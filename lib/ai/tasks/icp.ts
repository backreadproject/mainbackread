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

// The merged shape the UI reads. Written by two calls: the record task below,
// then the analysis task in icp-analysis.ts. Split because one call producing
// both exceeded 60s, and because a model asked to record and to reason in the
// same breath does neither well.
export const IcpOutput = z.object({
  kind: z.enum(["definition", "hypothesis"]),
  headline: z.string().default(""),
  definition: z.array(z.object({ label: z.string(), value: z.string() })).max(6).default([]),
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
  // Written by the analysis pass.
  findings: z.array(z.object({ finding: z.string(), basis: z.string(), soWhat: z.string() })).max(6).default([]),
  tensions: z.array(z.object({ observation: z.string(), why: z.string() })).max(3).default([]),
  market: z.array(z.object({ point: z.string(), caution: z.string() })).max(4).default([]),
  unknowns: z.array(z.object({ question: z.string(), whyItMatters: z.string() })).max(4).default([]),
  probes: z.array(z.object({ id: z.string(), q: z.string(), why: z.string() })).max(5).default([]),
  // Set by the route, never by a model. False means the second pass has not run.
  analysed: z.boolean().default(false),
});
export type IcpOutput = z.infer<typeof IcpOutput>;

export const IcpRecord = IcpOutput.pick({
  kind: true, headline: true, definition: true, triggers: true, committee: true,
  find: true, disqualifiers: true, angles: true, test: true, limits: true,
});
export type IcpRecord = z.infer<typeof IcpRecord>;

const SHAPE = [
  "RETURN EXACTLY THIS JSON. Every key present. Where a key does not apply return [] or \"\". NEVER omit a key.",
  "{",
  '  "kind": "definition" | "hypothesis",',
  '  "headline": "one plain sentence naming who this is",',
  '  "definition": [ { "label": "short", "value": "one or two sentences" } ],',
  '  "triggers": [ { "event": "observable from outside", "why": "why they move" } ],',
  '  "committee": [ { "role": "title", "stance": "signs"|"champions"|"blocks", "cares": "their worry" } ],',
  '  "find": { "titles": [], "seniority": "", "headcount": "", "techSignals": [], "communities": [], "searchStrings": [] },',
  '  "disqualifiers": [ { "who": "looks right", "why": "is not" } ],',
  '  "angles": [ { "persona": "who", "lead": "what to lead with" } ],',
  '  "test": [ { "step": "do this", "detail": "how" } ],',
  '  "limits": "one short paragraph naming which answers were too thin to carry weight"',
  "}",
  "kind and stance are fixed keywords the interface reads, not free text.",
].join("\n");

const CORE = [
  "You structure a founder's answers about their own buyers into a clean record.",
  "",
  SHAPE,
  "",
  "THIS IS THE RECORD PASS. Be faithful. A separate pass does the reasoning, so do not attempt findings, implications or advice here.",
  "",
  "1. Use their nouns. If they said 'brand repositioning' do not write 'marketing services'. Category language makes the whole thing generic.",
  "2. Invent no name, number, tool or community they did not give you.",
  "3. A trigger is something an OUTSIDER COULD OBSERVE happening at a company: a hire, a raise, a launch, a departure, a renewal date. 'They need a better process' is the problem restated with a date on it, and it is not a trigger. If their answers contain no observable trigger, return [].",
  "4. Disqualifiers describe companies that LOOK right and are not. Draw them from the bad fits they named. 'No budget' is useless.",
  "5. limits names which of their answers were blank, circular or too general to rest anything on. Name the question numbers.",
  "6. Where their answers do not establish something, leave it empty. An empty field is honest; a plausible guess is not.",
  "",
  "Write plainly. No marketing register.",
  "JSON ONLY. No prose outside it, no code fences. Escape apostrophes and quotes inside string values.",
];

const OPERATING = [
  "",
  "OPERATING BRANCH. They have paying customers. kind is \"definition\". test is [].",
  "definition: who they are, and separately what has to be TRUE RIGHT NOW for them to buy.",
  "searchStrings: one to three strings pasteable into a prospecting tool WITHOUT editing. Real title strings, real filter names. If their answers do not support a real one, return [].",
];

const STARTUP = [
  "",
  "STARTUP BRANCH. Nobody has paid them yet. kind is \"hypothesis\" and the headline says so plainly.",
  "definition: who they might be, what has to be true, the evidence behind it, and who did NOT care.",
  "committee is []. angles is []. find.searchStrings is []. Inventing those from a handful of conversations is false precision.",
  "test: three to five steps to falsify this in two weeks, including one stating what result would prove it WRONG.",
];

function rubric(b: IcpBranch): string {
  return CORE.concat(b === "operating" ? OPERATING : STARTUP).join("\n");
}

export function answersBlock(i: IcpInput): string {
  const l = [
    "WHAT THEY SELL: " + i.sells,
    i.customerCount == null ? "PAYING CUSTOMERS: none yet" : "PAYING CUSTOMERS: " + String(i.customerCount),
    "",
    "THEIR ANSWERS:",
  ];
  i.answers.forEach((a, n) => {
    l.push("", "Q" + String(n + 1) + ". " + a.q, "A. " + (a.a.trim() || "(left blank)"));
  });
  return l.join("\n");
}

export const icpTask: Task<IcpInput, IcpRecord> = {
  id: "icp",
  tier: "reason",
  maxTokens: 3000,
  schema: IcpRecord,
  cacheable: (i) => rubric(i.branch),
  system: (i) => rubric(i.branch) + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys, kind and stance stay English." : ""),
  user: (i) => answersBlock(i) + "\n\nA blank or circular answer is a gap. Name it in limits by question number rather than stretching it into a finding.",
  fixture: (i): IcpRecord => ({
    kind: i.branch === "operating" ? "definition" : "hypothesis",
    headline: "Mock mode. AI_PROVIDER is not set to anthropic.",
    definition: [{ label: "Who they are", value: "Mock output." }],
    triggers: [], committee: [],
    find: { titles: [], seniority: "", headcount: "", techSignals: [], communities: [], searchStrings: [] },
    disqualifiers: [], angles: [], test: [],
    limits: "Mock mode.",
  }),
};