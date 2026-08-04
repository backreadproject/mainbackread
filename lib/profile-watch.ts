import { matchPersona } from "./persona-match";
import type { ReaderState } from "./observed";
import type { GapOutput } from "./ai/tasks/gap";

/**
 * What changed since the last time we looked.
 *
 * A notification is a difference, so all of this is a comparison against a
 * stored snapshot rather than a reading of the present. That is also why the
 * snapshot is written even when nothing is worth saying: skipping the write on
 * a quiet check would make the next one compare against something stale and
 * announce a change that happened weeks ago.
 *
 * Every rule here exists to protect one thing: a bell that rings only when
 * something happened is a bell people read. One that rings weekly to say
 * nothing moved is a bell people turn off, and then it cannot tell them the
 * one thing that mattered.
 */

/** No reader matching a persona in this long, and the persona is worth a word. */
export const QUIET_DAYS = 30;

/** Do not repeat the same quiet persona more often than this. */
export const REPEAT_AFTER_DAYS = 30;

export type Cadence = "daily" | "weekly" | "monthly" | "manual";

export interface NotifySettings {
  gapFound: boolean;
  personaQuiet: boolean;
  findingMoved: boolean;
  /** Off by design. A note every week saying nothing changed teaches people
   *  to stop reading the ones that say something did. */
  everyCheck: boolean;
}

export const DEFAULT_NOTIFY: NotifySettings = {
  gapFound: true,
  personaQuiet: true,
  findingMoved: true,
  everyCheck: false,
};

export function readNotify(v: unknown): NotifySettings {
  const o = (v && typeof v === "object" ? v : {}) as Partial<NotifySettings>;
  return {
    gapFound: o.gapFound !== false,
    personaQuiet: o.personaQuiet !== false,
    findingMoved: o.findingMoved !== false,
    everyCheck: o.everyCheck === true,
  };
}

export interface CheckState {
  engaged: number;
  readers: number;
  identified: number;
  /** Persona name to when a matching reader last did anything. */
  personaSeen: Record<string, string>;
  /** Event key to when it was last said, so nothing is said twice. */
  notified: Record<string, string>;
  crossedThresholdAt: string | null;
}

export function emptyCheck(): CheckState {
  return { engaged: 0, readers: 0, identified: 0, personaSeen: {}, notified: {}, crossedThresholdAt: null };
}

export function readCheck(v: unknown): CheckState {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    engaged: typeof o.engaged === "number" ? o.engaged : 0,
    readers: typeof o.readers === "number" ? o.readers : 0,
    identified: typeof o.identified === "number" ? o.identified : 0,
    personaSeen: (o.persona_seen ?? o.personaSeen ?? {}) as Record<string, string>,
    notified: (o.notified ?? {}) as Record<string, string>,
    crossedThresholdAt: (o.crossed_threshold_at ?? o.crossedThresholdAt ?? null) as string | null,
  };
}

export type WatchEvent =
  | { kind: "threshold"; engaged: number; threshold: number }
  | { kind: "gap"; headline: string }
  | { kind: "findingMoved"; headline: string; nowAgrees: boolean }
  | { kind: "personaQuiet"; persona: string; days: number };

const DAY = 24 * 3600 * 1000;

/** Is this profile due a look, given how often its owner asked to be checked? */
export function dueForCheck(cadence: Cadence, lastCheckedAt: string | null, now: Date): boolean {
  if (cadence === "manual") return false;
  if (!lastCheckedAt) return true;
  const since = now.getTime() - new Date(lastCheckedAt).getTime();
  const window = cadence === "daily" ? DAY : cadence === "weekly" ? 7 * DAY : 30 * DAY;
  // A little under, so a daily job at a slightly drifting hour does not skip
  // a day because it ran four minutes early.
  return since >= window - 10 * 60 * 1000;
}

/** When a reader matching each persona was last active. */
export function personaLastSeen(
  readers: ReaderState[],
  personas: { name: string; titleVariants: string[] }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!personas.length) return out;
  for (const r of readers) {
    if (!r.lastAt) continue;
    const m = matchPersona({ roles: r.roles, roleOther: r.roleOther, name: r.name }, personas);
    if (!m.persona) continue;
    if (!out[m.persona] || r.lastAt > out[m.persona]) out[m.persona] = r.lastAt;
  }
  return out;
}

function saidRecently(notified: Record<string, string>, key: string, now: Date, days: number): boolean {
  const when = notified[key];
  if (!when) return false;
  return now.getTime() - new Date(when).getTime() < days * DAY;
}

/**
 * The whole decision, as one pure function.
 *
 * `gap` is the analysis as it stands now, and `previousGap` what it said last
 * time. Both may be absent: the analysis refuses to run below the threshold or
 * without enough identified readers, and a refusal is not a finding.
 */
export function diffCheck(opts: {
  now: Date;
  threshold: number;
  settings: NotifySettings;
  previous: CheckState;
  engaged: number;
  readers: number;
  identified: number;
  personaSeen: Record<string, string>;
  /** Personas on the current asserted revision, whatever their state. */
  personas: string[];
  gap: { id: string | null; agrees: boolean; headline: string } | null;
  previousGap: { agrees: boolean } | null;
}): { events: WatchEvent[]; next: CheckState } {
  const { now, previous, settings } = opts;
  const events: WatchEvent[] = [];
  const notified: Record<string, string> = { ...previous.notified };
  const stamp = now.toISOString();

  // 1. The threshold, said once ever. Crossing back under and over again is
  //    the same fact arriving twice, not news.
  let crossedThresholdAt = previous.crossedThresholdAt;
  if (!crossedThresholdAt && opts.engaged >= opts.threshold) {
    crossedThresholdAt = stamp;
    events.push({ kind: "threshold", engaged: opts.engaged, threshold: opts.threshold });
    notified["threshold"] = stamp;
  }

  // 2. A disagreement, once per analysis run. The run id changes only when the
  //    readers moved, so a cached run never announces itself twice.
  if (opts.gap && !opts.gap.agrees && settings.gapFound) {
    const key = "gap:" + (opts.gap.id ?? opts.gap.headline.slice(0, 60));
    if (!notified[key]) {
      events.push({ kind: "gap", headline: opts.gap.headline });
      notified[key] = stamp;
    }
  }

  // 3. The direction reversed. Not the number moving, the answer changing:
  //    agreement becoming disagreement, or the other way round.
  if (opts.gap && opts.previousGap && settings.findingMoved) {
    if (opts.gap.agrees !== opts.previousGap.agrees) {
      const key = "moved:" + (opts.gap.id ?? stamp);
      if (!notified[key]) {
        events.push({ kind: "findingMoved", headline: opts.gap.headline, nowAgrees: opts.gap.agrees });
        notified[key] = stamp;
      }
    }
  }

  // 4. A persona nobody has matched in a month. Only for personas we have seen
  //    at least once: one that never appeared at all is a fact about the
  //    profile, and the gap analysis is where that belongs.
  const personaSeen: Record<string, string> = { ...previous.personaSeen };
  for (const [name, at] of Object.entries(opts.personaSeen)) {
    if (!personaSeen[name] || at > personaSeen[name]) personaSeen[name] = at;
  }
  if (settings.personaQuiet) {
    for (const name of opts.personas) {
      const last = personaSeen[name];
      if (!last) continue;
      const days = Math.floor((now.getTime() - new Date(last).getTime()) / DAY);
      if (days < QUIET_DAYS) continue;
      const key = "quiet:" + name;
      if (saidRecently(notified, key, now, REPEAT_AFTER_DAYS)) continue;
      events.push({ kind: "personaQuiet", persona: name, days });
      notified[key] = stamp;
    }
  }

  return {
    events,
    next: {
      engaged: opts.engaged,
      readers: opts.readers,
      identified: opts.identified,
      personaSeen,
      notified,
      crossedThresholdAt,
    },
  };
}
