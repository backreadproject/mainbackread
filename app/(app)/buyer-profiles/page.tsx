import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature, getLimit } from "@/lib/plans";
import { observeProfiles } from "@/lib/observed";
import { reachFor, leastUsed } from "@/lib/profile-reach";
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

  // The Observed tier. Counted, never inferred, and computed on view because
  // nothing runs on a schedule yet: "last checked" is therefore the newest
  // signal we counted rather than a claim about background work.
  const observed = await observeProfiles(
    supabase,
    list.map((p) => ({ id: p.id, threshold: (p.threshold as number) ?? 20 })),
    hasComplete,
  );

  const now = new Date();

  const rows = list.map((p) => {
    const o = observed[p.id];
    const engaged = o?.summary.engaged ?? 0;
    const threshold = (p.threshold as number) ?? 20;
    const reach = reachFor({
      engaged,
      threshold,
      since: o?.summary.firstSignalAt ?? null,
      createdAt: (p.created_at as string),
      now,
    });

    return {
      id: p.id,
      name: p.name,
      objective: p.objective as string,
      revisions: revCount[p.id] ?? 0,
      started: Boolean(hasComplete[p.id]),
      documents: docCount[p.id] ?? 0,
      updatedAt: (p.updated_at ?? p.created_at) as string,
      basis: o?.basis ?? "draft",
      engaged,
      readers: o?.summary.readers ?? 0,
      threshold,
      lastSignalAt: o?.summary.lastSignalAt ?? null,
      willReach: reach.willReach,
      weeksToThreshold: reach.weeks,
    };
  });

  const limit = getLimit(ctx.plan.id, "buyerProfiles");

  return (
    <ProfilesClient
      rows={rows}
      limit={limit}
      planName={ctx.plan.name}
      topPlan={limit === null}
      entitled={hasFeature(ctx.plan.id, "icp")}
      deletable={leastUsed(rows)}
    />
  );
}
