import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { documentId, mode, firstName, lastName, email } = await req.json();

  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim()) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (mode === "email" && !email?.trim()) return NextResponse.json({ error: "Email is required to send." }, { status: 400 });

  // Verify the caller can actually see/act on this document (defense in depth).
  // The session client's SELECT is RLS-scoped, so if this returns a row, the
  // user legitimately has access to the document.
  const { data: docRow } = await supabase.from("documents").select("title").eq("id", documentId).single();
  if (!docRow) return NextResponse.json({ error: "You don't have access to that document." }, { status: 403 });
  const docTitle = docRow.title ?? "a document";

  const label = `${firstName.trim()} ${lastName.trim()}`;

  // Create the recipient via the ADMIN client. We've authenticated the user and
  // confirmed document access above, so bypassing RLS here is safe and avoids the
  // insert-then-read-back policy trap (same pattern as create-org/project/grants).
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

  const origin = new URL(req.url).origin;
  const readUrl = `${origin}/read/${rec.share_token}`;

  if (mode === "email") {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.PROSPECT_FROM_EMAIL || "BackRead <onboarding@resend.dev>";
    if (!RESEND_API_KEY) {
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: "Recipient created, but email is not configured yet (RESEND_API_KEY missing). Copy the link to send manually." });
    }

    // Sender identity for the email: "First Last from Organization".
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
    else senderName = "A BackRead user";
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
  return `<!doctype html><html><body style="margin:0;background:#F8F9FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-block;width:20px;height:20px;border:2px solid #1FA971;border-radius:50%;position:relative;"><span style="position:absolute;inset:5px;background:#1FA971;border-radius:50%;"></span></span>
      <span style="font-size:19px;font-weight:700;color:#0F1729;">BackRead</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 20px;">${senderName} has shared a document with you to read: <strong style="color:#0F1729;">${docTitle}</strong>.</p>
      <a href="${readUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:10px;">Open the document</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:22px 0 0;">Or paste this link into your browser:<br><span style="color:#475467;">${readUrl}</span></p>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">Sent via BackRead. The document reads the reader.</p>
  </div>
  </body></html>`;
}
