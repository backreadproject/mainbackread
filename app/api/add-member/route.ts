import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { organizationId, email, role } = await req.json();
  if (!organizationId || !email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!["admin", "member"].includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  // Confirm the caller is owner/admin of this org (defense in depth; RLS also enforces).
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();
  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Only owners and admins can add members." }, { status: 403 });
  }

  // Look up the target user by email using admin.
  const admin = createAdminClient();
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  const target = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (!target) {
    return NextResponse.json({ error: "No BackRead account with that email. In Stage 4, invites will let you add people who haven't signed up yet." }, { status: 404 });
  }

  // Already a member?
  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", target.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "That person is already a member." }, { status: 409 });

  // Insert membership (RLS insert allows owner/admin).
  const { data: member, error: insErr } = await supabase
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: target.id, role, email: target.email })
    .select("id, user_id, role, email, created_at")
    .single();
  if (insErr || !member) return NextResponse.json({ error: insErr?.message ?? "Could not add member." }, { status: 400 });

  // Flip their profile to org account if not already.
  await admin.from("profiles").upsert({ id: target.id, account_type: "organization", active_org_id: organizationId, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true, member: { id: member.id, userId: member.user_id, email: member.email, role: member.role, joinedAt: member.created_at } });
}
