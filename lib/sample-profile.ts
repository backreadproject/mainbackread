import type { Profile } from "@/lib/buyer-profile";
import type { ObservedView, ObservedSummary } from "@/lib/observed";
import type { GapOutput } from "@/lib/ai/tasks/gap";

/**
 * The sample buyer profile.
 *
 * Every account has one, and it exists ONLY here. No rows are inserted for
 * anybody, which is what makes the whole idea workable:
 *
 *   it cannot eat a plan slot, because there is nothing to count
 *   it cannot pollute Documents, Recipients, Activity or Overview
 *   it cannot be edited or deleted, because there is nothing to write to
 *   it costs no model call and no storage
 *   there is nothing to erase when somebody asks to be forgotten
 *   and a brand new account with no data still sees the feature working
 *
 * The story is the one the approved screens were drawn around, so the sample
 * and the design are the same worked example rather than two different ones.
 *
 * Dates are computed from `now` at read time. A sample whose newest reader
 * arrived in July would look abandoned by September.
 */

/** Deliberately not a UUID. Every page checks for it BEFORE querying, because
 *  comparing this against a uuid column raises a Postgres error rather than
 *  returning nothing. */
export const SAMPLE_ID = "sample";

export function isSampleId(id: string): boolean {
  return id === SAMPLE_ID;
}

export const SAMPLE_NAME = "Sample Buyer Profile";
export const SAMPLE_THRESHOLD = 20;

const DAY = 24 * 3600 * 1000;
const iso = (now: Date, daysAgo: number, hours = 0) =>
  new Date(now.getTime() - daysAgo * DAY - hours * 3600 * 1000).toISOString();

/* ------------------------------------------------------------------ */
/* What the sender said                                                */
/* ------------------------------------------------------------------ */

export const SAMPLE_PROFILE: Profile = {
  version: 3,
  done: ["market", "people", "find"],
  market: {
    headline:
      "Onboarding automation for B2B SaaS companies that have just made time to value somebody's explicit job.",
    definition:
      "B2B SaaS companies between 50 and 500 people that have recently made onboarding somebody's explicit job. Post Series A, selling annual contracts of their own, with a customer success function that exists on the org chart rather than being absorbed into support.\n\nThe size band is a proxy. What actually has to be true is that one named person is accountable for time to value. Below roughly 50 people that person does not exist, which is why both of the churned accounts failed.",
    reallyTrue:
      "One named person is accountable for time to value, and their review depends on it moving. Headcount is how you find that person from outside, not the reason they buy.",
    triggers: [
      {
        event: "A first VP or Head of Customer Success appointed in the last 90 days",
        why: "The strongest signal available, and publicly visible. They arrive holding a number somebody else already failed to move.",
        detectable: true,
      },
      {
        event: "Time to value named in an investor update or a public post",
        why: "Rare to see and decisive when you do. Somebody senior has said the quiet part out loud.",
        detectable: true,
      },
      {
        event: "Series A or B closed two to four months ago",
        why: "Headcount arrives before process does. The gap opens after the round, not on the day of it.",
        detectable: true,
      },
      {
        event: "Moving to or from Zendesk, Intercom or Pylon",
        why: "Onboarding gets re-examined while the stack is already open.",
        detectable: true,
      },
      {
        event: "A retention number disclosed that moved the wrong way",
        why: "Public, embarrassing, and followed by a search for something to change.",
        detectable: true,
      },
    ],
    disqualifiers: [
      { who: "Under 30 people", why: "Nobody owns onboarding, so nobody owns the outcome after you leave." },
      { who: "Self serve only, no contracts", why: "There is no onboarding moment to automate." },
      { who: "Agencies and consultancies", why: "They onboard clients, not users. The word matches, the problem does not." },
      { who: "Already running a customer success platform", why: "Not a hard no, but you become a rip and replace, which is a longer sale." },
    ],
    limits: [
      "This is built from eleven customers, two of which churned. It predicts who is worth approaching, not who will buy.",
      "Nothing here knows what your competitors are doing or what a prospect was told last week.",
      "The trigger events are the ones visible from outside. The decisive one is often a conversation you will never see.",
    ],
  },
  people: {
    populations: [
      {
        name: "Companies with a first CS hire",
        howTheyDiffer:
          "One person, newly arrived, with a mandate and no team. They move fast and they buy on evidence they can show a board.",
      },
      {
        name: "Companies with an established CS team",
        howTheyDiffer:
          "A manager with existing process to defend. Slower, more people in the room, and the objection is adoption rather than budget.",
      },
    ],
    personas: [
      {
        name: "VP Customer Success",
        roleInDeal: "champion",
        afraidOf: "Being the person hired to fix onboarding who did not fix onboarding",
        titleVariants: [
          "VP Customer Success",
          "Head of Customer Success",
          "Director of Customer Experience",
          "VP Customer Operations",
          "Head of Onboarding",
        ],
        reportsTo: "The CRO in about half of these companies and the CEO in the rest. The CEO reporting line closes faster.",
        measuredOn: "Net revenue retention, time to first value, and logo churn in the first two quarters",
        wants: "A visible win inside their first two quarters that they can show the board",
        budgetAuthority: "Usually none alone at this deal size. They convene the room; the CFO signs.",
        objectionTheyRaise: "My team will not adopt another tool",
        respondsTo: "A number they already know is bad, said back to them plainly",
        losesThem: "The word automation, and any implication their team is the problem",
        gathersAt: ["Gain Grow Retain slack", "Pulse conference", "CS in Focus newsletter"],
      },
      {
        name: "CFO or VP Finance",
        roleInDeal: "economic buyer",
        afraidOf: "Another tool nobody adopts, on a renewal they will have to defend",
        titleVariants: ["CFO", "VP Finance", "Head of Finance", "Finance Director"],
        reportsTo: "The CEO",
        measuredOn: "Net revenue retention and the cost of the tooling line",
        wants: "A number that moves inside the contract term",
        budgetAuthority: "Signs at this deal size without a committee",
        objectionTheyRaise: "What happens to this if the person who championed it leaves",
        respondsTo: "Renewal risk in the first 90 days, which is where their churn actually starts",
        losesThem: "A pitch about features rather than about the number",
        gathersAt: [],
      },
      {
        name: "Head of Engineering",
        roleInDeal: "blocker",
        afraidOf: "Write access to the product database, and a support tool becoming an integration project",
        titleVariants: ["Head of Engineering", "VP Engineering", "CTO", "Director of Engineering"],
        reportsTo: "The CTO or the CEO",
        measuredOn: "Delivery against roadmap, and incidents",
        wants: "To not be involved",
        budgetAuthority: "None, and a veto that costs nothing to use",
        objectionTheyRaise: "What does this need access to",
        respondsTo: "A precise answer about scope of access, given before being asked",
        losesThem: "Vagueness about data, and anything that sounds like a migration",
        gathersAt: [],
      },
    ],
    angles: [
      { forPersona: "VP Customer Success", leadWith: "The inherited problem. Name the 40 day number, not the product." },
      { forPersona: "CFO or VP Finance", leadWith: "Renewal risk in the first 90 days, which is where their churn actually starts." },
      { forPersona: "Head of Engineering", leadWith: "Exactly what it reads and what it never writes to, in one sentence, unprompted." },
    ],
    neverLeadWith:
      "Automation. It reads as headcount reduction to the exact person you need as a champion.",
    expectedObjection:
      "We are building this internally. Usually true, usually stalled, and usually owned by somebody with three higher priorities.",
  },
  find: {
    filters: {
      titles: [
        "VP Customer Success",
        "Head of Customer Success",
        "Director of Customer Experience",
        "VP Customer Operations",
        "Head of Onboarding",
      ],
      excludeTitles: ["recruiter", "talent", "account executive"],
      headcount: "51-500",
      industries: ["B2B SaaS", "Enterprise software", "Software development"],
      excludeIndustries: ["staffing and recruiting", "management consulting", "advertising agency"],
      geographies: ["United States", "United Kingdom", "Nigeria"],
      technologies: ["zendesk", "intercom", "hubspot"],
      keywords: ["saas", "b2b software", "customer success"],
      hiringSignals: ["Hired a first VP or Head of Customer Success in the last 90 days"],
      fundingStages: ["series_a", "series_b"],
    },
    calendars: [
      {
        market: "United States",
        workingWeek: "Monday to Friday, UTC minus 5 to minus 8",
        quietPeriods: "Thanksgiving week, 20 December to 2 January, the week of 4 July",
        budgetCycle: "Calendar year. Budget conversations from October.",
      },
      {
        market: "United Kingdom",
        workingWeek: "Monday to Friday, UTC to UTC plus 1",
        quietPeriods: "August school holidays, the late August bank holiday, 20 December to 2 January",
        budgetCycle: "Many run to 5 April. Confirm rather than assume.",
      },
      {
        market: "Nigeria",
        workingWeek: "Monday to Friday, UTC plus 1",
        quietPeriods: "Eid and Christmas periods, late December",
        budgetCycle: "Calendar year for most. Subsidiaries follow the parent.",
      },
    ],
    signals: [
      {
        signal: "A first Head of Customer Success appointed",
        whereVisible: "LinkedIn job changes, and the company's own announcement post",
        meaning: "Somebody now owns a number that nobody owned last quarter",
      },
      {
        signal: "A Series A or B announced two to four months ago",
        whereVisible: "Crunchbase last funding date, press coverage",
        meaning: "Headcount has arrived and process has not caught up",
      },
      {
        signal: "Support roles being hired faster than engineering roles",
        whereVisible: "The company's own careers page",
        meaning: "Volume is being absorbed by people rather than by product",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* What the readers did                                                */
/* ------------------------------------------------------------------ */

export function sampleObserved(now: Date): ObservedView {
  const summary: ObservedSummary = {
    readers: 47,
    opened: 41,
    engaged: 22,
    questions: 31,
    questioners: 14,
    replies: 3,
    forwards: 9,
    forwarders: 7,
    documents: 2,
    won: 2,
    lost: 4,
    noDecision: 3,
    outcomesMarked: 9,
    firstSignalAt: iso(now, 77),
    lastSignalAt: iso(now, 0, 4),
  };

  return {
    summary,
    opens: {
      // Monday first. Midweek heavy, which is what actually happens.
      byDay: [5, 11, 13, 8, 3, 1, 0],
      firstOpens: 41,
      medianMinutes: 260,
      fastestMinutes: 3,
      within15: 9,
      measured: 38,
    },
    common: {
      engaged: 22,
      notEngaged: 19,
      askedEngaged: 14,
      askedNotEngaged: 0,
      forwardedEngaged: 7,
      forwardsTotal: 9,
      returnedEngaged: 16,
      pages: [
        {
          documentId: "sample-doc-1",
          title: "Series A onboarding deck",
          pageCount: 14,
          page: 4,
          seconds: 4820,
          readers: 18,
          standout: true,
        },
        {
          documentId: "sample-doc-2",
          title: "Implementation overview",
          pageCount: 6,
          page: 3,
          seconds: 910,
          readers: 6,
          standout: false,
        },
      ],
    },
  };
}

/** The documents this sample profile is attached to. Named only, because they
 *  do not exist either. */
export const SAMPLE_DOCUMENTS = [
  { id: "sample-doc-1", title: "Series A onboarding deck" },
  { id: "sample-doc-2", title: "Implementation overview" },
];

/** Per persona, what the readers matching it did. Precomputed rather than run
 *  through the matcher, because there are no reader rows to match. */
export function samplePersonaObserved(slug: string): ObservedSummary | null {
  const base: ObservedSummary = {
    readers: 0, opened: 0, engaged: 0, questions: 0, questioners: 0,
    replies: 0, forwards: 0, forwarders: 0, documents: 2,
    won: 0, lost: 0, noDecision: 0, outcomesMarked: 0,
    firstSignalAt: null, lastSignalAt: null,
  };
  if (slug === "vp-customer-success") {
    return { ...base, readers: 14, opened: 13, engaged: 9, questioners: 6, questions: 11, forwarders: 5, forwards: 5, won: 2, lost: 3, noDecision: 2, outcomesMarked: 7 };
  }
  if (slug === "cfo-or-vp-finance") {
    return { ...base, readers: 6, opened: 5, engaged: 4, questioners: 2, questions: 3, forwarders: 1, forwards: 1, won: 0, lost: 1, noDecision: 1, outcomesMarked: 2 };
  }
  if (slug === "head-of-engineering") {
    return base;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Where the readers and the description part company                  */
/* ------------------------------------------------------------------ */

export const SAMPLE_GAP: GapOutput = {
  headline: "The readers who engage are smaller than you said, and several are the kind you disqualified.",
  agrees: false,
  finding:
    "You described mid-market B2B SaaS between 50 and 500 people, and you named agencies as a disqualifier.\n\nOf the 22 readers who got past halfway, 13 are at companies under 40 people, and 6 of those are agencies. Both of your closed deals are in that group.\n\nThat is not a small drift at the edge of the definition. It is most of the engaged group sitting outside it.",
  claims: [
    {
      stated: "50 to 500 employees",
      observed: "Median engaged reader is at a 34 person company",
      movement: "contradicted",
    },
    {
      stated: "Agencies and consultancies are disqualified",
      observed: "6 of 22 engaged readers are at agencies",
      movement: "contradicted",
    },
    {
      stated: "The VP Customer Success champions the deal",
      observed: "14 of 22 engaged readers match that persona",
      movement: "holding",
    },
    {
      stated: "The CFO signs",
      observed: "7 of 9 forwards went to a finance address",
      movement: "holding",
    },
    {
      stated: "The Head of Engineering blocks",
      observed: "No reader matching that persona has engaged",
      movement: "never appeared",
    },
    {
      stated: "Post Series A or B",
      observed: "9 of 22 engaged readers are at bootstrapped companies",
      movement: "weaker",
    },
    {
      stated: "A first senior CS hire is the trigger",
      observed: "Nothing in the reader data speaks to when they hired",
      movement: "no evidence",
    },
  ],
  doesNotTell:
    "It does not tell you that the small agencies are better customers. Both of your churned accounts were also small, and nine marked outcomes is not enough to separate engagement from retention.\n\nWhat it does tell you is that your prospecting and your document are pulling in different directions. One of them is wrong, and this page cannot say which.",
};

export function sampleGapRun(now: Date) {
  return {
    id: "sample-gap-1",
    engaged: 22,
    readers: 47,
    identified: 31,
    output: SAMPLE_GAP,
    created_at: iso(now, 0, 4),
  };
}

export function samplePreviousGapRun(now: Date) {
  return {
    id: "sample-gap-0",
    engaged: 17,
    readers: 39,
    identified: 24,
    output: { ...SAMPLE_GAP, headline: "Early sign that engaged readers are smaller than described." },
    created_at: iso(now, 7),
  };
}

/* ------------------------------------------------------------------ */
/* The revisions                                                       */
/* ------------------------------------------------------------------ */

const ANSWERS = [
  { q: "What you sell", a: "Onboarding automation that gets a new B2B SaaS customer to first value in days instead of weeks." },
  { q: "Your single best customer", a: "Halcyon Retail Cloud" },
  { q: "What had just changed there when they bought?", a: "They hired a first VP of Customer Success in January and she inherited a 40 day onboarding the board had flagged twice." },
  { q: "Who signed it off, and who else was in the room?", a: "VP Customer Success championed it. The CFO signed. Their head of engineering had a veto on anything touching the product database." },
  { q: "What were they doing before you?", a: "A Notion checklist, three Zapier automations and a shared inbox. They did not replace a competitor, they replaced manual work." },
  { q: "Name two customers who were a bad fit", a: "Trellis Group and Bowen Health. Both under 30 people, both bought on a demo and churned in four months. Neither had anyone whose job was onboarding, so nobody owned it after we left." },
  { q: "Where do these people already gather?", a: "Gain Grow Retain slack, the CS in Focus newsletter, Pulse conference." },
];

export function sampleRevisions(now: Date) {
  return [
    {
      id: "sample-rev-3",
      revision: 3,
      source: "asserted" as const,
      refinedFrom: null,
      branch: "operating" as const,
      status: "complete" as const,
      isBaseline: true,
      createdAt: iso(now, 7),
      completedAt: iso(now, 7),
      headline: SAMPLE_PROFILE.market?.headline ?? "",
      answered: 7,
      questions: 15,
      diff: {
        changed: ["Name two customers who were a bad fit"],
        added: ["Where do these people already gather?"],
        removed: [],
        differentQuestions: false,
      },
      answers: ANSWERS,
    },
    {
      id: "sample-rev-2",
      revision: 2,
      source: "refined" as const,
      refinedFrom: 1,
      branch: "operating" as const,
      status: "complete" as const,
      isBaseline: false,
      createdAt: iso(now, 14),
      completedAt: iso(now, 14),
      headline: "Drafted from the readers: onboarding automation for smaller software teams and agencies.",
      answered: 7,
      questions: 15,
      diff: { changed: [], added: [], removed: [], differentQuestions: false },
      answers: ANSWERS,
    },
    {
      id: "sample-rev-1",
      revision: 1,
      source: "asserted" as const,
      refinedFrom: null,
      branch: "operating" as const,
      status: "complete" as const,
      isBaseline: false,
      createdAt: iso(now, 24),
      completedAt: iso(now, 24),
      headline: "Onboarding automation for mid-market B2B SaaS.",
      answered: 6,
      questions: 15,
      diff: null,
      answers: ANSWERS.slice(0, 6),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* The row on the list                                                 */
/* ------------------------------------------------------------------ */

export function sampleListRow(now: Date) {
  return {
    id: SAMPLE_ID,
    name: SAMPLE_NAME,
    objective: "outbound",
    revisions: 3,
    started: true,
    documents: 2,
    updatedAt: iso(now, 7),
    basis: "tested" as const,
    engaged: 22,
    readers: 47,
    threshold: SAMPLE_THRESHOLD,
    lastSignalAt: iso(now, 0, 4),
    willReach: true,
    weeksToThreshold: 0,
    /** The list marks it, does not count it against the plan, and never offers
     *  it up for deletion. */
    sample: true,
  };
}
