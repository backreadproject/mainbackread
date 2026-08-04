import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isLocked, requirePaidAccess } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import { questionsFor } from "@/lib/icp-questions";
import {
  runAI, icpTask, icpPeopleTask, icpDemandTask, icpMarketTask,
  icpActivationTask, icpSynthesisTask,
} from "@/lib/ai";
import {
  PASSES, emptyProfile, nextPass, computeConfidence,
  type IcpProfile, type Pass,
} from "@/lib/icp-profile";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ANSWER = 4000;
const Answer = z.object({ id: z.string().min(1).max(40), q: z.string().min(1).max(300), a: z.string().max(MAX_ANSWER) });

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), profileId: z.string().uuid(), branch: z.enum(["operating", "startup"]) }),
  z.object({
    action: z.literal("save"), id: z.string().uuid(),
    sells: z.string().max(600).default(""),
    customerCount: z.number().int().min(0).max(1000000).nullable().default(null),
    answers: z.array(Answer).max(12),
  }),
  z.object({ action: z.literal("enrich"), id: z.string().uuid(), probes: z.array(Answer).max(6) }),
  // One pass per request. `pass` omitted means "run whichever is next".
  z.object({ action: z.literal("run"), id: z.string().uuid(), pass: z.enum(PASSES).optional() }),
  z.object({ action: z.literal("discard"), id: z.string().uuid() }),
]);

type QA = { id: string; q: string; a: string };
type Stored = { sells: string; customerCount: number | null; items: QA[]; probes: QA[] };
type IcpRow = {
  id: string; branch: "operating" | "startup"; source: "asserted" | "refined";
  revision: number; refined_from: number | null; status: "draft" | "complete";
  answers: unknown; answers_hash: string | null; output: IcpProfile | null;
  created_at: string; completed_at: string | null;
};

function emptyAnswers(): Stored { return { sells: "", customerCount: null, items: [], probes: [] }; }
function readAnswers(v: unknown): Stored {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Stored>;
  return {
    sells: typeof o.sells === "string" ? o.sells : "",
    customerCount: typeof o.customerCount === "number" ? o.customerCount : null,
    items: Array.isArray(o.items) ? o.items : [],
    probes: Array.isArray(o.probes) ? o.probes : [],
  };
}
function hashOf(branch: string, locale: string, a: Stored): string {
  return createHash("sha256").update(JSON.stringify({ branch, locale, a })).digest("hex");
}
function readProfile(v: unknown): IcpProfile {
  const o = v as IcpProfile | null;
  if (!o || typeof o !== "object" || !Array.isArray(o.done)) return emptyProfile();
  return o;
}

const COLS = "id, branch, source, revision, refined_from, status, answers, answers_hash, output, created_at, completed_at, profile_id";
type Sb = Awaited<ReturnType<typeof createClient>>;
type Scope = { personal: boolean; orgId: string | null };

function scopedRow(supabase: Sb, scope: Scope, userId: string) {
  const q = supabase.from("icp_profiles").select(COLS);
  return scope.personal ? q.eq("owner_id", userId).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
}

function base(supabase: Sb, scope: Scope, userId: string, profileId: string) {
  const q = supabase.from("icp_profiles").select(COLS);
  const s = scope.personal ? q.eq("owner_id", userId).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
  return s.eq("profile_id", profileId);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { err: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) {
    return { err: NextResponse.json({ error: "Buyer profile is on the Personal plan and above.", upgrade: true }, { status: 402 }) };
  }
  const scope: Scope = ctx.scope === "org" && ctx.orgId ? { personal: false, orgId: ctx.orgId } : { personal: true, orgId: null };
  return { supabase, user, ctx, scope };
}

export async function GET(req: NextRequest) {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, user, scope } = c;
  const profileId = req.nextUrl.searchParams.get("profileId") ?? "";
  if (!profileId) return NextResponse.json({ error: "Which profile?" }, { status: 400 });
  const { data: d1 } = await base(supabase, scope, user.id, profileId).eq("status", "draft").maybeSingle();
  const { data: d2 } = await base(supabase, scope, user.id, profileId)
    .eq("status", "complete").eq("source", "asserted")
    .order("revision", { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({
    draft: (d1 as IcpRow | null) ?? null,
    current: (d2 as IcpRow | null) ?? null,
    scope: scope.personal ? "personal" : "org",
  });
}

export async function POST(req: NextRequest) {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, user, ctx, scope } = c;

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Bad request: " + parsed.error.issues[0].message }, { status: 400 });
  const body = parsed.data;

  if (body.action === "start" || body.action === "run") {
    const gate = await requirePaidAccess(createAdminClient(), user.id);
    if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });
  }

  if (body.action === "start") {
    const profileId = body.profileId;
    const { data: e1 } = await base(supabase, scope, user.id, profileId).eq("status", "draft").maybeSingle();
    const existing = e1 as IcpRow | null;
    if (existing) return NextResponse.json({ profile: existing, resumed: true, branchMismatch: existing.branch !== body.branch });

    const q = supabase.from("icp_profiles").select("revision");
    const sq0 = scope.personal ? q.eq("owner_id", user.id).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
    const sq = sq0.eq("profile_id", profileId);
    const { data: l1 } = await sq.order("revision", { ascending: false }).limit(1).maybeSingle();
    const last = l1 as { revision: number } | null;

    const { data: p1 } = await base(supabase, scope, user.id, profileId)
      .eq("status", "complete").order("revision", { ascending: false }).limit(1).maybeSingle();
    const prev = p1 as IcpRow | null;
    const seeded = prev && prev.branch === body.branch ? { ...readAnswers(prev.answers), probes: [] } : emptyAnswers();

    const { data, error } = await supabase.from("icp_profiles").insert({
      owner_id: scope.personal ? user.id : null,
      organization_id: scope.personal ? null : scope.orgId,
      profile_id: profileId,
      created_by: user.id,
      revision: (last?.revision ?? 0) + 1,
      source: "asserted", refined_from: null, branch: body.branch, status: "draft",
      answers: seeded,
    }).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not start: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as IcpRow, resumed: false, seeded: seeded.items.length > 0 });
  }

  const { data: r1 } = await scopedRow(supabase, scope, user.id).eq("id", body.id).maybeSingle();
  const row = r1 as IcpRow | null;
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const stored = readAnswers(row.answers);

  if (body.action === "discard") {
    const { error } = await supabase.from("icp_profiles").delete().eq("id", row.id);
    if (error) return NextResponse.json({ error: "Could not discard: " + error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save") {
    if (row.status !== "draft") return NextResponse.json({ error: "This profile is finished. Start a new revision to change it." }, { status: 409 });
    const answers: Stored = { sells: body.sells, customerCount: body.customerCount, items: body.answers, probes: stored.probes };
    const { data, error } = await supabase.from("icp_profiles").update({ answers, updated_at: new Date().toISOString() })
      .eq("id", row.id).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as IcpRow });
  }

  if (body.action === "enrich") {
    // New probe answers invalidate everything downstream of the record: the
    // analyses were reasoned from a smaller set of facts. Keep the record,
    // clear the rest, and let the client re-run.
    const answers: Stored = { ...stored, probes: body.probes };
    const prof = readProfile(row.output);
    const reset: IcpProfile = { ...prof, people: null, demand: null, market: null, activation: null, synthesis: null, done: prof.done.filter((d) => d === "record") };
    const { data, error } = await supabase.from("icp_profiles")
      .update({ answers, output: reset, updated_at: new Date().toISOString() })
      .eq("id", row.id).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as IcpRow });
  }

  // ---- run one pass ----
  if (!stored.sells.trim() || stored.items.filter((i) => i.a.trim()).length < 3) {
    return NextResponse.json({ error: "Answer at least three questions first. A profile built on less is guesswork wearing a format." }, { status: 400 });
  }

  const locale = await getLocale();
  const hash = hashOf(row.branch, locale, stored);
  let prof = readProfile(row.output);

  // Answers changed since the last run: everything on the page describes a
  // different set of facts and must be rebuilt.
  if (row.answers_hash && row.answers_hash !== hash) prof = emptyProfile();

  const pass: Pass | null = body.pass ?? nextPass(prof);
  if (!pass) return NextResponse.json({ profile: row, done: true, cached: true });
  if (prof.done.includes(pass)) return NextResponse.json({ profile: row, cached: true });

  const answered = stored.probes.filter((p) => p.a.trim());
  const shared = {
    branch: row.branch,
    sells: stored.sells,
    customerCount: row.branch === "startup" ? null : stored.customerCount,
    answers: stored.items.map((x) => ({ q: x.q, a: x.a }))
      .concat(answered.map((p) => ({ q: "FOLLOW-UP: " + p.q, a: p.a }))),
    locale,
  };

  // Later passes read earlier ones, so a missing prerequisite is a client bug,
  // not something to paper over with an empty object.
  const need = (x: unknown, name: string) => {
    if (!x) throw new Error("PREREQ:" + name);
    return x;
  };

  try {
    let patch: Partial<IcpProfile>;
    switch (pass) {
      case "record":
        patch = { record: (await runAI(icpTask, shared)).data };
        break;
      case "people":
        patch = { people: (await runAI(icpPeopleTask, { ...shared, record: need(prof.record, "record") as never })).data };
        break;
      case "demand":
        patch = { demand: (await runAI(icpDemandTask, { ...shared, record: need(prof.record, "record") as never })).data };
        break;
      case "market":
        patch = { market: (await runAI(icpMarketTask, { ...shared, record: need(prof.record, "record") as never })).data };
        break;
      case "activation":
        patch = { activation: (await runAI(icpActivationTask, {
          ...shared,
          record: need(prof.record, "record") as never,
          people: need(prof.people, "people") as never,
          demand: need(prof.demand, "demand") as never,
          market: need(prof.market, "market") as never,
        })).data };
        break;
      case "synthesis":
        patch = { synthesis: (await runAI(icpSynthesisTask, {
          ...shared,
          record: need(prof.record, "record") as never,
          people: need(prof.people, "people") as never,
          demand: need(prof.demand, "demand") as never,
          market: need(prof.market, "market") as never,
          activation: need(prof.activation, "activation") as never,
        })).data };
        break;
    }

    const weightedIds = questionsFor(row.branch, locale).filter((q) => q.weight).map((q) => q.id);

    // Merged in Postgres under a row lock, not read-modify-write here. people,
    // demand and market depend on record but not on each other, so they run
    // concurrently -- and concurrently, three writes of a locally computed
    // object would leave only the last one.
    const { data, error } = await supabase.rpc("icp_merge_output", {
      p_id: row.id,
      p_patch: patch,
      p_pass: pass,
      p_confidence: computeConfidence(stored.items, weightedIds, stored.probes, stored.customerCount, row.branch),
      p_hash: hash,
    });
    if (error) return NextResponse.json({ error: "Built it, but could not save it: " + error.message }, { status: 500 });

    // next and done come from what the DATABASE now holds, not from a local
    // copy that a concurrent pass may already have moved past.
    const saved = data as unknown as IcpRow;
    const after = readProfile(saved.output);
    return NextResponse.json({ profile: saved, pass, next: nextPass(after), done: after.done.length === PASSES.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[icp] pass failed", { revisionId: row.id, pass, branch: row.branch, locale, error: msg });
    if (msg.startsWith("PREREQ:")) {
      return NextResponse.json({ error: "That section needs an earlier one first. Reload the page and continue.", pass }, { status: 409 });
    }
    return NextResponse.json({
      error: "Could not build the " + pass + " section. Everything already built is saved. Try that section again.",
      pass,
    }, { status: 502 });
  }
}