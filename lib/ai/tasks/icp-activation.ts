import { z } from "zod";
import type { Task } from "../types";
import { PROVENANCE, HOUSE_STYLE } from "./icp-claim";
import { answersBlock, type IcpInput, type IcpRecord } from "./icp";
import type { IcpPeople } from "./icp-people";
import type { IcpDemand } from "./icp-demand";
import type { IcpMarket } from "./icp-market";

export interface IcpActivationInput extends IcpInput {
  record: IcpRecord;
  people: IcpPeople;
  demand: IcpDemand;
  market: IcpMarket;
}

export const IcpActivation = z.object({
  /** Opening lines earn the read; value propositions do not. */
  hooks: z.array(z.object({
    hook: z.string(),
    forWhom: z.string(),
    worksBecause: z.string(),
    channel: z.enum(["email", "linkedin", "call", "ad", "any"]),
  })).max(6).default([]),

  /** Complete, sendable drafts. A template with brackets is homework, not an asset. */
  messages: z.array(z.object({
    kind: z.enum(["cold email", "linkedin", "call opener", "follow-up", "referral ask", "one-liner"]),
    forWhom: z.string(),
    subject: z.string().default(""),
    body: z.string(),
    /** Named so a user can spot it if the reasoning behind it was wrong. */
    restsOn: z.string().default(""),
  })).max(6).default([]),

  /** Ranked by fit to THIS buyer, and explicitly including what not to bother with. */
  channels: z.array(z.object({
    channel: z.string(),
    fit: z.enum(["strong", "mixed", "weak"]),
    why: z.string(),
    firstMove: z.string().default(""),
    cost: z.enum(["low", "medium", "high"]),
  })).max(8).default([]),

  /** Observable and checkable. A score you cannot compute is decoration. */
  scoring: z.array(z.object({
    signal: z.string(),
    direction: z.enum(["positive", "negative"]),
    weight: z.enum(["strong", "moderate", "weak"]),
    howToCheck: z.string(),
  })).max(10).default([]),

  qualification: z.array(z.object({
    dimension: z.string(),
    askThis: z.string(),
    goodAnswer: z.string(),
    walkAwayIf: z.string(),
  })).max(6).default([]),

  /** Pasteable into Apollo, Clay or Sales Navigator without editing. */
  prospectFilters: z.object({
    titles: z.array(z.string()).max(10).default([]),
    excludeTitles: z.array(z.string()).max(6).default([]),
    headcount: z.string().default(""),
    industries: z.array(z.string()).max(8).default([]),
    excludeIndustries: z.array(z.string()).max(6).default([]),
    geographies: z.array(z.string()).max(8).default([]),
    technologies: z.array(z.string()).max(8).default([]),
    keywords: z.array(z.string()).max(8).default([]),
    hiringSignals: z.array(z.string()).max(5).default([]),
    fundingStages: z.array(z.string()).max(5).default([]),
    searchStrings: z.array(z.object({
      tool: z.string(),
      query: z.string(),
    })).max(3).default([]),
  }).default({
    titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [],
    geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [], searchStrings: [],
  }),

  /** Frequency of need decides pricing shape more than willingness to pay does. */
  pricingNotes: z.array(z.object({
    note: z.string(),
    basis: z.string().default(""),
    unless: z.string().default(""),
  })).max(4).default([]),

  /** One recommendation, argued. Not a menu. */
  motion: z.object({
    recommended: z.enum(["self-serve", "product-led", "inbound", "outbound", "partner", "enterprise"]),
    why: z.string().default(""),
    notThis: z.string().default(""),
  }).default({ recommended: "outbound", why: "", notThis: "" }),
});
export type IcpActivation = z.infer<typeof IcpActivation>;

const SYSTEM = [
  "You turn a buyer profile into things a team can execute this week. You are given the",
  "founder's answers plus four analyses: the record, the people, the demand and the market.",
  "Everything you write must trace back to those, and the whole point is that it is",
  "SPECIFIC ENOUGH TO USE WITHOUT EDITING.",
  "",
  PROVENANCE,
  "",
  "HOOKS. The opening line that earns the next sentence. Reference the trigger or the fear,",
  "never the product. `worksBecause` names which finding it exploits.",
  "",
  "MESSAGES. Write COMPLETE, SENDABLE drafts. No square brackets, no [Company], no",
  "placeholder for a first name beyond a plain {first_name} merge token if one is truly",
  "needed. A template someone has to finish is homework; a draft they can send after",
  "changing two words is an asset. Reference a real observable situation from the demand",
  "and market analyses. Keep cold emails under 90 words: this market deletes long ones.",
  "`restsOn` names the finding the message depends on, so a user who disagrees with that",
  "finding knows to discard the message with it.",
  "",
  "CHANNELS. Ranked by fit to THIS buyer, and you MUST include at least one marked 'weak'",
  "with a reason. Telling someone which channel not to spend on is worth more than",
  "another one to try. `firstMove` is the concrete first action, not a strategy.",
  "",
  "SCORING. Every signal must be OBSERVABLE and CHECKABLE. `howToCheck` names where you",
  "would actually look: a job board, a filing, a website change, a LinkedIn field. A",
  "scoring attribute nobody can verify is decoration. Include negative signals; the ones",
  "that predict a wasted quarter are as valuable as the positive ones.",
  "",
  "QUALIFICATION. Not BANT letters. The actual question to ask on a first call, what a",
  "good answer sounds like, and the answer that should make them walk away. `walkAwayIf`",
  "is the field most sellers will not write for themselves.",
  "",
  "PROSPECT FILTERS. Pasteable into Apollo, Clay or Sales Navigator WITHOUT EDITING. Real",
  "title strings including the variants and misspellings that exist in the wild. Exclusions",
  "matter as much as inclusions. `searchStrings` gives one ready query per named tool. If",
  "the analyses do not support a real filter, leave the field empty rather than filling it",
  "with something plausible: a wrong filter wastes a customer's credits and their money.",
  "",
  "PRICING NOTES. Follow the FREQUENCY of the need. An episodic buyer who needs this three",
  "times a year will not hold an annual subscription however much they liked it; a",
  "continuous one will. That single distinction changes the pricing model, and almost no",
  "founder follows it through. Say it plainly.",
  "",
  "MOTION. ONE recommendation, argued from the deal size, the cycle length and the",
  "committee size. `notThis` names the motion they will be tempted by and should avoid,",
  "with the reason. A menu of options is a refusal to advise.",
  "",
  HOUSE_STYLE,
].join("\n");

export const icpActivationTask: Task<IcpActivationInput, IcpActivation> = {
  id: "icp-activation",
  tier: "reason",
  maxTokens: 5000,
  schema: IcpActivation,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr" ? "\n\nWrite every string VALUE in French, EXCEPT job titles, product names, keywords and search strings, which stay in the language the market actually uses. Keys and enum values stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "RECORD:", JSON.stringify(i.record),
    "",
    "PEOPLE:", JSON.stringify(i.people),
    "",
    "DEMAND:", JSON.stringify(i.demand),
    "",
    "MARKET:", JSON.stringify(i.market),
    "",
    "Now write what a team can execute. Do not restate the analyses.",
  ].join("\n"),
  fixture: (): IcpActivation => ({
    hooks: [], messages: [], channels: [], scoring: [], qualification: [],
    prospectFilters: {
      titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [],
      geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [], searchStrings: [],
    },
    pricingNotes: [],
    motion: { recommended: "outbound", why: "", notThis: "" },
  }),
};