import { z } from "zod";
import type { Task } from "../types";
import { PROVENANCE, HOUSE_STYLE, Severity, Cadence } from "./icp-claim";
import { answersBlock, type IcpInput, type IcpRecord } from "./icp";

export interface IcpDemandInput extends IcpInput { record: IcpRecord }

const Prov = {
  source: z.enum(["stated", "inferred", "market"]),
  basis: z.string().default(""),
};

export const IcpDemand = z.object({
  /** Ranked by what it costs them, not by how often it is mentioned. */
  pains: z.array(z.object({
    pain: z.string(),
    severity: Severity,
    cadence: Cadence,
    /** Who personally absorbs it. A pain nobody owns never gets funded. */
    feltBy: z.string(),
    /** What it costs in hours, money, deals or risk. Vague cost, no budget. */
    cost: z.string().default(""),
    ...Prov,
  })).max(7).default([]),

  /** The state they want, in their language, not the feature that produces it. */
  outcomes: z.array(z.object({
    theyAsk: z.string(),
    theyActuallyWant: z.string(),
    measuredBy: z.string().default(""),
    ...Prov,
  })).max(5).default([]),

  /** Observable events that start the search. */
  triggers: z.array(z.object({
    event: z.string(),
    window: z.enum(["immediate", "weeks", "months"]),
    whereVisible: z.string().default(""),
    whyItStarts: z.string(),
    ...Prov,
  })).max(7).default([]),

  objections: z.array(z.object({
    objection: z.string(),
    realConcern: z.string(),
    raisedBy: z.string(),
    stage: z.string().default(""),
    answer: z.string(),
    ...Prov,
  })).max(7).default([]),

  criteria: z.array(z.object({
    criterion: z.string(),
    weight: z.enum(["decisive", "important", "tiebreaker", "claimed but not real"]),
    why: z.string().default(""),
    ...Prov,
  })).max(8).default([]),

  journey: z.array(z.object({
    stage: z.string(),
    whatHappens: z.string(),
    whoDrives: z.string().default(""),
    typicalDuration: z.string().default(""),
    /** Where deals actually die at this stage. The most useful field here. */
    stallsWhen: z.string().default(""),
    ...Prov,
  })).max(8).default([]),

  /** The reason a deal that should close does not. Usually not price. */
  killers: z.array(z.object({
    killer: z.string(),
    stage: z.string().default(""),
    earlyWarning: z.string().default(""),
    prevention: z.string(),
  })).max(5).default([]),
});
export type IcpDemand = z.infer<typeof IcpDemand>;

const SYSTEM = [
  "You map DEMAND: what hurts, what they want instead, what starts a search, and where",
  "purchases die. You have a founder's answers and a record built from them. Go beyond",
  "both using what you know about how this kind of buyer actually buys.",
  "",
  PROVENANCE,
  "",
  "PAINS. Rank by what the pain COSTS, not by how often people complain about it. The",
  "loudest complaint is rarely the funded one. `feltBy` names the person who personally",
  "absorbs it, because a pain that belongs to nobody in particular never gets a budget.",
  "`cost` must be concrete: hours per week, deals lost, a number someone would have to",
  "defend. 'Inefficiency' is not a cost.",
  "",
  "OUTCOMES. `theyAsk` is the words they use when they enquire. `theyActuallyWant` is the",
  "state they are trying to reach, which is usually about a decision, a conversation, or",
  "how they are perceived, not about the feature. Someone asking for read tracking wants",
  "to stop waiting; someone asking for reporting wants to walk into a meeting unafraid.",
  "`measuredBy` is how they would know it worked.",
  "",
  "TRIGGERS. An event an OUTSIDER COULD OBSERVE. A hire, a raise, a launch, a departure,",
  "a renewal date, a regulatory deadline, a bad quarter. 'They realise they need a better",
  "process' is the problem restated with a date attached and is NOT a trigger. `window`",
  "is how long the opening stays open, which decides whether outreach must be immediate.",
  "If their answers contain no observable trigger, supply market ones and label them so.",
  "",
  "OBJECTIONS. `objection` is what gets said. `realConcern` is what is meant, and they are",
  "rarely the same: 'too expensive' usually means 'I cannot defend this internally' or 'I",
  "do not believe it will work'. `answer` is the specific move that removes it, not a",
  "value proposition.",
  "",
  "CRITERIA. What actually decides it. Include the criteria people CLAIM matter and do not",
  "( 'best in class support' ) and mark them 'claimed but not real'. That distinction is",
  "worth more than the ranked list.",
  "",
  "JOURNEY. The real path, not a funnel diagram. `stallsWhen` is the most useful field on",
  "this page: name where deals actually go quiet at each stage, because that is where the",
  "seller can intervene.",
  "",
  "KILLERS. The reason a deal that should have closed did not. Usually not price:",
  "a champion leaving, a competing priority, a security review nobody planned for, a",
  "procurement process discovered too late. `earlyWarning` is the observable sign it is",
  "happening while there is still time.",
  "",
  HOUSE_STYLE,
].join("\n");

export const icpDemandTask: Task<IcpDemandInput, IcpDemand> = {
  id: "icp-demand",
  tier: "reason",
  maxTokens: 4500,
  schema: IcpDemand,
  cacheable: () => SYSTEM,
  system: (i) => SYSTEM + (i.locale === "fr" ? "\n\nWrite every string VALUE in French. Keys and enum values stay English." : ""),
  user: (i) => [
    answersBlock(i),
    "",
    "THE RECORD BUILT FROM THESE ANSWERS:",
    JSON.stringify(i.record),
    "",
    "Map the demand. Do not restate the above.",
  ].join("\n"),
  fixture: (): IcpDemand => ({
    pains: [], outcomes: [], triggers: [], objections: [], criteria: [], journey: [], killers: [],
  }),
};