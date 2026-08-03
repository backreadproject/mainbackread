import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { readerLink } from "@/lib/reader-origin";
import { sendEmail, emailConfigured } from "@/lib/email";
import { resolvePlanForUser, isLocked, checkSendQuota, logUsage } from "@/lib/plan-context";

export const runtime = "nodejs";

// Sending to a recipient who ALREADY EXISTS.
//
// Signers named at upload are created immediately, with an email and a share
// token, in LINK mode -- deliberately, because naming someone is not sending to
// them. Sending stays a separate decision made later.
//
// Until now the only way to email them was the create form, which would have
// made a SECOND row for the same person: one carrying their signature fields,
// one able to receive mail and unable to sign. This sends the link they already
// have instead.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  const overrideEmail = typeof body.email === "string" ? body.email.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
  if (!recipientId) return NextResponse.json({ error: "Nothing to send." }, { status: 400 });

  const admin = createAdminClient();
  const { data: rec } = await admin
    .from("recipients")
    .select("id, label, first_name, email, share_token, document_id, sent_at")
    .eq("id", recipientId)
    .maybeSingle();
  if (!rec) return NextResponse.json({ error: "No such recipient." }, { status: 404 });

  // RLS proves ownership: if the session client can see the document, the caller
  // may send its links. Same model as /api/outcome and /api/concern.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title")
    .eq("id", rec.document_id as string)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  const plan = await resolvePlanForUser(admin, user.id);
  if (isLocked(plan)) {
    return NextResponse.json({ error: "Your subscription has ended.", trialEnded: true }, { status: 402 });
  }
  const gate = await checkSendQuota(admin, plan.plan, user.id);
  if (!gate.allowed) {
    return NextResponse.json({ error: "You have used all " + gate.limit + " email sends this month.", limitReached: true }, { status: 402 });
  }

  const to = overrideEmail || ((rec.email as string) || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "This recipient has no email address. Add one to send." }, { status: 400 });
  }
  if (!emailConfigured("relay")) {
    return NextResponse.json({ error: "Email is not configured yet. Copy the link and send it manually." }, { status: 400 });
  }

  const ctx = await getOrgContext();
  const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const personName = ((prof?.first_name as string) || "") + " " + ((prof?.last_name as string) || "");
  const who = personName.trim();
  const orgName = ctx.org?.name?.trim() || "";
  const senderName = who && orgName ? who + " from " + orgName : who || orgName || "A colleague";

  const readUrl = readerLink(rec.share_token as string, new URL(req.url).origin);
  const firstName = (rec.first_name as string) || (rec.label as string) || "there";
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Account first, then the message: sendEmail takes the account positionally.
  //
  // The From stays documents@relaydocuments.com, which is what keeps the tool
  // invisible. Reply-To is the sender's own address, because that domain has no
  // mailbox -- a reader who replies would otherwise bounce, and a reply is a
  // stronger signal than any dwell time.
  const sent = await sendEmail("relay", {
    to,
    subject: senderName + ' shared "' + doc.title + '" with you',
    html:
      "<p>Hello " + esc(firstName) + ",</p>" +
      (note ? "<p>" + esc(note) + "</p>" : "") +
      "<p>" + esc(senderName) + " has shared a document with you.</p>" +
      '<p><a href="' + readUrl + '">Open the document</a></p>',
    replyTo: user.email ?? undefined,
  });

  if (!sent.ok) return NextResponse.json({ error: "Could not send that email." }, { status: 502 });

  // Stamped only now. sent_at is what the certificate reads, and it must mean
  // "something was actually sent", not "a row exists".
  await admin
    .from("recipients")
    .update({
      delivery: "email",
      sent_at: new Date().toISOString(),
      ...(rec.email ? {} : { email: to }),
    })
    .eq("id", recipientId);

  try {
    await logUsage(admin, "send", { userId: user.id, orgId: plan.orgId, documentId: rec.document_id as string });
  } catch { /* usage logging must not fail a send that already went out */ }

  return NextResponse.json({ ok: true, sentTo: to, resent: !!rec.sent_at });
}