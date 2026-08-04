import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { observeProfile, type ObservedSummary } from "@/lib/observed";
import { buildGapInput, gapRefusal, type StatedRevision, type Refusal } from "@/lib/gap-input";
import { runAI, gapTask, type GapOutput } from "@/lib/ai";

/**
 * Running the gap analysis, in one place.
 *
 * Two callers: the page, where a person pressed a button, and the scheduled
 * watcher, where nobody did. They must produce identical results or the bell
 * would announce a finding the page then disagrees with, so this is the only
 * implementation and both go through it.
 *
 * The reads take whichever client the caller has. The page passes its session
 * client so RLS decides what it can see; the watcher has no session and passes
 * the admin client, having already established which profiles it is allowed to
 * look at.
 */

type Db = SupabaseClient;

export type GapRunRow = {
  id: string | null;
  fingerprint: string;
  engaged: number;
  readers: number;
  identified: number;
  output: GapOutput;
  created_at: string;
};

export type GapRunResult =
  | { refusal: Refusal; summary: ObservedSummary }
  | { run: GapRunRow; previous: GapRunRow | null; cached: boolean; unsaved?: boolean; summary: ObservedSummary };

export class GapFailed extends Error {}

export async function runGapFor(
  db: Db,
  admin: Db,
  profileId: string,
  opts: { refresh?: boolean; locale: "en" | "fr" },
): Promise<GapRunResult> {
  const { data: profile } = await db
    .from("buyer_profiles")
    .select("id, objective, threshold")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) throw new GapFailed("No such profile.");

  // Measured against the newest ASSERTED revision, never a refined one. A
  // comparison against something we wrote would agree with itself forever.
  const { data: rev } = await db
    .from("icp_profiles")
    .select("id, revision, output")
    .eq("profile_id", profileId)
    .eq("status", "complete")
    .eq("source", "asserted")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  const threshold = (profile.threshold as number) ?? 20;
  const { readers, summary, common } = await observeProfile(db, profileId, threshold, Boolean(rev));

  const refusal = gapRefusal(readers, summary.engaged, threshold, Boolean(rev));
  if (refusal) return { refusal, summary };

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

  const runs = (recent ?? []) as unknown as GapRunRow[];
  if (!opts.refresh && runs[0]?.fingerprint === fingerprint) {
    return { run: runs[0], previous: runs[1] ?? null, cached: true, summary };
  }

  // Verbatim questions, the single most useful thing on the observed side.
  // Capped: forty of them would crowd out everything else in the prompt.
  const { data: qs } = await db
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
    locale: opts.locale,
    objective: (profile.objective as string) ?? "outbound",
    threshold,
    revision: (rev?.output ?? {}) as StatedRevision,
    readers,
    pages: common.pages,
    questions,
    summary,
  });

  let output: GapOutput;
  try {
    output = (await runAI(gapTask, input)).data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[gap] failed", { profileId, engaged: summary.engaged, error: msg });
    throw new GapFailed("Could not run the comparison. Nothing has been changed. Try again.");
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
    return {
      run: {
        id: null, fingerprint,
        engaged: summary.engaged, readers: summary.readers,
        identified: input.observed.identified,
        output, created_at: new Date().toISOString(),
      },
      previous: runs[0] ?? null,
      cached: false,
      unsaved: true,
      summary,
    };
  }

  return { run: saved as unknown as GapRunRow, previous: runs[0] ?? null, cached: false, summary };
}
