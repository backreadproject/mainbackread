import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { runAI, icpTask, type IcpOutput } from "@/lib/ai";
import { getLocale } from "@/lib/locale-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ANSWER = 4000;
const Answer = z.object({ id: z.string().min(1).max(40), q: z.string().min(1).max(300), a: z.string().max(MAX_ANSWER) });

// No `source`, no `revision`, no `locale`. Anything the client could assert
// about how the output is produced is something it could get wrong.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), branch: z.enum(["operating", "startup"]) }),
  z.object({
    action: z.literal("save"),
    id: z.string().uuid(),
    sells: z.string().max(600).default(""),
    customerCount: z.number().int().min(0).max(1000000).nullable().default(null),
    answers: z.array(Answer).max(12),
  }),
  // Probe answers. Allowed on a COMPLETE row: answering a follow-up enriches the
  // revision the system asked it of. It is not a new assertion, so it must not
  // reset the divergence baseline.
  z.object({ action: z.literal("enrich"), id: z.string().uuid(), probes: z.array(Answer).max(6) }),
  z.object({ action: z.literal("generate"), id: z.string().uuid() }),
  z.object({ action: z.literal("discard"), id: z.string().uuid() }),
]);

type QA = { id: string; q: string; a: string };
type Stored = { sells: string; customerCount: number | null; items: QA[]; probes: QA[] };

type IcpRow = {
  id: string; branch: "operating" | "startup"; source: "asserted" | "refined";
  revision: number; refined_from: number | null; status: "draft" | "complete";
  answers: unknown; answers_hash: string | null; output: IcpOutput | null;
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

const COLS = "id, branch, source, revision, refined_from, status, answers, answers_hash, output, created_at, completed_at";
type Sb = Awaited<ReturnType<typeof createClient>>;
type Scope = { personal: boolean; orgId: string | null };

function base(supabase: Sb, scope: Scope, userId: string) {
  const q = supabase.from("icp_profiles").select(COLS);
  return scope.personal ? q.eq("owner_id", userId).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
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

export async function GET() {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, user, scope } = c;
  const { data: d1 } = await base(supabase, scope, user.id).eq("status", "draft").maybeSingle();
  const { data: d2 } = await base(supabase, scope, user.id)
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

  if ((body.action === "start" || body.action === "generate") && isLocked(ctx)) {
    return NextResponse.json({ error: "Your trial has ended. Subscribe to build a new buyer profile.", upgrade: true }, { status: 402 });
  }

  if (body.action === "start") {
    const { data: e1 } = await base(supabase, scope, user.id).eq("status", "draft").maybeSingle();
    const existing = e1 as IcpRow | null;
    if (existing) return NextResponse.json({ profile: existing, resumed: true, branchMismatch: existing.branch !== body.branch });

    const q = supabase.from("icp_profiles").select("revision");
    const sq = scope.personal ? q.eq("owner_id", user.id).is("organization_id", null) : q.eq("organization_id", scope.orgId as string);
    const { data: l1 } = await sq.order("revision", { ascending: false }).limit(1).maybeSingle();
    const last = l1 as { revision: number } | null;

    const { data: p1 } = await base(supabase, scope, user.id)
      .eq("status", "complete").order("revision", { ascending: false }).limit(1).maybeSingle();
    const prev = p1 as IcpRow | null;
    const seeded = prev && prev.branch === body.branch
      ? { ...readAnswers(prev.answers), probes: [] }
      : emptyAnswers();

    const { data, error } = await supabase.from("icp_profiles").insert({
      owner_id: scope.personal ? user.id : null,
      organization_id: scope.personal ? null : scope.orgId,
      created_by: user.id,
      revision: (last?.revision ?? 0) + 1,
      source: "asserted",
      refined_from: null,
      branch: body.branch,
      status: "draft",
      answers: seeded,
    }).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not start: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as IcpRow, resumed: false, seeded: seeded.items.length > 0 });
  }

  const { data: r1 } = await base(supabase, scope, user.id).eq("id", body.id).maybeSingle();
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
    const answers: Stored = { ...stored, probes: body.probes };
    const { data, error } = await supabase.from("icp_profiles").update({ answers, updated_at: new Date().toISOString() })
      .eq("id", row.id).select(COLS).single();
    if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data as IcpRow });
  }

  // generate
  if (!stored.sells.trim() || stored.items.filter((i) => i.a.trim()).length < 3) {
    return NextResponse.json({ error: "Answer at least three questions first. A profile built on less is guesswork wearing a format." }, { status: 400 });
  }

  const locale = await getLocale();
  const hash = hashOf(row.branch, locale, stored);
  if (row.answers_hash === hash && row.output) return NextResponse.json({ profile: row, cached: true });

  const branch = row.branch;
  const answered = stored.probes.filter((p) => p.a.trim());
  let out: IcpOutput;
  try {
    const res = await runAI(icpTask, {
      branch,
      sells: stored.sells,
      customerCount: branch === "startup" ? null : stored.customerCount,
      // Probe answers arrive as further questions, marked so the model knows
      // they were asked after it had already seen the first pass.
      answers: stored.items.map((x) => ({ q: x.q, a: x.a }))
        .concat(answered.map((p) => ({ q: "FOLLOW-UP: " + p.q, a: p.a }))),
      locale,
    });
    out = res.data;
  } catch (e) {
    console.error("[icp] generation failed", { profileId: row.id, branch, locale, error: e instanceof Error ? e.message : e });
    return NextResponse.json({ error: "Could not build the profile from these answers. Your answers are saved. Try again, and if it keeps failing, add a little more detail to the questions you answered briefly." }, { status: 502 });
  }

  out.kind = branch === "operating" ? "definition" : "hypothesis";
  if (branch === "startup") {
    // Only the sections that would be false precision from a handful of
    // conversations. Findings, tensions, market and probes stay: those are
    // reasoning, not fabrication, and they are why this page exists.
    out.committee = [];
    out.angles = [];
    out.find = { ...out.find, searchStrings: [] };
  }

  const { data, error } = await supabase.from("icp_profiles").update({
    output: out, answers_hash: hash, status: "complete",
    completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", row.id).select(COLS).single();
  if (error) return NextResponse.json({ error: "Built it, but could not save it: " + error.message }, { status: 500 });
  return NextResponse.json({ profile: data as IcpRow, cached: false });
}