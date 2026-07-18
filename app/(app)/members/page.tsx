import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const ctx = await getOrgContext();

  if (!ctx.org) {
    // No org yet — show the create-org state.
    return <MembersClient org={null} role={null} members={[]} invites={[]} accountType={ctx.accountType} trialStartedAt={ctx.trialStartedAt} />;
  }

  const supabase = await createClient();
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("id, user_id, role, email, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: true });

  const { data: inviteRows } = await supabase
    .from("invitations")
    .select("id, email, first_name, last_name, role, status, created_at, expires_at")
    .eq("organization_id", ctx.org.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const invites = (inviteRows ?? []).map((i) => ({
    id: i.id, email: i.email, firstName: i.first_name, lastName: i.last_name, role: i.role as "admin" | "member", createdAt: i.created_at, expiresAt: i.expires_at,
  }));

  const rows = memberRows ?? [];
  const userIds = rows.map((r) => r.user_id).filter(Boolean);
  const { data: profileRows } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", userIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }[] };
  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));
  const members = rows.map((r) => {
    const p = profileMap.get(r.user_id);
    return {
      id: r.id,
      userId: r.user_id,
      email: (r.email as string | null) ?? null,
      firstName: (p?.first_name as string) || "",
      lastName: (p?.last_name as string) || "",
      avatarUrl: (p?.avatar_url as string) || null,
      role: r.role as "owner" | "admin" | "member",
      joinedAt: r.created_at,
    };
  });

  return <MembersClient org={ctx.org} role={ctx.role} members={members} invites={invites} accountType={ctx.accountType} trialStartedAt={ctx.trialStartedAt} />;
}
