import type { SupabaseClient } from "@supabase/supabase-js";
import { roleLabel } from "@/lib/roles";

/**
 * The index pane for the recipients surface.
 *
 * Grouped by the company the sender recorded, because that is how a deal is
 * actually held in someone's head: three people at Northwind, two at Halcyon,
 * and a long tail of individuals. The tail is pooled at the bottom rather than
 * scattered as eleven groups of one.
 *
 * The tone dot is the whole point of an index. A list you have to read is a
 * list; a list you can scan for the three rows that need you is a queue.
 */

export type IndexTone = "green" | "amber" | "danger" | undefined;

export type IndexReader = {
  id: string;
  name: string;
  sub: string;
  right: string;
  tone: IndexTone;
};

export type IndexGroup = {
  label: string;
  count: number;
  readers: IndexReader[];
};

type Db = SupabaseClient;

function shortAgo(iso: string | null, now: number): string {
  if (!iso) return "never";
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 60) return Math.max(1, mins) + "m";
  const hours = Math.floor(mins / 60);
  if (hours < 48) return hours + "h";
  return Math.floor(hours / 24) + "d";
}

/** What this reader needs from you, in one colour.
 *
 *  Danger is a reply nobody has handled, because that is a person waiting.
 *  Amber is somebody who was engaged and has gone quiet, which is the thing
 *  that costs money silently. Green is engaged and moving. Everything else has
 *  no dot at all: a list where every row is coloured has no signal in it. */
function toneFor(r: {
  opens: number; questions: number; replied: boolean; handled: boolean;
  forwards: number; lastAt: string | null;
}, now: number, quietDays: number): IndexTone {
  if (r.replied && !r.handled) return "danger";
  const engaged = r.opens >= 2 || r.questions > 0 || r.forwards > 0 || r.replied;
  if (!engaged) return undefined;
  const quiet = r.lastAt ? (now - new Date(r.lastAt).getTime()) / 86400000 : Infinity;
  return quiet >= quietDays ? "amber" : "green";
}

export async function recipientIndex(
  supabase: Db,
  opts: { quietDays: number; now?: Date } = { quietDays: 7 },
): Promise<IndexGroup[]> {
  const now = (opts.now ?? new Date()).getTime();

  const { data: recs } = await supabase
    .from("recipients")
    .select("id, label, first_name, last_name, email, company, roles, role_other, document_id, created_at")
    .order("created_at", { ascending: false });

  const rows = (recs ?? []) as {
    id: string; label: string | null; first_name: string | null; last_name: string | null;
    email: string | null; company: string | null; roles: string[] | null; role_other: string | null;
    document_id: string; created_at: string;
  }[];
  if (!rows.length) return [];

  const { data: sigs } = await supabase
    .from("signals")
    .select("recipient_id, kind, created_at")
    .in("recipient_id", rows.map((r) => r.id));

  type Agg = { opens: number; questions: number; forwards: number; replied: boolean; handled: boolean; lastAt: string | null };
  const agg = new Map<string, Agg>();
  const of = (id: string): Agg => {
    let a = agg.get(id);
    if (!a) { a = { opens: 0, questions: 0, forwards: 0, replied: false, handled: false, lastAt: null }; agg.set(id, a); }
    return a;
  };
  for (const s of (sigs ?? []) as { recipient_id: string; kind: string; created_at: string }[]) {
    const a = of(s.recipient_id);
    if (s.kind === "opened") a.opens += 1;
    else if (s.kind === "question") a.questions += 1;
    else if (s.kind === "forwarded") a.forwards += 1;
    else if (s.kind === "replied") a.replied = true;
    else if (s.kind === "reply_handled") a.handled = true;
    if (!a.lastAt || s.created_at > a.lastAt) a.lastAt = s.created_at;
  }

  const byCompany = new Map<string, IndexReader[]>();
  const loose: IndexReader[] = [];

  for (const r of rows) {
    const a = of(r.id);
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim()
      || r.label || r.email || "Unnamed reader";

    // The most useful second line is what they do, then what they did.
    const role = (r.roles ?? []).map(roleLabel).filter(Boolean)[0] ?? r.role_other ?? null;
    const did = a.replied ? "replied"
      : a.questions > 0 ? a.questions + (a.questions === 1 ? " question" : " questions")
      : a.opens > 0 ? a.opens + (a.opens === 1 ? " open" : " opens")
      : "not opened";
    const sub = role ? role + " \u00b7 " + did : did;

    const reader: IndexReader = {
      id: r.id,
      name,
      sub,
      right: shortAgo(a.lastAt, now),
      tone: toneFor({ ...a }, now, opts.quietDays),
    };

    const company = (r.company ?? "").trim();
    if (company) {
      const list = byCompany.get(company) ?? [];
      list.push(reader);
      byCompany.set(company, list);
    } else {
      loose.push(reader);
    }
  }

  // A company with one reader is not an account. It goes in the tail with the
  // rest, or the index becomes a list of headings.
  const groups: IndexGroup[] = [];
  const singles: IndexReader[] = [];
  for (const [company, readers] of byCompany) {
    if (readers.length > 1) groups.push({ label: company, count: readers.length, readers });
    else singles.push(...readers);
  }

  groups.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const tail = [...singles, ...loose];
  if (tail.length) {
    groups.push({ label: "Everyone else", count: tail.length, readers: tail });
  }

  return groups;
}
