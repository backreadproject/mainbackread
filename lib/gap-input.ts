import { roleLabel } from "./roles";
import { matchPersona } from "./persona-match";
import type { ReaderState, PageStat } from "./observed";
import type { GapInput } from "./ai/tasks/gap";

/**
 * Turning readers into something the gap analysis can argue with.
 *
 * The refusals live here rather than in the prompt, because a refusal that
 * costs a model call is not a refusal. Two of them:
 *
 * Below the profile's threshold there are not enough engaged readers for any
 * pattern to survive two more people arriving.
 *
 * And below a floor of identified readers there is nothing to compare WHO they
 * are against. Somebody can have forty engaged readers and know nothing about
 * any of them, and a comparison of a stated market against forty strangers is
 * a sentence with no subject.
 */

/** Readers with a role or a company recorded. Anything the analysis says about
 *  who these people are rests on this number. */
export const IDENTIFIED_FLOOR = 5;

export type StatedRevision = {
  market?: {
    definition?: string;
    reallyTrue?: string;
    triggers?: { event: string; why: string }[];
    disqualifiers?: { who: string; why: string }[];
  } | null;
  people?: {
    personas?: { name: string; roleInDeal?: string; titleVariants?: string[] }[];
  } | null;
};

export type Refusal =
  | { kind: "no-revision" }
  | { kind: "below-threshold"; engaged: number; threshold: number }
  | { kind: "too-few-identified"; identified: number; floor: number; readers: number };

export function identifiedCount(readers: ReaderState[]): number {
  return readers.filter((r) => r.roles.length > 0 || r.roleOther || r.company).length;
}

/** Why this cannot run yet, or null when it can. */
export function gapRefusal(
  readers: ReaderState[],
  engaged: number,
  threshold: number,
  hasRevision: boolean,
): Refusal | null {
  if (!hasRevision) return { kind: "no-revision" };
  if (engaged < threshold) return { kind: "below-threshold", engaged, threshold };
  const identified = identifiedCount(readers);
  if (identified < IDENTIFIED_FLOOR) {
    return { kind: "too-few-identified", identified, floor: IDENTIFIED_FLOOR, readers: readers.length };
  }
  return null;
}

function tally(values: string[]): { name: string; count: number }[] {
  const m = new Map<string, number>();
  for (const v of values) {
    const k = v.trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildGapInput(opts: {
  locale: "en" | "fr";
  objective: string;
  threshold: number;
  revision: StatedRevision;
  readers: ReaderState[];
  pages: PageStat[];
  /** Verbatim reader questions. Capped by the caller. */
  questions: string[];
  summary: {
    readers: number; opened: number; engaged: number;
    questioners: number; questions: number;
    forwarders: number; forwards: number;
    outcomesMarked: number; won: number; lost: number;
  };
}): GapInput {
  const m = opts.revision.market ?? {};
  const personas = (opts.revision.people?.personas ?? []).map((p) => ({
    name: p.name,
    roleInDeal: p.roleInDeal ?? "",
    titleVariants: p.titleVariants ?? [],
  }));

  // Roles as their human labels. The ids mean nothing to a model and a role
  // that no longer exists in the library is dropped rather than shown raw.
  const roleNames: string[] = [];
  for (const r of opts.readers) {
    for (const id of r.roles) {
      const label = roleLabel(id);
      if (label) roleNames.push(label);
    }
    if (r.roleOther) roleNames.push(r.roleOther);
  }

  const shapes = personas.map((p) => ({ name: p.name, titleVariants: p.titleVariants }));
  const matches = new Map<string, number>();
  for (const p of personas) matches.set(p.name, 0);
  let unmatched = 0;
  for (const r of opts.readers) {
    const hit = matchPersona({ roles: r.roles, roleOther: r.roleOther, name: r.name }, shapes);
    if (hit.persona) matches.set(hit.persona, (matches.get(hit.persona) ?? 0) + 1);
    else unmatched += 1;
  }

  return {
    locale: opts.locale,
    objective: opts.objective,
    threshold: opts.threshold,
    stated: {
      definition: m.definition ?? "",
      reallyTrue: m.reallyTrue ?? "",
      triggers: (m.triggers ?? []).map((t) => ({ claim: t.event, detail: t.why })),
      disqualifiers: (m.disqualifiers ?? []).map((d) => ({ claim: d.who, detail: d.why })),
      personas,
    },
    observed: {
      ...opts.summary,
      identified: identifiedCount(opts.readers),
      roles: tally(roleNames).slice(0, 12).map((x) => ({ label: x.name, count: x.count })),
      companies: tally(opts.readers.map((r) => r.company ?? "")).slice(0, 12),
      personaMatches: [...matches.entries()].map(([name, count]) => ({ name, count })),
      unmatched,
      pages: opts.pages.map((p) => ({
        title: p.title, page: p.page, pageCount: p.pageCount, readers: p.readers,
      })),
      questionText: opts.questions,
    },
  };
}
