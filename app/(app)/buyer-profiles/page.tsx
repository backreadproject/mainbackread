import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature, getLimit } from "@/lib/plans";
import ProfilesClient from "./ProfilesClient";

export const dynamic = "force-dynamic";

export default async function BuyerProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);

  // RLS scopes this to the caller's own rows or their organisation's, so no
  // owner/org filter is needed here.
  const { data: profiles } = await supabase
    .from("buyer_profiles")
    .select("id, name, objective, cadence, threshold, created_at, updated_at")
    .order("created_at", { ascending: false });

  const list = profiles ?? [];
  const ids = list.map((p) => p.id);

  // Revisions and attached documents, both read in one query each rather than
  // per row. Counted in JS because the numbers here are small and a grouped
  // count would need a view.
  const { data: revs } = ids.length
    ? await supabase.from("icp_profiles").select("profile_id, status, source, revision").in("profile_id", ids)
    : { data: [] };

  const { data: docs } = ids.length
    ? await supabase.from("documents").select("id, buyer_profile_id").in("buyer_profile_id", ids)
    : { data: [] };

  const revCount: Record<string, number> = {};
  const hasComplete: Record<string, boolean> = {};
  for (const r of revs ?? []) {
    const k = r.profile_id as string;
    revCount[k] = (revCount[k] ?? 0) + 1;
    if (r.status === "complete") hasComplete[k] = true;
  }

  const docCount: Record<string, number> = {};
  for (const d of docs ?? []) {
    const k = d.buyer_profile_id as string;
    docCount[k] = (docCount[k] ?? 0) + 1;
  }

  const rows = list.map((p) => ({
    id: p.id,
    name: p.name,
    objective: p.objective as string,
    revisions: revCount[p.id] ?? 0,
    started: Boolean(hasComplete[p.id]),
    documents: docCount[p.id] ?? 0,
    updatedAt: (p.updated_at ?? p.created_at) as string,
  }));

  return (
    <ProfilesClient
      rows={rows}
      limit={getLimit(ctx.plan.id, "buyerProfiles")}
      planName={ctx.plan.name}
      topPlan={ctx.plan.id === "business"}
      entitled={hasFeature(ctx.plan.id, "icp")}
    />
  );
}
