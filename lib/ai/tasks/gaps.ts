import { z } from "zod";
import type { Task } from "../types";

export interface GapsInput {
  documentTitle: string;
  documentText: string;
  /** What real readers have actually asked this customer, most recent first.
   *  Empty on a first document, and the prompt handles that honestly rather
   *  than pretending to evidence it does not have. */
  askedBefore: string[];
  locale: "en" | "fr";
}

export const GapsOutput = z.object({
  /** Questions a reader is likely to ask that the document does not answer.
   *  Ordered by how likely they are to stall a decision. */
  gaps: z.array(z.object({
    question: z.string(),
    /** Why this will come up: what the document says, or fails to say, that
     *  leads a reader here. */
    why: z.string(),
    /** Where it belongs, when the document has an obvious place for it. */
    where: z.string().optional(),
  })).max(6),
  /** What the document already answers well. Named so the customer knows the
   *  tool read it rather than pattern-matched a template. */
  covered: z.array(z.string()).max(3),
  /** Honest statement of the basis. Different sentence with and without
   *  reader history, and the customer should be able to tell which they got. */
  basis: z.string(),
});
export type GapsOutput = z.infer<typeof GapsOutput>;

/**
 * The only feature that helps BEFORE the wait.
 *
 * Everything else in ReadProspects answers "what happened after I sent it".
 * This one asks a different question: what will a reader want to know that
 * this document does not tell them. It runs on an unsent document, which
 * makes it the first thing a new customer can get value from.
 *
 * TWO INPUTS, and the second is the one nobody else has. Reading the document
 * cold produces reasonable guesses. Reading it alongside the questions this
 * customer's real readers have actually asked produces something better: not
 * "a reader might ask about pricing" but "your readers keep asking what
 * happens after the first year, and this document does not say".
 *
 * The reader history arrives free -- it is already in signals -- and it gets
 * stronger every month the customer uses the product, without anyone touching
 * this code.
 */
export const gapsTask: Task<GapsInput, GapsOutput> = {
  id: "gaps",
  tier: "reason",
  maxTokens: 2000,
  schema: GapsOutput,

  // The document is the stable half, so it is what gets cached across
  // regenerations of the same document.
  cacheable: (i) => `DOCUMENT: ${i.documentTitle}\n\n${i.documentText}`,

  system: (i) => {
    const hasHistory = i.askedBefore.length > 0;
    return [
      "You are reading a document on behalf of the person about to send it, to find what it fails to answer.",
      "",
      "You are NOT reviewing the writing. Not tone, not structure, not length. The only question is: what will a reader need to know that this document does not tell them?",
      "",
      "WHAT COUNTS AS A GAP. A question a serious reader would have to ask before deciding. Commercial terms that are implied but not stated, a claim made without the evidence behind it, a next step that is not spelled out, an obvious objection left unaddressed.",
      "",
      "WHAT DOES NOT. Anything the document already answers, even briefly. Anything a reader could look up elsewhere. Anything so generic it would apply to every document of this kind -- if your question would fit any proposal, it is not a finding about THIS one.",
      "",
      hasHistory
        ? "YOU HAVE EVIDENCE. Below are questions this sender's real readers have asked about their documents. Weight these heavily: a question that has already been asked twice is not a hypothesis, it is a pattern. Where one of them applies to this document and this document does not answer it, that is your strongest finding, and say so in `why`."
        : "YOU HAVE NO READER HISTORY for this sender yet, so every finding is inference from the document alone. Say that plainly in `basis` rather than implying evidence you do not have.",
      "",
      "Be specific enough to act on. \"Clarify the pricing\" is useless. \"The document gives a monthly price but never says what happens at renewal, and two of your readers have asked about year two\" is a finding.",
      "",
      "Fewer, better findings. Six is a maximum, not a target. If the document is genuinely complete, return one or two and say so.",
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"gaps":[{"question":"...","why":"...","where":"..."}],"covered":["..."],"basis":"..."}',
      i.locale === "fr"
        ? "\n\nWrite every string VALUE in French. JSON keys stay exactly as specified in English."
        : "",
    ].join("\n");
  },

  user: (i) => {
    if (!i.askedBefore.length) return "Read the document above and find what it does not answer.";
    const list = i.askedBefore.slice(0, 40).map((q) => "- " + q).join("\n");
    return `Questions this sender's readers have actually asked, across their documents:\n${list}\n\nRead the document above and find what it does not answer, weighting these.`;
  },

  fixture: (i) => ({
    gaps: [
      {
        question: i.locale === "fr" ? "Que se passe-t-il au renouvellement ?" : "What happens at renewal?",
        why: i.locale === "fr"
          ? "Le document donne un prix mensuel mais ne dit jamais ce qui se passe apr\u00e8s la premi\u00e8re ann\u00e9e."
          : "The document gives a monthly price but never says what happens after the first year.",
        where: i.locale === "fr" ? "Pr\u00e8s des tarifs" : "Near the pricing",
      },
    ],
    covered: [i.locale === "fr" ? "Ce que fait le produit" : "What the product does"],
    basis: i.locale === "fr"
      ? "[fixture] Bas\u00e9 sur le document seul."
      : "[fixture] Based on the document alone.",
  }),
};