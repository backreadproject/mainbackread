import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RecipientDetailClient from "./RecipientDetailClient";
import { getSalesSettings } from "@/lib/sales-settings";
import type { OutcomeValue } from "./OutcomeCard";

// The evidence sentence the outcome prompt asks with.
//
// Built here rather than in the client because it reads the raw signals, and
// built at all because the difference between a product and a form is whether
// it knows what happened. "Update this record" gets dismissed once and ignored
// forever. "Sarah read this three times and asked about the annual commitment,
// then went quiet" gets answered.
//
// Returns "" when there is nothing worth saying, which suppresses the prompt
// entirely -- a reader who opened once and left is not a deal going cold.
function describe(
  name: string,
  sig: { kind: string; value: unknown; created_at: string }[],
  fr: boolean
): string {
  let opens = 0;
  const questions: string[] = [];
  let replied = false;
  let forwarded = false;
  for (const s of sig) {
    if (s.kind === "opened") opens++;
    else if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) {
      questions.push(String((s.value as { text: string }).text));
    } else if (s.kind === "replied") replied = true;
    else if (s.kind === "forwarded") forwarded = true;
  }

  // Nothing beyond a single glance. Not a deal, so not a question worth asking.
  if (opens < 2 && questions.length === 0 && !replied && !forwarded) return "";

  const parts: string[] = [];
  if (opens >= 2) parts.push(fr ? `l\u2019a lu ${opens} fois` : `read this ${opens} times`);
  else if (opens === 1) parts.push(fr ? "l\u2019a ouvert" : "opened this");
  if (questions.length > 0) {
    parts.push(fr ? `a pos\u00e9 ${questions.length} question${questions.length > 1 ? "s" : ""}` : `asked ${questions.length} question${questions.length > 1 ? "s" : ""}`);
  }
  if (forwarded) parts.push(fr ? "l\u2019a transf\u00e9r\u00e9 \u00e0 un coll\u00e8gue" : "forwarded it to a colleague");
  if (replied) parts.push(fr ? "a r\u00e9pondu" : "replied");

  const list = parts.length > 1
    ? parts.slice(0, -1).join(", ") + (fr ? " et " : " and ") + parts[parts.length - 1]
    : parts[0];
  return fr ? `${name} ${list}, puis plus rien.` : `${name} ${list}, then went quiet.`;
}

export default async function RecipientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sales = user ? await getSalesSettings(supabase, user.id) : { quietDays: 7 };

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, share_token, document_id, created_at, email, outcome, outcome_at, outcome_snoozed_at, roles, role_other, company, delivery, documents ( title )")
    .eq("id", id)
    .single();

  if (!recipient) notFound();
  const doc = recipient.documents as unknown as { title: string } | undefined;

  const { data: signals } = await supabase
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", id)
    .order("created_at", { ascending: true });

  const sig = signals ?? [];

  // Days since anything happened. Null when nothing ever has, which is a
  // different situation from silence and gets no prompt.
  const newest = sig.length ? new Date(sig[sig.length - 1].created_at).getTime() : null;
  const quietDays = newest === null ? null : Math.floor((Date.now() - newest) / 86400000);

  // Snoozing suppresses the prompt for one cycle, not forever. Whether a quiet
  // deal is dead is a question whose answer changes.
  const snoozedAt = recipient.outcome_snoozed_at ? new Date(recipient.outcome_snoozed_at).getTime() : 0;
  const snoozed = snoozedAt > 0 && Date.now() - snoozedAt < sales.quietDays * 86400000;

  const name = recipient.label || "This reader";

  return <RecipientDetailClient
    recipient={{ id: recipient.id, label: recipient.label, shareToken: recipient.share_token, documentId: recipient.document_id, documentTitle: doc?.title ?? "Untitled" }}
    identity={{
      id: recipient.id,
      label: recipient.label,
      email: recipient.email ?? null,
      company: recipient.company ?? null,
      roles: recipient.roles ?? [],
      roleOther: recipient.role_other ?? null,
      delivery: recipient.delivery ?? null,
      createdAt: recipient.created_at,
    }}
    signals={sig}
    outcome={{
      value: (recipient.outcome ?? null) as OutcomeValue,
      at: recipient.outcome_at ?? null,
      quietDays,
      snoozed,
      quietThreshold: sales.quietDays,
      evidenceEn: describe(name, sig, false),
      evidenceFr: describe(name, sig, true),
    }}
  />;
}