import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { isSampleId } from "@/lib/sample-profile";
import { hasFeature } from "@/lib/plans";
import { readNotify, type Cadence } from "@/lib/profile-watch";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Nothing to edit and nothing to schedule: the sample has no rows.
  if (isSampleId(id)) redirect("/buyer-profiles/" + id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) redirect("/buyer-profiles/" + id);

  // RLS decides.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, name, cadence, threshold, notify, last_checked_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  return (
    <SettingsClient
      profile={{
        id: profile.id as string,
        name: profile.name as string,
        cadence: (profile.cadence as Cadence) ?? "weekly",
        threshold: (profile.threshold as number) ?? 20,
        notify: readNotify(profile.notify),
        lastCheckedAt: (profile.last_checked_at as string | null) ?? null,
      }}
      // Daily re-checks are the Business plan in the approved screen. Every
      // other cadence is on every paid plan.
      canDaily={ctx.plan.id === "business"}
      planName={ctx.plan.name}
    />
  );
}
