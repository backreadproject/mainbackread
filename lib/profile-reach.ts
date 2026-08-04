/**
 * Will this profile ever have enough readers to tell you anything?
 *
 * A profile whose Observed tab can never fill is a profile that will never do
 * the thing it exists to do. Saying so is more useful than selling somebody a
 * bigger plan so they can hold more of them.
 *
 * The rate is measured, not assumed: engaged readers so far, over the time the
 * profile has actually been collecting them. It moves as the customer's volume
 * moves, which is the point.
 */

/** A year. Past this the answer is practically no, whatever the arithmetic. */
export const HORIZON_WEEKS = 52;

/** Below this the rate is one or two readers and dividing by it produces
 *  confident nonsense. */
const MIN_WEEKS_OBSERVED = 1;

export interface Reach {
  /** Engaged readers per week, measured. */
  perWeek: number;
  /** Weeks to the threshold at that rate. Null when the rate is zero, or when
   *  there is nothing to project from yet. */
  weeks: number | null;
  /** Already there. */
  reached: boolean;
  /** On course to get there inside the horizon. */
  willReach: boolean;
  /** Nothing has arrived yet, so this is not a projection about a slow profile,
   *  it is the absence of one. */
  noData: boolean;
}

export function reachFor(opts: {
  engaged: number;
  threshold: number;
  /** When readers started arriving for this profile. Falls back to when the
   *  profile was created, which is the right denominator for one that has
   *  existed for months and collected nobody. */
  since: string | null;
  createdAt: string;
  now?: Date;
}): Reach {
  const { engaged, threshold } = opts;
  if (engaged >= threshold) {
    return { perWeek: 0, weeks: 0, reached: true, willReach: true, noData: false };
  }

  const now = opts.now ?? new Date();
  const from = new Date(opts.since ?? opts.createdAt);
  const weeksOpen = Math.max(
    MIN_WEEKS_OBSERVED,
    (now.getTime() - from.getTime()) / (7 * 24 * 3600 * 1000),
  );

  if (engaged === 0) {
    return { perWeek: 0, weeks: null, reached: false, willReach: false, noData: true };
  }

  const perWeek = engaged / weeksOpen;
  if (perWeek <= 0) {
    return { perWeek: 0, weeks: null, reached: false, willReach: false, noData: true };
  }

  const weeks = Math.ceil((threshold - engaged) / perWeek);
  return {
    perWeek: Math.round(perWeek * 100) / 100,
    weeks,
    reached: false,
    willReach: weeks <= HORIZON_WEEKS,
    noData: false,
  };
}

/**
 * Which profiles to offer up when someone is out of slots.
 *
 * Ranked by how little each is doing rather than by age: an unfinished draft
 * from yesterday is a better thing to delete than a working profile from March.
 */
export interface Deletable {
  id: string;
  name: string;
  reason: "unfinished" | "unattached" | "quiet";
  engaged: number;
  documents: number;
  updatedAt: string;
}

export function leastUsed(
  rows: { id: string; name: string; started: boolean; documents: number; engaged: number; updatedAt: string }[],
  limit = 3,
): Deletable[] {
  const scored = rows.map((r) => {
    const reason: Deletable["reason"] = !r.started ? "unfinished" : r.documents === 0 ? "unattached" : "quiet";
    // Unfinished first, then never attached, then whichever is quietest.
    const rank = !r.started ? 0 : r.documents === 0 ? 1 : 2;
    return { r, reason, rank };
  });

  return scored
    .sort((a, b) => (a.rank - b.rank) || (a.r.engaged - b.r.engaged) || a.r.updatedAt.localeCompare(b.r.updatedAt))
    // A profile doing real work is not a candidate, however full the plan is.
    .filter((x) => x.rank < 2 || x.r.engaged === 0)
    .slice(0, limit)
    .map((x) => ({
      id: x.r.id,
      name: x.r.name,
      reason: x.reason,
      engaged: x.r.engaged,
      documents: x.r.documents,
      updatedAt: x.r.updatedAt,
    }));
}
