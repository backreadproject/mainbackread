import { createAdminClient } from "@/lib/supabase/admin";
import { readerLink, readerOrigin } from "@/lib/reader-origin";
import { sendEmail, emailConfigured } from "@/lib/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
import { deliverForRecipient } from "@/lib/webhooks";
const MAX_COLLEAGUES = 10;

function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Reader-initiated forward. The reader is NOT signed in; they are authenticated purely by
// their share_token. We resolve that token to its recipient/document with the admin client,
// mint a fresh tracked link per colleague, email each from the neutral RelayDocuments sender,
// and record a "forwarded" signal on the original reader so the verdict can read forwardedTo.
export async function POST(req: Request) {
  let body: { token?: string; colleagues?: { name?: string; email?: string }[]; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });

  const list = Array.isArray(body.colleagues) ? body.colleagues : [];
  const clean = list
    .map((c) => ({ name: String(c?.name ?? "").trim(), email: String(c?.email ?? "").trim() }))
    .filter((c) => c.name && c.email)
    .slice(0, MAX_COLLEAGUES);
  if (!clean.length) return NextResponse.json({ error: "Add at least one colleague." }, { status: 400 });
  if (clean.some((c) => !EMAIL_RE.test(c.email))) return NextResponse.json({ error: "One of the email addresses looks invalid." }, { status: 400 });
  const note = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";

  const admin = createAdminClient();
  const { data: origin } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, document_id, documents ( title )")
    .eq("share_token", token)
    .single();
  if (!origin) return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });

  const doc = origin.documents as unknown as { title?: string } | undefined;
  const docTitle = (doc?.title && doc.title.trim()) || "a document";
  const forwarder = (origin.label as string) || `${origin.first_name ?? ""} ${origin.last_name ?? ""}`.trim() || "A colleague";

  const privacyUrl = `${readerOrigin(new URL(req.url).origin)}/privacy`;
  const sent: { email: string; ok: boolean }[] = [];
  for (const c of clean) {
    const parts = c.name.split(/\s+/);
    const firstName = parts[0] || c.name;
    const lastName = parts.slice(1).join(" ") || "";
    const { data: rec, error } = await admin
      .from("recipients")
      .insert({ document_id: origin.document_id, label: c.name, first_name: firstName, last_name: lastName, email: c.email, delivery: "email" })
      .select("share_token")
      .single();
    if (error || !rec) { sent.push({ email: c.email, ok: false }); continue; }
    const readUrl = readerLink(rec.share_token as string, new URL(req.url).origin);
    const emailResult = await sendEmail("relay", { to: c.email, subject: `${forwarder} shared "${docTitle}" with you`, html: forwardEmail({ toName: firstName, forwarder, docTitle, readUrl, note, privacyUrl }) });
    sent.push({ email: c.email, ok: emailResult.ok });
  }

  // Record the forward against the original reader (non-fatal). Feeds the verdict's forwardedTo.
  try {
    await admin.from("signals").insert({ recipient_id: origin.id, kind: "forwarded", value: { colleagues: clean } });
      await deliverForRecipient(origin.id, "reader.forwarded", { colleagueCount: clean.length });
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, count: clean.length, sent, emailConfigured: emailConfigured("relay") });
}

function forwardEmail({ toName, forwarder, docTitle, readUrl, note, privacyUrl }: { toName: string; forwarder: string; docTitle: string; readUrl: string; note: string; privacyUrl: string }) {
  const tn = esc(toName), fw = esc(forwarder), dt = esc(docTitle), url = esc(readUrl), pv = esc(privacyUrl);
  const noteBlock = note
    ? `<div style="border-left:3px solid #d7ebe0;padding:2px 0 2px 14px;margin:16px 0;color:#475467;font-size:14px;font-style:italic;line-height:1.5;">${esc(note)}</div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#EEF3F0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:26px;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:#159A56;color:#fff;font-size:15px;line-height:1;">&rarr;</span>
      <span style="font-size:17px;font-weight:700;color:#111A16;">Relay</span>
    </div>
    <div style="background:#fff;border:1px solid #E5EBE7;border-radius:14px;padding:28px;">
      <p style="font-size:16px;color:#111A16;margin:0 0 14px;">Hi ${tn},</p>
      <p style="font-size:15px;color:#475467;line-height:1.6;margin:0 0 6px;"><strong style="color:#111A16;">${fw}</strong> shared a document with you through RelayDocuments: <strong style="color:#111A16;">${dt}</strong>.</p>
      ${noteBlock}
      <a href="${url}" style="display:inline-block;background:#159A56;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 24px;border-radius:10px;margin-top:10px;">View document &rarr;</a>
      <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:20px 0 0;">Or paste this link into your browser:<br><span style="color:#475467;">${url}</span></p>
    </div>
    <div style="background:#F6F8F7;border-radius:10px;padding:12px 14px;margin:14px 0 12px;font-size:11.5px;color:#586760;line-height:1.6;">
      <strong style="color:#111A16;">Why you got this:</strong> ${fw} forwarded this document to you using RelayDocuments, a service for sharing documents by link. If this was not meant for you, you can ignore it, nothing opens until you choose to.
    </div>
    <p style="font-size:11.5px;color:#98A2B3;text-align:center;margin:0;"><a href="${pv}" style="color:#159A56;font-weight:600;text-decoration:none;">Privacy notice</a> &middot; RelayDocuments Inc</p>
  </div>
  </body></html>`;
}




