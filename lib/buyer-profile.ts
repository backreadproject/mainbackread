import {
  BP_PASSES,
  BuyerProfileOutput,
  emptyBuyerProfile,
  type BpPass,
} from "./ai/tasks/buyer-passes";

export { BP_PASSES as PASSES, emptyBuyerProfile as emptyProfile };
export type Pass = BpPass;
export type Profile = BuyerProfileOutput;
export { BuyerProfileOutput as ProfileSchema };

/** Which pass to run next, or null when there is nothing left. */
export function nextPass(p: Profile): Pass | null {
  return BP_PASSES.find((x) => !p.done.includes(x)) ?? null;
}

/** Tolerant read of whatever is in the column. A profile written by the old
 *  six pass shape parses to an empty one rather than throwing: the passes
 *  changed, and a customer's stale row must not break their page. */
export function readProfile(v: unknown): Profile {
  const o = v as Profile | null;
  if (!o || typeof o !== "object" || !Array.isArray(o.done)) return emptyBuyerProfile();
  if ((o as { version?: number }).version !== 3) return emptyBuyerProfile();
  return o;
}

export type Answered = { id: string; q: string; a: string };

/**
 * Confidence is COMPUTED, never asked of a model.
 *
 * A model rating its own confidence produces a number that tracks how assured
 * its prose sounded, not how much it actually had to work with. These inputs
 * are all observable facts about the answers.
 *
 * Weighted questions carry double because a one line answer to "name two
 * customers who were a bad fit" removes more from the analysis than a thin
 * answer anywhere else.
 */
export function computeConfidence(
  items: Answered[],
  weighted: string[],
  branch: "operating" | "startup",
): { band: "strong" | "moderate" | "thin" | "insufficient"; pct: number; reasons: string[] } {
  const reasons: string[] = [];
  const substantive = (a: string) => a.trim().split(/\s+/).filter(Boolean).length >= 12;

  const answered = items.filter((i) => i.a.trim().length > 0);
  const solid = items.filter((i) => substantive(i.a));
  const coverage = items.length ? solid.length / items.length : 0;

  const w = items.filter((i) => weighted.includes(i.id));
  const wSolid = w.filter((i) => substantive(i.a));
  const wRatio = w.length ? wSolid.length / w.length : 0;

  // Coverage 45, weighted questions 40, evidence base 15.
  let pct = coverage * 45 + wRatio * 40;

  if (branch === "operating") {
    pct += 15;
    reasons.push("Built on customers who have already paid.");
  } else {
    pct += 3;
    reasons.push("No paying customers yet, so everything here is a hypothesis rather than a finding.");
  }

  const thin = answered.length - solid.length;
  if (thin > 0) reasons.push(thin + " answer" + (thin === 1 ? " was" : "s were") + " too brief to rest anything on.");

  const blank = items.length - answered.length;
  if (blank > 0) reasons.push(blank + " question" + (blank === 1 ? " was" : "s were") + " left blank.");

  if (w.length && wSolid.length < w.length) {
    reasons.push("The questions that carry the most weight were not all answered fully.");
  }

  pct = Math.max(0, Math.min(100, Math.round(pct)));
  const band = pct >= 75 ? "strong" : pct >= 50 ? "moderate" : pct >= 28 ? "thin" : "insufficient";
  return { band, pct, reasons };
}
