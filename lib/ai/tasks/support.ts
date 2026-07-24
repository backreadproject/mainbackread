import { z } from "zod";
import type { Task } from "../types";
import { supportKnowledge } from "@/lib/support-kb";

export interface SupportTurn { role: "user" | "assistant"; content: string }

export interface SupportInput {
  question: string;
  history: SupportTurn[];
  /** Who we are talking to, when we know. Shapes tone, never unlocks anything. */
  who: { signedIn: boolean; name?: string | null; plan?: string | null; isOrg?: boolean };
  /** True when a person has already been brought in. The bot keeps helping,
   *  it just stops re-escalating and stops promising to resolve their issue. */
  humanWaiting?: boolean;
}

export const SupportOutput = z.object({
  answer: z.string(),
  /** True when this needs a person: account-specific, billing, a complaint,
   *  anything the knowledge base does not cover, or an explicit request. */
  escalate: z.boolean(),
  /** Short internal note for the human picking it up. Never shown to the user. */
  reason: z.string().max(140),
});
export type SupportOutput = z.infer<typeof SupportOutput>;

export const supportTask: Task<SupportInput, SupportOutput> = {
  id: "support",
  tier: "fast",
  maxTokens: 600,
  schema: SupportOutput,

  // Stable across every conversation, so Anthropic caches it.
  cacheable: () => supportKnowledge(),

  system: (i) => {
    const ctx = i.who.signedIn
      ? `The person is signed in${i.who.name ? ` and is called ${i.who.name}` : ""}${i.who.plan ? `, on the ${i.who.plan} plan` : ""}${i.who.isOrg ? ", in an organization account" : ""}.`
      : "The person is not signed in. They may be evaluating ReadProspects before buying.";

    return [
      "You are the support assistant for ReadProspects. You are helpful, direct and brief.",
      "",
      ctx,
      "",
      i.humanWaiting ? "A person from the team has already been brought into this conversation and will reply separately, here or by email. Keep answering anything else they ask that the reference material covers. Do not say you are escalating again, and do not promise to resolve what they raised, but never go silent on them." : "",
      "GROUNDING. Answer only from the reference material above. It is the whole truth you have about this product. If the answer is not in it, do not construct one from what you know about similar tools. Say you will get a person and set escalate to true.",
      "",
      "ESCALATE, do not guess, when any of these are true:",
      "1. The question is about their specific account, a specific document, or a specific charge. You cannot see their data.",
      "2. Anything about money already paid, refunds, or a billing dispute.",
      "3. A complaint, a privacy or deletion request, or anything legal.",
      "4. A bug report, or something that sounds broken.",
      "5. They ask for a human, in any wording.",
      "6. The reference material does not answer it.",
      "",
      "When you escalate, say so plainly in one line, without apology or filler. Do not promise a response time.",
      "",
      "STYLE. Two or three sentences unless they asked for detail. No greetings after the first message. No 'I'd be happy to'. Never invent a feature, a price, or a limit. Plan names are Free, Personal, Team and Business, and nothing else.",
      "",
      "Respond with ONLY a JSON object, no markdown fences:",
      '{"answer":"what you tell them","escalate":true or false,"reason":"why, for the person picking this up"}',
    ].join("\n");
  },

  user: (i) => {
    const convo = i.history.slice(-8).map((t) => `${t.role === "user" ? "Them" : "You"}: ${t.content}`).join("\n");
    return convo ? `${convo}\nThem: ${i.question}` : `Them: ${i.question}`;
  },

  fixture: (i) => {
    const q = i.question.toLowerCase();
    const wantsHuman = /human|person|agent|speak to someone|refund|charge|billing|complain/.test(q);
    if (wantsHuman) {
      return {
        answer: "That one needs a person. I have passed it on with your message.",
        escalate: true,
        reason: "[fixture] asked for a human or raised billing",
      };
    }
    if (/plan|price|cost|how much|limit/.test(q)) {
      return {
        answer: "Free covers 2 documents a month with 2 verdicts each. Personal lifts the limits for one person. Team adds organizations and seats, and Business adds A/B versions, Slack and webhook alerts, and the API.",
        escalate: false,
        reason: "[fixture] plan question",
      };
    }
    return {
      answer: "ReadProspects shares a document by private link and tells you how it was read: what held them, what they asked, and what to do next.",
      escalate: false,
      reason: "[fixture] general",
    };
  },
};

