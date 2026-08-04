import { createClient } from "@/lib/supabase/server";
import RecipientsClient from "./RecipientsClient";

export default async function RecipientsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase.from("documents").select("id, title");
  const docMap = new Map((docs ?? []).map((d) => [d.id, d.title]));
  const { data: recipients } = await supabase.from("recipients").select("id, label, share_token, document_id, created_at, outcome, roles, role_other, company").order("created_at", { ascending: false });
  const recs = recipients ?? [];
  const ids = recs.map((r) => r.id);
  const { data: signals } = ids.length ? await supabase.from("signals").select("recipient_id, kind, value").in("recipient_id", ids) : { data: [] };
  const opened = new Set<string>(); const qc: Record<string, number> = {}; let totalQ = 0, totalEsc = 0;
  for (const s of signals ?? []) {
    if (s.kind === "opened") opened.add(s.recipient_id);
    if (s.kind === "question") { qc[s.recipient_id] = (qc[s.recipient_id] ?? 0) + 1; totalQ++; if (s.value && typeof s.value === "object" && "escalated" in s.value && (s.value as {escalated?:boolean}).escalated) totalEsc++; }
  }
  const rows = recs.map((r) => ({ id: r.id, label: r.label, documentTitle: docMap.get(r.document_id) ?? "Untitled", createdAt: r.created_at, opened: opened.has(r.id), questions: qc[r.id] ?? 0, outcome: (r.outcome ?? null) as string | null, company: r.company ?? null, roles: (r.roles ?? []) as string[], roleOther: r.role_other ?? null }));
  const stats = { total: recs.length, opened: opened.size, unopened: recs.length - opened.size, questions: totalQ, escalated: totalEsc, won: recs.filter((r) => r.outcome === "won").length };
  return <RecipientsClient rows={rows} stats={stats} />;
}
