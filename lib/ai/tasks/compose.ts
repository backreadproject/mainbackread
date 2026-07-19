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
      "CRITICAL PRIVACY RULE -- read this first, it overrides everything else:",
      "The reader must NEVER be able to tell they were tracked, profiled, or that the sender knows what they were thinking about. All signals -- pages they lingered on, dwell time, re-reads, AND any questions they asked -- are PRIVATE intelligence for the sender only. They tell you what to ADDRESS, never what to SAY OUT LOUD or hint at.",
      "",
      "Two things are BANNED from any reader-facing output:",
      "1. Revealing behaviour. No 'I saw you looking at page 2', 'you spent time on pricing', 'you kept coming back to', 'I noticed you focused on'. Never narrate what they did.",
      "2. Revealing that you know their specific concern. This is the subtle one. Do NOT say 'good question on the messaging limit', 'your question about X', 'the point you were curious about', 'the thing you wanted clarified', or ANY phrasing that signals you know what they were after. Even referencing a question they typed is banned here -- it still tells them their attention was noted and acted on.",
      "3. Asserting that they read, opened, reviewed, or engaged with the document AT ALL. This is the sneakiest tell and it hides in innocent-looking phrases. BANNED: 'now that you've had a chance to go through it', 'now that you've read it', 'now that you've reviewed', 'after looking through the doc', 'since you've gone through it', 'hope you got a chance to look', 'now that you've had a chance to review'. The sender has NO legitimate way to know whether the reader opened the document -- claiming they did reveals the tracking. Write as if you genuinely do not know whether or how much they engaged.",
      "",
      "USE NEUTRAL FRAMING instead. A follow-up should reference the document without any claim about whether it was read: 'following up on the [document] I sent', 'wanted to make sure you have everything you need on [topic]', 'circling back on this', 'in case it is useful'. These are true whether the reader studied it cover to cover or never opened it -- so they leak nothing.",
      "",
      "INSTEAD: act on the insight completely invisibly. If they got stuck on the messaging limit, the follow-up simply INCLUDES the messaging limit as one helpful detail among a normal, natural message -- the way a thorough sender might proactively share a useful figure. You provide the thing they needed WITHOUT ever framing it as a response to their concern. The reader should think 'that was helpful', never 'how did they know that's what I wanted?'",
      "",
      "TONE GUARD: do not be conspicuously eager or laser-targeted. A message that zeroes in hard on exactly the reader's private worry -- even without naming it -- feels engineered and creepy. Keep proactive help light and natural, folded into a normal message, not presented as a mission to resolve their specific question.",
      "",
      "RULES:",
      "1. Provide what helps this reader, expressed as ordinary thoughtfulness -- never as observation, never as a targeted response to their concern. The reader should feel well-served, never watched or handled.",
      "2. Never invent facts about the document. If a detail is not in the document, do not assert it.",
      "3. Be useful without being generic, but the specificity comes from quietly including the right helpful detail -- not from signalling that you know what they were looking for.",
      "4. Do not overclaim the reader's intent. If the verdict confidence is low, keep the output measured -- do not write as if the deal is hot when the signals are thin.",
      "5. Match the sender's ask exactly. If they asked for talking points, produce talking points, not an email. If they asked for a summary for a colleague, write to that third party, not the reader.",
      channelGuidance(i.channel),
      `6. Write the output in ${languageName(i.locale)}.`,
      "",
      "The 'note' is a private aside to the sender (never seen by the reader), so it MAY reference the strategy -- e.g. 'Folded in the messaging limit since that is where they got stuck.' The 'output' is what reaches the reader and must obey the privacy rule absolutely.",
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
