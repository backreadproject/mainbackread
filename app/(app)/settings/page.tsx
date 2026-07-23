import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getOrgContext();
  const isOrg = !!ctx.org;
  const canManageOrg = ctx.role === "owner" || ctx.role === "admin";

  let orgName = "";
  let orgDomain = "";
  if (ctx.org) {
    const { data: org } = await supabase.from("organizations").select("name, domain").eq("id", ctx.org.id).single();
    orgName = org?.name ?? ctx.org.name;
    orgDomain = (org?.domain as string) ?? "";
  }

  const admin = createAdminClient();
  const planCtx = await resolvePlanForUser(admin, user.id);
  const webhooksEnabled = isOrg && hasFeature(planCtx.plan.id, "webhookAlerts");
  const { data: hooks } = ctx.org
    ? await admin.from("webhooks").select("id, url, events, active, last_status, last_delivery_at").eq("organization_id", ctx.org.id).order("created_at")
    : { data: [] };

  return (
    <SettingsClient
      email={user.email ?? ""}
      isOrg={isOrg}
      canManageOrg={canManageOrg}
      orgId={ctx.org?.id ?? null}
      orgName={orgName}
      orgDomain={orgDomain}
      webhooksEnabled={webhooksEnabled}
      webhooks={(hooks ?? []) as { id: string; url: string; events: string[]; active: boolean; last_status: number | null; last_delivery_at: string | null }[]}
      planName={planCtx.plan.name}
    />
  );
}
