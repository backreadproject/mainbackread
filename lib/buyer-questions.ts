import type { Locale } from "./i18n";

/**
 * The discovery questions, exactly as approved.
 *
 * This replaces lib/icp-questions.ts. The old file asked eight prose questions
 * and nothing else; this asks structured facts on step one and the three
 * questions that actually predict on step two.
 *
 * Screen four is the business. Screen five is the evidence, and the weighted
 * questions there are the ones that make the output predict rather than
 * describe: a named customer, the moment they bought, and the two that went
 * wrong. Asking what a good customer looks like produces a demographic sketch,
 * which is why most ICP documents get filed and never read again.
 */

export type Objective = "outbound" | "client" | "investor" | "partnership";
export type Branch = "operating" | "startup";

export type FieldKind = "text" | "long" | "select" | "multi";

export interface Field {
  /** Stable. Answers are keyed on this, so fields can be reordered safely. */
  id: string;
  label: string;
  /** Shown under the label, always visible. Never a tooltip. */
  hint?: string;
  kind: FieldKind;
  placeholder?: string;
  /** Grouped options for select and multi. */
  groups?: { label: string; options: string[] }[];
  /** These decide whether the output predicts anything, and the failure mode is
   *  a one line answer. Marked in the interface. */
  weight?: boolean;
}

export interface Step {
  id: string;
  title: string;
  intro: string;
  fields: Field[];
}

const CATEGORY: { label: string; options: string[] }[] = [
  { label: "Software", options: ["B2B SaaS, customer success", "B2B SaaS, sales", "B2B SaaS, marketing", "B2B SaaS, finance and operations", "B2B SaaS, HR and people", "Developer tools", "Infrastructure and cloud", "Data and analytics", "Security", "Vertical SaaS", "Consumer app"] },
  { label: "Services", options: ["Marketing or creative agency", "Web or app development studio", "Management consulting", "Recruiting or staffing", "Accounting or bookkeeping", "Legal practice", "Training and coaching", "Managed IT services"] },
  { label: "Commerce", options: ["D2C brand", "B2B wholesale or distribution", "Marketplace", "Physical retail", "Food and beverage"] },
  { label: "Regulated and vertical", options: ["Fintech", "Healthtech or medtech", "Edtech", "Proptech or real estate", "Insurtech", "Logistics and supply chain", "Energy and climate", "Legaltech", "Govtech"] },
  { label: "Other", options: ["Media and publishing", "Creator or community", "Nonprofit or NGO", "Hardware or IoT", "Manufacturing", "Professional practice", "Something else"] },
];

const MODEL: { label: string; options: string[] }[] = [
  { label: "Recurring", options: ["Subscription, annual contracts", "Subscription, monthly", "Seat based subscription", "Usage or consumption based", "Freemium converting to paid", "Monthly retainer", "Hardware plus service contract"] },
  { label: "Non recurring", options: ["One off project fee", "Time and materials", "Licensing"] },
  { label: "Intermediated", options: ["Commission or revenue share", "Marketplace take rate", "Advertising", "Donations or grants"] },
  { label: "Other", options: ["Something else"] },
];

const GEO: { label: string; options: string[] }[] = [
  { label: "Africa", options: ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Rwanda"] },
  { label: "North America", options: ["United States", "Canada", "Mexico"] },
  { label: "Europe", options: ["United Kingdom", "Ireland", "Germany", "France", "Netherlands", "Spain", "Sweden", "Poland"] },
  { label: "Middle East", options: ["UAE", "Saudi Arabia", "Israel", "Qatar"] },
  { label: "Asia Pacific", options: ["India", "Singapore", "Australia", "Japan", "Philippines", "Indonesia"] },
  { label: "Latin America", options: ["Brazil", "Argentina", "Colombia", "Chile"] },
  { label: "Anywhere", options: ["Remote first, no country focus"] },
];

/** Smallest to largest, deliberately. A band list out of order is unreadable. */
const DEAL: { label: string; options: string[] }[] = [
  { label: "Smallest to largest", options: ["Under USD 1,000 a year", "USD 1,000 to 5,000", "USD 5,000 to 10,000", "USD 10,000 to 25,000", "USD 25,000 to 50,000", "USD 50,000 to 100,000", "USD 100,000 to 250,000", "Over USD 250,000"] },
];

const SIZE: { label: string; options: string[] }[] = [
  { label: "Smallest to largest", options: ["1 to 10 employees", "11 to 50", "51 to 200", "201 to 500", "501 to 1,000", "1,001 to 5,000", "Over 5,000"] },
];

const CLOSE: { label: string; options: string[] }[] = [
  { label: "", options: ["Under two weeks", "Two weeks to one month", "One to three months", "Three to six months", "Over six months"] },
];

/** Fund stage replaces headcount when the objective is raising money: a fund is
 *  not described by how many people work there. */
const FUND_STAGE: { label: string; options: string[] }[] = [
  { label: "Stage", options: ["Pre-seed", "Seed", "Series A", "Series B", "Series C and later", "Growth or private equity", "Angel or syndicate", "Grant or foundation", "Development finance"] },
];

const CHEQUE: { label: string; options: string[] }[] = [
  { label: "Smallest to largest", options: ["Under USD 25,000", "USD 25,000 to 100,000", "USD 100,000 to 500,000", "USD 500,000 to 2 million", "USD 2 million to 10 million", "Over USD 10 million"] },
];

function businessStep(objective: Objective, fr: boolean): Step {
  const sells: Field = {
    id: "sells",
    label: fr ? "Ce que vous vendez" : "What you sell",
    hint: fr ? "Une phrase, comme vous le diriez \u00e0 voix haute." : "One sentence, the way you would say it out loud.",
    kind: "long",
    weight: true,
  };

  const common: Field[] = [
    { id: "company", label: fr ? "Entreprise" : "Company", kind: "text" },
    { id: "website", label: fr ? "Site web" : "Website", kind: "text", placeholder: "example.com" },
    sells,
    {
      id: "category",
      label: fr ? "Cat\u00e9gorie" : "Category",
      hint: fr ? "Si aucune ne convient, choisissez autre chose et d\u00e9crivez-le." : "If none of these is close, pick something else and describe it.",
      kind: "select",
      groups: CATEGORY,
    },
    {
      id: "model",
      label: fr ? "Mod\u00e8le \u00e9conomique" : "Business model",
      hint: fr
        ? "Compte plus que la cat\u00e9gorie. D\u00e9cide s\u2019il existe un moment de renouvellement."
        : "This matters more than category. It decides whether there is a renewal moment at all.",
      kind: "select",
      groups: MODEL,
    },
    {
      id: "geo",
      label: fr ? "O\u00f9 vous vendez" : "Where you sell",
      hint: fr
        ? "Chaque march\u00e9 que vous travaillez vraiment. D\u00e9termine jours f\u00e9ri\u00e9s, fuseaux et cycles budg\u00e9taires."
        : "Every market you actively work. Drives holidays, timezones and fiscal cycles.",
      kind: "multi",
      groups: GEO,
      placeholder: fr ? "Choisissez vos march\u00e9s" : "Pick every market you work",
    },
  ];

  if (objective === "investor") {
    return {
      id: "business",
      title: fr ? "Parlez-nous de l\u2019entreprise" : "Tell us about the business",
      intro: fr
        ? "Nous r\u00e9cup\u00e9rons ce que nous pouvons depuis votre site pour que vous corrigiez plut\u00f4t que de saisir."
        : "We pull what we can from your site so you are correcting rather than typing.",
      fields: [
        ...common,
        { id: "stage", label: fr ? "Stade recherch\u00e9" : "Stage you are raising at", kind: "select", groups: FUND_STAGE },
        {
          id: "cheque",
          label: fr ? "Taille de ticket vis\u00e9e" : "Cheque size you need",
          hint: fr ? "Choisissez chaque tranche qui vous conviendrait." : "Pick every band that would work for you.",
          kind: "multi",
          groups: CHEQUE,
          placeholder: fr ? "Choisissez les tranches" : "Pick every band that works",
        },
        { id: "close", label: fr ? "Dur\u00e9e habituelle d\u2019une lev\u00e9e" : "How long a round usually takes", kind: "select", groups: CLOSE },
      ],
    };
  }

  return {
    id: "business",
    title: fr ? "Parlez-nous de l\u2019entreprise" : "Tell us about the business",
    intro: fr
      ? "Nous r\u00e9cup\u00e9rons ce que nous pouvons depuis votre site pour que vous corrigiez plut\u00f4t que de saisir."
      : "We pull what we can from your site so you are correcting rather than typing.",
    fields: [
      ...common,
      {
        id: "deal",
        label: fr ? "Taille d\u2019affaire habituelle" : "Typical deal size",
        hint: fr ? "Choisissez chaque tranche o\u00f9 vous concluez vraiment." : "Pick every band you genuinely close in.",
        kind: "multi",
        groups: DEAL,
        placeholder: fr ? "Choisissez les tranches" : "Pick every band you close in",
      },
      {
        id: "size",
        label: fr ? "Taille des clients" : "Customer size",
        hint: fr ? "Effectif des entreprises \u00e0 qui vous vendez." : "Headcount of the companies you sell to.",
        kind: "multi",
        groups: SIZE,
        placeholder: fr ? "Choisissez les tailles" : "Pick every size you sell to",
      },
      { id: "close", label: fr ? "D\u00e9lai de conclusion" : "Time to close", kind: "select", groups: CLOSE },
    ],
  };
}

function evidenceStep(objective: Objective, branch: Branch, fr: boolean): Step {
  // The hypothesis branch cannot ask about customers it does not have. Question
  // four does the work question six does on the other branch: who did NOT care
  // is more informative than who did, and a founder has that answer even when
  // customer history does not exist.
  if (branch === "startup") {
    return {
      id: "evidence",
      title: fr ? "Ce que vous avez d\u00e9j\u00e0 vu" : "What you have seen so far",
      intro: fr
        ? "Vous n\u2019avez pas encore de clients, donc ceci sera marqu\u00e9 comme une hypoth\u00e8se. Les questions portent sur des personnes r\u00e9elles \u00e0 qui vous avez parl\u00e9, pas sur des personas."
        : "You do not have customers yet, so this will be labelled a hypothesis. The questions ask about real people you have spoken to, not personas.",
      fields: [
        {
          id: "person",
          label: fr ? "D\u00e9crivez une personne \u00e0 qui vous avez r\u00e9ellement parl\u00e9 et qui a ce probl\u00e8me" : "Describe one person you have actually spoken to who has this problem",
          hint: fr ? "Pas un persona. Quelqu\u2019un \u00e0 qui vous avez parl\u00e9." : "Not a persona. Someone you talked to.",
          kind: "long",
          weight: true,
        },
        {
          id: "today",
          label: fr ? "Que font-ils \u00e0 ce sujet aujourd\u2019hui ?" : "What are they doing about it today?",
          hint: fr ? "M\u00eame si la r\u00e9ponse est un tableur et des jurons." : "Even if the answer is a spreadsheet and swearing.",
          kind: "long",
        },
        {
          id: "litup",
          label: fr ? "Qui s\u2019est illumin\u00e9 quand vous l\u2019avez d\u00e9crit, et qui non ?" : "Who lit up when you described it, and who did not?",
          hint: fr
            ? "Incluez ceux qui n\u2019ont pas achet\u00e9. Qui s\u2019en fichait est plus instructif que qui s\u2019y int\u00e9ressait."
            : "Include the people who did not buy. Who did not care is more informative than who did.",
          kind: "long",
          weight: true,
        },
        {
          id: "urgent",
          label: fr ? "Que doit-il \u00eatre vrai pour que ce soit urgent plut\u00f4t qu\u2019int\u00e9ressant ?" : "What has to be true for this to be urgent rather than interesting?",
          kind: "long",
          weight: true,
        },
        {
          id: "found",
          label: fr ? "O\u00f9 avez-vous trouv\u00e9 les personnes \u00e0 qui vous avez parl\u00e9 ?" : "Where did you find the people you have already spoken to?",
          kind: "long",
        },
        {
          id: "buy",
          label: fr ? "Que faudrait-il pour que quelqu\u2019un ach\u00e8te ce trimestre ?" : "What would have to happen for someone to buy this quarter?",
          kind: "long",
        },
      ],
    };
  }

  const who = objective === "investor" ? (fr ? "investisseur" : "investor") : objective === "partnership" ? (fr ? "partenaire" : "partner") : (fr ? "client" : "customer");

  return {
    id: "evidence",
    title: fr ? "Maintenant, la partie qui pr\u00e9dit vraiment" : "Now the part that actually predicts",
    intro: fr
      ? "Demander \u00e0 quoi ressemble un bon client produit un croquis d\u00e9mographique. Demander des personnes pr\u00e9cises, un moment pr\u00e9cis et ceux qui se sont mal pass\u00e9s produit quelque chose d\u2019utilisable."
      : "Asking what a good customer looks like produces a demographic sketch. Asking about specific people, a specific moment, and the ones that went wrong produces something usable.",
    fields: [
      {
        id: "best",
        label: fr ? "Votre meilleur " + who + ", nomm\u00e9ment" : "Your single best " + who,
        hint: fr ? "Un vrai, par son nom. Pas un type." : "A real one, by name. Not a type.",
        kind: "text",
        weight: true,
      },
      {
        id: "moment",
        label: fr ? "Qu\u2019est-ce qui venait de changer chez eux au moment de la d\u00e9cision ?" : "What had just changed there when they bought?",
        hint: fr
          ? "Le d\u00e9clencheur. La plupart des documents ICP l\u2019omettent, et c\u2019est ce qui fait mouche."
          : "The trigger. Most ICP documents leave this out and it is what makes outreach land.",
        kind: "long",
        weight: true,
      },
      {
        id: "room",
        label: fr ? "Qui a valid\u00e9, et qui d\u2019autre \u00e9tait dans la pi\u00e8ce ?" : "Who signed it off, and who else was in the room?",
        kind: "long",
      },
      {
        id: "before",
        label: fr ? "Que faisaient-ils avant vous ?" : "What were they doing before you?",
        kind: "long",
      },
      {
        id: "badfit",
        label: fr ? "Nommez deux " + who + "s qui n\u2019\u00e9taient pas les bons" : "Name two " + who + "s who were a bad fit",
        hint: fr
          ? "Et ce qu\u2019ils avaient en commun. Cette question fait plus de travail que toutes celles au-dessus."
          : "And what they had in common. This does more work than any question above it.",
        kind: "long",
        weight: true,
      },
      {
        id: "gather",
        label: fr ? "O\u00f9 ces personnes se retrouvent-elles d\u00e9j\u00e0 ?" : "Where do these people already gather?",
        hint: fr ? "Seulement celles o\u00f9 vous les avez vraiment vues." : "Only ones you have actually seen them in.",
        kind: "long",
      },
    ],
  };
}

export function stepsFor(objective: Objective, branch: Branch, locale: Locale = "en"): Step[] {
  const fr = locale === "fr";
  return [businessStep(objective, fr), evidenceStep(objective, branch, fr)];
}

export function allFields(objective: Objective, branch: Branch, locale: Locale = "en"): Field[] {
  return stepsFor(objective, branch, locale).flatMap((s) => s.fields);
}

/** Ids of the fields that carry double weight in the confidence calculation. */
export function weightedIds(objective: Objective, branch: Branch): string[] {
  return allFields(objective, branch).filter((f) => f.weight).map((f) => f.id);
}

/** The single sentence describing what they sell. Kept as a named export
 *  because several call sites need it without walking the field list. */
export const SELLS_ID = "sells";
