import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Creates a prospect recipient (with name), returns the read link.
// If mode === 'email', also dispatches a branded email via Resend.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { documentId, mode, firstName, lastName, email } = await req.json();

  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim()) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (mode === "email" && !email?.trim()) return NextResponse.json({ error: "Email is required to send." }, { status: 400 });

  const label = `${firstName.trim()} ${lastName.trim()}`;

  // Create the recipient. RLS: caller must be able to see/edit the document.
  const { data: rec, error } = await supabase
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

  // Get the document title for the email.
  const { data: docRow } = await supabase.from("documents").select("title").eq("id", documentId).single();
  const docTitle = docRow?.title ?? "a document";

  const origin = new URL(req.url).origin;
  const readUrl = `${origin}/read/${rec.share_token}`;

  // Email dispatch via Resend.
  if (mode === "email") {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.PROSPECT_FROM_EMAIL || "BackRead <onboarding@resend.dev>";
    if (!RESEND_API_KEY) {
      // Recipient created, but email can't send without the key. Report gracefully.
      return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: "Recipient created, but email is not configured yet (RESEND_API_KEY missing). Copy the link to send manually." });
    }

    const senderName = `${(user.user_metadata?.full_name as string) || user.email || "A BackRead user"}`;
    const html = brandedEmail({ firstName: firstName.trim(), senderName, docTitle, readUrl });

    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [email.trim()],
          subject: `${senderName} shared "${docTitle}" with you`,
          html,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return NextResponse.json({ ok: true, recipient: rec, readUrl, emailSent: false, emailWarning: `Recipient created, but the email failed to send: ${txt.slice(0, 200)}` });
      }
    } catch (e) {
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
