import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The Observed tier: what the readers of a profile's documents actually did.
 *
 * Everything here is counted, never inferred. No AI, no model call. The gap
 * analysis reasons on top of this; this file only establishes the facts it
 * reasons about, which is why it is pure and testable end to end.
 *
 * A profile is measured through the documents it is attached to. Attach
 * nothing and there is nothing to observe, which is correct rather than a
 * failure state.
 */

// Bare, so a client typed against the real schema is assignable.
type Db = SupabaseClient;

/** Every column the reader fold needs. Kept in one place because two loaders
 *  select it and a column missing here is a silently empty field there. */
const RECIPIENT_COLS =
  "id, document_id, email, first_name, last_name, label, roles, role_other, company, outcome";

export type SignalRow = {
  recipient_id: string;
  kind: string;
  page: number | null;
  value: unknown;
  created_at: string;
};

export type RecipientRow = {
  id: string;
  document_id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  label?: string | null;
  roles?: string[] | null;
  role_other?: string | null;
  company?: string | null;
  outcome?: string | null;
};

/** One PERSON, not one recipient row. Somebody sent two documents is one
 *  reader, and the threshold is a claim about people. */
export interface ReaderState {
  /** Lowercased email where there is one, else the recipient id. A link-mode
   *  reader with no address cannot be matched to anyone, so they stand alone. */
  key: string;
  name: string;
  email: string | null;
  company: string | null;
  /** Role ids from lib/roles.ts. What personas are matched against. */
  roles: string[];
  roleOther: string | null;
  /** won, lost or no_decision, where the sender has recorded it. */
  outcome: string | null;
  recipientIds: string[];
  documentIds: string[];
  opens: number;
  /** Deepest page reached across every document. */
  deepestPage: number;
  /** Deepest page as a fraction, 0 to 1, where the page count is known. */
  deepestFraction: number;
  questions: number;
  replies: number;
  forwards: number;
  dwellSeconds: number;
  firstAt: string | null;
  lastAt: string | null;
  engaged: boolean;
}

export interface ObservedSummary {
  /** Distinct people who were sent something. */
  readers: number;
  opened: number;
  engaged: number;
  questions: number;
  /** People who asked, as against questions asked. Both appear on the mock. */
  questioners: number;
  replies: number;
  forwards: number;
  forwarders: number;
  documents: number;
  won: number;
  lost: number;
  noDecision: number;
  /** won + lost + no_decision. Below the threshold no rate is printed. */
  outcomesMarked: number;
  /** Newest signal counted. With no scheduler this is what "last checked"
   *  honestly means: the data is current to here, computed when you looked. */
  lastSignalAt: string | null;
}

export type Basis = "draft" | "stated" | "tested";

export interface ProfileObserved {
  profileId: string;
  summary: ObservedSummary;
  basis: Basis;
  /** How many more engaged people before the Observed tier can say anything. */
  toThreshold: number;
}

export function emptySummary(): ObservedSummary {
  return {
    readers: 0, opened: 0, engaged: 0, questions: 0, questioners: 0,
    replies: 0, forwards: 0, forwarders: 0, documents: 0,
    won: 0, lost: 0, noDecision: 0, outcomesMarked: 0, lastSignalAt: null,
  };
}

/* ------------------------------------------------------------------ */

/** page_dwell stores milliseconds under "ms". Reading the wrong key here is
 *  what made every dwell figure in every report zero for weeks. */
function dwellSeconds(v: unknown): number {
  if (v && typeof v === "object" && "ms" in (v as Record<string, unknown>)) {
    const ms = (v as Record<string, unknown>).ms;
    return typeof ms === "number" ? Math.round(ms / 1000) : 0;
  }
  return 0;
}

function forwardCount(v: unknown): number {
  const c = (v as { colleagues?: unknown[] } | null)?.colleagues;
  return Array.isArray(c) ? Math.max(1, c.length) : 1;
}

function displayName(r: RecipientRow): string {
  const full = [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
  return full || r.label || r.email || "Unnamed reader";
}

function identity(r: RecipientRow): string {
  const e = (r.email ?? "").trim().toLowerCase();
  return e || r.id;
}

/**
 * Engagement, extending the definition already used by the cooling list on the
 * overview so the two surfaces cannot disagree about who counts.
 *
 * The mock says "past page three", which is right for a fourteen page deck and
 * wrong for a four page one. Halfway generalises it. The other four clauses
 * each describe somebody who did something deliberate, and forwarding is a
 * stronger signal than depth: it costs the reader something.
 */
export function isEngaged(r: {
  opens: number;
  deepestFraction: number;
  questions: number;
  replies: number;
  forwards: number;
}): boolean {
  if (r.opens < 1) return false;
  return (
    r.deepestFraction >= 0.5 ||
    r.opens >= 2 ||
    r.questions > 0 ||
    r.replies > 0 ||
    r.forwards > 0
  );
}

/**
 * Fold recipients and their signals into one row per person.
 *
 * pageCounts maps document id to page count. A document with no page count
 * cannot have a halfway point, so depth simply does not vote for those readers
 * and the other four clauses decide.
 */
export function buildReaders(
  recipients: RecipientRow[],
  signals: SignalRow[],
  pageCounts: Record<string, number | null | undefined> = {},
): ReaderState[] {
  const byRecipient = new Map<string, RecipientRow>();
  for (const r of recipients) byRecipient.set(r.id, r);

  const byPerson = new Map<string, ReaderState>();
  const ensure = (r: RecipientRow): ReaderState => {
    const key = identity(r);
    let s = byPerson.get(key);
    if (!s) {
      s = {
        key,
        name: displayName(r),
        email: r.email ? r.email.trim().toLowerCase() : null,
        company: null,
        roles: [],
        roleOther: null,
        outcome: null,
        recipientIds: [],
        documentIds: [],
        opens: 0,
        deepestPage: 0,
        deepestFraction: 0,
        questions: 0,
        replies: 0,
        forwards: 0,
        dwellSeconds: 0,
        firstAt: null,
        lastAt: null,
        engaged: false,
      };
      byPerson.set(key, s);
    }
    if (!s.recipientIds.includes(r.id)) s.recipientIds.push(r.id);
    if (!s.documentIds.includes(r.document_id)) s.documentIds.push(r.document_id);
    // A named row beats a bare address if both exist for one person.
    if (s.name === "Unnamed reader" || s.name === s.email) s.name = displayName(r);
    // Identity merges across a person's rows: recorded on one document and
    // blank on another is still recorded. First non-empty wins.
    if (!s.company && r.company) s.company = r.company;
    if (!s.roleOther && r.role_other) s.roleOther = r.role_other;
    for (const id of r.roles ?? []) if (!s.roles.includes(id)) s.roles.push(id);
    // An outcome is recorded per document. Won on any of them wins: somebody
    // who closed is closed, whatever happened on the other document.
    if (r.outcome) s.outcome = s.outcome === "won" || r.outcome === "won" ? "won" : (s.outcome ?? r.outcome);
    return s;
  };

  // Every recipient exists as a reader even with no signals: somebody sent to
  // and never opened is a fact, and "41 of 47 opened" needs the 47.
  for (const r of recipients) ensure(r);

  for (const sig of signals) {
    const r = byRecipient.get(sig.recipient_id);
    if (!r) continue;
    const s = ensure(r);

    if (!s.firstAt || sig.created_at < s.firstAt) s.firstAt = sig.created_at;
    if (!s.lastAt || sig.created_at > s.lastAt) s.lastAt = sig.created_at;

    switch (sig.kind) {
      case "opened":
        s.opens += 1;
        break;
      case "page_dwell": {
        s.dwellSeconds += dwellSeconds(sig.value);
        if (typeof sig.page === "number" && sig.page > s.deepestPage) {
          s.deepestPage = sig.page;
        }
        const pages = pageCounts[r.document_id];
        if (typeof sig.page === "number" && typeof pages === "number" && pages > 1) {
          const f = sig.page / pages;
          if (f > s.deepestFraction) s.deepestFraction = Math.min(1, f);
        }
        break;
      }
      case "question":
        s.questions += 1;
        break;
      case "replied":
        s.replies += 1;
        break;
      case "forwarded":
        s.forwards += forwardCount(sig.value);
        break;
      default:
        break;
    }
  }

  const out = [...byPerson.values()];
  for (const s of out) s.engaged = isEngaged(s);
  return out;
}

export function summarise(readers: ReaderState[]): ObservedSummary {
  const docs = new Set<string>();
  const s = emptySummary();
  s.readers = readers.length;

  for (const r of readers) {
    for (const d of r.documentIds) docs.add(d);
    if (r.opens > 0) s.opened += 1;
    if (r.engaged) s.engaged += 1;
    s.questions += r.questions;
    if (r.questions > 0) s.questioners += 1;
    s.replies += r.replies;
    s.forwards += r.forwards;
    if (r.forwards > 0) s.forwarders += 1;
    if (r.outcome === "won") s.won += 1;
    else if (r.outcome === "lost") s.lost += 1;
    else if (r.outcome === "no_decision") s.noDecision += 1;
    if (r.lastAt && (!s.lastSignalAt || r.lastAt > s.lastSignalAt)) s.lastSignalAt = r.lastAt;
  }

  s.documents = docs.size;
  s.outcomesMarked = s.won + s.lost + s.noDecision;
  return s;
}

/**
 * Draft until a revision is finished. Stated until the threshold is crossed.
 * Tested after. Nothing here is a quality judgement, only a statement about
 * what the profile has been checked against.
 */
export function basisFor(hasCompleteRevision: boolean, engaged: number, threshold: number): Basis {
  if (!hasCompleteRevision) return "draft";
  return engaged >= threshold ? "tested" : "stated";
}

/* ------------------------------------------------------------------ */

/**
 * One round trip per table for every profile at once, rather than per profile.
 * The caller has already proven entitlement; RLS scopes all three reads.
 */
export async function observeProfiles(
  supabase: Db,
  profiles: { id: string; threshold: number }[],
  hasCompleteRevision: Record<string, boolean>,
): Promise<Record<string, ProfileObserved>> {
  const out: Record<string, ProfileObserved> = {};
  for (const p of profiles) {
    out[p.id] = {
      profileId: p.id,
      summary: emptySummary(),
      basis: basisFor(hasCompleteRevision[p.id] ?? false, 0, p.threshold),
      toThreshold: p.threshold,
    };
  }
  if (!profiles.length) return out;

  const ids = profiles.map((p) => p.id);
  const { data: docs } = await supabase
    .from("documents")
    .select("id, page_count, buyer_profile_id")
    .in("buyer_profile_id", ids);

  const docRows = (docs ?? []) as { id: string; page_count: number | null; buyer_profile_id: string }[];
  if (!docRows.length) return out;

  const docToProfile: Record<string, string> = {};
  const pageCounts: Record<string, number | null> = {};
  for (const d of docRows) {
    docToProfile[d.id] = d.buyer_profile_id;
    pageCounts[d.id] = d.page_count;
  }

  const { data: recs } = await supabase
    .from("recipients")
    .select(RECIPIENT_COLS)
    .in("document_id", docRows.map((d) => d.id));

  const recRows = (recs ?? []) as unknown as RecipientRow[];
  if (!recRows.length) return out;

  const { data: sigs } = await supabase
    .from("signals")
    .select("recipient_id, kind, page, value, created_at")
    .in("recipient_id", recRows.map((r) => r.id));

  const sigRows = (sigs ?? []) as SignalRow[];

  // Split by profile, then fold. A reader who appears under two profiles is
  // counted under each, because they were measured against each.
  const recByProfile: Record<string, RecipientRow[]> = {};
  const recToProfile: Record<string, string> = {};
  for (const r of recRows) {
    const pid = docToProfile[r.document_id];
    if (!pid) continue;
    (recByProfile[pid] ??= []).push(r);
    recToProfile[r.id] = pid;
  }

  const sigByProfile: Record<string, SignalRow[]> = {};
  for (const s of sigRows) {
    const pid = recToProfile[s.recipient_id];
    if (!pid) continue;
    (sigByProfile[pid] ??= []).push(s);
  }

  for (const p of profiles) {
    const readers = buildReaders(recByProfile[p.id] ?? [], sigByProfile[p.id] ?? [], pageCounts);
    const summary = summarise(readers);
    out[p.id] = {
      profileId: p.id,
      summary,
      basis: basisFor(hasCompleteRevision[p.id] ?? false, summary.engaged, p.threshold),
      toThreshold: Math.max(0, p.threshold - summary.engaged),
    };
  }

  return out;
}

/** One profile, with the readers themselves. For the detail and persona pages. */
export async function observeProfile(
  supabase: Db,
  profileId: string,
  threshold: number,
  hasCompleteRevision: boolean,
): Promise<{ readers: ReaderState[]; summary: ObservedSummary; basis: Basis; toThreshold: number }> {
  const { data: docs } = await supabase
    .from("documents")
    .select("id, page_count")
    .eq("buyer_profile_id", profileId);

  const docRows = (docs ?? []) as { id: string; page_count: number | null }[];
  const pageCounts: Record<string, number | null> = {};
  for (const d of docRows) pageCounts[d.id] = d.page_count;

  let recRows: RecipientRow[] = [];
  let sigRows: SignalRow[] = [];

  if (docRows.length) {
    const { data: recs } = await supabase
      .from("recipients")
      .select(RECIPIENT_COLS)
      .in("document_id", docRows.map((d) => d.id));
    recRows = (recs ?? []) as unknown as RecipientRow[];

    if (recRows.length) {
      const { data: sigs } = await supabase
        .from("signals")
        .select("recipient_id, kind, page, value, created_at")
        .in("recipient_id", recRows.map((r) => r.id));
      sigRows = (sigs ?? []) as SignalRow[];
    }
  }

  const readers = buildReaders(recRows, sigRows, pageCounts);
  const summary = summarise(readers);
  return {
    readers,
    summary,
    basis: basisFor(hasCompleteRevision, summary.engaged, threshold),
    toThreshold: Math.max(0, threshold - summary.engaged),
  };
}
