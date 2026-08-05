import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The index pane for the documents surface.
 *
 * Grouped by whether the document is still doing anything, because that is the
 * only question worth asking of a list of documents. A title and a date tells
 * you nothing; "nobody has opened this in three weeks" tells you what to do.
 *
 * Archived sits last and stays visible. Hiding it would make the count on the
 * list disagree with the count in the index, and somebody would eventually
 * spend twenty minutes on that.
 */

export type DocTone = "green" | "amber" | undefined;

export type IndexDoc = {
  id: string;
  title: string;
  sub: string;
  right: string;
  tone: DocTone;
};

export type DocGroup = {
  label: string;
  count: number;
  docs: IndexDoc[];
};

type Db = SupabaseClient;

/** Anything older than this and the document has stopped working. */
const QUIET_DAYS = 14;
/** Anything inside this and it is still live. */
const ACTIVE_DAYS = 7;

function shortAgo(iso: string | null, now: number): string {
  if (!iso) return "never";
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 60) return Math.max(1, mins) + "m";
  const hours = Math.floor(mins / 60);
  if (hours < 48) return hours + "h";
  return Math.floor(hours / 24) + "d";
}

export async function documentIndex(
  supabase: Db,
  opts: { now?: Date } = {},
): Promise<DocGroup[]> {
  const now = (opts.now ?? new Date()).getTime();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, created_at, archived_at")
    .order("created_at", { ascending: false });

  const rows = (docs ?? []) as { id: string; title: string | null; created_at: string; archived_at: string | null }[];
  if (!rows.length) return [];

  const { data: recs } = await supabase
    .from("recipients")
    .select("id, document_id")
    .in("document_id", rows.map((d) => d.id));

  const recRows = (recs ?? []) as { id: string; document_id: string }[];
  const docOf = new Map(recRows.map((r) => [r.id, r.document_id]));

  const { data: sigs } = recRows.length
    ? await supabase
        .from("signals")
        .select("recipient_id, kind, created_at")
        .in("recipient_id", recRows.map((r) => r.id))
    : { data: [] };

  type Agg = { readers: Set<string>; opened: Set<string>; engagedOpens: Map<string, number>; questioners: Set<string>; lastAt: string | null };
  const byDoc = new Map<string, Agg>();
  const of = (id: string): Agg => {
    let a = byDoc.get(id);
    if (!a) { a = { readers: new Set(), opened: new Set(), engagedOpens: new Map(), questioners: new Set(), lastAt: null }; byDoc.set(id, a); }
    return a;
  };
  for (const r of recRows) of(r.document_id).readers.add(r.id);

  for (const s of (sigs ?? []) as { recipient_id: string; kind: string; created_at: string }[]) {
    const docId = docOf.get(s.recipient_id);
    if (!docId) continue;
    const a = of(docId);
    if (s.kind === "opened") {
      a.opened.add(s.recipient_id);
      a.engagedOpens.set(s.recipient_id, (a.engagedOpens.get(s.recipient_id) ?? 0) + 1);
    }
    if (s.kind === "question") a.questioners.add(s.recipient_id);
    if (!a.lastAt || s.created_at > a.lastAt) a.lastAt = s.created_at;
  }

  const active: IndexDoc[] = [];
  const quiet: IndexDoc[] = [];
  const archived: IndexDoc[] = [];

  for (const d of rows) {
    const a = byDoc.get(d.id);
    const readers = a?.readers.size ?? 0;
    // The same definition the document page uses for its own count, so the
    // index and the page it opens cannot disagree.
    const engaged = a
      ? [...a.readers].filter((id) => (a.engagedOpens.get(id) ?? 0) > 1 || a.questioners.has(id)).length
      : 0;

    const sub = readers === 0
      ? "Nobody has been sent this"
      : readers + (readers === 1 ? " reader" : " readers") + ", " + engaged + " engaged";

    const days = a?.lastAt ? (now - new Date(a.lastAt).getTime()) / 86400000 : Infinity;
    const tone: DocTone =
      readers === 0 ? undefined
      : days <= ACTIVE_DAYS ? "green"
      : days >= QUIET_DAYS ? "amber"
      : undefined;

    const entry: IndexDoc = {
      id: d.id,
      title: d.title || "Untitled",
      sub,
      right: shortAgo(a?.lastAt ?? null, now),
      tone,
    };

    if (d.archived_at) archived.push(entry);
    else if (readers > 0 && days <= QUIET_DAYS) active.push(entry);
    else quiet.push(entry);
  }

  const groups: DocGroup[] = [];
  if (active.length) groups.push({ label: "Still moving", count: active.length, docs: active });
  if (quiet.length) groups.push({ label: "Gone quiet", count: quiet.length, docs: quiet });
  if (archived.length) groups.push({ label: "Archived", count: archived.length, docs: archived });
  return groups;
}
