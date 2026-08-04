import { roleLabel } from "./roles";

/**
 * Matching a reader to a persona.
 *
 * The honest answer is usually "no persona match", and that answer is the point
 * rather than a failure: two readers matching nothing on the attached profile
 * is exactly what the gap analysis is built from. So this never reaches for a
 * best guess. It matches on evidence or it says no.
 *
 * Everything here is a string comparison against what the sender recorded. No
 * model call, so it costs nothing and it cannot drift from the profile.
 */

export interface PersonaLike {
  name: string;
  titleVariants: string[];
}

export interface ReaderLike {
  /** Role ids from lib/roles.ts, chosen by the sender when adding the reader. */
  roles: string[];
  /** Free text role, when none of the 342 fitted. */
  roleOther: string | null;
  /** Falls back to the display name, which sometimes carries a title. */
  name: string | null;
}

export interface Match {
  persona: string | null;
  /** How the match was made, shown to the sender because the two are different
   *  claims: a recorded role is a fact, a name that happens to contain a title
   *  is an inference. */
  basis: "role" | "typed" | "none";
}

const STOP = new Set([
  "of", "the", "and", "or", "a", "an", "to", "for", "at", "in", "on",
  "head", "senior", "lead", "chief", "officer", "director", "manager", "vp",
  "vice", "president", "global", "regional", "deputy", "assistant", "associate",
]);

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/** The words that actually carry meaning in a job title. "VP of Customer
 *  Success" and "Head of Customer Success" share customer and success, which is
 *  the whole signal; everything else is seniority decoration. */
function core(s: string): Set<string> {
  return new Set(words(s).filter((w) => w.length > 2 && !STOP.has(w)));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  return hit / Math.min(a.size, b.size);
}

/**
 * A reader matches a persona when their recorded role shares most of its
 * meaningful words with one of the persona's title variants.
 *
 * The threshold is deliberately high. A loose match puts a reader under a
 * persona they are not, and every number computed per persona downstream
 * inherits that error silently.
 */
export function matchPersona(reader: ReaderLike, personas: PersonaLike[]): Match {
  if (!personas.length) return { persona: null, basis: "none" };

  const candidates: { text: string; basis: "role" | "typed" }[] = [];
  for (const id of reader.roles) {
    const label = roleLabel(id);
    if (label) candidates.push({ text: label, basis: "role" });
  }
  if (reader.roleOther) candidates.push({ text: reader.roleOther, basis: "role" });
  // A name is the weakest source and only used when nothing was recorded.
  if (!candidates.length && reader.name) candidates.push({ text: reader.name, basis: "typed" });

  let best: { score: number; persona: string; basis: "role" | "typed" } | null = null;

  for (const c of candidates) {
    const cw = core(c.text);
    for (const p of personas) {
      for (const variant of [p.name, ...p.titleVariants]) {
        const score = overlap(cw, core(variant));
        if (score >= 0.6 && (!best || score > best.score)) {
          best = { score, persona: p.name, basis: c.basis };
        }
      }
    }
  }

  return best ? { persona: best.persona, basis: best.basis } : { persona: null, basis: "none" };
}

export interface MatchSummary {
  byPersona: Record<string, number>;
  unmatched: number;
  total: number;
}

export function summarise<R extends ReaderLike>(readers: R[], personas: PersonaLike[]): MatchSummary {
  const byPersona: Record<string, number> = {};
  for (const p of personas) byPersona[p.name] = 0;
  let unmatched = 0;
  for (const r of readers) {
    const m = matchPersona(r, personas);
    if (m.persona) byPersona[m.persona] = (byPersona[m.persona] ?? 0) + 1;
    else unmatched++;
  }
  return { byPersona, unmatched, total: readers.length };
}

/**
 * A persona has a name and no id, so the URL carries a slug of the name.
 * Stable across a reorder, which an index would not be, and readable, which
 * matters when somebody pastes a link into Slack.
 */
export function personaSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "persona";
}
