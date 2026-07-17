import { createClient } from "@/lib/supabase/server";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: docs } = await supabase.from("documents").select("id, title, created_at").order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);
  const { data: recips } = docIds.length ? await supabase.from("recipients").select("id, document_id, label").in("document_id", docIds) : { data: [] };
  const recipients = recips ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigs } = recIds.length ? await supabase.from("signals").select("recipient_id, kind, value, created_at").in("recipient_id", recIds).order("created_at", { ascending: false }) : { data: [] };
  const signals = sigs ?? [];

  const recMap = new Map(recipients.map((r) => [r.id, r]));
  const docMap = new Map(documents.map((d) => [d.id, d.title]));

  const openedRecipients = new Set<string>();
  let questionCount = 0;
  const recentEvents: { text: string; at: string; kind: string }[] = [];
  for (const s of signals) {
    const r = recMap.get(s.recipient_id);
    const who = r?.label || "An unnamed reader";
    const doc = r ? (docMap.get(r.document_id) ?? "a document") : "a document";
    if (s.kind === "opened") { openedRecipients.add(s.recipient_id); if (recentEvents.length < 6) recentEvents.push({ text: `${who} opened ${doc}`, at: s.created_at, kind: "opened" }); }
    if (s.kind === "question") { questionCount++; if (recentEvents.length < 6) { const qq = (s.value && typeof s.value === "object" && "text" in s.value) ? String((s.value as {text:string}).text) : ""; recentEvents.push({ text: `${who} asked: "${qq}"`, at: s.created_at, kind: "question" }); } }
  }

  const stats = {
    documents: documents.length,
    recipients: recipients.length,
    reads: openedRecipients.size,
    questions: questionCount,
  };

  return <OverviewClient stats={stats} recentEvents={recentEvents.slice(0, 6)} hasData={documents.length > 0} />;
}
