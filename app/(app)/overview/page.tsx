import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const supabase = await createClient();
  await supabase.auth.getUser();
  const locale = await getLocale();
  const t = getDict(locale).activity;

  const { data: docs } = await supabase.from("documents").select("id, title, created_at").order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);
  const { data: recips } = docIds.length
    ? await supabase.from("recipients").select("id, document_id, label").in("document_id", docIds)
    : { data: [] };
  const recipients = recips ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigs } = recIds.length
    ? await supabase.from("signals").select("recipient_id, kind, value, created_at").in("recipient_id", recIds).order("created_at", { ascending: false })
    : { data: [] };
  const signals = sigs ?? [];

  const recMap = new Map(recipients.map((r) => [r.id, r]));
  const docMap = new Map(documents.map((d) => [d.id, d.title]));

  type Agg = { opens: number; questions: number; lastAt: string };
  const agg = new Map<string, Agg>();
  const openedRecipients = new Set<string>();
  let questionCount = 0;
  const recentEvents: { text: string; at: string; kind: string }[] = [];
  const docOpens = new Map<string, string[]>();

  for (const s of signals) {
    const r = recMap.get(s.recipient_id);
    const who = r?.label || t.unnamedReader;
    const doc = r ? (docMap.get(r.document_id) ?? t.aDocument) : t.aDocument;
    const a = agg.get(s.recipient_id) ?? { opens: 0, questions: 0, lastAt: s.created_at };
    if (new Date(s.created_at) > new Date(a.lastAt)) a.lastAt = s.created_at;
    if (s.kind === "opened") {
      a.opens++;
      openedRecipients.add(s.recipient_id);
      if (r) { const arr = docOpens.get(r.document_id) ?? []; arr.push(s.created_at); docOpens.set(r.document_id, arr); }
      if (recentEvents.length < 8) recentEvents.push({ text: `${who} ${t.opened} ${doc}`, at: s.created_at, kind: "opened" });
    }
    if (s.kind === "question") {
      a.questions++;
      questionCount++;
      if (recentEvents.length < 8) {
        const qq = s.value && typeof s.value === "object" && "text" in s.value ? String((s.value as { text: string }).text) : "";
        recentEvents.push({ text: `${who} ${t.asked} "${qq}"`, at: s.created_at, kind: "question" });
      }
    }
    agg.set(s.recipient_id, a);
  }

  function intentOf(opens: number, questions: number): number {
    let v = opens * 0.16 + questions * 0.22;
    if (opens >= 2) v += 0.18;
    if (opens >= 3) v += 0.12;
    if (questions >= 1 && opens >= 2) v += 0.1;
    return Math.max(opens + questions > 0 ? 0.12 : 0.04, Math.min(0.98, v));
  }

  const readers = recipients.map((r) => {
    const a = agg.get(r.id) ?? { opens: 0, questions: 0, lastAt: "" };
    return {
      id: r.id,
      name: r.label || t.unnamedReader,
      doc: docMap.get(r.document_id) ?? t.aDocument,
      opens: a.opens,
      questions: a.questions,
      lastAt: a.lastAt,
      intent: intentOf(a.opens, a.questions),
    };
  });

  function spark(times: string[]): number[] {
    if (!times.length) return [8, 8, 8, 8, 8, 8];
    const ts = times.map((x) => new Date(x).getTime()).sort((a, b) => a - b);
    const min = ts[0];
    const max = Math.max(ts[ts.length - 1], min + 1);
    const buckets = new Array(6).fill(0);
    for (const x of ts) { let i = Math.floor(((x - min) / (max - min)) * 6); if (i > 5) i = 5; buckets[i]++; }
    const mx = Math.max(...buckets, 1);
    return buckets.map((b) => Math.round(8 + (b / mx) * 92));
  }
  const documentsOut = documents.slice(0, 6).map((d) => ({
    id: d.id,
    title: d.title,
    reads: (docOpens.get(d.id) ?? []).length,
    spark: spark(docOpens.get(d.id) ?? []),
  }));

  const stats = { documents: documents.length, recipients: recipients.length, reads: openedRecipients.size, questions: questionCount };

  return (
    <OverviewClient
      stats={stats}
      recentEvents={recentEvents.slice(0, 6)}
      readers={readers}
      documents={documentsOut}
      hasData={documents.length > 0}
    />
  );
}
