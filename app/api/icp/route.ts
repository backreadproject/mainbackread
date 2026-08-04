import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, requirePaidAccess } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import { stepsFor, weightedIds, type Branch, type Objective } from "@/lib/buyer-questions";
import { runAI, marketTask, peopleTask, findTask } from "@/lib/ai";
import { PASSES, readProfile, nextPass, computeConfidence, type Profile, type Pass } from "@/lib/buyer-profile";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ANSWER = 4000;
const Answer = z.object({
  id: z.string().min(1).max(40),
  q: z.string().min(1).max(300),
  a: z.string().max(MAX_ANSWER),
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), profileId: z.string().uuid(), branch: z.enum(["operating", "startup"]) }),
  z.object({
    action: z.literal("save"),
    id: z.string().uuid(),
    sells: z.string().max(1000).default(""),
    answers: z.array(Answer).max(20),
  }),
  z.object({ action: z.literal("run"), id: z.string().uuid(), pass: z.enum(PASSES).optional() }),
  z.object({ action: z.literal("discard"), id: z.string().uuid() }),
]);

type QA = { id: string; q: string; a: string };
type Stored = { sells: string; items: QA[] };

type Row = {
  id: string;
  branch: Branch;
  source: "asserted" | "refined";
  revision: number;
  refined_from: number | null;
  status: "draft" | "complete";
  answers: unknown;
  answers_hash: string | null;
  output: Profile | null;
  created_at: string;
  completed_at: string | null;
  profile_id: string;
};

const COLS =
  "id, branch, source, revision, refined_from, status, answers, answers_hash, output, created_at, completed_at, profile_id";

function readAnswers(v: unknown): Stored {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Stored>;
  return {
    sells: typeof o.sells === "string" ? o.sells : "",
    items: Array.isArray(o.items) ? o.items : [],
  };
}

function hashOf(branch: string, objective: string, locale: string, a: Stored): string {
  return createHash("sha256").update(JSON.stringify({ branch, objective, locale, a })).digest("hex");
}

type Sb = Awaited<ReturnType<typeof createClient>>;
type Scope = { personal: boolean; orgId: string | null };

/** Revisions of one profile. */
function base(supabase: Sb, scope: Scope, userId: string, profileId: string) {
  const q = supabase.from("icp_profiles").select(COLS);
  const s = scope.personal ? q.eq("owner_id", userId).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
  return s.eq("profile_id", profileId);
}

/** A single revision by id. The owner clauses still prove entitlement, and the
 *  id is already unique, so no profile scope is needed. */
function scopedRow(supabase: Sb, scope: Scope, userId: string) {
  const q = supabase.from("icp_profiles").select(COLS);
  return scope.personal ? q.eq("owner_id", userId).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { err: NextResponse.json({ error: "Sign in again." }, { status: 401 }) };
  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) {
    return { err: NextResponse.json({ error: "Buyer profiles are on the Personal plan and above.", upgrade: true }, { status: 402 }) };
  }
  const scope: Scope = ctx.scope === "org" && ctx.orgId ? { personal: false, orgId: ctx.orgId } : { personal: true, orgId: null };
  return { supabase, admin, user, ctx, scope };
}

/** The objective lives on the profile, and every pass reads it. */
async function objectiveOf(supabase: Sb, profileId: string): Promise<Objective> {
  const { data } = await supabase.from("buyer_profiles").select("objective").eq("id", profileId).maybeSingle();
  const o = (data?.objective ?? "outbound") as Objective;
  return o;
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
    draft: (d1 as Row | null) ?? null,
    current: (d2 as Row | null) ?? null,
    scope: scope.personal ? "personal" : "org",
  });
}

export async function POST(req: NextRequest) {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, admin, user, scope } = c;

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Bad request: " + parsed.error.issues[0].message }, { status: 400 });
  const body = parsed.data;

  if (body.action === "start" || body.action === "run") {
    const gate = await requirePaidAccess(admin, user.id);
    if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });
  }

  if (body.action === "start") {
    const profileId = body.profileId;

    // An unfinished draft is work. Hand it back rather than overwriting it.
    const { data: e1 } = await base(supabase, scope, user.id, profileId).eq("status", "draft").maybeSingle();
    const existing = e1 as Row | null;
    if (existing) {
      return NextResponse.json({ profile: existing, resumed: true, branchMismatch: existing.branch !== body.branch });
    }

    // Revisions number within their own profile.
    const { data: l1 } = await base(supabase, scope, user.id, profileId)
      .order("revision", { ascending: false }).limit(1).maybeSingle();
    const last = l1 as { revision: number } | null;

    // Seed from the previous revision of THIS profile so a re-answer starts
    // from what they wrote rather than from an empty form.
    const { data: p1 } = await base(supabase, scope, user.id, profileId)
      .eq("status", "complete").order("revision", { ascending: false }).limit(1).maybeSingle();
    const prev = p1 as Row | null;
    const seeded = prev && prev.branch === body.branch ? readAnswers(prev.answers) : { sells: "", items: [] };

    const { data, error } = await supabase.from("icp_profiles").insert({
      owner_id: scope.personal ? user.id : null,
      organization_id: scope.personal ? null : scope.orgId,
      created_by: user.id,
      profile_id: profileId,
      revision: (last?.revision ?? 0) + 1,
      source: "asserted",
      refined_from: null,
      branch: body.branch,
      status: "draft",
      answers: seeded,
    }).select(COLS).single();

    if (error) return NextResponse.json({ error: "Could not start: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as Row, resumed: false, seeded: seeded.items.length > 0 });
  }

  const { data: r1 } = await scopedRow(supabase, scope, user.id).eq("id", body.id).maybeSingle();
  const row = r1 as Row | null;
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (body.action === "discard") {
    const { error } = await supabase.from("icp_profiles").delete().eq("id", row.id);
    if (error) return NextResponse.json({ error: "Could not discard: " + error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save") {
    if (row.status !== "draft") {
      return NextResponse.json({ error: "This revision is finished. Start a new one to change it." }, { status: 409 });
    }
    const answers: Stored = { sells: body.sells, items: body.answers };
    const { data, error } = await supabase.from("icp_profiles")
      .update({ answers, updated_at: new Date().toISOString() })
      .eq("id", row.id).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as Row });
  }

  // ---- run one pass ----
  const stored = readAnswers(row.answers);
  if (stored.items.filter((i) => i.a.trim()).length < 3) {
    return NextResponse.json(
      { error: "Answer at least three questions first. A profile built on less is guesswork wearing a format." },
      { status: 400 },
    );
  }

  const locale = await getLocale();
  const objective = await objectiveOf(supabase, row.profile_id);
  const hash = hashOf(row.branch, objective, locale, stored);

  let prof = readProfile(row.output);
  if (row.answers_hash && row.answers_hash !== hash) prof = readProfile(null);

  const pass: Pass | null = body.pass ?? nextPass(prof);
  if (!pass) return NextResponse.json({ profile: row, done: true, cached: true });
  if (prof.done.includes(pass)) return NextResponse.json({ profile: row, cached: true });

  const shared = {
    objective,
    branch: row.branch,
    sells: stored.sells,
    answers: stored.items.map((x) => ({ q: x.q, a: x.a })),
    locale,
  };

  // Later passes read earlier ones, so a missing prerequisite is a client bug,
  // not something to paper over with an empty object.
  const need = <T,>(x: T | null, name: string): T => {
    if (!x) throw new Error("PREREQ:" + name);
    return x;
  };

  try {
    let patch: Partial<Profile>;
    switch (pass) {
      case "market":
        patch = { market: (await runAI(marketTask, shared)).data };
        break;
      case "people":
        patch = { people: (await runAI(peopleTask, { ...shared, market: need(prof.market, "market") })).data };
        break;
      case "find":
        patch = {
          find: (await runAI(findTask, {
            ...shared,
            market: need(prof.market, "market"),
            people: need(prof.people, "people"),
          })).data,
        };
        break;
    }

    const weighted = weightedIds(objective, row.branch);

    // Merged in Postgres under a row lock rather than read-modify-write here.
    const { data, error } = await supabase.rpc("icp_merge_output", {
      p_id: row.id,
      p_patch: patch,
      p_pass: pass,
      p_confidence: computeConfidence(stored.items, weighted, row.branch),
      p_hash: hash,
    });
    if (error) return NextResponse.json({ error: "Built it, but could not save it: " + error.message }, { status: 500 });

    const saved = data as unknown as Row;
    const after = readProfile(saved.output);
    return NextResponse.json({
      profile: saved,
      pass,
      next: nextPass(after),
      done: after.done.length === PASSES.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[buyer-profile] pass failed", { revisionId: row.id, pass, branch: row.branch, objective, locale, error: msg });
    if (msg.startsWith("PREREQ:")) {
      return NextResponse.json({ error: "That section needs an earlier one first. Reload the page and continue.", pass }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Could not build the " + pass + " section. Everything already built is saved. Try that section again.", pass },
      { status: 502 },
    );
  }
}
