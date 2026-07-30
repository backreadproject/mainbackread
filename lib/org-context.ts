import { createClient } from "@/lib/supabase/server";

export type OrgContext = {
  accountType: "personal" | "organization";
  org: { id: string; name: string } | null;
  role: "owner" | "admin" | "member" | null;
  trialStartedAt: string | null;
};

// Reads the current user's org context (account type, active org, their role).
export async function getOrgContext(): Promise<OrgContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { accountType: "personal", org: null, role: null, trialStartedAt: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, active_org_id, trial_started_at")
    .eq("id", user.id)
    .single();

  const acctType = (profile?.account_type as OrgContext["accountType"]) ?? "personal";
  const trialStartedAt = (profile?.trial_started_at as string | null) ?? null;

  // If they haven't set up an org yet, return their account type but no org.
  if (!profile || !profile.active_org_id) {
    return { accountType: acctType, org: null, role: null, trialStartedAt };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", profile.active_org_id)
    .single();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", profile.active_org_id)
    .eq("user_id", user.id)
    .single();

  if (!org) return { accountType: acctType, org: null, role: null, trialStartedAt };

  return {
    accountType: acctType,
    org: { id: org.id, name: org.name },
    role: (membership?.role as OrgContext["role"]) ?? "member",
    trialStartedAt,
  };
}
