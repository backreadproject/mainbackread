import { z } from "zod";
import type { Task } from "../types";

export interface AskInput {
  documentText: string;
  documentTitle: string;
  question: string;
  currentPage: number;
  /** What the sender explicitly allows the companion to discuss. */
  policy?: { discussPricing?: boolean };
}

export const AskOutput = z.object({
  answer: z.string(),
  /** True when the document simply does not contain the answer. */
  outOfScope: z.boolean(),
  /** True when the reader is probing commercial terms. Never answered — always escalated. */
  escalate: z.boolean(),
});
export type AskOutput = z.infer<typeof AskOutput>;

export const askTask: Task<AskInput, AskOutput> = {
  id: "ask",
  tier: "fast",
  maxTokens: 400,
  schema: AskOutput,

  cacheable: (i) =>
    `DOCUMENT — "${i.documentTitle}"\nThis is the only source of truth. Nothing outside it exists.\n\n${i.documentText}`,

  system: () =>
    [
      "You are BackRead, a reading companion embedded inside a document that someone has shared with the reader.",
      "",
      "You answer ONLY from the document. You have no other knowledge and you never imply that you do.",
      "",
      "HARD RULES — these are not style preferences, they are the product:",
      "1. Never invent a number, name, date, or claim. If it is not in the document, it does not exist.",
      "2. Never speculate about whether pricing, terms, timelines, or commitments are negotiable, flexible, or discountable. You are speaking on the sender's behalf to a counterparty. Set escalate=true and tell the reader you will pass the question to the sender.",
      "3. Never characterise the sender's position, eagerness, or willingness to move.",
      "4. If the document does not cover it, say so plainly and set outOfScope=true. Offer to flag it to the sender. Do not pad, do not guess, do not apologise at length.",
      "5. Be brief. Two or three sentences. The reader is reading a document, not chatting.",
      "",
      "Respond with ONLY a JSON object, no markdown fences, no preamble:",
      '{"answer":"...","outOfScope":false,"escalate":false}',
    ].join("\n"),

  user: (i) => `The reader is on page ${i.currentPage}.\n\nTheir question: ${i.question}`,

  fixture: (i) => {
    const q = i.question.toLowerCase();
    // NOTE: "negotiable" has no 't' after the 'a'. Match the stem, not the verb.
    const commercial = /negotia|discount|flexib|budge|lower|cheaper|wiggle|room on|terms|waive/.test(q);
    if (commercial) {
      return {
        answer:
          "That's a commercial question I can't answer on the sender's behalf. I've flagged it — they'll come back to you directly.",
        outOfScope: false,
        escalate: true,
      };
    }
    return {
      answer: `[fixture] The document addresses this on page ${i.currentPage}. Swap AI_PROVIDER to "anthropic" for a real answer.`,
      outOfScope: false,
      escalate: false,
    };
  },
};
