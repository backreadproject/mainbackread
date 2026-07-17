import { createClient } from "@/lib/supabase/server";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: recipients } = await supabase.from("recipients").select("id, label, document_id, documents ( title )");
  const recMap = new Map((recipients ?? []).map((r) => {
    const d = r.documents as unknown as { title: string } | undefined;
    return [r.id, { label: r.label as string | null, docTitle: d?.title ?? "a document", docId: r.document_id }];
  }));
  const ids = [...recMap.keys()];
  const { data: signals } = ids.length
    ? await supabase.from("signals").select("recipient_id, kind, value, created_at").in("recipient_id", ids).order("created_at", { ascending: false }).limit(60)
    : { data: [] };
  const events = (signals ?? []).map((s) => {
    const r = recMap.get(s.recipient_id);
    const who = r?.label || "An unnamed reader";
    const doc = r?.docTitle ?? "a document";
    let text = "";
    if (s.kind === "opened") text = `${who} opened ${doc}`;
    else if (s.kind === "question") { const q = (s.value && typeof s.value === "object" && "text" in s.value) ? String((s.value as {text:string}).text) : ""; text = `${who} asked: "${q}"`; }
    else return null;
    return { text, at: s.created_at, docId: r?.docId };
  }).filter(Boolean);
  return <ActivityClient events={events as {text:string;at:string;docId?:string}[]} />;
}
