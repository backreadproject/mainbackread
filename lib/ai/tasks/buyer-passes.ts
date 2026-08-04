import { z } from "zod";
import type { Task } from "../types";
import type { Objective, Branch } from "@/lib/buyer-questions";

/**
 * The buyer profile passes, built from the approved screens.
 *
 * The old ICP schemas produced hooks, channels, scoring, qualification, pricing
 * notes and a recommended motion. None of that is on any approved screen, and
 * several sections that ARE on the screens had no field to render from. These
 * schemas emit the sections and nothing else.
 *
 * Three passes rather than six, because the screens ask three questions:
 * who is this market and what sets it off, who are the people in it, and where
 * do you find them. Fewer passes is also less wall clock and less spend.
 */

export interface ProfileAnswer { q: string; a: string }

export interface ProfileInput {
  objective: Objective;
  branch: Branch;
  /** The single sentence describing what they sell. */
  sells: string;
  answers: ProfileAnswer[];
  locale: "en" | "fr";
}

export function answersBlock(i: ProfileInput): string {
  return [
    "OBJECTIVE: " + i.objective,
    "EVIDENCE: " + (i.branch === "operating" ? "they have paying customers" : "no customers yet, this is a hypothesis"),
    "",
    "WHAT THEY SELL: " + i.sells,
    "",
    "THEIR ANSWERS:",
    ...i.answers.filter((x) => x.a.trim()).map((x) => "Q: " + x.q + "\nA: " + x.a),
  ].join("\n");
}

const HOUSE = [
  "HOUSE STYLE.",
  "Write plainly. No marketing register, no adjectives doing the work of evidence.",
  "Never invent a fact the answers do not support. If something is not established,",
  "say so in that field rather than filling it with something plausible.",
  "Sentence case. No em dashes.",
].join("\n");

/* ------------------------------------------------------------------ */
/* Pass one: the market, its triggers, and who is disqualified         */
/* ------------------------------------------------------------------ */

export const MarketOutput = z.object({
  /** Read back at the confirm gate before five sections are built on it. */
  headline: z.string(),
  /** Prose, two or three paragraphs. The mock renders this as running text
   *  above the labelled rows, not as a list. */
  definition: z.string(),
  /** The size band is usually a proxy for something truer. Name the truer
   *  thing, because that is the sentence a customer has never written down. */
  reallyTrue: z.string(),
  triggers: z.array(z.object({
    event: z.string(),
    why: z.string(),
    /** Whether this is visible from outside. A trigger you cannot detect is
     *  a wish, and the search criteria pass depends on knowing which is which. */
    detectable: z.boolean().default(false),
  })).max(6).default([]),
  disqualifiers: z.array(z.object({
    who: z.string(),
    why: z.string(),
  })).max(6).default([]),
  /** What none of this can tell them. Present on every approved screen. */
  limits: z.array(z.string()).max(4).default([]),
});
export type MarketOutput = z.infer<typeof MarketOutput>;

const MARKET_SYSTEM = [
  "You define a market from a founder's own answers about their business.",
  "",
  "HEADLINE. One sentence a customer will read at a confirmation gate before five",
  "more sections are built on top of it. If the evidence is thin, say so in it:",
  "an unproven hypothesis should be named as one in the first six words.",
  "",
  "DEFINITION. Two or three short paragraphs of running prose. Who this market is,",
  "and what has to be true of a company for this to be worth buying.",
  "",
  "REALLYTRUE. The size band, the sector and the funding stage are proxies. Name",
  "the thing they are proxies FOR. A founder rarely writes this down and it is the",
  "single most useful line on the page: 'below fifty people nobody owns onboarding,",
  "so there is nobody for the product to make successful'.",
  "",
  "TRIGGERS. The moment that turns this from interesting into urgent. Mark",
  "detectable true only when the event leaves a public trace someone could search",
  "for. A trigger nobody can see is a wish, not a trigger.",
  "",
  "DISQUALIFIERS. Who looks right and is not, with the reason. If the answers named",
  "bad fits, those come first and their shared property is the real disqualifier.",
  "",
  "LIMITS. What this profile cannot tell them. Never leave this empty.",
  "",
  HOUSE,
].join("\n");

export const marketTask: Task<ProfileInput, MarketOutput> = {
  id: "bp-market",
  tier: "reason",
  maxTokens: 2600,
  schema: MarketOutput,
  cacheable: () => MARKET_SYSTEM,
  system: (i) => MARKET_SYSTEM + (i.locale === "fr"
    ? "\n\nWrite every string VALUE in French. Keys and enum values stay English."
    : ""),
  user: (i) => answersBlock(i) + "\n\nDefine the market.",
  fixture: (): MarketOutput => ({
    headline: "", definition: "", reallyTrue: "", triggers: [], disqualifiers: [], limits: [],
  }),
};

/* ------------------------------------------------------------------ */
/* Pass two: the personas, exactly the fields the persona screen shows */
/* ------------------------------------------------------------------ */

const Persona = z.object({
  name: z.string(),
  /** Champion, economic buyer, blocker. Rendered as "role in the deal". */
  roleInDeal: z.enum(["champion", "economic buyer", "blocker", "user", "technical evaluator"]),
  /** The one line the personas table shows. Not a summary, a fear. */
  afraidOf: z.string(),
  titleVariants: z.array(z.string()).max(8).default([]),
  reportsTo: z.string().default(""),
  /** What they are measured on at review time. This explains every decision
   *  they make and almost nobody writes it down. */
  measuredOn: z.string().default(""),
  wants: z.string().default(""),
  /** What they can actually do, not what the title implies. */
  budgetAuthority: z.string().default(""),
  objectionTheyRaise: z.string().default(""),
  respondsTo: z.string().default(""),
  /** The thing that loses them. Usually a word rather than an argument. */
  losesThem: z.string().default(""),
  /** Only where the answers actually named. Never inferred: a gathering place
   *  we guessed at sends someone to a room their buyer is not in. */
  gathersAt: z.array(z.string()).max(6).default([]),
});

export const PeopleOutput = z.object({
  /** Named explicitly, because the most valuable finding is usually that two
   *  populations have been averaged into one persona. */
  populations: z.array(z.object({
    name: z.string(),
    howTheyDiffer: z.string(),
  })).max(3).default([]),
  personas: z.array(Persona).max(4).default([]),
  /** Per persona, what to open with. The mock shows these as labelled rows. */
  angles: z.array(z.object({
    forPersona: z.string(),
    leadWith: z.string(),
  })).max(4).default([]),
  neverLeadWith: z.string().default(""),
  expectedObjection: z.string().default(""),
});
export type PeopleOutput = z.infer<typeof PeopleOutput>;

const PEOPLE_SYSTEM = [
  "You profile the PEOPLE in a market that has already been defined.",
  "",
  "POPULATIONS FIRST, and this is the section that matters most. Ask whether the",
  "people described actually behave the same way. Different frequency of need,",
  "different budget owner, different urgency. An episodic buyer and a continuous",
  "one are DIFFERENT BUSINESSES even when they share a job title, and averaging",
  "them produces a profile that fits nobody. If they genuinely are one population,",
  "return one and say so. Do not manufacture a split to look clever.",
  "",
  "PERSONAS. Real working roles, at most four. Every persona needs:",
  "roleInDeal, because a champion and a signer are approached differently.",
  "afraidOf, which is the professional consequence they are avoiding. Fear of",
  "looking incompetent after championing a failed tool moves more deals than any",
  "promised gain, and this is the line the personas table shows.",
  "measuredOn, what they are judged on at review time.",
  "budgetAuthority, what they can actually do rather than what the title implies.",
  "losesThem, the specific word or move that ends it. Often a single word.",
  "gathersAt, ONLY places the answers actually named. Never invent one: sending",
  "someone to a community their buyer is not in wastes a week.",
  "",
  "ANGLES. What to lead with, per persona, in one line. Reference the trigger or",
  "the fear, never the product.",
  "",
  "NEVERLEADWITH. The thing that reads badly to the exact person they need as a",
  "champion. Name it and say nothing else.",
  "",
  HOUSE,
].join("\n");

export interface PeopleInput extends ProfileInput { market: MarketOutput }

export const peopleTask: Task<PeopleInput, PeopleOutput> = {
  id: "bp-people",
  tier: "reason",
  maxTokens: 3200,
  schema: PeopleOutput,
  cacheable: () => PEOPLE_SYSTEM,
  system: (i) => PEOPLE_SYSTEM + (i.locale === "fr"
    ? "\n\nWrite every string VALUE in French, EXCEPT job titles, which stay in the language the market actually uses. Keys and enum values stay English."
    : ""),
  user: (i) => [answersBlock(i), "", "THE MARKET AS DEFINED:", JSON.stringify(i.market), "", "Profile the people. Do not restate the market."].join("\n"),
  fixture: (): PeopleOutput => ({ populations: [], personas: [], angles: [], neverLeadWith: "", expectedObjection: "" }),
};

/* ------------------------------------------------------------------ */
/* Pass three: where to find them                                      */
/* ------------------------------------------------------------------ */

export const FindOutput = z.object({
  /** Pasteable without editing. lib/search-criteria.ts maps this one object
   *  into six platform vocabularies deterministically, so this is generated
   *  once rather than six times. */
  filters: z.object({
    titles: z.array(z.string()).max(10).default([]),
    excludeTitles: z.array(z.string()).max(6).default([]),
    headcount: z.string().default(""),
    industries: z.array(z.string()).max(8).default([]),
    excludeIndustries: z.array(z.string()).max(6).default([]),
    geographies: z.array(z.string()).max(10).default([]),
    technologies: z.array(z.string()).max(8).default([]),
    keywords: z.array(z.string()).max(8).default([]),
    hiringSignals: z.array(z.string()).max(5).default([]),
    fundingStages: z.array(z.string()).max(6).default([]),
  }),
  /** One row per market they sell into. Calendar and law, never advice about
   *  send times: nobody can know the best hour from a form. */
  calendars: z.array(z.object({
    market: z.string(),
    workingWeek: z.string(),
    quietPeriods: z.string(),
    budgetCycle: z.string(),
  })).max(8).default([]),
  /** Signals visible from outside, with where to look. */
  signals: z.array(z.object({
    signal: z.string(),
    whereVisible: z.string(),
    meaning: z.string(),
  })).max(6).default([]),
});
export type FindOutput = z.infer<typeof FindOutput>;

const FIND_SYSTEM = [
  "You turn a defined market and its personas into search criteria and calendars.",
  "",
  "FILTERS. Pasteable into a prospecting tool WITHOUT EDITING. Real title strings",
  "including the variants that exist in the wild. Exclusions matter as much as",
  "inclusions: name the titles that collide with these on a keyword match.",
  "headcount as a plain range like '51 to 500'. If the analyses do not support a",
  "real filter, LEAVE THE FIELD EMPTY rather than filling it with something",
  "plausible: a wrong filter wastes a customer's credits and their money.",
  "",
  "CALENDARS. One row per market named in the answers. Working week, quiet periods",
  "including public holidays and vacation months, and the budget cycle. This is",
  "calendar and law.",
  "",
  "YOU MUST NOT SUGGEST A BEST HOUR OR WEEKDAY TO SEND. Nobody can know that from",
  "a form, and the numbers other tools print for it are folklore. Say nothing.",
  "",
  "SIGNALS. Observable from outside, with where you would actually look: a job",
  "board, a filing, a website change, a LinkedIn field. A signal nobody can check",
  "is decoration.",
  "",
  HOUSE,
].join("\n");

export interface FindInput extends ProfileInput { market: MarketOutput; people: PeopleOutput }

export const findTask: Task<FindInput, FindOutput> = {
  id: "bp-find",
  tier: "reason",
  maxTokens: 2600,
  schema: FindOutput,
  cacheable: () => FIND_SYSTEM,
  system: (i) => FIND_SYSTEM + (i.locale === "fr"
    ? "\n\nWrite prose string VALUES in French. Job titles, filter values and search terms stay in the language the market uses. Keys stay English."
    : ""),
  user: (i) => [answersBlock(i), "", "MARKET:", JSON.stringify(i.market), "", "PEOPLE:", JSON.stringify(i.people), "", "Now say where to find them."].join("\n"),
  fixture: (): FindOutput => ({
    filters: { titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [], geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [] },
    calendars: [], signals: [],
  }),
};

/* ------------------------------------------------------------------ */

export const BP_PASSES = ["market", "people", "find"] as const;
export type BpPass = (typeof BP_PASSES)[number];

/** Stored on icp_profiles.output. Every pass optional: a profile with two of
 *  three is a real state, not a broken one. */
export const BuyerProfileOutput = z.object({
  version: z.literal(3).default(3),
  market: MarketOutput.nullable().default(null),
  people: PeopleOutput.nullable().default(null),
  find: FindOutput.nullable().default(null),
  done: z.array(z.enum(BP_PASSES)).default([]),
});
export type BuyerProfileOutput = z.infer<typeof BuyerProfileOutput>;

export function emptyBuyerProfile(): BuyerProfileOutput {
  return { version: 3, market: null, people: null, find: null, done: [] };
}
