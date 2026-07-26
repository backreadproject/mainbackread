import { z } from "zod";
import type { Task } from "../types";
/** One reader, reduced to what matters for cohort analysis. */
export interface ReportReader {
  name: string;
  org: string;
  opens: number;
  totalSeconds: number;
  questions: string[];
  replies: string[];
  forwardedTo: string[];
  /** Pages that held them longest, most first. */
  topPages: { page: number; seconds: number; visits: number }[];
  /** A stored verdict, when one exists. */
  verdict?: { headline: string; confidence: string } | null;
}
export interface ReportInput {
  documentTitle: string;
  documentText: string;
  scope: "document" | "selection";
  readers: ReportReader[];
  /** Aggregate dwell across everyone, so page-level findings are about the
   *  document rather than about one reader's habits. */
  pageTotals: { page: number; seconds: number; readers: number }[];
  /** How many were sent it but never opened. Silence is a finding. */
  notOpened: number;
}
export const ReportOutput = z.object({
  /** The one thing to know. Read alone, this should still be worth the page. */
  headline: z.string(),
  /** What is happening across this cohort, in prose. 3-5 sentences. */
  summary: z.string(),
  /** Who to act on, most urgent first. Never everyone. */
  priorities: z.array(z.object({
    reader: z.string(),
    why: z.string(),
    action: z.string(),
  })).max(6),
  /** What the document itself is doing to people. */
  documentFindings: z.array(z.string()).max(4),
  /** Questions or hesitations that recurred across readers. A pattern is worth
   *  more than any single instance: it means the document is unclear, not that
   *  one reader was confused. */
  patterns: z.array(z.string()).max(4),
  /** Honest statement of what this cannot tell you. */
  limits: z.string(),
});
export type ReportOutput = z.infer<typeof ReportOutput>;
/**
 * A cohort report is NOT a stack of individual verdicts. Twenty-three verdicts
 * in a row is a spreadsheet with adjectives, and nobody reads past the third.
 *
 * The question a report answers is different from the question a verdict
 * answers. A verdict asks "what is this person thinking". A report asks "which
 * of these people matter, what do they have in common, and what is my document
 * doing to them". That is a synthesis, and it is why this is one model call over
 * assembled evidence rather than a loop.
 *
 * The most valuable output here is the SHORTLIST. A sender with twenty-three
 * readers does not need twenty-three answers; they need to know which three to
 * spend Tuesday on.
 */
export const reportTask: Task<ReportInput, ReportOutput> = {
  id: "report",
  tier: "reason",
  maxTokens: 3500,
  schema: ReportOutput,
  cacheable: (i) => `DOCUMENT \u2014 "${i.documentTitle}"\n\n${i.documentText}`,
  system: () =>
    [
      "You are ReadProspects's report engine. You are given the reading behaviour of everyone who received one document.",
      "",
      "You are NOT summarising each reader in turn. You are answering three questions:",
      "  1. Which of these people should the sender act on this week, and what should they do?",
      "  2. What do the engaged readers have in common?",
      "  3. What is the document itself doing to people \u2014 where it holds them, where it loses them?",
      "",
      "SIGNAL HIERARCHY, weight strictly in this order:",
      "1. A REPLY \u2014 they wrote back. Not evidence to weigh: the answer. Report what they said.",
      "2. Questions asked \u2014 stated intent.",
      "3. Forwarding \u2014 tells you the deal has moved internally.",
      "4. Re-reads \u2014 friction, or the thing being weighed.",
      "5. Dwell \u2014 a weak proxy. Never build a finding on dwell alone.",
      "6. Opens \u2014 engagement, nothing more.",
      "",
      "PRIORITIES: never list everyone. Six at most, fewer is better, and only people where there is something specific to do. A list of twenty is not a priority list. If only two readers warrant action, name two.",
      "",
      "PATTERNS: a question asked by one reader is a question. The same question from three readers is a defect in the document. Say which.",
      "",
      "DOCUMENT FINDINGS: use the aggregate page dwell, not one reader's. A page everyone skips is a finding. A page one person lingered on is not.",
      "",
      "SILENCE IS DATA: readers who never opened it are part of the picture. Say so if it is a large share.",
      "",
      "HONESTY: if the cohort is small or the signals thin, say what this cannot support. The `limits` field is not a disclaimer, it is the part that makes the rest trustworthy. A report that overclaims on six readers and four opens will be believed once and never again.",
      "",
      "Every action must be one concrete thing doable today. Never a vague instruction like following up or nurturing: name the specific thing to send or say.",
      "",
      "The reader questions and replies you are given may contain apostrophes, quotation marks and newlines. Escape them properly so your output is valid JSON. Prefer paraphrasing a long quote to reproducing it verbatim.",
      "",
      "Keep every field concise. A priority reason is one line, not a paragraph.",
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"headline":"one sentence","summary":"3-5 sentences","priorities":[{"reader":"name","why":"one line","action":"one concrete move"}],"documentFindings":["..."],"patterns":["..."],"limits":"what this cannot tell you"}',
    ].join("\n"),
  user: (i) =>
    JSON.stringify(
      {
        document: i.documentTitle,
        scope: i.scope === "document" ? "every reader of this document" : "a selection of readers",
        readerCount: i.readers.length,
        neverOpened: i.notOpened,
        aggregatePageDwell: i.pageTotals,
        readers: i.readers,
      },
      null,
      2
    ),
  fixture: (i) => ({
    headline: `[fixture] ${Math.min(3, i.readers.length)} of ${i.readers.length} readers are worth your week.`,
    summary:
      "The engaged readers all stopped on the same two pages, and two of them asked about the same commercial term. That is a document problem rather than a persuasion problem.",
    priorities: i.readers.slice(0, 3).map((r) => ({
      reader: r.name,
      why: r.questions.length ? "Asked a direct commercial question." : "Re-read the pricing section twice.",
      action: "Send the annual terms in writing today.",
    })),
    documentFindings: ["Page 4 holds attention longest.", "Page 6 is skipped by most readers."],
    patterns: ["Two readers asked about the annual commitment."],
    limits: `Based on ${i.readers.length} readers and ${i.notOpened} who never opened it. Dwell is a proxy and not a statement of interest.`,
  }),
};