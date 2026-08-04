import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { answerDiff, readAnswers } from "@/lib/revisions";
import RevisionsClient, { type RevisionRow } from "./RevisionsClient";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  revision: number;
  source: "asserted" | "refined";
  refined_from: number | null;
  branch: "operating" | "startup";
  status: "draft" | "complete";
  answers: unknown;
  output: unknown;
  created_at: string;
  completed_at: string | null;
};

export default async function RevisionsPage({
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
  if (!hasFeature(ctx.plan.id, "icp")) redirect("/buyer-profiles/" + id);

  // RLS decides.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: revs } = await supabase
    .from("icp_profiles")
    .select("id, revision, source, refined_from, branch, status, answers, output, created_at, completed_at")
    .eq("profile_id", id)
    .order("revision", { ascending: true });

  const list = (revs ?? []) as unknown as Row[];

  // The baseline is the newest FINISHED revision the customer wrote. It is
  // what the gap analysis measures against, and nothing we generated is ever
  // eligible for it.
  const baselineId = [...list]
    .reverse()
    .find((r) => r.source === "asserted" && r.status === "complete")?.id ?? null;

  const rows: RevisionRow[] = list.map((r, i) => {
    // Compared against the previous revision of any kind, because that is what
    // the person was looking at when they decided to change something.
    const prev = i > 0 ? list[i - 1] : null;
    const diff = prev ? answerDiff(prev.answers, r.answers) : null;
    const stored = readAnswers(r.answers);
    const out = (r.output ?? null) as { market?: { headline?: string } } | null;

    return {
      id: r.id,
      revision: r.revision,
      source: r.source,
      refinedFrom: r.refined_from,
      branch: r.branch,
      status: r.status,
      isBaseline: r.id === baselineId,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      headline: out?.market?.headline ?? "",
      answered: stored.items.filter((x) => x.a.trim()).length,
      questions: stored.items.length,
      diff,
      answers: stored.items.filter((x) => x.a.trim()).map((x) => ({ q: x.q, a: x.a })),
    };
  }).reverse();

  return (
    <RevisionsClient
      profile={{ id: profile.id as string, name: profile.name as string }}
      rows={rows}
    />
  );
}
