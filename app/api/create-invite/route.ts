import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { resolvePlanForUser, isLocked, checkSeatLimit } from "@/lib/plan-context";
import { notify, notifyEmail } from "@/lib/notify";
import { sendEmail, emailConfigured } from "@/lib/email";
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

  // ---- Plan gates: trial lock + seat cap --------------------------------
  const plan = await resolvePlanForUser(admin, user.id);
  if (isLocked(plan)) {
    return NextResponse.json({ error: "Your free trial has ended. Subscribe to add teammates.", trialEnded: true }, { status: 402 });
  }
  const seatGate = await checkSeatLimit(admin, plan.plan, ctx.org.id);
  if (!seatGate.allowed) {
    return NextResponse.json({ error: `The ${plan.plan.name} plan includes ${seatGate.limit} seats and they're all in use. Upgrade to add more.`, limitReached: true, limit: seatGate.limit, used: seatGate.used }, { status: 402 });
  }
  // -----------------------------------------------------------------------

  const cleanEmail = email.trim().toLowerCase();
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === cleanEmail);
  if (existing) {
    const { data: alreadyMember } = await admin.from("organization_members").select("id").eq("organization_id", ctx.org.id).eq("user_id", existing.id).maybeSingle();
    if (alreadyMember) return NextResponse.json({ error: "That person is already a member." }, { status: 409 });
    await admin.from("organization_members").insert({ organization_id: ctx.org.id, user_id: existing.id, role, email: cleanEmail });
    await admin.from("profiles").upsert({ id: existing.id, account_type: "organization", active_org_id: ctx.org.id, updated_at: new Date().toISOString() });
    const origin0 = new URL(req.url).origin;
    await notify({
      userId: existing.id,
      type: "added_to_org",
      title: `You were added to ${ctx.org.name}`,
      body: `You now have access as ${role}.`,
      params: { org: ctx.org.name, role },
      link: "/overview",
      email: { to: cleanEmail, subject: `You've been added to ${ctx.org.name} on ReadProspects`, html: notifyEmail(`You've joined ${ctx.org.name}`, `You now have access as ${role}. Open ReadProspects to get started.`, `${origin0}/overview`, "Open ReadProspects") },
    });
    return NextResponse.json({ ok: true, addedDirectly: true });
  }
  const { data: invite, error } = await admin
    .from("invitations")
    .insert({ organization_id: ctx.org.id, email: cleanEmail, first_name: firstName.trim(), last_name: lastName.trim(), role, invited_by: user.id })
    .select("id, token, first_name")
    .single();
  if (error || !invite) return NextResponse.json({ error: error?.message ?? "Could not create invitation." }, { status: 400 });
  const origin = new URL(req.url).origin;
  const acceptUrl = `${origin}/invite/${invite.token}`;
  if (!emailConfigured("readprospects")) {
    return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: false, acceptUrl, emailWarning: "Invitation created, but email isn't configured. Share this link manually: " + acceptUrl });
  }
  const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const inviterName = `${(prof?.first_name as string) || ""} ${(prof?.last_name as string) || ""}`.trim() || (user.email ?? "A teammate");
  const html = inviteEmail({ firstName: firstName.trim(), inviterName, orgName: ctx.org.name, acceptUrl });
  const emailResult = await sendEmail("readprospects", {
    to: cleanEmail,
    subject: `${inviterName} invited you to join ${ctx.org.name} on ReadProspects`,
    html,
    // A reply to an invitation should reach the person who sent it, not a
    // noreply mailbox. The invite already names them, so this reveals nothing.
    replyTo: user.email ?? undefined,
  });
  if (!emailResult.ok) {
    return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: false, acceptUrl, emailWarning: `Invitation created, but the email failed: ${emailResult.error ?? ""}. Share this link: ${acceptUrl}` });
  }
  return NextResponse.json({ ok: true, invite: { id: invite.id }, emailSent: true });
}
function inviteEmail({ firstName, inviterName, orgName, acceptUrl }: { firstName: string; inviterName: string; orgName: string; acceptUrl: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F8F9FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-block;width:20px;height:20px;border:2px solid #1FA971;border-radius:50%;position:relative;"><span style="position:absolute;inset:5px;background:#1FA971;border-radius:50%;"></span></span>
      <span style="font-size:19px;font-weight:700;color:#0F1729;">ReadProspects</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 20px;">${inviterName} has invited you to join <strong style="color:#0F1729;">${orgName}</strong> on ReadProspects. Accept the invitation and set your password to get started.</p>
      <a href="${acceptUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:10px;">Accept invitation</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:22px 0 0;">This invitation expires in 14 days. If you weren't expecting it, you can ignore this email.</p>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">Sent via ReadProspects. The document reads the reader.</p>
  </div>
  </body></html>`;
}
