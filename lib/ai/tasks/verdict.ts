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
  /** What the reader wrote back, verbatim. Not scored, not summarised: a reply
   *  is the one thing here that is not an inference. */
  replies: string[];
  forwardedTo: string[];
  openCount: number;
  /** The customer's language. The verdict is stored, so it is fixed in the
   *  language it was generated in; switching later needs a regeneration. */
  locale: "en" | "fr";
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
 *   replies  >  questions asked  >  forwarding  >  re-reads  >  dwell  >  opens
 *
 * A reply sits above everything because it is not evidence to reason from, it is
 * the answer. Once someone tells you what they think, inferring what they think
 * is running an estimate over the top of the truth.
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
  // 700 was not enough for headline + reasoning + nextAction + up to four
  // evidence strings. The object was being truncated mid-write, which surfaced
  // as an unparseable response rather than as a token limit.
  maxTokens: 1400,
  schema: VerdictOutput,

  cacheable: (i) => `DOCUMENT — "${i.documentTitle}"\n\n${i.documentText}`,

  system: (i) =>
    [
      "You are ReadProspects's verdict engine. You are given behavioural signals from one reader of one document.",
      "",
      "Diagnose the DEAL, not the document. The sender does not want analytics — they want to know what the reader is thinking and what to do about it.",
      "",
      "SIGNAL HIERARCHY — weight strictly in this order:",
      "1. A REPLY — they wrote back. This is not evidence to weigh, it is the answer. When a reply is present, read it and report what it says. Do not infer around it, do not soften it, and do not let dwell or opens argue with it.",
      "2. Questions asked — stated intent. Worth more than everything below combined.",
      "3. Forwarding — who they involved tells you what stage the deal is at.",
      "4. Re-reads and backtracks — friction, or the thing they are weighing.",
      "5. Dwell time — a weak proxy. Never build a verdict on dwell alone.",
      "6. Open count — engagement, nothing more.",
      "",
      "WHEN THERE IS A REPLY: confidence is high, because you are not guessing. If they declined, say so plainly and make nextAction about closing it out cleanly rather than pursuing. A rejection the sender has not registered is the most expensive thing in their list. If they asked for something, nextAction is to send it.",
      "",
      "HONESTY REQUIREMENT: If the signals are thin — little dwell, no questions, no forwarding — say so and set confidence to low. Do NOT manufacture a narrative. A confident verdict on thin evidence is worse than no verdict, because the sender will act on it.",
      "",
      "nextAction must be one concrete thing a person can do today. Not 'follow up'. Not 'consider reaching out'. Something specific.",
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"headline":"one blunt sentence","reasoning":"2-3 sentences on what the reader is actually thinking","nextAction":"one concrete move","confidence":"high|medium|low","evidence":["short signal","short signal"]}',
    ].join("\n") + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. JSON keys stay exactly as specified in English." : ""),

  user: (i) =>
    JSON.stringify(
      {
        reader: `${i.readerName}, ${i.readerOrg}`,
        opens: i.openCount,
        pages: i.pages,
        backtracks: i.backtracks,
        questionsAsked: i.questionsAsked,
        repliedWithTheirOwnWords: i.replies,
        forwardedTo: i.forwardedTo,
      },
      null,
      2
    ),

  fixture: (i) => {
    if (i.replies.length) {
      return {
        headline: "[fixture] They replied. Read their words, not the signals.",
        reasoning: "A reply supersedes everything inferred from how they read it.",
        nextAction: "Answer them.",
        confidence: "high" as const,
        evidence: i.replies.slice(0, 2),
      };
    }
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
