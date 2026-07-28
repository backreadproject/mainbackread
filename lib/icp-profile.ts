import { z } from "zod";
import { IcpRecord } from "./ai/tasks/icp";
import { IcpPeople } from "./ai/tasks/icp-people";
import { IcpDemand } from "./ai/tasks/icp-demand";
import { IcpMarket } from "./ai/tasks/icp-market";
import { IcpActivation } from "./ai/tasks/icp-activation";
import { IcpSynthesis } from "./ai/tasks/icp-synthesis";

/** The six passes, in the order they must run. Each later pass reads earlier ones. */
export const PASSES = ["record", "people", "demand", "market", "activation", "synthesis"] as const;
export type Pass = (typeof PASSES)[number];

/** Stored on icp_profiles.output. Every pass is optional: a profile with three
 *  of six is a real, usable state, not a broken one. */
export const IcpProfile = z.object({
  version: z.literal(2).default(2),
  record: IcpRecord.nullable().default(null),
  people: IcpPeople.nullable().default(null),
  demand: IcpDemand.nullable().default(null),
  market: IcpMarket.nullable().default(null),
  activation: IcpActivation.nullable().default(null),
  synthesis: IcpSynthesis.nullable().default(null),
  /** Which passes have landed. The client reads this to know what to run next. */
  done: z.array(z.enum(PASSES)).default([]),
  confidence: z.object({
    band: z.enum(["strong", "moderate", "thin", "insufficient"]),
    pct: z.number().min(0).max(100),
    reasons: z.array(z.string()).default([]),
  }).nullable().default(null),
});
export type IcpProfile = z.infer<typeof IcpProfile>;

export function emptyProfile(): IcpProfile {
  return {
    version: 2, record: null, people: null, demand: null, market: null,
    activation: null, synthesis: null, done: [], confidence: null,
  };
}

export function nextPass(p: IcpProfile): Pass | null {
  return PASSES.find((x) => !p.done.includes(x)) ?? null;
}

export type Answered = { id: string; q: string; a: string };

/**
 * Confidence is COMPUTED, never asked of a model.
 *
 * A model rating its own confidence produces a number that tracks how assured its
 * prose sounded, not how much it actually had to work with. These inputs are all
 * observable facts about the answers.
 *
 * Weighted questions are the ones marked `weight` in lib/icp-questions.ts. They
 * carry double because a one-line answer to "name two customers who were a bad
 * fit" removes more from the analysis than a thin answer anywhere else.
 */
export function computeConfidence(
  items: Answered[],
  weightedIds: string[],
  probes: Answered[],
  customerCount: number | null,
  branch: "operating" | "startup",
): { band: "strong" | "moderate" | "thin" | "insufficient"; pct: number; reasons: string[] } {
  const reasons: string[] = [];
  const substantive = (a: string) => a.trim().split(/\s+/).filter(Boolean).length >= 12;

  const answered = items.filter((i) => i.a.trim().length > 0);
  const solid = items.filter((i) => substantive(i.a));
  const coverage = items.length ? solid.length / items.length : 0;

  const weighted = items.filter((i) => weightedIds.includes(i.id));
  const weightedSolid = weighted.filter((i) => substantive(i.a));
  const weightedRatio = weighted.length ? weightedSolid.length / weighted.length : 0;

  const probesSolid = probes.filter((p) => substantive(p.a)).length;

  // Coverage 40, weighted questions 35, evidence base 15, probes 10.
  let pct = coverage * 40 + weightedRatio * 35;

  if (branch === "operating") {
    const n = customerCount ?? 0;
    if (n >= 20) { pct += 15; reasons.push("Built on " + n + " paying customers."); }
    else if (n >= 8) { pct += 11; reasons.push("Built on " + n + " paying customers, enough to see a pattern."); }
    else if (n >= 3) { pct += 6; reasons.push("Only " + n + " paying customers, so a pattern and a coincidence still look alike."); }
    else { reasons.push("Almost no paying customers to generalise from."); }
  } else {
    pct += 4;
    reasons.push("No paying customers yet, so everything here is a hypothesis rather than a finding.");
  }

  pct += Math.min(probesSolid, 4) * 2.5;
  if (probesSolid > 0) reasons.push(probesSolid + " follow-up question" + (probesSolid === 1 ? "" : "s") + " answered.");

  if (answered.length > solid.length) {
    reasons.push((answered.length - solid.length) + " answer" + (answered.length - solid.length === 1 ? " was" : "s were") + " too brief to rest anything on.");
  }
  if (items.length - answered.length > 0) {
    reasons.push((items.length - answered.length) + " question" + (items.length - answered.length === 1 ? " was" : "s were") + " left blank.");
  }
  if (weighted.length && weightedSolid.length < weighted.length) {
    reasons.push("The questions that carry the most weight were not all answered fully.");
  }

  pct = Math.max(0, Math.min(100, Math.round(pct)));
  const band = pct >= 75 ? "strong" : pct >= 50 ? "moderate" : pct >= 28 ? "thin" : "insufficient";
  return { band, pct, reasons };
}