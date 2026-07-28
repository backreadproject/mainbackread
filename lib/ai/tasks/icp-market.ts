import { z } from "zod";
import type { Task } from "../types";
import { Claim, PROVENANCE, HOUSE_STYLE } from "./icp-claim";
import { answersBlock, type IcpInput, type IcpRecord } from "./icp";

export interface IcpMarketInput extends IcpInput { record: IcpRecord }

export const IcpMarket = z.object({
  /** What they already run. Prospecting filters and integration arguments both
   *  come from here. */
  stack: z.array(z.object({
    category: z.string(),
    tools: z.array(z.string()).max(6).default([]),
    note: z.string().default(""),
    source: z.enum(["stated", "inferred", "market"]),
    basis: z.string().default(""),
    unless: z.string().default(""),
  })).max(8).default([]),

  /** Named places, not platform names. "LinkedIn" is not a channel. */
  channels: z.array(z.object({
    place: z.string(),
    behaviour: z.string(),
    reachable: z.enum(["easily", "with effort", "rarely"]),
    source: z.enum(["stated", "inferred", "market"]),
    basis: z.string().default(""),
    unless: z.string().default(""),
  })).max(8).default([]),

  /** Actual query strings. These are ad keywords and SEO briefs, so they must
   *  read like something a person types at 11pm, not like a category. */
  searchIntent: z.array(z.object({
    query: z.string(),
    stage: z.enum(["problem aware", "solution aware", "vendor aware"]),
    why: z.string().default(""),
  })).max(10).default([]),

  content: z.array(Claim).max(5).default([]),
  outreachNorms: z.array(Claim).max(5).default([]),

  /** The status quo is the real competitor and it is usually not a product. */
  alternatives: z.array(z.object({
    alternative: z.string(),
    kind: z.enum(["product", "in-house", "manual", "consultant", "status quo"]),
    whyChosen: z.string(),
    weakness: z.string(),
    source: z.enum(["stated", "inferred", "market"]),
    basis: z.string().default(""),
  })).max(6).default([]),

  /** Observable events. A prospecting trigger you cannot detect is a wish. */
  detectableSignals: z.array(z.object({
    signal: z.string(),
    whereVisible: z.string(),
    meaning: z.string(),
  })).max(8).default([]),
});
export type IcpMarket = z.infer<typeof IcpMarket>;

const SYSTEM = [
  "You are a market analyst. You are given a founder's answers about their buyers and a",
  "record already built from them. Your job is the OPPOSITE of summarising: describe the",
  "market they are aiming at, using what you know about that kind of company, that they",
  "did not and could not tell you.",
  "",
  PROVENANCE,
  "",
  "MOST OF WHAT YOU RETURN HERE WILL BE source:\"market\". That is correct and expected.",
  "This pass exists precisely because the customer cannot write it themselves.",
  "",
  "SECTION BY SECTION:",
  "",
  "stack - what this kind of company actually runs today, by category (CRM, email, docs,",
  "analytics, project management, accounting). Name real products that this size and type",
  "of company genuinely uses. This drives prospecting filters and integration arguments,",
  "so a wrong guess is expensive: if you are unsure what a segment runs, say so in `note`",
  "rather than naming something plausible.",
  "",
  "channels - WHERE these people actually are, named specifically. Not 'LinkedIn' but",
  "which groups, which newsletters, which subreddits, which Slack or Discord communities,",
  "which conferences, which publications. `behaviour` says what they do there: lurk, ask",
  "for recommendations, post, hire. `reachable` is honest about whether an outsider can",
  "actually get to them there or whether it is a closed room.",
  "",
  "searchIntent - the literal strings these people type. Write what a person types at",
  "11pm when the problem is biting, including the clumsy phrasings. These become ad",
  "keywords and content briefs, so 'document tracking software' is useful and 'improving",
  "sales efficiency' is not. Cover all three stages: someone who has the problem and does",
  "not know tools exist, someone comparing approaches, someone comparing vendors.",
  "",
  "content - what this audience actually reads and trusts, and what they ignore. Be",
  "willing to say a format does not work for them.",
  "",
  "outreachNorms - how this market responds to cold contact. Tolerance, best channel,",
  "what gets deleted, timing, who replies personally versus who has a gatekeeper.",
  "",
  "alternatives - what they use INSTEAD today, ranked by how common it really is. The",
  "honest answer is usually a spreadsheet, a habit, or doing nothing, and naming the",
  "status quo as the main competitor is more useful than listing vendors. `weakness` is",
  "the crack the seller can work in.",
  "",
  "detectableSignals - events an OUTSIDER can actually observe that indicate this buyer",
  "is in-market now: a job posting, a funding announcement, a leadership change, a site",
  "change, a conference attendee list, a regulatory date. `whereVisible` must name where",
  "you would actually see it. A signal nobody can detect is not a signal.",
  "",
  HOUSE_STYLE,
].join("\n");

export const icpMarketTask: Task<IcpMarketInput, IcpMarket> = {
  id: "icp-market",
  tier: "reason",
  maxTokens: 4000,
  schema: IcpMarket,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr" ? "\n\nWrite every string VALUE in French, EXCEPT product names, community names and search queries, which stay in the language people actually use them in. Keys and enum values stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "THE RECORD BUILT FROM THESE ANSWERS:",
    JSON.stringify(i.record),
    "",
    "Describe the market these buyers sit in. Do not restate the above.",
  ].join("\n"),
  fixture: (): IcpMarket => ({
    stack: [], channels: [], searchIntent: [], content: [], outreachNorms: [],
    alternatives: [], detectableSignals: [],
  }),
};