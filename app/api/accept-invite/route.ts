import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing token or password." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const admin = createAdminClient();

  // Look up the invitation.
  const { data: invite } = await admin.from("invitations").select("*").eq("token", token).single();
  if (!invite) return NextResponse.json({ error: "This invitation is invalid." }, { status: 404 });
  if (invite.status !== "pending") return NextResponse.json({ error: "This invitation has already been used or revoked." }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });

  // Create the auth user with the chosen password, name in metadata, email confirmed.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { first_name: invite.first_name, last_name: invite.last_name, full_name: `${invite.first_name} ${invite.last_name}` },
  });
  if (createErr || !created.user) {
    // If the user already exists (edge case), surface a clear message.
    return NextResponse.json({ error: createErr?.message ?? "Could not create your account." }, { status: 400 });
  }
  const userId = created.user.id;

  // Profile with names + org account.
  await admin.from("profiles").upsert({ id: userId, first_name: invite.first_name, last_name: invite.last_name, account_type: "organization", active_org_id: invite.organization_id, updated_at: new Date().toISOString() });

  // Add to the org.
  await admin.from("organization_members").insert({ organization_id: invite.organization_id, user_id: userId, role: invite.role, email: invite.email });

  // Mark invitation accepted.
  await admin.from("invitations").update({ status: "accepted" }).eq("id", invite.id);

  return NextResponse.json({ ok: true, email: invite.email });
}

// GET: validate a token and return invite details (for the accept page to show who/what).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const admin = createAdminClient();
  const { data: invite } = await admin.from("invitations").select("email, first_name, last_name, status, expires_at, organization_id").eq("token", token).single();
  if (!invite) return NextResponse.json({ valid: false, reason: "invalid" });
  if (invite.status !== "pending") return NextResponse.json({ valid: false, reason: "used" });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

  const { data: org } = await admin.from("organizations").select("name").eq("id", invite.organization_id).single();
  return NextResponse.json({ valid: true, email: invite.email, firstName: invite.first_name, orgName: org?.name ?? "an organization" });
}
