import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { readerLink } from "@/lib/reader-origin";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { documentId, mode, firstName, lastName, email } = await req.json();
  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim()) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (mode === "email" && !email?.trim()) return NextResponse.json({ error: "Email is required to send." }, { status: 400 });
  const { data: docRow } = await supabase.from("documents").select("title").eq("id", documentId).single();
  if (!docRow) return NextResponse.json({ error: "You don't have access to that document." }, { status: 403 });
  const docTitle = docRow.title ?? "a document";
  const label = `${firstName.trim()} ${lastName.trim()}`;
  const admin = createAdminClient();
  const { data: rec, error } = await admin
    .from("recipients")
    .insert({
      document_id: documentId,
      label,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: mode === "email" ? email.trim() : null,
      delivery: mode === "email" ? "email" : "link",
    })
    .select("id, label, share_token, created_at, first_name, last_name, email, delivery")
    .single();
  if (error || !rec) return NextResponse.json({ error: error?.message ?? "Could not create recipient." }, { status: 400 });
  // Reader links ALWAYS use the private reader-delivery domain, never the app domain.
  // Fall back to the request origin only if no reader domain is configured (local dev).
  const readUrl = readerLink(rec.share_token, new URL(req.url).origin);
  if (mode === "email") {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // Send from the reader domain, not the app domain, so nothing in the recipient's
    // inbox ties back to the marketing/app brand. Override with PROSPECT_FROM_EMAIL.
    const FROM = process.env.PROSPECT_FROM_EMAIL || "Documents <documents@relaydocuments.com>";
    if (!RESEND_API_KEY) {
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: "Recipient created, but email is not configured yet (RESEND_API_KEY missing). Copy the link to send manually." });
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
    const html = brandedEmail({ firstName: firstName.trim(), senderName, docTitle, readUrl });
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [email.trim()], subject: `${senderName} shared "${docTitle}" with you`, html }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: `Recipient created, but the email failed to send: ${txt.slice(0, 200)}` });
      }
    } catch {
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: "Recipient created, but the email service could not be reached." });
    }
    return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: true });
  }
  return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false });
}
function brandedEmail({ firstName, senderName, docTitle, readUrl }: { firstName: string; senderName: string; docTitle: string; readUrl: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F4F6F3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#E7F6EF;">
        <span style="display:inline-block;width:16px;height:16px;border:2px solid #0B7A4B;border-radius:4px;"></span>
      </span>
      <span style="font-size:17px;font-weight:700;color:#0F1729;">Documents</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 20px;">${senderName} has shared a document with you: <strong style="color:#0F1729;">${docTitle}</strong>.</p>
      <a href="${readUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:10px;">Open the document</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:22px 0 0;">Or paste this link into your browser:<br><span style="color:#475467;">${readUrl}</span></p>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">This link was shared privately with you.</p>
  </div>
  </body></html>`;
}
