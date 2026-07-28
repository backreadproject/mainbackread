import { z } from "zod";
import type { Task } from "../types";
import { IcpOutput, answersBlock, type IcpBranch, type IcpInput, type IcpRecord } from "./icp";

export interface IcpAnalysisInput extends IcpInput {
  record: IcpRecord;
}

export const IcpAnalysis = IcpOutput.pick({
  headline: true, findings: true, tensions: true, market: true, unknowns: true, probes: true,
});
export type IcpAnalysis = z.infer<typeof IcpAnalysis>;

const SHAPE = [
  "RETURN EXACTLY THIS JSON. Every key present. Where you have nothing worth saying return []. NEVER omit a key.",
  "{",
  '  "headline": "your single sharpest finding, one sentence",',
  '  "findings": [ { "finding": "what follows that they did not say", "basis": "from Q2 and Q5", "soWhat": "what they should do differently" } ],',
  '  "tensions": [ { "observation": "where two answers pull against each other", "why": "why it matters" } ],',
  '  "market": [ { "point": "generally true of the group they named", "caution": "what would make it not apply to them" } ],',
  '  "unknowns": [ { "question": "the missing fact", "whyItMatters": "what cannot be concluded without it" } ],',
  '  "probes": [ { "id": "short_slug", "q": "a specific question", "why": "what answering it unlocks" } ]',
  "}",
].join("\n");

const SYSTEM = [
  "You are handed a founder's raw answers about their buyers, and a clean record already made from them.",
  "The record exists. Your ONLY job is to say what they do not already know.",
  "",
  SHAPE,
  "",
  "THE TEST THAT GOVERNS EVERY LINE:",
  "COULD THIS PERSON HAVE WRITTEN THIS SENTENCE THEMSELVES FROM THEIR OWN ANSWERS?",
  "If yes, delete it. Restating them is already done and it is not your job. A line that survives is one they would read and think: I had not put it that way.",
  "Returning three real findings beats returning six where three are their own words rearranged.",
  "",
  "WHAT A FINDING IS. A consequence, a distinction or a contradiction that follows from what they said but that they did not say. Work through all of these before you write:",
  "- TWO THINGS TREATED AS ONE. Do the people they described actually behave the same way? Different frequency of need, different budget, different renewal behaviour, different urgency. An episodic buyer and a continuous one are different businesses even when they have the same job title.",
  "- WHAT THEY ARE ACTUALLY SELLING. Read what the buyer DOES with the outcome, not the feature. If the buyer uses it to decide whether to stop waiting, they are buying a decision, not information. That changes who pays and how much.",
  "- WHAT THE TRIGGER IMPLIES. If the need is episodic, what happens to the account when the episode ends? Frequency drives pricing, churn and lifetime value, and they rarely follow it through.",
  "- THE DISQUALIFIER HIDDEN IN THEIR WINS. Who would NOT act differently even if this worked perfectly? Those people will never pay however warmly they respond.",
  "- WHO IS MISSING FROM THE ROOM. Whose approval or budget is implied by what they described but never mentioned.",
  "- WHAT THE ENTHUSIASM IS WORTH. If people liked it but nobody paid or committed, say what that gap usually means.",
  "",
  "`basis` cites the answers it follows from, by Q number. Never write a finding you cannot cite. That is what makes it checkable rather than assertive.",
  "`soWhat` is the decision it changes. If nothing they do changes, it is an observation and it does not belong.",
  "",
  "TENSIONS. Where two of their answers cannot both be fully true, or where the people they described and the people they target are not the same people. Name it plainly, do not soften it.",
  "",
  "MARKET. What is generally true of the population they named that they did NOT supply: how that group typically buys, what they already use, typical budget ownership, typical cycle length, where they gather. This is the one place you may go beyond their answers. `caution` states what would make each point not apply to them. Never dress market knowledge as though it came from their answers.",
  "",
  "UNKNOWNS. Not 'you did not mention X'. The form is: without X you cannot conclude Y. Price and buying authority first when absent.",
  "",
  "PROBES. Follow-up questions that would most improve the next pass, best first.",
  "- Answerable from memory in one or two sentences. Never requiring research.",
  "- Never a rephrasing of a question already asked. You have their answers; ask what is still missing.",
  "- Concrete over abstract: 'What did the last person who said no give as their reason?' not 'Tell us about objections.'",
  "- `why` states what you could then tell them. It should read like a trade.",
  "- `id` is a short lowercase slug, no spaces.",
  "",
  "THIN ANSWERS ARE NORMAL. People write flatly, and answer a question about a moment with a generality. Read past it. Infer what legitimately follows, and turn what you cannot infer into probes. NEVER pad to fill a section. Three sharp findings and four good probes beat a full page of stretching.",
  "",
  "Use their nouns. Write plainly, no marketing register. Do not flatter them and do not hedge into uselessness.",
  "JSON ONLY. No prose outside it, no code fences. Escape apostrophes and quotes inside string values, including anything quoted back from their answers.",
].join("\n");

const BRANCH_NOTE: Record<IcpBranch, string> = {
  operating: "They have paying customers, so their answers describe real purchases. Findings can be stated with some confidence. Watch for a definition drawn from their happiest customers rather than their most typical.",
  startup: "Nobody has paid them yet. Enthusiasm is not evidence, and the people who did NOT respond tell you more than the people who agreed. Do not let an absence of paying customers make you vague: the reasoning is exactly what they cannot do for themselves at this stage.",
};

export const icpAnalysisTask: Task<IcpAnalysisInput, IcpAnalysis> = {
  id: "icp-analysis",
  tier: "reason",
  maxTokens: 3500,
  schema: IcpAnalysis,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + "\n\n" + BRANCH_NOTE[i.branch] +
    (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "THE RECORD ALREADY MADE FROM THESE ANSWERS:",
    JSON.stringify(i.record),
    "",
    "Do not restate any of the above. Cite answers by their Q numbers in `basis`.",
  ].join("\n"),
  fixture: (): IcpAnalysis => ({
    headline: "Mock mode. AI_PROVIDER is not set to anthropic.",
    findings: [{ finding: "Mock finding.", basis: "from Q1", soWhat: "Nothing, this is mock mode." }],
    tensions: [], market: [], unknowns: [],
    probes: [{ id: "mock", q: "Mock probe?", why: "Mock mode returns a fixture." }],
  }),
};