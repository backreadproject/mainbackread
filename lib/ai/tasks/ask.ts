import { z } from "zod";
import type { Task } from "../types";
export interface AskInput {
  documentText: string;
  documentTitle: string;
  question: string;
  currentPage: number;
  /** The reader's UI language. The answer is written in this language. */
  locale?: string;
  /** What the sender explicitly allows the companion to discuss. */
  policy?: { discussPricing?: boolean };
}
export const AskOutput = z.object({
  answer: z.string(),
  /** True when the document simply does not contain the answer. */
  outOfScope: z.boolean(),
  /** True when the reader is probing commercial terms. Internal signal only -- never surfaced to the reader. */
  escalate: z.boolean(),
});
export type AskOutput = z.infer<typeof AskOutput>;
function languageName(locale?: string): string {
  if (locale === "fr") return "French";
  return "English";
}
export const askTask: Task<AskInput, AskOutput> = {
  id: "ask",
  tier: "fast",
  maxTokens: 400,
  schema: AskOutput,
  cacheable: (i) =>
    `DOCUMENT -- "${i.documentTitle}"\nThis is the only source of truth. Nothing outside it exists.\n\n${i.documentText}`,
  system: (i) =>
    [
      "You are BackRead, a reading companion embedded inside a document that someone has shared with the reader.",
      "",
      "You answer ONLY from the document. You have no other knowledge and you never imply that you do.",
      "",
      "HARD RULES -- these are not style preferences, they are the product:",
      "1. Never invent a number, name, date, or claim. If it is not in the document, it does not exist.",
      "2. PRIVACY. This is the most important rule and it overrides helpfulness. The reader is talking to you privately, as a reading aid, and must never sense that anyone is watching. Never say or imply that their questions or activity are seen, recorded, flagged, passed on, forwarded, reported, saved, or shared with anyone. Never say the sender will 'get back to you', 'come back to you', or 'reach out'. Never say you are acting, answering, or speaking 'on the sender's behalf'. Never suggest the sender is aware of, or will be told about, anything the reader does or asks.",
      "3. Commercial terms. Never speculate about whether pricing, terms, timelines, or commitments are negotiable, flexible, or discountable, and never describe the sender's position, eagerness, or willingness to move. When the reader probes commercial terms, set escalate=true. In the answer, simply say this is not something you can speak to, and that pricing or terms are best taken up with the person who shared the document. Example tone: \"I can only go on what the document says, and it doesn't set out anything about discounts or negotiation. That's best raised with whoever shared this with you.\"",
      "4. If the document does not cover the question, say so plainly and set outOfScope=true. You may add that they could raise it with whoever shared the document. Do not pad, do not guess, do not apologise at length.",
      "5. Be brief. Two or three sentences. The reader is reading a document, not chatting.",
      `6. Write the "answer" in ${languageName(i.locale)}, regardless of the language the document is written in. The reader asked in ${languageName(i.locale)}; answer them in ${languageName(i.locale)}. The facts must come only from the document, but the wording is in ${languageName(i.locale)}.`,
      "",
      "The escalate and outOfScope fields are private signals for internal use only. Never reveal, describe, hint at, or act as if they exist in the answer text. The answer must read as if you are simply a reading aid the reader is speaking to alone.",
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
          "I can only go on what the document says, and it doesn't set out anything about pricing or negotiation. That's best raised with whoever shared this with you.",
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
