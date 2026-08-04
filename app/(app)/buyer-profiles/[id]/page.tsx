import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { observeProfile } from "@/lib/observed";
import ProfileDetailClient from "./ProfileDetailClient";

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage({
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

  // RLS decides. A profile in someone else's workspace returns no row.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, name, objective, cadence, threshold, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title")
    .eq("buyer_profile_id", id);

  // Has any revision of this profile actually been finished? Basis depends
  // on it, and a draft is never 'stated only' however many readers exist.
  const { data: done } = await supabase
    .from("icp_profiles").select("id")
    .eq("profile_id", id).eq("status", "complete").limit(1).maybeSingle();

  const { summary } = await observeProfile(
    supabase,
    id,
    (profile.threshold as number) ?? 20,
    Boolean(done),
  );

  return (
    <ProfileDetailClient
      profile={{
        id: profile.id,
        name: profile.name,
        objective: profile.objective as string,
        cadence: profile.cadence as string,
        threshold: profile.threshold as number,
      }}
      documents={(docs ?? []).map((d) => ({ id: d.id, title: d.title ?? "Untitled" }))}
      entitled={hasFeature(ctx.plan.id, "icp")}
      observed={summary}
    />
  );
}
