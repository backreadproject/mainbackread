import { z } from "zod";
import type { Task } from "../types";

/**
 * The gap analysis.
 *
 * This is the one place in the product that argues with the customer, so it is
 * also the one place where inventing something would do real damage: a person
 * who rewrites their targeting on a pattern of four readers has been actively
 * harmed by us.
 *
 * Three guards, and only the third is in the prompt. The route refuses to call
 * this at all below the threshold, and refuses again when too few readers have
 * a recorded role or company to compare against anything. What remains for the
 * model is to read real evidence and say plainly whether it matches.
 *
 * "They agree with you" is a legitimate and useful answer. A tool that only
 * ever finds disagreement is not analysing, it is performing.
 */

export interface GapStatedClaim {
  claim: string;
  detail: string;
}

export interface GapInput {
  locale: "en" | "fr";
  objective: string;
  threshold: number;
  /** What the customer wrote, from the newest asserted revision. */
  stated: {
    definition: string;
    reallyTrue: string;
    triggers: GapStatedClaim[];
    disqualifiers: GapStatedClaim[];
    personas: { name: string; roleInDeal: string; titleVariants: string[] }[];
  };
  /** What the readers actually did. Every number counted, none inferred. */
  observed: {
    readers: number;
    opened: number;
    engaged: number;
    questioners: number;
    questions: number;
    forwarders: number;
    forwards: number;
    outcomesMarked: number;
    won: number;
    lost: number;
    /** How many readers have a role or a company recorded. The denominator
     *  for anything said about who these people are. */
    identified: number;
    roles: { label: string; count: number }[];
    companies: { name: string; count: number }[];
    personaMatches: { name: string; count: number }[];
    unmatched: number;
    pages: { title: string; page: number; pageCount: number | null; readers: number }[];
    questionText: string[];
  };
}

export const GapOutput = z.object({
  /** One line. The disagreement, or that there is not one. */
  headline: z.string(),
  /** True when the readers broadly match what was stated. Drives the tone of
   *  the whole page, so it is a field rather than something inferred from
   *  the prose. */
  agrees: z.boolean(),
  /** Two or three short paragraphs. What was said, what happened, and the
   *  size of the gap between them. */
  finding: z.string(),
  /** The stated claims, each with what the readers did about it. */
  claims: z.array(z.object({
    stated: z.string(),
    observed: z.string(),
    movement: z.enum(["holding", "weaker", "contradicted", "never appeared", "no evidence"]),
  })).max(8).default([]),
  /** The honest limit. Present on every approved screen and the reason this
   *  page can be trusted at all. */
  doesNotTell: z.string(),
});
export type GapOutput = z.infer<typeof GapOutput>;

const SYSTEM = [
  "You compare what a seller said about their buyers against what their readers actually did.",
  "",
  "HOUSE STYLE.",
  "Write plainly. No marketing register, no adjectives doing the work of evidence.",
  "Sentence case. No em dashes. Address the seller as you.",
  "",
  "WHAT YOU ARE GIVEN.",
  "STATED is what the seller wrote themselves. It is a claim, not a fact.",
  "OBSERVED is counted from readers who opened their documents. Every number there is real.",
  "",
  "RULES, and the first three matter more than the output.",
  "1. Never invent a fact. If OBSERVED does not establish something, do not say it.",
  "   You may say that it is not established. That is a useful sentence.",
  "2. The numbers you are given are the only numbers you may use. Do not compute",
  "   rates, percentages or projections from them. A count is a fact; a rate over",
  "   a small count is a fiction with a decimal point.",
  "3. `identified` is how many readers have a recorded role or company. Anything",
  "   you say about WHO these people are rests on that number and no larger one.",
  "   If it is small, say so in the finding itself rather than at the end.",
  "4. If the readers broadly match what was stated, set agrees to true and say so.",
  "   Agreement is a finding. Manufacturing a disagreement to seem useful is the",
  "   single worst thing this page can do.",
  "5. For each stated claim you can check, give one claims row. Use movement",
  "   'no evidence' when the observed data simply does not speak to it, which",
  "   will often be most of them. Do not stretch.",
  "6. doesNotTell must name what this comparison genuinely cannot settle.",
  "   Engagement is not purchase. Attention is not intent. Readers who engaged",
  "   are not proof that they are better customers than the ones who did not.",
  "",
  "Do not recommend a rewrite. The seller decides what to do; you establish what happened.",
].join("\n");

function block(i: GapInput): string {
  const s = i.stated;
  const o = i.observed;
  const lines: string[] = [];

  lines.push("STATED, written by the seller.");
  lines.push("Objective: " + i.objective);
  if (s.definition) lines.push("Market definition: " + s.definition);
  if (s.reallyTrue) lines.push("What actually has to be true: " + s.reallyTrue);
  if (s.triggers.length) {
    lines.push("Trigger events:");
    for (const t of s.triggers) lines.push("  - " + t.claim + ": " + t.detail);
  }
  if (s.disqualifiers.length) {
    lines.push("Disqualifiers, who they said is NOT a fit:");
    for (const d of s.disqualifiers) lines.push("  - " + d.claim + ": " + d.detail);
  }
  if (s.personas.length) {
    lines.push("Personas they expect in the deal:");
    for (const p of s.personas) {
      lines.push("  - " + p.name + " (" + p.roleInDeal + "), titles: " + (p.titleVariants.join(", ") || "none given"));
    }
  }

  lines.push("");
  lines.push("OBSERVED, counted from their readers.");
  lines.push("Readers sent to: " + o.readers + ". Opened: " + o.opened + ". Engaged: " + o.engaged + ".");
  lines.push("Readers with a recorded role or company: " + o.identified + " of " + o.readers + ".");
  lines.push("Asked a question: " + o.questioners + " readers, " + o.questions + " questions.");
  lines.push("Forwarded: " + o.forwarders + " readers, " + o.forwards + " forwards.");
  lines.push("Outcomes recorded: " + o.outcomesMarked + " (" + o.won + " won, " + o.lost + " lost).");

  if (o.roles.length) {
    lines.push("Recorded roles among readers:");
    for (const r of o.roles) lines.push("  - " + r.label + ": " + r.count);
  } else {
    lines.push("No roles recorded on any reader.");
  }

  if (o.companies.length) {
    lines.push("Recorded companies:");
    for (const c of o.companies) lines.push("  - " + c.name + ": " + c.count);
  } else {
    lines.push("No companies recorded on any reader.");
  }

  if (o.personaMatches.length) {
    lines.push("Readers matching each stated persona, by recorded role:");
    for (const p of o.personaMatches) lines.push("  - " + p.name + ": " + p.count);
    lines.push("  - matching no persona: " + o.unmatched);
  }

  if (o.pages.length) {
    lines.push("Where the group stopped:");
    for (const p of o.pages) {
      lines.push("  - " + p.title + ": page " + p.page + (p.pageCount ? " of " + p.pageCount : "") + ", " + p.readers + " readers");
    }
  }

  if (o.questionText.length) {
    lines.push("What readers asked, verbatim:");
    for (const q of o.questionText) lines.push("  - " + q);
  }

  return lines.join("\n");
}

export const gapTask: Task<GapInput, GapOutput> = {
  id: "bp-gap",
  tier: "reason",
  maxTokens: 2600,
  schema: GapOutput,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr"
    ? "\n\nWrite every string VALUE in French. Keys and enum values stay English."
    : ""),
  user: (i) => block(i) + "\n\nCompare them.",
  fixture: (): GapOutput => ({
    headline: "",
    agrees: true,
    finding: "",
    claims: [],
    doesNotTell: "",
  }),
};
