import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { observeProfile } from "@/lib/observed";
import { gapRefusal } from "@/lib/gap-input";
import { isSampleId, SAMPLE_NAME, SAMPLE_THRESHOLD, sampleGapRun, samplePreviousGapRun, sampleObserved } from "@/lib/sample-profile";
import GapClient, { type GapRun } from "./GapClient";

export const dynamic = "force-dynamic";

export default async function GapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (isSampleId(id)) {
    const now = new Date();
    return (
      <GapClient
        profile={{ id, name: SAMPLE_NAME, threshold: SAMPLE_THRESHOLD }}
        revision={3}
        summary={sampleObserved(now).summary}
        refusal={null}
        latest={sampleGapRun(now) as GapRun}
        previous={samplePreviousGapRun(now) as GapRun}
        readOnly
      />
    );
  }

  if (!hasFeature(ctx.plan.id, "icp")) redirect("/buyer-profiles/" + id);

  // RLS decides.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, name, threshold")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: rev } = await supabase
    .from("icp_profiles")
    .select("id, revision")
    .eq("profile_id", id)
    .eq("status", "complete")
    .eq("source", "asserted")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  const threshold = (profile.threshold as number) ?? 20;
  const { readers, summary } = await observeProfile(supabase, id, threshold, Boolean(rev));
  const refusal = gapRefusal(readers, summary.engaged, threshold, Boolean(rev));

  // Runs are service-role only, read here after RLS above proved ownership.
  const { data: runs } = await admin
    .from("buyer_gap_runs")
    .select("id, engaged, readers, identified, output, created_at")
    .eq("profile_id", id)
    .order("created_at", { ascending: false })
    .limit(2);

  const list = (runs ?? []) as unknown as GapRun[];

  return (
    <GapClient
      profile={{ id: profile.id as string, name: profile.name as string, threshold }}
      revision={rev ? (rev.revision as number) : null}
      summary={summary}
      refusal={refusal}
      latest={list[0] ?? null}
      previous={list[1] ?? null}
    />
  );
}
