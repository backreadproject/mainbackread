// The questionnaire. Deliberately NOT in lib/i18n.ts: fifteen questions with
// helper text would bloat a file that already carries three duplicate `nav`
// objects and has cost hours in mis-anchored patches. French lives alongside
// this in icp-questions.fr.ts.
import type { Locale } from "@/lib/i18n";
import { OPERATING_FR, STARTUP_FR } from "./icp-questions.fr";

export type IcpBranchId = "operating" | "startup";

export interface IcpQuestion {
  /** Stable. Answers are keyed on this, so questions can be reordered safely. */
  id: string;
  /** Rail label. Two or three words. */
  label: string;
  q: string;
  /** What a good answer looks like. Shown under the question, always visible. */
  why: string;
  /** Marked in the interface. These three decide whether the output predicts
   *  anything, and the failure mode is a one-line answer. */
  weight?: boolean;
}

/** Question one on both branches feeds the `sells` field on the route. */
export const SELLS_ID = "sells";

export const OPERATING: IcpQuestion[] = [
  { id: "sells", label: "What you sell", q: "What do you sell, in one sentence?",
    why: "Plain words, the way you would say it across a table. Category language here makes every line of the result generic." },
  { id: "best", label: "Your best customer", weight: true, q: "Name your single best customer. Not a type, a real one.",
    why: "The one you would clone. Who they are, what they do, roughly how big." },
  { id: "moment", label: "What changed", weight: true, q: "What was happening at their company when they bought? What changed?",
    why: "The moment, not the reason. A hire, a raise, a competitor win, a project that failed, a renewal date. This is the answer that turns a description of a buyer into something you can go and search for." },
  { id: "room", label: "Who signed it off", q: "Who signed it off, and who else was in the room?",
    why: "Titles are enough. Include anyone who could have stopped it, even if they did not." },
  { id: "before", label: "What they did before", q: "What were they doing before you? What did they replace or stop doing?",
    why: "If the honest answer is nothing, say nothing. Displacing a habit is a different sale from displacing a supplier." },
  { id: "badfit", label: "Two bad fits", weight: true, q: "Name two customers who were a bad fit. What did they have in common?",
    why: "The most useful question here. Churned, haggled, never onboarded, or simply exhausting. Whatever they shared becomes your disqualifier list, and disqualifiers save more time than targeting does." },
  { id: "deal", label: "Deal size and length", q: "Typical deal size, and how long it takes to close.",
    why: "A range is fine. Say whether it is a retainer, a project, or a subscription." },
  { id: "gather", label: "Where they gather", q: "Where do these people already gather?",
    why: "Communities, events, publications, newsletters, group chats. Name the actual ones, not the categories." },
];

export const STARTUP: IcpQuestion[] = [
  { id: "sells", label: "What you sell", q: "What do you sell, and what does it remove?",
    why: "What goes away when someone buys it. Time, cost, risk, or a task nobody wants to own." },
  { id: "person", label: "One real person", weight: true, q: "Describe one person you have actually spoken to who has this problem badly.",
    why: "Not a persona. Someone you talked to. Their role, their company, and what they actually said." },
  { id: "today", label: "What they do today", q: "What are they doing about it today?",
    why: "Even if the answer is a spreadsheet and swearing. The status quo is the competitor you are really up against." },
  { id: "litup", label: "Who lit up, who did not", weight: true, q: "Who lit up when you described it, and who did not?",
    why: "The ones who did not care matter more. Polite agreement tells you nothing. Indifference tells you where the edge of your market is, and it is the only evidence of that you have before anyone pays." },
  { id: "urgent", label: "What makes it urgent", q: "What has to be true about a company for this to be urgent rather than interesting?",
    why: "Interesting does not get budget. Name the condition that makes it this quarter's problem." },
  { id: "found", label: "Where you found them", q: "Where did you find the people you have already spoken to?",
    why: "Be specific, and say if they all came from one place. Six conversations from one channel is one channel, not a market." },
  { id: "buy", label: "What would make them buy", q: "What would have to happen for someone to buy this quarter?",
    why: "The concrete trigger, not the value proposition." },
];

export function questionsFor(branch: IcpBranchId, locale: Locale = "en"): IcpQuestion[] {
  if (locale === "fr") return branch === "operating" ? OPERATING_FR : STARTUP_FR;
  return branch === "operating" ? OPERATING : STARTUP;
}