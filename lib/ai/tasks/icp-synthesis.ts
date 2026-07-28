import { z } from "zod";
import type { Task } from "../types";
import { Band, PROVENANCE, HOUSE_STYLE } from "./icp-claim";
import { answersBlock, type IcpInput, type IcpRecord } from "./icp";
import type { IcpPeople } from "./icp-people";
import type { IcpDemand } from "./icp-demand";
import type { IcpMarket } from "./icp-market";
import type { IcpActivation } from "./icp-activation";

export interface IcpSynthesisInput extends IcpInput {
  record: IcpRecord;
  people: IcpPeople;
  demand: IcpDemand;
  market: IcpMarket;
  activation: IcpActivation;
}

export const IcpSynthesis = z.object({
  /** A name a team would actually say out loud in a meeting. */
  profileName: z.string().default(""),
  headline: z.string().default(""),
  summary: z.string().default(""),

  opportunity: z.array(z.object({
    dimension: z.enum([
      "market size", "budget availability", "ease of reaching them",
      "sales complexity", "competitive intensity", "expansion potential", "urgency",
    ]),
    band: Band,
    why: z.string(),
  })).max(7).default([]),

  /** Bands, not numbers. Ranges the reader can argue with. */
  economics: z.object({
    dealSize: z.string().default(""),
    cycleLength: z.string().default(""),
    committeeSize: z.string().default(""),
    repeatShape: z.string().default(""),
    basis: z.string().default(""),
  }).default({ dealSize: "", cycleLength: "", committeeSize: "", repeatShape: "", basis: "" }),

  /** The reason to open this page. Each must be uncitable to the user's own words. */
  findings: z.array(z.object({
    finding: z.string(),
    basis: z.string(),
    soWhat: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  })).max(6).default([]),

  tensions: z.array(z.object({ observation: z.string(), why: z.string() })).max(4).default([]),

  /** Sequenced, because everything at once is nothing. */
  doNext: z.array(z.object({
    action: z.string(),
    when: z.enum(["this week", "this month", "this quarter"]),
    why: z.string(),
    expect: z.string().default(""),
  })).max(5).default([]),

  /** Naming what would sink it is the differentiator, applied to the whole page. */
  risks: z.array(z.object({
    risk: z.string(),
    ifTrue: z.string(),
    checkBy: z.string(),
  })).max(4).default([]),

  unknowns: z.array(z.object({ question: z.string(), whyItMatters: z.string() })).max(5).default([]),

  probes: z.array(z.object({
    id: z.string(),
    q: z.string(),
    why: z.string(),
    unlocks: z.string().default(""),
  })).max(5).default([]),

  limits: z.string().default(""),
});
export type IcpSynthesis = z.infer<typeof IcpSynthesis>;

const SYSTEM = [
  "You are handed a founder's answers and five analyses built from them: record, people,",
  "demand, market, activation. Every section is already written. Your job is the one thing",
  "none of those passes could do: JUDGE. Decide what matters, what is shaky, what to do",
  "first, and what would prove the whole thing wrong.",
  "",
  PROVENANCE,
  "",
  "DO NOT SUMMARISE. Five documents already say what they say. Repeating them in shorter",
  "sentences is the single most common failure of a synthesis and it is worthless.",
  "Everything you write must be a JUDGEMENT ACROSS the analyses, not a compression of them.",
  "",
  "profileName - what a team would actually call this buyer in a meeting. Concrete and",
  "sayable: 'Post-Series-A founder mid-raise', not 'Growth-Stage Decision Maker'.",
  "",
  "headline - the single sharpest thing you can tell this founder, in one sentence. If",
  "they would already agree with it without reading further, it is the wrong sentence.",
  "",
  "summary - one short paragraph a stranger could read to understand who this buyer is and",
  "why they buy. Written for someone who will read nothing else on the page.",
  "",
  "opportunity - band each dimension and JUSTIFY it in `why`. Bands are strong, mixed, weak",
  "or unknown. Use 'unknown' honestly and often; pretending to know is worse than admitting",
  "you do not. Do not band everything 'strong': a profile where nothing is difficult has",
  "not been thought about.",
  "",
  "economics - deal size, cycle length, committee size, and the SHAPE of repeat business.",
  "`repeatShape` is the field that changes a business model: does this buyer come back",
  "monthly, once a year, or once ever? Follow it through even when the founder has not.",
  "",
  "findings - the reason to open this page. A finding is a consequence, distinction or",
  "contradiction that follows from the material but that the founder did not state and",
  "could not easily have written themselves. Look hardest at: two populations averaged into",
  "one, what they are actually selling versus what they think, what the frequency of need",
  "implies about pricing and churn, who is missing from the committee, and what the gap",
  "between enthusiasm and payment usually means. `basis` cites question numbers or the",
  "analysis it comes from. `confidence` is honest: low is a legitimate and useful answer.",
  "",
  "tensions - where two things in the material cannot both be fully true, or where the",
  "people described and the people targeted are not the same people. State it plainly.",
  "",
  "doNext - at most five actions, SEQUENCED. `expect` says what result would indicate it is",
  "working. Everything at once is the same as nothing.",
  "",
  "risks - what would sink this profile if true. `checkBy` is the cheapest way to find out.",
  "This section is the product's whole position applied to itself: a profile that names",
  "what would make it wrong is worth more than one that sounds certain.",
  "",
  "unknowns - the form is: without X you cannot conclude Y. Price and buying authority first",
  "when absent.",
  "",
  "probes - follow-up questions that would most improve the next pass. Answerable from",
  "memory in a sentence or two, never requiring research, never a rephrasing of a question",
  "already asked. `unlocks` names the section that would get sharper. `id` is a short",
  "lowercase slug.",
  "",
  "limits - what this whole profile rests on and where it is thin. Name specific question",
  "numbers that were blank, circular or too general. Do not soften it.",
  "",
  HOUSE_STYLE,
].join("\n");

export const icpSynthesisTask: Task<IcpSynthesisInput, IcpSynthesis> = {
  id: "icp-synthesis",
  tier: "reason",
  maxTokens: 4500,
  schema: IcpSynthesis,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys and enum values stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "RECORD:", JSON.stringify(i.record),
    "", "PEOPLE:", JSON.stringify(i.people),
    "", "DEMAND:", JSON.stringify(i.demand),
    "", "MARKET:", JSON.stringify(i.market),
    "", "ACTIVATION:", JSON.stringify(i.activation),
    "",
    "Judge. Do not summarise.",
  ].join("\n"),
  fixture: (): IcpSynthesis => ({
    profileName: "", headline: "Mock mode.", summary: "",
    opportunity: [],
    economics: { dealSize: "", cycleLength: "", committeeSize: "", repeatShape: "", basis: "" },
    findings: [], tensions: [], doNext: [], risks: [], unknowns: [], probes: [],
    limits: "Mock mode.",
  }),
};