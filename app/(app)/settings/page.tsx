import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
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

  return (
    <SettingsClient
      email={user.email ?? ""}
      isOrg={isOrg}
      canManageOrg={canManageOrg}
      orgId={ctx.org?.id ?? null}
      orgName={orgName}
      orgDomain={orgDomain}
    />
  );
}
