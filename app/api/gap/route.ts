import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, requirePaidAccess } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import { observeProfile } from "@/lib/observed";
import { buildGapInput, gapRefusal, type StatedRevision } from "@/lib/gap-input";
import { runAI, gapTask } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Running the gap analysis.
 *
 * The two refusals happen before any model call, because a refusal that costs
 * money is not a refusal. Everything that survives them is real evidence.
 *
 * Runs are kept rather than replaced. The previous row is what "what changed
 * since last check" reads from, and a history of what this page said is the
 * only way a customer can tell a finding that strengthened from one that
 * appeared out of nowhere.
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) {
    return NextResponse.json({ error: "Buyer profiles are on the Personal plan and above.", upgrade: true }, { status: 402 });
  }
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const body = await req.json().catch(() => ({}));
  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const refresh = body.refresh === true;
  if (!profileId) return NextResponse.json({ error: "Which profile?" }, { status: 400 });

  // RLS decides. A profile in someone else's workspace returns no row.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, objective, threshold")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "No such profile." }, { status: 404 });

  // Measured against the newest ASSERTED revision, never a refined one. A
  // comparison against something we wrote would agree with itself forever.
  const { data: rev } = await supabase
    .from("icp_profiles")
    .select("id, revision, output")
    .eq("profile_id", profileId)
    .eq("status", "complete")
    .eq("source", "asserted")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  const threshold = (profile.threshold as number) ?? 20;
  const { readers, summary, common } = await observeProfile(supabase, profileId, threshold, Boolean(rev));

  const refusal = gapRefusal(readers, summary.engaged, threshold, Boolean(rev));
  if (refusal) {
    return NextResponse.json({ refusal, summary }, { status: 200 });
  }

  // What the analysis would be looking at. A run is stale when any of it moves.
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({
      rev: rev?.id ?? null,
      engaged: summary.engaged,
      readers: summary.readers,
      questions: summary.questions,
      outcomes: summary.outcomesMarked,
      last: summary.lastSignalAt,
    }))
    .digest("hex");

  const { data: recent } = await admin
    .from("buyer_gap_runs")
    .select("id, fingerprint, engaged, readers, identified, output, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(2);

  const runs = recent ?? [];
  if (!refresh && runs[0]?.fingerprint === fingerprint) {
    return NextResponse.json({ run: runs[0], previous: runs[1] ?? null, cached: true });
  }

  const locale = await getLocale();

  // Verbatim questions, which are the single most useful thing on the observed
  // side. Capped: forty questions would crowd out everything else in the prompt.
  const { data: qs } = await supabase
    .from("signals")
    .select("value, recipient_id")
    .eq("kind", "question")
    .in("recipient_id", readers.flatMap((r) => r.recipientIds))
    .limit(25);

  const questions = (qs ?? [])
    .map((q) => {
      const v = q.value as { text?: string } | null;
      return typeof v?.text === "string" ? v.text.slice(0, 240) : "";
    })
    .filter(Boolean);

  const input = buildGapInput({
    locale,
    objective: (profile.objective as string) ?? "outbound",
    threshold,
    revision: (rev?.output ?? {}) as StatedRevision,
    readers,
    pages: common.pages,
    questions,
    summary,
  });

  let output;
  try {
    output = (await runAI(gapTask, input)).data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[gap] failed", { profileId, engaged: summary.engaged, error: msg });
    return NextResponse.json(
      { error: "Could not run the comparison. Nothing has been changed. Try again." },
      { status: 502 },
    );
  }

  const { data: saved, error } = await admin
    .from("buyer_gap_runs")
    .insert({
      profile_id: profileId,
      revision_id: rev?.id ?? null,
      fingerprint,
      engaged: summary.engaged,
      readers: summary.readers,
      identified: input.observed.identified,
      output,
    })
    .select("id, fingerprint, engaged, readers, identified, output, created_at")
    .single();

  if (error) {
    // The analysis ran and cost money. Hand it back even though it did not save.
    console.error("[gap] ran but could not save", { profileId, error: error.message });
    return NextResponse.json({
      run: { id: null, fingerprint, engaged: summary.engaged, readers: summary.readers, identified: input.observed.identified, output, created_at: new Date().toISOString() },
      previous: runs[0] ?? null,
      unsaved: true,
    });
  }

  return NextResponse.json({ run: saved, previous: runs[0] ?? null, cached: false });
}
