import { z } from "zod";
import type { Task } from "../types";

export type IcpBranch = "operating" | "startup";
export interface IcpAnswer { q: string; a: string }
export interface IcpInput {
  branch: IcpBranch;
  sells: string;
  customerCount: number | null;
  answers: IcpAnswer[];
  locale: "en" | "fr";
}

export const IcpOutput = z.object({
  kind: z.enum(["definition", "hypothesis"]),
  headline: z.string(),
  definition: z.array(z.object({ label: z.string(), value: z.string() })).max(6).default([]),
  findings: z.array(z.object({ finding: z.string(), basis: z.string(), soWhat: z.string() })).max(6).default([]),
  tensions: z.array(z.object({ observation: z.string(), why: z.string() })).max(3).default([]),
  market: z.array(z.object({ point: z.string(), caution: z.string() })).max(4).default([]),
  unknowns: z.array(z.object({ question: z.string(), whyItMatters: z.string() })).max(4).default([]),
  probes: z.array(z.object({ id: z.string(), q: z.string(), why: z.string() })).max(5).default([]),
  triggers: z.array(z.object({ event: z.string(), why: z.string() })).max(6).default([]),
  committee: z.array(z.object({ role: z.string(), stance: z.enum(["signs", "champions", "blocks"]), cares: z.string() })).max(5).default([]),
  find: z.object({
    titles: z.array(z.string()).max(8).default([]),
    seniority: z.string().default(""),
    headcount: z.string().default(""),
    techSignals: z.array(z.string()).max(6).default([]),
    communities: z.array(z.string()).max(6).default([]),
    searchStrings: z.array(z.string()).max(3).default([]),
  }).default({ titles: [], seniority: "", headcount: "", techSignals: [], communities: [], searchStrings: [] }),
  disqualifiers: z.array(z.object({ who: z.string(), why: z.string() })).max(5).default([]),
  angles: z.array(z.object({ persona: z.string(), lead: z.string() })).max(4).default([]),
  test: z.array(z.object({ step: z.string(), detail: z.string() })).max(5).default([]),
  limits: z.string().default(""),
});
export type IcpOutput = z.infer<typeof IcpOutput>;

const SHAPE = [
  "RETURN EXACTLY THIS JSON. Every key present, exactly these types. Where a key does not apply return [] or \"\". NEVER omit a key.",
  "{",
  '  "kind": "definition" | "hypothesis",',
  '  "headline": "your sharpest finding, one sentence. NOT a summary of what they said.",',
  '  "definition": [ { "label": "short", "value": "one or two sentences" } ],',
  '  "findings": [ { "finding": "what follows that they did not say", "basis": "from Q2 and Q5", "soWhat": "what they should do differently" } ],',
  '  "tensions": [ { "observation": "where two answers pull against each other", "why": "why it matters" } ],',
  '  "market": [ { "point": "generally true of the group they named", "caution": "what would make it not apply to them" } ],',
  '  "unknowns": [ { "question": "the missing fact", "whyItMatters": "what cannot be concluded without it" } ],',
  '  "probes": [ { "id": "short_slug", "q": "a specific question", "why": "what answering it unlocks" } ],',
  '  "triggers": [ { "event": "observable from outside", "why": "why they move" } ],',
  '  "committee": [ { "role": "title", "stance": "signs"|"champions"|"blocks", "cares": "their worry" } ],',
  '  "find": { "titles": [], "seniority": "", "headcount": "", "techSignals": [], "communities": [], "searchStrings": [] },',
  '  "disqualifiers": [ { "who": "looks right", "why": "is not" } ],',
  '  "angles": [ { "persona": "who", "lead": "what to lead with" } ],',
  '  "test": [ { "step": "do this", "detail": "how" } ],',
  '  "limits": "one paragraph"',
  "}",
  "kind and stance are fixed keywords the interface reads, not free text.",
].join("\n");

const CORE = [
  "You are given a founder's answers about their own buyers. Your job is to tell them something they do not already know.",
  "",
  SHAPE,
  "",
  "THE TEST THAT GOVERNS EVERY LINE:",
  "Before writing any line outside `definition`, ask: COULD THIS PERSON HAVE WRITTEN THIS SENTENCE THEMSELVES FROM THEIR OWN ANSWERS?",
  "If yes, delete it. They did not come here to be summarised. A profile that returns their own words arranged into headings is a failure, however well organised.",
  "`definition` is the one exception: it is a faithful record of what they asserted, because later work measures against it.",
  "",
  "WHAT A FINDING IS. A consequence, a distinction or a contradiction that follows from what they said but that they did not say. Look hard for:",
  "- Two things they treated as one. Different segments hiding inside one description: different frequency, different budget, different renewal behaviour.",
  "- What they are actually selling, as opposed to what they think they are selling. Read what the buyer DOES with the outcome, not the feature.",
  "- What their trigger implies about frequency, and therefore about pricing, churn and lifetime value. An episodic need and a continuous one are different businesses.",
  "- The disqualifier implied by their own wins: who would not act differently even if this worked perfectly.",
  "- Who must be in the room that they never mentioned.",
  "`basis` cites the answers it follows from, by number. That is what makes a finding checkable instead of assertive. Never write a finding you cannot cite.",
  "`soWhat` is the decision it changes. If nothing they do changes, it is an observation, not a finding, and it does not belong.",
  "",
  "TENSIONS. Where two of their answers cannot both be fully true, or where the people they describe and the people they target are not the same people. Name it plainly. Do not soften it.",
  "",
  "MARKET. What is generally true of the population they named that they did NOT supply: how that group typically buys, what they usually already use, where they gather, typical budget ownership, typical cycle length. This is the one place you may go beyond their answers, and it must be visibly separate from findings. `caution` states what would make each point not apply to them. Never present market knowledge as though it came from their answers.",
  "",
  "UNKNOWNS. Not 'you did not mention X'. The form is: without X you cannot conclude Y. Pick the gaps that most limit the analysis, price and buying authority first when absent.",
  "",
  "PROBES. Specific follow-up questions to fill the gaps that matter most, best first.",
  "- Answerable from memory in one or two sentences. Never requiring research.",
  "- Never a rephrasing of a question already asked. You have their answers; ask what is still missing.",
  "- Concrete over abstract. 'What did the last person who said no give as their reason?' not 'Tell us about objections.'",
  "- `why` states what you could then tell them. It is a trade, and it should read like one.",
  "- `id` is a short lowercase slug, no spaces.",
  "",
  "THIN ANSWERS. Many people write flatly, or answer a question about a moment with a generality. That is normal and it is not their fault. Read past it: infer what you legitimately can, say plainly in `limits` which answers were too thin to carry weight, and put the rest into probes. NEVER pad. An honest short profile with four sharp probes is worth more than a full one built on stretching.",
  "",
  "Use their nouns, never category language. Invent no name, number, tool or community that is not either theirs or clearly marked as market knowledge.",
  "Write plainly. No marketing register.",
  "JSON ONLY. No prose outside it, no code fences. Escape apostrophes and quotes inside string values, including anything quoted back from their answers.",
];

const OPERATING = [
  "",
  "OPERATING BRANCH. They have paying customers, so this is a DEFINITION. kind is \"definition\". test is [].",
  "definition: who they are, and separately what has to be TRUE RIGHT NOW. The second half is the half that matters.",
  "Fill triggers, committee, disqualifiers, angles and every field of find.",
  "searchStrings: one to three strings pasteable into a prospecting tool WITHOUT editing. Real title strings, real filter names. If their answers do not support a real one, return [] rather than a decorative example.",
];

const STARTUP = [
  "",
  "STARTUP BRANCH. Nobody has paid them yet. kind is \"hypothesis\" and the headline says so.",
  "definition: the hypothesis as labelled rows. Who they might be, what has to be true, the evidence behind it, and who did NOT care.",
  "committee is []. angles is []. find.searchStrings is [].",
  "Inventing a buying committee from a handful of conversations is false precision. But findings, tensions, market and probes are NOT false precision, and they are where this page earns its place. Do not thin them out because the branch is uncertain.",
  "test: three to five steps to falsify this in two weeks, including one stating what result would prove it WRONG.",
  "Weigh who did not respond above who agreed. Indifference is the more informative signal.",
];

function rubric(b: IcpBranch): string {
  return CORE.concat(b === "operating" ? OPERATING : STARTUP).join("\n");
}

export const icpTask: Task<IcpInput, IcpOutput> = {
  id: "icp",
  tier: "reason",
  maxTokens: 6000,
  schema: IcpOutput,
  cacheable: (i) => rubric(i.branch),
  system: (i) => rubric(i.branch) + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys, kind and stance stay English." : ""),
  user: (i) => {
    const l = [
      "WHAT THEY SELL: " + i.sells,
      i.customerCount == null ? "PAYING CUSTOMERS: none yet" : "PAYING CUSTOMERS: " + String(i.customerCount),
      "",
      "THEIR ANSWERS:",
    ];
    i.answers.forEach((a, n) => {
      l.push("", "Q" + String(n + 1) + ". " + a.q, "A. " + (a.a.trim() || "(left blank)"));
    });
    l.push("", "Cite answers by these Q numbers in `basis`. A blank or circular answer is a gap: name it in limits and turn it into a probe rather than stretching it.");
    return l.join("\n");
  },
  fixture: (i): IcpOutput => ({
    kind: i.branch === "operating" ? "definition" : "hypothesis",
    headline: "Mock mode. AI_PROVIDER is not set to anthropic.",
    definition: [{ label: "Who they are", value: "Mock output." }],
    findings: [{ finding: "Mock finding.", basis: "from Q1", soWhat: "Nothing, this is mock mode." }],
    tensions: [], market: [], unknowns: [],
    probes: [{ id: "mock", q: "Mock probe question?", why: "Mock mode returns a fixture." }],
    triggers: [], committee: [],
    find: { titles: [], seniority: "", headcount: "", techSignals: [], communities: [], searchStrings: [] },
    disqualifiers: [], angles: [], test: [],
    limits: "Mock mode.",
  }),
};