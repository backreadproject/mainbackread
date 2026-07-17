import { createClient } from "@/lib/supabase/server";
import RecipientsClient from "./RecipientsClient";

export default async function RecipientsPage() {
  const supabase = await createClient();

  // RLS scopes all of this to the logged-in owner automatically.
  const { data: docs } = await supabase.from("documents").select("id, title");
  const docMap = new Map((docs ?? []).map((d) => [d.id, d.title]));

  const { data: recipients } = await supabase
    .from("recipients")
    .select("id, label, share_token, document_id, created_at")
    .order("created_at", { ascending: false });

  const recs = recipients ?? [];
  const ids = recs.map((r) => r.id);

  const { data: signals } = ids.length
    ? await supabase.from("signals").select("recipient_id, kind, value").in("recipient_id", ids)
    : { data: [] };

  // Summarise per recipient: opened?, question count.
  const opened = new Set<string>();
  const questionCount: Record<string, number> = {};
  for (const s of signals ?? []) {
    if (s.kind === "opened") opened.add(s.recipient_id);
    if (s.kind === "question") questionCount[s.recipient_id] = (questionCount[s.recipient_id] ?? 0) + 1;
  }

  const rows = recs.map((r) => ({
    id: r.id,
    label: r.label,
    documentId: r.document_id,
    documentTitle: docMap.get(r.document_id) ?? "Untitled",
    createdAt: r.created_at,
    opened: opened.has(r.id),
    questions: questionCount[r.id] ?? 0,
  }));

  return <RecipientsClient rows={rows} />;
}
