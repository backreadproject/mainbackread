import { z } from "zod";
import type { Task } from "../types";
import { Claim, PROVENANCE, HOUSE_STYLE } from "./icp-claim";
import { answersBlock, type IcpInput, type IcpRecord } from "./icp";

export interface IcpPeopleInput extends IcpInput { record: IcpRecord }

const Persona = z.object({
  name: z.string(),
  titles: z.array(z.string()).max(6).default([]),
  role: z.enum(["economic", "champion", "user", "technical", "blocker"]),
  reportsTo: z.string().default(""),
  owns: z.string().default(""),
  /** What they are measured on. Everything a persona does is downstream of this,
   *  and it is the single most useful line in a persona. */
  judgedOn: z.array(z.string()).max(4).default([]),
  background: z.string().default(""),
  /** Tenure changes buying behaviour more than seniority does: a new arrival
   *  has a mandate and no incumbent supplier. */
  tenure: z.string().default(""),
  authority: z.enum(["signs", "recommends", "vetoes", "influences", "none"]),
  source: z.enum(["stated", "inferred", "market"]),
  basis: z.string().default(""),
});

export const IcpPeople = z.object({
  /** Named explicitly, because the most valuable finding is usually that two
   *  populations have been averaged into one persona. */
  segments: z.array(z.object({
    name: z.string(),
    who: z.string(),
    howTheyDiffer: z.string(),
    frequency: z.enum(["one-off", "episodic", "continuous"]),
    priority: z.enum(["primary", "secondary", "deprioritise"]),
    why: z.string(),
    basis: z.string().default(""),
  })).max(3).default([]),

  personas: z.array(Persona).max(5).default([]),

  committee: z.array(z.object({
    role: z.string(),
    influence: z.enum(["decisive", "high", "medium", "low"]),
    interest: z.enum(["high", "medium", "low"]),
    wants: z.string(),
    fears: z.string(),
    winThemWith: z.string(),
    source: z.enum(["stated", "inferred", "market"]),
    basis: z.string().default(""),
  })).max(6).default([]),

  /** Career motive, not corporate motive. People buy for both and only admit one. */
  motivations: z.array(Claim).max(5).default([]),
  /** The professional consequence they are avoiding. Usually stronger than any gain. */
  fears: z.array(Claim).max(5).default([]),
  /** What they think is true about their industry, including where they are wrong.
   *  A message that contradicts a held belief has to earn it. */
  beliefs: z.array(Claim).max(4).default([]),
  /** How they decide: evidence they trust, pace, tolerance for risk. */
  temperament: z.array(Claim).max(4).default([]),

  /** Who looks right and is not, at the person level rather than the company level. */
  antiPersonas: z.array(z.object({
    who: z.string(),
    looksRight: z.string(),
    whyNot: z.string(),
  })).max(4).default([]),
});
export type IcpPeople = z.infer<typeof IcpPeople>;

const SYSTEM = [
  "You profile the PEOPLE who buy. You are given a founder's answers and a record built",
  "from them. Go beyond both: describe the humans, their incentives and their internal",
  "politics, using what you know about people in these roles.",
  "",
  PROVENANCE,
  "",
  "Much of this will be source:\"market\". Roles carry predictable incentives, and a",
  "founder can rarely articulate the internal politics of their own buyer.",
  "",
  "SEGMENTS FIRST, AND THIS IS THE SECTION THAT MATTERS MOST.",
  "Ask whether the people described actually behave the same way. Different frequency of",
  "need, different budget owner, different urgency, different channel, different renewal",
  "behaviour. An episodic buyer and a continuous one are DIFFERENT BUSINESSES even when",
  "they share a job title, and averaging them produces a persona that fits nobody.",
  "If they genuinely are one population, return one segment and say so. Do not manufacture",
  "a split to look clever. But if two are hiding in there, naming it is the single most",
  "useful thing on this page. `priority` is your recommendation and `why` must justify it.",
  "",
  "PERSONAS. Real working roles, not archetypes.",
  "`judgedOn` is the most important field: what this person is measured on at review time",
  "explains every decision they make, and almost nobody writes it down.",
  "`tenure` matters more than seniority for buying behaviour: someone six weeks into a role",
  "has a mandate, a budget and no incumbent supplier; someone four years in has all three",
  "problems reversed.",
  "`authority` is what they can actually do, not their title's implication.",
  "",
  "COMMITTEE. Who else is in the room, including people the founder never mentioned.",
  "Finance, procurement, IT security, legal and the person whose workflow changes all",
  "appear late and stall deals. `fears` is what makes them say no; `winThemWith` is the",
  "specific thing that removes the objection, not a value proposition.",
  "",
  "MOTIVATIONS. Separate the corporate reason from the CAREER reason. People buy for both",
  "and only state the first. Being seen to have solved something, avoiding a conversation",
  "with a boss, and having a number to show at review are real motivations and are usually",
  "stronger than efficiency.",
  "",
  "FEARS. The professional consequence they are avoiding. Fear of looking incompetent",
  "after championing a failed tool moves more deals than any promised gain.",
  "",
  "BELIEFS. What they hold true about their industry, including where it is outdated. A",
  "message that contradicts a held belief must earn it; a message that rides one is easy.",
  "",
  "TEMPERAMENT. How they decide. What evidence they trust, how fast they move, whether",
  "they buy on peer recommendation or on proof, how much risk they will carry personally.",
  "",
  "ANTI-PERSONAS. People who look like the buyer and will not buy. Name the specific tell",
  "that separates them from the real buyer.",
  "",
  HOUSE_STYLE,
].join("\n");

export const icpPeopleTask: Task<IcpPeopleInput, IcpPeople> = {
  id: "icp-people",
  tier: "reason",
  maxTokens: 4000,
  schema: IcpPeople,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr" ? "\n\nWrite every string VALUE in French, EXCEPT job titles, which stay in the language the market actually uses. Keys and enum values stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "THE RECORD BUILT FROM THESE ANSWERS:",
    JSON.stringify(i.record),
    "",
    "Profile the people. Do not restate the above.",
  ].join("\n"),
  fixture: (): IcpPeople => ({
    segments: [], personas: [], committee: [], motivations: [], fears: [],
    beliefs: [], temperament: [], antiPersonas: [],
  }),
};