import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";
import ActivityClient from "./ActivityClient";
export default async function ActivityPage() {
  const locale = await getLocale();
  const actDict = getDict(locale).activity;
  const supabase = await createClient();
  const { data: recipients } = await supabase.from("recipients").select("id, label, document_id, documents ( title )");
  const recMap = new Map((recipients ?? []).map((r) => { const d = r.documents as unknown as { title: string } | undefined; return [r.id, { label: r.label as string | null, docTitle: d?.title ?? actDict.aDocument }]; }));
  const ids = [...recMap.keys()];
  const { data: signals } = ids.length ? await supabase.from("signals").select("recipient_id, kind, value, created_at").in("recipient_id", ids).order("created_at", { ascending: false }).limit(80) : { data: [] };
  const all = signals ?? [];
  let opens = 0, questions = 0;
  const events = all.map((s) => { const r = recMap.get(s.recipient_id); const who = r?.label || actDict.unnamedReader; const doc = r?.docTitle ?? actDict.aDocument; let text = "", kind = s.kind; if (s.kind === "opened") { text = `${who} ${actDict.opened} ${doc}`; opens++; } else if (s.kind === "question") { const qq = (s.value && typeof s.value === "object" && "text" in s.value) ? String((s.value as {text:string}).text) : ""; text = `${who} ${actDict.asked} "${qq}"`; questions++; } else return null; return { text, at: s.created_at, kind }; }).filter(Boolean);
  return <ActivityClient events={events as {text:string;at:string;kind:string}[]} stats={{ total: events.length, opens, questions }} />;
}
