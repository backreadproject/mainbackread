import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { isSampleId } from "@/lib/sample-profile";
import { hasFeature } from "@/lib/plans";
import EditClient from "./EditClient";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({
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
    .select("id, name, objective")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  // Changing the objective changes which questions get asked, so it is only
  // offered when there is nothing generated to invalidate. After that it is a
  // re-answer, which is what a new objective actually is.
  const { data: revs } = await supabase
    .from("icp_profiles")
    .select("id, revision, status")
    .eq("profile_id", id)
    .order("revision", { ascending: false });

  const list = revs ?? [];
  const generated = list.some((r) => r.status === "complete");

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title")
    .eq("buyer_profile_id", id);

  return (
    <EditClient
      profile={{
        id: profile.id as string,
        name: profile.name as string,
        objective: profile.objective as string,
      }}
      generated={generated}
      revisions={list.length}
      documents={(docs ?? []).map((d) => ({ id: d.id as string, title: (d.title as string) ?? "Untitled" }))}
    />
  );
}
