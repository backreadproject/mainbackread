import { z } from "zod";
import type { Task } from "../types";

export type IcpBranch = "operating" | "startup";

export interface IcpAnswer { q: string; a: string }

export interface IcpInput {
  branch: IcpBranch;
  /** What they sell, in their own words. Question one. */
  sells: string;
  /** Paying customers they claim. Null on the startup branch. */
  customerCount: number | null;
  answers: IcpAnswer[];
  locale: "en" | "fr";
}

export const IcpOutput = z.object({
  /** Says out loud which of the two things this is. The UI leads with it. */
  kind: z.enum(["definition", "hypothesis"]),
  headline: z.string(),
  definition: z.array(z.object({ label: z.string(), value: z.string() })).max(6),
  /** The field almost every buyer profile omits, and the one that makes outreach land. */
  triggers: z.array(z.object({ event: z.string(), why: z.string() })).max(6),
  committee: z.array(z.object({
    role: z.string(),
    stance: z.enum(["signs", "champions", "blocks"]),
    cares: z.string(),
  })).max(5),
  find: z.object({
    titles: z.array(z.string()).max(8),
    seniority: z.string(),
    headcount: z.string(),
    techSignals: z.array(z.string()).max(6),
    communities: z.array(z.string()).max(6),
    searchStrings: z.array(z.string()).max(3),
  }),
  disqualifiers: z.array(z.object({ who: z.string(), why: z.string() })).max(5),
  angles: z.array(z.object({ persona: z.string(), lead: z.string() })).max(4),
  /** Startup branch only. Empty on the operating branch. */
  test: z.array(z.object({ step: z.string(), detail: z.string() })).max(5),
  limits: z.string(),
});
export type IcpOutput = z.infer<typeof IcpOutput>;

/**
 * The rubric is the cacheable half.
 *
 * Unlike the report task there is no document here, so the repeating expensive
 * text is the instruction set itself. It is identical for every customer on a
 * given branch, which makes it the right thing to cache.
 */
function rubric(branch: IcpBranch): string {
  const shared = [
    "You turn a founder's answers about their own customers into a structured buyer profile.",
    "",
    "RULES THAT DECIDE WHETHER THIS IS WORTH READING:",
    "1. Use their nouns. If they said 'brand repositioning' do not write 'marketing services'. Generic language is the failure mode; a profile written in category words gets filed and never used.",
    "2. Never invent a number, a name, a tool or a community they did not give you. If you do not know their headcount band, infer it only from something they said and say what you inferred it from.",
    "3. Trigger events come from the specific moment they described, not from a list of things that commonly trigger purchases. A trigger is something an outsider could actually observe happening at a company.",
    "4. Disqualifiers must describe companies that LOOK right and are not. 'Companies with no budget' is useless. Draw them from the bad fits they named.",
    "5. The limits field names the weakness of THIS input: how many customers it rests on, whether they arrived through one channel, which questions were answered thinly. A generic caveat is worse than none because it gets skipped.",
    "6. Write plainly. No marketing register, no adjectives doing work that a fact should do.",
    "",
    "JSON ONLY. No prose, no code fences. Escape every apostrophe and quotation mark inside string values correctly, including inside anything you quote back from their answers.",
  ];

  const operating = [
    "",
    "THIS IS THE OPERATING BRANCH. They have paying customers, so the output is a DEFINITION.",
    "Set kind to 'definition'. Leave test as an empty array.",
    "definition: who they are, and separately what has to be TRUE RIGHT NOW for them to buy. The second half is the half that matters.",
    "find.searchStrings: one to three strings specific enough to paste into a search or a prospecting tool without editing. Use real title strings and real filter names.",
    "committee: who signs, who champions, who blocks. Stance must be accurate, and 'blocks' is not an insult, it is the person whose objection stalls the deal.",
  ];

  const startup = [
    "",
    "THIS IS THE STARTUP BRANCH. Nobody has paid them yet, so the output is a HYPOTHESIS and must say so.",
    "Set kind to 'hypothesis'. The headline states plainly that this is unverified.",
    "Return committee as an empty array, angles as an empty array, and find.searchStrings as an empty array. Inventing a buying committee or a search string from a handful of conversations is false precision, and it is the exact thing this product exists to refuse. Fill find.titles and find.communities ONLY where they named specific ones.",
    "test: how to falsify this in two weeks. Who to talk to, what to ask, and one step that states what result would prove the hypothesis wrong.",
    "Give weight to who did NOT respond. People who failed to care are more informative than people who agreed politely.",
  ];

  return shared.concat(branch === "operating" ? operating : startup).join("\n");
}

export const icpTask: Task<IcpInput, IcpOutput> = {
  id: "icp",
  tier: "reason",
  maxTokens: 4000,
  schema: IcpOutput,
  cacheable: (i) => rubric(i.branch),
  system: (i) =>
    rubric(i.branch) +
    (i.locale === "fr" ? "\n\nWrite every string value in French." : ""),
  user: (i) => {
    const lines = [
      "WHAT THEY SELL: " + i.sells,
      i.customerCount == null
        ? "PAYING CUSTOMERS: none yet"
        : "PAYING CUSTOMERS: " + String(i.customerCount),
      "",
      "THEIR ANSWERS:",
    ];
    i.answers.forEach((a, n) => {
      lines.push("");
      lines.push("Q" + String(n + 1) + ". " + a.q);
      lines.push("A. " + (a.a.trim() || "(left blank)"));
    });
    lines.push("");
    lines.push("Any answer left blank is a gap. Do not fill it with something plausible, and say so in limits.");
    return lines.join("\n");
  },
  fixture: (i): IcpOutput => ({
    kind: i.branch === "operating" ? "definition" : "hypothesis",
    headline:
      i.branch === "operating"
        ? "Mid-market teams six months past a funding round, with a leader new enough to want a change."
        : "A hypothesis, not a definition. Nobody has paid you yet.",
    definition: [
      { label: "Who they are", value: "Sample scope, generated in mock mode." },
      { label: "What has to be true now", value: "A recent change that makes this urgent rather than interesting." },
    ],
    triggers: [{ event: "A new leader in post under 120 days", why: "They arrive with a mandate and no incumbent supplier." }],
    committee: i.branch === "operating"
      ? [{ role: "Head of function", stance: "champions" as const, cares: "Being judged on something they inherited." }]
      : [],
    find: {
      titles: ["Head of Function"],
      seniority: "Director and above",
      headcount: "40 to 150",
      techSignals: [],
      communities: [],
      searchStrings: i.branch === "operating" ? ['title=["Head of Function"] AND employees=40..150'] : [],
    },
    disqualifiers: [{ who: "Companies that look right but buy on price", why: "They run the process in house." }],
    angles: i.branch === "operating" ? [{ persona: "New leader", lead: "The thing you inherited." }] : [],
    test: i.branch === "startup"
      ? [{ step: "Talk to five more who match and three who do not", detail: "The three are the control." }]
      : [],
    limits: "Mock mode. This output was not generated from your answers.",
  }),
};