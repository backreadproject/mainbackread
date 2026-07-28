import { z } from "zod";

// The unit of everything in a buyer profile.
//
// The difference between "you told us this", "this follows from what you told
// us" and "this is generally true of the market you named" is the difference
// between a document someone can act on and one they have to re-verify line by
// line. Most ICP tools blur all three into confident prose. Keeping them apart
// is the whole product position, applied per claim rather than per document.
export const Source = z.enum(["stated", "inferred", "market"]);
export type Source = z.infer<typeof Source>;

export const Claim = z.object({
  text: z.string(),
  source: Source,
  /** stated: the question number. inferred: the numbers it follows from.
   *  market: the population it holds for. Never empty. */
  basis: z.string().default(""),
  /** What would make this wrong. Empty ONLY for stated claims, which cannot be
   *  wrong about themselves. An inference or a market claim with no falsifier
   *  is an assertion wearing a citation. */
  unless: z.string().default(""),
});
export type Claim = z.infer<typeof Claim>;

/** Deliberately not a number. A score out of ten implies a measurement nobody
 *  made; a band plus a reason can be argued with. */
export const Band = z.enum(["strong", "mixed", "weak", "unknown"]);
export type Band = z.infer<typeof Band>;

export const Rated = z.object({
  text: z.string(),
  band: Band,
  why: z.string().default(""),
  source: Source,
  basis: z.string().default(""),
});

export const Severity = z.enum(["critical", "high", "medium", "low"]);
export const Cadence = z.enum(["constant", "daily", "weekly", "monthly", "quarterly", "rare"]);

/** Shared across every pass, and always the first thing in the system prompt so
 *  it sits in the cacheable half. */
export const PROVENANCE = [
  "EVERY ITEM YOU RETURN CARRIES ITS PROVENANCE. This is not decoration; it is the point.",
  "",
  'source: "stated"   - they said this. basis is the question number. unless is "".',
  'source: "inferred" - this FOLLOWS from what they said but they did not say it.',
  "                     basis names the question numbers it rests on, e.g. \"Q2, Q5\".",
  "                     unless names what would make the inference wrong.",
  'source: "market"   - general knowledge about the population they named. They did',
  "                     NOT supply this. basis names the population it holds for,",
  "                     e.g. \"B2B software companies under 200 people\".",
  "                     unless names what would make it not apply to them.",
  "",
  "YOU ARE EXPECTED TO USE market CLAIMS. A profile made only of the customer's own",
  "words is worthless to them; they already know their own words. What they cannot",
  "supply is what is true of the market they are aiming at. Supply it, and label it.",
  "",
  "But never dress a market claim as stated, and never cite a question that does not",
  "support what you wrote. A wrong label is worse than a missing section, because it",
  "spends trust that the honest sections earned.",
  "",
  "Every inferred and every market claim MUST have a real `unless`. 'This may not",
  "apply' is not a falsifier. Name the specific condition that would break it.",
].join("\n");

export const HOUSE_STYLE = [
  "Use their nouns. If they said 'brand repositioning' never write 'marketing services'.",
  "Write plainly. No marketing register, no adjectives doing work a fact should do.",
  "Be specific enough to act on. 'LinkedIn' is not a channel, 'the r/ecommerce weekly",
  "thread and the Operators Slack' is. Where you cannot be specific, say so and return",
  "fewer items rather than padding with vague ones.",
  "Never invent a named company, person, product or figure you are not confident is real.",
  "A market claim should be a pattern, not a fabricated statistic.",
  "",
  "JSON ONLY. No prose outside it, no code fences. Escape apostrophes and quotation",
  "marks correctly inside string values, including anything quoted back from them.",
  "Every key present. Where you have nothing worth saying, return an empty array.",
  "Returning three real items beats six where three are padding.",
].join("\n");