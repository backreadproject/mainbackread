import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const ctx = await getOrgContext();
  if (ctx.accountType !== "organization" || !ctx.org) return NextResponse.json({ error: "Organization required." }, { status: 403 });
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "Only owners and admins can invite." }, { status: 403 });

  const { email, firstName, lastName, role } = await req.json();
  if (!email?.trim() || !firstName?.trim() || !lastName?.trim()) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  if (!["admin", "member"].includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  const admin = createAdminClient();
  const cleanEmail = email.trim().toLowerCase();

  // If they already have an account, add them directly to the org instead of inviting.
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === cleanEmail);
  if (existing) {
    // Already a member?
    const { data: alreadyMember } = await admin.from("organization_members").select("id").eq("organization_id", ctx.org.id).eq("user_id", existing.id).maybeSingle();
    if (alreadyMember) return NextResponse.json({ error: "That person is already a member." }, { status: 409 });
    await admin.from("organization_members").insert({ organization_id: ctx.org.id, user_id: existing.id, role, email: cleanEmail });
    await admin.from("profiles").upsert({ id: existing.id, account_type: "organization", active_org_id: ctx.org.id, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, addedDirectly: true });
  }

  // Otherwise create an invitation.
  const { data: invite, error } = await admin
    .from("invitations")
    .insert({ organization_id: ctx.org.id, email: cleanEmail, first_name: firstName.trim(), last_name: lastName.trim(), role, invited_by: user.id })
    .select("id, token, first_name")
    .single();
  if (error || !invite) return NextResponse.json({ error: error?.message ?? "Could not create invitation." }, { status: 400 });

  // Send the invitation email via Resend.
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.PROSPECT_FROM_EMAIL || "BackRead <onboarding@resend.dev>";
  const origin = new URL(req.url).origin;
  const acceptUrl = `${origin}/invite/${invite.token}`;

  if (!RESEND_API_KEY) {
    return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: false, acceptUrl, emailWarning: "Invitation created, but email isn't configured. Share this link manually: " + acceptUrl });
  }

  const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const inviterName = `${(prof?.first_name as string) || ""} ${(prof?.last_name as string) || ""}`.trim() || (user.email ?? "A teammate");
  const html = inviteEmail({ firstName: firstName.trim(), inviterName, orgName: ctx.org.name, acceptUrl });

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [cleanEmail], subject: `${inviterName} invited you to join ${ctx.org.name} on BackRead`, html }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: false, acceptUrl, emailWarning: `Invitation created, but the email failed: ${txt.slice(0, 160)}. Share this link: ${acceptUrl}` });
    }
  } catch {
    return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: false, acceptUrl, emailWarning: "Invitation created, but email couldn't send. Share this link: " + acceptUrl });
  }

  return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: true });
}

function inviteEmail({ firstName, inviterName, orgName, acceptUrl }: { firstName: string; inviterName: string; orgName: string; acceptUrl: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F8F9FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-block;width:20px;height:20px;border:2px solid #1FA971;border-radius:50%;position:relative;"><span style="position:absolute;inset:5px;background:#1FA971;border-radius:50%;"></span></span>
      <span style="font-size:19px;font-weight:700;color:#0F1729;">BackRead</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 20px;">${inviterName} has invited you to join <strong style="color:#0F1729;">${orgName}</strong> on BackRead. Accept the invitation and set your password to get started.</p>
      <a href="${acceptUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:10px;">Accept invitation</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:22px 0 0;">This invitation expires in 14 days. If you weren't expecting it, you can ignore this email.</p>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">Sent via BackRead. The document reads the reader.</p>
  </div>
  </body></html>`;
}
