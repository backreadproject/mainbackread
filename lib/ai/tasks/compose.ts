import { z } from "zod";
import type { Task } from "../types";
/**
 * The "act on it" task. After a verdict, the sender asks the system to PRODUCE
 * something grounded in how the reader actually engaged: a follow-up message, a
 * one-pager, talking points. This is the verdict turned into action.
 *
 * It reuses the same signal shape as the verdict task, plus the verdict itself,
 * the sender's ask, an optional channel, and optional sender-supplied context.
 */
export interface ComposeInput {
  documentText: string;
  documentTitle: string;
  readerName: string;
  /** The verdict already produced for this reader (so we build ON it, not re-derive it). */
  verdict?: { headline: string; reasoning: string; nextAction: string; confidence: string };
  /** Reader signals, same shaping as the verdict route produces. */
  questionsAsked: string[];
  pagesEngaged: { page: number; seconds: number; visits: number }[];
  /** What the sender wants produced. Free text or a preset ask. */
  ask: string;
  /** For messages: the channel it's going to, so tone/length/format fit. */
  channel?: "email" | "linkedin" | "text" | "whatsapp" | "";
  /** Sender-supplied extra context (typed notes for now; files later). */
  context?: string;
  /** The sender's own name, for signing / voice. */
  senderName?: string;
  /** Output language, from the sender's UI locale. */
  locale?: string;
}
export const ComposeOutput = z.object({
  /** The finished deliverable, ready to copy. Plain text / light markdown. */
  output: z.string(),
  /** A one-line note on the approach taken, shown above the output. */
  note: z.string(),
});
export type ComposeOutput = z.infer<typeof ComposeOutput>;
function languageName(locale?: string): string {
  return locale === "fr" ? "French" : "English";
}
function channelGuidance(channel?: string): string {
  switch (channel) {
    case "email":
      return "This is an EMAIL. Include a subject line on the first line as 'Subject: ...', then the body. Professional but human. A greeting and a sign-off. A few short paragraphs, not a wall of text.";
    case "linkedin":
      return "This is a LinkedIn MESSAGE. Short, warm, direct. No subject line. No formal sign-off. One or two tight paragraphs. Conversational, not corporate.";
    case "text":
      return "This is a TEXT / SMS message. Very short. One to three sentences. Casual and clear. No subject, no sign-off, no fluff.";
    case "whatsapp":
      return "This is a WhatsApp message. Short and friendly, slightly more relaxed than email. A line or two. No subject line.";
    default:
      return "";
  }
}
export const composeTask: Task<ComposeInput, ComposeOutput> = {
  id: "compose",
  tier: "reason",
  maxTokens: 1200,
  schema: ComposeOutput,
  cacheable: (i) => `DOCUMENT -- "${i.documentTitle}"\n\n${i.documentText}`,
  system: (i) =>
    [
      "You are BackRead's drafting assistant. A sender has shared a document, watched how one reader engaged with it, and now wants you to help them ACT on it.",
      "",
      "You produce a finished, ready-to-use deliverable based on:",
      "- the document itself (your source of truth for any facts),",
      "- how the reader actually engaged (the questions they asked, the pages they lingered on),",
      "- the verdict already reached about the deal,",
      "- and the sender's specific ask.",
      "",
      "RULES:",
      "1. Ground everything in real signals and the document. Reference what the reader actually did (a question they asked, a section they dwelled on) when it strengthens the output. Never invent reader behaviour.",
      "2. Never invent facts about the document. If a detail is not in the document, do not assert it.",
      "3. Be genuinely useful, not generic. A follow-up that any template could produce is a failure. Use the specific reader's specific behaviour.",
      "4. Do not overclaim the reader's intent. If the verdict confidence is low, keep the output measured -- do not write as if the deal is hot when the signals are thin.",
      "5. Match the sender's ask exactly. If they asked for talking points, produce talking points, not an email. If they asked for a summary for a colleague, write to that third party, not the reader.",
      channelGuidance(i.channel),
      `6. Write the output in ${languageName(i.locale)}.`,
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"output":"the finished deliverable, ready to copy","note":"one short line on the approach you took"}',
    ].filter(Boolean).join("\n"),
  user: (i) =>
    JSON.stringify(
      {
        ask: i.ask,
        channel: i.channel || "(not a message / no channel)",
        reader: i.readerName,
        senderName: i.senderName || "(the sender)",
        verdict: i.verdict ?? "(no verdict yet)",
        questionsAsked: i.questionsAsked,
        pagesEngaged: i.pagesEngaged,
        senderContext: i.context || "(none provided)",
      },
      null,
      2
    ),
  fixture: (i) => ({
    output:
      `[fixture] Draft for ${i.readerName} in response to: "${i.ask}". Swap AI_PROVIDER to "anthropic" for a real draft grounded in the reader's signals.`,
    note: "Fixture output -- real drafting runs on the anthropic provider.",
  }),
};
