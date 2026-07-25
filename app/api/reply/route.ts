import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { deliverForRecipient } from "@/lib/webhooks";
import { sendEmail } from "@/lib/email";
export const runtime = "nodejs";
// A reader replying to the person who shared the document with them.
//
// This is an unauthenticated write that puts reader-supplied text into a real
// inbox, so it carries the same guards as the reader Ask endpoint: rate limited
// per share token, hard length cap, and the From stays ours. The reader's
// address appears only in reply_to, never in a From on our domain, because
// spoofing the sender is what turns a feature like this into a spam relay.
const MAX_LEN = 2000;
const PER_TOKEN_PER_HOUR = 5;
const PER_TOKEN_PER_DAY = 15;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function hourWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).toISOString();
}
function dayWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}
function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export async function POST(req: NextRequest) {
  let body: { token?: string; message?: string; email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Write something first." }, { status: 400 });
  if (message.length > MAX_LEN) return NextResponse.json({ error: `Keep it under ${MAX_LEN} characters.` }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });
  const admin = createAdminClient();
  // Rate limit before anything else. Reachable by anyone holding a share token.
  const [h, d] = await Promise.all([
    admin.rpc("bump_rate_limit", { p_bucket: `reply:${token}:h`, p_window: hourWindow() }),
    admin.rpc("bump_rate_limit", { p_bucket: `reply:${token}:d`, p_window: dayWindow() }),
  ]);
  if (!h.error && Number(h.data) > PER_TOKEN_PER_HOUR) {
    return NextResponse.json({ error: "You have sent several replies just now. Give it an hour." }, { status: 429 });
  }
  if (!d.error && Number(d.data) > PER_TOKEN_PER_DAY) {
    return NextResponse.json({ error: "That is as many replies as this link can send today." }, { status: 429 });
  }
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, email, document_id, documents ( id, title, owner_id )")
    .eq("share_token", token)
    .single();
  if (!recipient) return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  const doc = recipient.documents as unknown as { id: string; title: string; owner_id: string } | undefined;
  if (!doc) return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  const readerName = (recipient.label as string) || `${recipient.first_name ?? ""} ${recipient.last_name ?? ""}`.trim() || "A reader";
  // The reply itself. The email is stored on the signal because it is what they
  // gave when replying, which may differ from whatever the sender guessed when
  // they created the link.
  const { error: sigErr } = await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind: "replied",
    value: { text: message, email, at: new Date().toISOString() },
  });
  if (sigErr) return NextResponse.json({ error: "Could not send that. Try again." }, { status: 500 });
  // Backfill the recipient's address when we never had one. Link-mode readers
  // arrive with email null, so this is the only way they become contactable.
  if (!recipient.email) {
    await admin.from("recipients").update({ email }).eq("id", recipient.id).is("email", null);
  }
  // Tell the sender. In-app always; email when we can resolve their address.
  let ownerEmail: string | null = null;
  try {
    const { data: owner } = await admin.auth.admin.getUserById(doc.owner_id);
    ownerEmail = owner?.user?.email ?? null;
  } catch { /* non-fatal */ }
  const link = `/recipients/${recipient.id}`;
  const preview = message.length > 240 ? message.slice(0, 240) + "\u2026" : message;
  await notify({
    userId: doc.owner_id,
    type: "reader_replied",
    title: `${readerName} replied about ${doc.title}`,
    body: preview,
    link,
    email: null,
  });
  if (ownerEmail) {
    const html = `<!doctype html><html><body style="margin:0;background:#F8F9FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:26px;">
      <span style="display:inline-block;width:20px;height:20px;border:2px solid #1FA971;border-radius:50%;position:relative;"><span style="position:absolute;inset:5px;background:#1FA971;border-radius:50%;"></span></span>
      <span style="font-size:19px;font-weight:700;color:#0F1729;">ReadProspects</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:13px;color:#98A2B3;margin:0 0 6px;">Reply to ${esc(doc.title)}</p>
      <p style="font-size:17px;font-weight:700;color:#0F1729;margin:0 0 16px;">${esc(readerName)}</p>
      <div style="border-left:3px solid #D7EBE0;padding:2px 0 2px 14px;margin:0 0 18px;color:#344054;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(message)}</div>
      <p style="font-size:13px;color:#475467;line-height:1.55;margin:0 0 18px;">Reply to this email and it goes straight to them at ${esc(email)}.</p>
      <a href="https://app.readprospects.com${link}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">See how they read it</a>
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">Sent via ReadProspects. The document reads the reader.</p>
  </div></body></html>`;
    await sendEmail("readprospects", {
      to: ownerEmail,
      subject: `${readerName} replied about "${doc.title}"`,
      html,
      // The whole point: hitting Reply reaches the reader, not a noreply box.
      replyTo: email,
    });
  }
  try { await deliverForRecipient(recipient.id, "reader.replied", { text: message }); } catch { /* non-fatal */ }
  return NextResponse.json({ ok: true });
}