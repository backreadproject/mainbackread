import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { readerLink } from "@/lib/reader-origin";
import { pickVariantForDocument } from "@/lib/variants";
import { sendEmail, emailConfigured } from "@/lib/email";
import { resolvePlanForUser, isLocked, checkRecipientLimit, checkSendQuota, logUsage } from "@/lib/plan-context";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { documentId, mode, firstName, lastName, email, note, variantId } = await req.json();
  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim()) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (mode === "email" && !email?.trim()) return NextResponse.json({ error: "Email is required to send." }, { status: 400 });
  const noteClean = typeof note === "string" ? note.trim().slice(0, 2000) : "";
  const { data: docRow } = await supabase.from("documents").select("title").eq("id", documentId).single();
  if (!docRow) return NextResponse.json({ error: "You don't have access to that document." }, { status: 403 });
  const docTitle = docRow.title ?? "a document";
  const label = `${firstName.trim()} ${lastName.trim()}`;
  const admin = createAdminClient();

  // ---- Plan gates -------------------------------------------------------
  const plan = await resolvePlanForUser(admin, user.id);
  if (isLocked(plan)) {
    return NextResponse.json({ error: "Your free trial has ended. Subscribe to keep sharing documents.", trialEnded: true }, { status: 402 });
  }
  // Recipients per document (Free = 1). Applies to link and email alike.
  const recGate = await checkRecipientLimit(admin, plan.plan, documentId);
  if (!recGate.allowed) {
    return NextResponse.json({ error: `The ${plan.plan.name} plan allows ${recGate.limit} recipient per document. Upgrade to add more.`, limitReached: true, limit: recGate.limit }, { status: 402 });
  }
  // Email sends per month (Free = 5).
  if (mode === "email") {
    const sendGate = await checkSendQuota(admin, plan.plan, user.id);
    if (!sendGate.allowed) {
      return NextResponse.json({ error: `You've used all ${sendGate.limit} email sends this month on the ${plan.plan.name} plan.`, limitReached: true, limit: sendGate.limit, used: sendGate.used }, { status: 402 });
    }
  }
  // -----------------------------------------------------------------------

  // A/B: honour an explicit variant, else auto-balance. Null when the document
  // has no variants, which leaves the default single-document flow untouched.
  const explicitVariant = typeof variantId === "string" && variantId.trim() ? variantId.trim() : null;
  const assignedVariant = explicitVariant ?? (await pickVariantForDocument(admin, documentId));

  const { data: rec, error } = await admin
    .from("recipients")
    .insert({
      document_id: documentId,
      variant_id: assignedVariant,
      label,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: mode === "email" ? email.trim() : null,
      delivery: mode === "email" ? "email" : "link",
    })
    .select("id, label, share_token, created_at, first_name, last_name, email, delivery, variant_id")
    .single();
  if (error || !rec) return NextResponse.json({ error: error?.message ?? "Could not create recipient." }, { status: 400 });
  const readUrl = readerLink(rec.share_token, new URL(req.url).origin);
  if (mode === "email") {
    if (!emailConfigured("relay")) {
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: "Recipient created, but email is not configured yet. Copy the link to send manually." });
    }
    const ctx = await getOrgContext();
    const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
    const first = (prof?.first_name as string) || (user.user_metadata?.first_name as string) || "";
    const last = (prof?.last_name as string) || (user.user_metadata?.last_name as string) || "";
    const personName = `${first} ${last}`.trim();
    const orgName = ctx.org?.name?.trim() || "";
    let senderName: string;
    if (personName && orgName) senderName = `${personName} from ${orgName}`;
    else if (personName) senderName = personName;
    else if (orgName) senderName = orgName;
    else senderName = "A colleague";
    const html = brandedEmail({ firstName: firstName.trim(), senderName, docTitle, readUrl, note: noteClean });
    const emailResult = await sendEmail("relay", { to: email.trim(), subject: `${senderName} shared "${docTitle}" with you`, html });
    if (!emailResult.ok) {
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: `Recipient created, but the email failed to send: ${emailResult.error ?? ""}` });
    }
    // Count this send against the monthly quota.
    await logUsage(admin, "send", { userId: user.id, orgId: plan.orgId, documentId });
    return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: true });
  }
  return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false });
}
// Escape user-supplied text before it goes into the email HTML.
function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function noteToHtml(note: string) {
  return note.trim().split(/\n{2,}/).map((para) =>
    `<p style="font-size:15px;color:#0F1729;line-height:1.6;margin:0 0 16px;">${esc(para).replace(/\r?\n/g, "<br>")}</p>`
  ).join("");
}
function brandedEmail({ firstName, senderName, docTitle, readUrl, note }: { firstName: string; senderName: string; docTitle: string; readUrl: string; note?: string }) {
  const fn = esc(firstName), sn = esc(senderName), dt = esc(docTitle);
  const noteBlock = note && note.trim() ? noteToHtml(note) : "";
  return `<!doctype html><html><body style="margin:0;background:#F4F6F3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#E7F6EF;">
        <span style="display:inline-block;width:16px;height:16px;border:2px solid #0B7A4B;border-radius:4px;"></span>
      </span>
      <span style="font-size:17px;font-weight:700;color:#0F1729;">Documents</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">Hi ${fn},</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 20px;">${sn} has shared a document with you: <strong style="color:#0F1729;">${dt}</strong>.</p>
      ${noteBlock}
      <a href="${readUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:10px;">Open the document</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:22px 0 0;">Or paste this link into your browser:<br><span style="color:#475467;">${readUrl}</span></p>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">This link was shared privately with you.</p>
  </div>
  </body></html>`;
}


