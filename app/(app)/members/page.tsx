import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const ctx = await getOrgContext();

  if (ctx.accountType !== "organization" || !ctx.org) {
    // No org yet — show the create-org state.
    return <MembersClient org={null} role={null} members={[]} />;
  }

  const supabase = await createClient();
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("id, user_id, role, email, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: true });

  const rows = memberRows ?? [];
  const members = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    email: (r.email as string | null) ?? null,
    role: r.role as "owner" | "admin" | "member",
    joinedAt: r.created_at,
  }));

  return <MembersClient org={ctx.org} role={ctx.role} members={members} />;
}
