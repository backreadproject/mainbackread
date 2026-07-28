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

// Defaults on every collection. A model that omits one field should cost a
// section of the page, not the whole generation and the call that paid for it.
export const IcpOutput = z.object({
  kind: z.enum(["definition", "hypothesis"]),
  headline: z.string(),
  definition: z.array(z.object({ label: z.string(), value: z.string() })).max(6).default([]),
  triggers: z.array(z.object({ event: z.string(), why: z.string() })).max(6).default([]),
  committee: z.array(z.object({
    role: z.string(),
    stance: z.enum(["signs", "champions", "blocks"]),
    cares: z.string(),
  })).max(5).default([]),
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

// THE SHAPE BLOCK. Its absence is what broke the first live run: the schema
// validated an output the model had never been told to produce.
const SHAPE = [
  "RETURN EXACTLY THIS JSON OBJECT. Every key must be present, with exactly this type.",
  "Where a key does not apply, return an empty array or an empty string. Never omit a key.",
  "",
  "{",
  '  "kind": "definition" or "hypothesis",',
  '  "headline": "one sentence",',
  '  "definition": [ { "label": "short label", "value": "one or two sentences" } ],',
  '  "triggers": [ { "event": "what an outsider could observe", "why": "why it makes them move" } ],',
  '  "committee": [ { "role": "job title", "stance": "signs" or "champions" or "blocks", "cares": "their worry" } ],',
  '  "find": {',
  '    "titles": [ "job title", "job title" ],',
  '    "seniority": "one line",',
  '    "headcount": "a range such as 40 to 150",',
  '    "techSignals": [ "product name" ],',
  '    "communities": [ "named community" ],',
  '    "searchStrings": [ "a string specific enough to paste unedited" ]',
  "  },",
  '  "disqualifiers": [ { "who": "who looks right", "why": "why they are not" } ],',
  '  "angles": [ { "persona": "who", "lead": "what to lead with" } ],',
  '  "test": [ { "step": "what to do", "detail": "how" } ],',
  '  "limits": "one paragraph"',
  "}",
  "",
  "stance and kind are fixed keywords, not free text. The interface reads them.",
].join("\n");

function rubric(branch: IcpBranch): string {
  const shared = [
    "You turn a founder's answers about their own customers into a structured buyer profile.",
    "",
    SHAPE,
    "",
    "RULES THAT DECIDE WHETHER THIS IS WORTH READING:",
    "1. Use their nouns. If they said 'brand repositioning' do not write 'marketing services'. Generic language is the failure mode; a profile written in category words gets filed and never used.",
    "2. Never invent a number, a name, a tool or a community they did not give you. Where you infer something, say what you inferred it from.",
    "3. A trigger is something an OUTSIDER COULD OBSERVE happening at a company: a hire, a raise, a launch, a departure, a renewal date. 'They need a better process' is the problem restated with a date on it, and it is not a trigger.",
    "4. Disqualifiers describe companies that LOOK right and are not. 'Companies with no budget' is useless. Draw them from the bad fits they named.",
    "5. limits names the weakness of THIS input: how many customers it rests on, whether they all came from one channel, which questions were answered thinly. A generic caveat is worse than none, because it gets skipped.",
    "6. Write plainly. No marketing register, no adjectives doing work a fact should do.",
    "",
    "JSON ONLY. No prose before or after, no code fences. Escape apostrophes and quotation marks correctly inside string values, including anything you quote back from their answers.",
  ];

  const operating = [
    "",
    "OPERATING BRANCH. They have paying customers, so this is a DEFINITION.",
    'kind is "definition". test is [].',
    "definition: who they are, and separately what has to be TRUE RIGHT NOW for them to buy. The second half is the half that matters.",
    "Fill triggers, committee, disqualifiers, angles and every field of find.",
    "searchStrings: one to three strings pasteable into a search or prospecting tool WITHOUT editing. Real title strings, real filter names.",
    "committee stance must be accurate. 'blocks' is not an insult; it is whoever's objection stalls the deal.",
  ];

  const startup = [
    "",
    "STARTUP BRANCH. Nobody has paid them yet, so this is a HYPOTHESIS and must say so.",
    'kind is "hypothesis". The headline states plainly that this is unverified.',
    "definition: the hypothesis as labelled rows. Who they might be, what has to be true, what evidence sits behind it, and who did NOT care.",
    "triggers: only where they described a real condition that makes it urgent. Otherwise [].",
    "disqualifiers: draw these from who did not respond.",
    'committee is []. angles is []. find.searchStrings is []. find.techSignals is [].',
    "Inventing a buying committee or a search string from a handful of conversations is false precision, and refusing to do it is the point of this product.",
    'find.titles and find.communities: only where they named specific ones. find.seniority and find.headcount: "" unless their answers actually establish it.',
    "test: three to five steps to falsify this in two weeks. Who to talk to, what to ask, and one step stating what result would prove the hypothesis WRONG.",
    "Give weight to who did NOT respond. Indifference is more informative than polite agreement.",
  ];

  return shared.concat(branch === "operating" ? operating : startup).join("\n");
}

export const icpTask: Task<IcpInput, IcpOutput> = {
  id: "icp",
  tier: "reason",
  maxTokens: 4000,
  schema: IcpOutput,
  cacheable: (i) => rubric(i.branch),
  system: (i) => rubric(i.branch) + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys, kind and stance stay in English." : ""),
  user: (i) => {
    const lines = [
      "WHAT THEY SELL: " + i.sells,
      i.customerCount == null ? "PAYING CUSTOMERS: none yet" : "PAYING CUSTOMERS: " + String(i.customerCount),
      "",
      "THEIR ANSWERS:",
    ];
    i.answers.forEach((a, n) => {
      lines.push("");
      lines.push("Q" + String(n + 1) + ". " + a.q);
      lines.push("A. " + (a.a.trim() || "(left blank)"));
    });
    lines.push("");
    lines.push("A blank answer is a gap. Do not fill it with something plausible. Say so in limits.");
    lines.push("A thin answer is also a gap. If they wrote one vague line where the question asked for a specific person or moment, treat that as missing rather than stretching it into a finding.");
    return lines.join("\n");
  },
  fixture: (i): IcpOutput => ({
    kind: i.branch === "operating" ? "definition" : "hypothesis",
    headline: i.branch === "operating"
      ? "Mock mode. This was not generated from your answers."
      : "Mock mode. A hypothesis placeholder, not generated from your answers.",
    definition: [{ label: "Who they are", value: "Sample scope, generated in mock mode." }],
    triggers: [{ event: "A new leader in post under 120 days", why: "They arrive with a mandate and no incumbent supplier." }],
    committee: i.branch === "operating" ? [{ role: "Head of function", stance: "champions" as const, cares: "Something they inherited." }] : [],
    find: {
      titles: ["Head of Function"], seniority: "Director and above", headcount: "40 to 150",
      techSignals: [], communities: [],
      searchStrings: i.branch === "operating" ? ['title=["Head of Function"] AND employees=40..150'] : [],
    },
    disqualifiers: [{ who: "Looks right, buys on price", why: "Runs the process in house." }],
    angles: i.branch === "operating" ? [{ persona: "New leader", lead: "The thing you inherited." }] : [],
    test: i.branch === "startup" ? [{ step: "Talk to five who match and three who do not", detail: "The three are the control." }] : [],
    limits: "Mock mode. AI_PROVIDER is not set to anthropic.",
  }),
};