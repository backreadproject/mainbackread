import { z } from "zod";
import type { Task } from "../types";

export interface PageSignal {
  page: number;
  title: string;
  seconds: number;
  visits: number;
}

export interface VerdictInput {
  documentText: string;
  documentTitle: string;
  readerName: string;
  readerOrg: string;
  pages: PageSignal[];
  backtracks: string[];
  questionsAsked: string[];
  forwardedTo: string[];
  openCount: number;
}

export const VerdictOutput = z.object({
  headline: z.string(),
  reasoning: z.string(),
  nextAction: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(z.string()).max(4),
});
export type VerdictOutput = z.infer<typeof VerdictOutput>;

/**
 * The signal hierarchy is the whole intellectual claim of the product:
 *
 *   questions asked  >  forwarding  >  re-reads  >  dwell  >  opens
 *
 * A question is stated intent. Dwell is a proxy, and a weak one — a reader who
 * sat on your pricing slide for 90 seconds may have been getting coffee.
 * A verdict engine that dresses up dwell as insight is a horoscope, and users
 * detect that within a week. So: thin signals must produce low confidence,
 * and low confidence must say so out loud.
 */
export const verdictTask: Task<VerdictInput, VerdictOutput> = {
  id: "verdict",
  tier: "reason",
  maxTokens: 700,
  schema: VerdictOutput,

  cacheable: (i) => `DOCUMENT — "${i.documentTitle}"\n\n${i.documentText}`,

  system: () =>
    [
      "You are BackRead's verdict engine. You are given behavioural signals from one reader of one document.",
      "",
      "Diagnose the DEAL, not the document. The sender does not want analytics — they want to know what the reader is thinking and what to do about it.",
      "",
      "SIGNAL HIERARCHY — weight strictly in this order:",
      "1. Questions asked — stated intent. Worth more than everything below combined.",
      "2. Forwarding — who they involved tells you what stage the deal is at.",
      "3. Re-reads and backtracks — friction, or the thing they are weighing.",
      "4. Dwell time — a weak proxy. Never build a verdict on dwell alone.",
      "5. Open count — engagement, nothing more.",
      "",
      "HONESTY REQUIREMENT: If the signals are thin — little dwell, no questions, no forwarding — say so and set confidence to low. Do NOT manufacture a narrative. A confident verdict on thin evidence is worse than no verdict, because the sender will act on it.",
      "",
      "nextAction must be one concrete thing a person can do today. Not 'follow up'. Not 'consider reaching out'. Something specific.",
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"headline":"one blunt sentence","reasoning":"2-3 sentences on what the reader is actually thinking","nextAction":"one concrete move","confidence":"high|medium|low","evidence":["short signal","short signal"]}',
    ].join("\n"),

  user: (i) =>
    JSON.stringify(
      {
        reader: `${i.readerName}, ${i.readerOrg}`,
        opens: i.openCount,
        pages: i.pages,
        backtracks: i.backtracks,
        questionsAsked: i.questionsAsked,
        forwardedTo: i.forwardedTo,
      },
      null,
      2
    ),

  fixture: (i) => {
    const thin = i.questionsAsked.length === 0 && i.forwardedTo.length === 0;
    if (thin) {
      return {
        headline: "Not enough signal to call this.",
        reasoning:
          "They opened it and skimmed. No questions, no forwarding, no re-reads worth reading into. Anything more confident than this would be invention.",
        nextAction: "Wait. Re-sending now teaches them your follow-ups are noise.",
        confidence: "low" as const,
        evidence: ["no questions asked", "not forwarded"],
      };
    }
    return {
      headline: "[fixture] Pricing is the blocker — not the product.",
      reasoning:
        "They are convinced by the traction and stuck on the commercial terms. Finance is already involved, which means this is a procurement problem now, not a persuasion problem.",
      nextAction: "Send commercial terms addressing the annual commit. Not another follow-up call.",
      confidence: "high" as const,
      evidence: i.questionsAsked.slice(0, 2).concat(i.forwardedTo.slice(0, 1)),
    };
  },
};
