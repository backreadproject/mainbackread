import type { Locale } from "./i18n";

/**
 * The discovery questions, as approved.
 *
 * Seven objectives, each fully built. The objective is a schema switch, not a
 * label: a recruiter is not describing deal size, a nonprofit has no customer,
 * and a founder raising money is not described by headcount. Each one gets the
 * fields its world actually has.
 *
 * Written as data rather than branches, so an eighth objective is a table entry.
 */

export type Objective =
  | "outbound"
  | "client"
  | "investor"
  | "partnership"
  | "recruiting"
  | "retail"
  | "nonprofit";

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

type G = { label: string; options: string[] }[];
const g = (label: string, options: string[]): G => [{ label, options }];

/* ---------------- shared option lists ---------------- */

const CATEGORY: G = [
  { label: "Software", options: ["B2B SaaS, customer success", "B2B SaaS, sales", "B2B SaaS, marketing", "B2B SaaS, finance and operations", "B2B SaaS, HR and people", "Developer tools", "Infrastructure and cloud", "Data and analytics", "Security", "Vertical SaaS", "Consumer app"] },
  { label: "Services", options: ["Marketing or creative agency", "Web or app development studio", "Management consulting", "Recruiting or staffing", "Accounting or bookkeeping", "Legal practice", "Training and coaching", "Managed IT services"] },
  { label: "Commerce", options: ["D2C brand", "B2B wholesale or distribution", "Marketplace", "Physical retail", "Food and beverage"] },
  { label: "Regulated and vertical", options: ["Fintech", "Healthtech or medtech", "Edtech", "Proptech or real estate", "Insurtech", "Logistics and supply chain", "Energy and climate", "Legaltech", "Govtech"] },
  { label: "Other", options: ["Media and publishing", "Creator or community", "Nonprofit or NGO", "Hardware or IoT", "Manufacturing", "Professional practice", "Something else"] },
];

const MODEL: G = [
  { label: "Recurring", options: ["Subscription, annual contracts", "Subscription, monthly", "Seat based subscription", "Usage or consumption based", "Freemium converting to paid", "Monthly retainer", "Hardware plus service contract"] },
  { label: "Non recurring", options: ["One off project fee", "Time and materials", "Licensing"] },
  { label: "Intermediated", options: ["Commission or revenue share", "Marketplace take rate", "Advertising", "Donations or grants"] },
  { label: "Other", options: ["Something else"] },
];

const GEO: G = [
  { label: "Africa", options: ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Rwanda"] },
  { label: "North America", options: ["United States", "Canada", "Mexico"] },
  { label: "Europe", options: ["United Kingdom", "Ireland", "Germany", "France", "Netherlands", "Spain", "Sweden", "Poland"] },
  { label: "Middle East", options: ["UAE", "Saudi Arabia", "Israel", "Qatar"] },
  { label: "Asia Pacific", options: ["India", "Singapore", "Australia", "Japan", "Philippines", "Indonesia"] },
  { label: "Latin America", options: ["Brazil", "Argentina", "Colombia", "Chile"] },
  { label: "Anywhere", options: ["Remote first, no country focus"] },
];

/** Bands run smallest to largest everywhere. A list out of order is unreadable. */
const DEAL = g("Smallest to largest", ["Under USD 1,000 a year", "USD 1,000 to 5,000", "USD 5,000 to 10,000", "USD 10,000 to 25,000", "USD 25,000 to 50,000", "USD 50,000 to 100,000", "USD 100,000 to 250,000", "Over USD 250,000"]);
const SIZE = g("Smallest to largest", ["1 to 10 employees", "11 to 50", "51 to 200", "201 to 500", "501 to 1,000", "1,001 to 5,000", "Over 5,000"]);
const CLOSE = g("", ["Under two weeks", "Two weeks to one month", "One to three months", "Three to six months", "Over six months"]);

const FUND_STAGE = g("Stage", ["Pre-seed", "Seed", "Series A", "Series B", "Series C and later", "Growth or private equity", "Angel or syndicate", "Grant or foundation", "Development finance"]);
const CHEQUE = g("Smallest to largest", ["Under USD 25,000", "USD 25,000 to 100,000", "USD 100,000 to 500,000", "USD 500,000 to 2 million", "USD 2 million to 10 million", "Over USD 10 million"]);

const SENIORITY = g("Junior to senior", ["Intern or graduate", "Individual contributor", "Senior individual contributor", "Team lead", "Manager", "Head of or director", "VP", "C level or founder"]);
const SALARY = g("Smallest to largest", ["Under USD 20,000", "USD 20,000 to 40,000", "USD 40,000 to 70,000", "USD 70,000 to 120,000", "USD 120,000 to 200,000", "Over USD 200,000", "Equity heavy, cash light"]);
const WORKSTYLE = g("", ["Fully remote", "Hybrid", "Onsite", "Onsite with relocation"]);

const CHANNEL = g("Route to shelf", ["Independent retailers", "Regional chains", "National chains", "Wholesalers and distributors", "Online marketplaces", "Direct to consumer only", "Export agents", "Buying groups and co-ops"]);
const ORDER = g("Smallest to largest", ["Under USD 500", "USD 500 to 2,000", "USD 2,000 to 10,000", "USD 10,000 to 50,000", "Over USD 50,000"]);

const FUNDER = g("Type", ["Private foundation", "Corporate foundation", "Government or public agency", "Multilateral or development finance", "Individual major donor", "Community or crowdfunding", "Faith based funder", "Impact investor"]);
const GRANT = g("Smallest to largest", ["Under USD 10,000", "USD 10,000 to 50,000", "USD 50,000 to 250,000", "USD 250,000 to 1 million", "Over USD 1 million"]);
const PROGRAMME = g("Area", ["Health", "Education", "Livelihoods and enterprise", "Climate and environment", "Governance and rights", "Water and sanitation", "Food security", "Gender and inclusion", "Humanitarian response", "Arts and culture", "Research"]);

/* ---------------- per objective ---------------- */

const SELLS_LABEL: Record<Objective, [string, string]> = {
  outbound: ["What you sell", "Ce que vous vendez"],
  client: ["What you do for clients", "Ce que vous faites pour vos clients"],
  investor: ["What the company does", "Ce que fait l\u2019entreprise"],
  partnership: ["What you would bring a partner", "Ce que vous apportez \u00e0 un partenaire"],
  recruiting: ["The role you are hiring for", "Le poste que vous recrutez"],
  retail: ["The product you want stocked", "Le produit que vous voulez faire r\u00e9f\u00e9rencer"],
  nonprofit: ["What your organisation does", "Ce que fait votre organisation"],
};

/** Who the evidence questions are about. Renaming matters: asking a recruiter
 *  about their best customer reads as a form built for somebody else. */
const WHO: Record<Objective, [string, string]> = {
  outbound: ["customer", "client"],
  client: ["client", "client"],
  investor: ["investor", "investisseur"],
  partnership: ["partner", "partenaire"],
  recruiting: ["hire", "recrutement"],
  retail: ["stockist", "distributeur"],
  nonprofit: ["funder", "financeur"],
};

function tailFields(o: Objective, fr: boolean): Field[] {
  const multi = (id: string, en: string, frl: string, hintEn: string, hintFr: string, groups: G): Field => ({
    id, kind: "multi", groups,
    label: fr ? frl : en,
    hint: fr ? hintFr : hintEn,
    placeholder: fr ? "Choisir" : "Choose every one that applies",
  });
  const sel = (id: string, en: string, frl: string, groups: G): Field => ({ id, kind: "select", groups, label: fr ? frl : en });

  if (o === "investor") return [
    sel("stage", "Stage you are raising at", "Stade recherch\u00e9", FUND_STAGE),
    multi("cheque", "Cheque size you need", "Taille de ticket vis\u00e9e", "Pick every band that would work.", "Chaque tranche qui conviendrait.", CHEQUE),
    sel("close", "How long a round usually takes", "Dur\u00e9e habituelle d\u2019une lev\u00e9e", CLOSE),
  ];

  if (o === "recruiting") return [
    multi("seniority", "Seniority", "Niveau", "Pick every level you would consider.", "Chaque niveau envisageable.", SENIORITY),
    multi("salary", "Salary band", "Fourchette salariale", "What you can genuinely pay, not what you wish you could.", "Ce que vous pouvez vraiment payer.", SALARY),
    sel("workstyle", "Remote, hybrid or onsite", "T\u00e9l\u00e9travail, hybride ou sur site", WORKSTYLE),
    sel("close", "Time from first contact to signed", "D\u00e9lai entre premier contact et signature", CLOSE),
  ];

  if (o === "retail") return [
    multi("channel", "Route to shelf", "Circuit de distribution", "Every route you actually want. Each behaves differently.", "Chaque circuit vis\u00e9. Ils ne se comportent pas pareil.", CHANNEL),
    multi("order", "Typical opening order", "Commande initiale habituelle", "Pick every band you genuinely open at.", "Chaque tranche o\u00f9 vous d\u00e9marrez vraiment.", ORDER),
    sel("close", "Time from pitch to first order", "D\u00e9lai entre pr\u00e9sentation et premi\u00e8re commande", CLOSE),
  ];

  if (o === "nonprofit") return [
    multi("funder", "Type of funder", "Type de financeur", "Each type asks for something different.", "Chaque type demande autre chose.", FUNDER),
    multi("grant", "Grant size", "Taille de subvention", "Pick every band worth the application effort.", "Chaque tranche qui vaut l\u2019effort du dossier.", GRANT),
    multi("programme", "Programme area", "Domaine d\u2019intervention", "What the work is actually about.", "Ce sur quoi porte r\u00e9ellement le travail.", PROGRAMME),
    sel("close", "Time from first contact to funds", "D\u00e9lai entre premier contact et financement", CLOSE),
  ];

  // outbound, client and partnership all describe an organisation they sell to.
  return [
    multi("deal", o === "partnership" ? "Value a partnership is worth" : "Typical deal size",
      o === "partnership" ? "Valeur d\u2019un partenariat" : "Taille d\u2019affaire habituelle",
      "Pick every band you genuinely close in.", "Chaque tranche o\u00f9 vous concluez vraiment.", DEAL),
    multi("size", o === "partnership" ? "Partner size" : "Customer size",
      o === "partnership" ? "Taille du partenaire" : "Taille des clients",
      "Headcount of the organisations you are approaching.", "Effectif des organisations vis\u00e9es.", SIZE),
    { id: "close", kind: "select", groups: CLOSE, label: fr ? "D\u00e9lai de conclusion" : "Time to close" },
  ];
}

function businessStep(o: Objective, fr: boolean): Step {
  return {
    id: "business",
    title: fr ? "Parlez-nous de l\u2019organisation" : "Tell us about the business",
    intro: fr
      ? "Nous r\u00e9cup\u00e9rons ce que nous pouvons depuis votre site pour que vous corrigiez plut\u00f4t que de saisir."
      : "We pull what we can from your site so you are correcting rather than typing.",
    fields: [
      { id: "company", kind: "text", label: fr ? "Organisation" : "Company" },
      { id: "website", kind: "text", label: fr ? "Site web" : "Website", placeholder: "example.com" },
      {
        id: "sells", kind: "long", weight: true,
        label: SELLS_LABEL[o][fr ? 1 : 0],
        hint: fr ? "Une phrase, comme vous le diriez \u00e0 voix haute." : "One sentence, the way you would say it out loud.",
      },
      {
        id: "category", kind: "select", groups: CATEGORY,
        label: fr ? "Cat\u00e9gorie" : "Category",
        hint: fr ? "Si aucune ne convient, choisissez autre chose." : "If none of these is close, pick something else and describe it.",
      },
      {
        id: "model", kind: "select", groups: MODEL,
        label: fr ? "Mod\u00e8le \u00e9conomique" : "Business model",
        hint: fr ? "Compte plus que la cat\u00e9gorie. D\u00e9cide s\u2019il existe un moment de renouvellement." : "This matters more than category. It decides whether there is a renewal moment at all.",
      },
      {
        id: "geo", kind: "multi", groups: GEO,
        label: fr ? "O\u00f9 vous travaillez" : "Where you sell",
        hint: fr ? "Chaque march\u00e9 que vous travaillez vraiment. D\u00e9termine jours f\u00e9ri\u00e9s, fuseaux et cycles budg\u00e9taires." : "Every market you actively work. Drives holidays, timezones and fiscal cycles.",
        placeholder: fr ? "Choisissez vos march\u00e9s" : "Pick every market you work",
      },
      ...tailFields(o, fr),
    ],
  };
}

/** The evidence questions, per objective. Same six shapes throughout: the best
 *  one by name, the moment it turned, who else was involved, what came before,
 *  the two that failed, and where these people already are. */
const EVIDENCE: Record<Objective, [string, string, string][]> = {
  outbound: [
    ["What had just changed there when they bought?", "Qu\u2019est-ce qui venait de changer chez eux au moment de l\u2019achat ?", "The trigger. Most ICP documents leave this out and it is what makes outreach land."],
    ["Who signed it off, and who else was in the room?", "Qui a valid\u00e9, et qui d\u2019autre \u00e9tait dans la pi\u00e8ce ?", ""],
    ["What were they doing before you?", "Que faisaient-ils avant vous ?", ""],
  ],
  client: [
    ["What had just changed there when they hired you?", "Qu\u2019est-ce qui venait de changer quand ils vous ont engag\u00e9 ?", "A new CMO, a funding round, a review of the incumbent. This is what makes outreach land."],
    ["Who chose you, and who else had a say?", "Qui vous a choisi, et qui d\u2019autre avait son mot \u00e0 dire ?", ""],
    ["Who or what were they using before you?", "Qui ou quoi utilisaient-ils avant vous ?", ""],
  ],
  investor: [
    ["What had just changed when they decided to invest?", "Qu\u2019est-ce qui venait de changer quand ils ont d\u00e9cid\u00e9 d\u2019investir ?", "The moment the round became real to them. Usually a number, a hire or a customer."],
    ["Who championed it internally, and who had to approve?", "Qui l\u2019a port\u00e9 en interne, et qui devait approuver ?", "Associate, partner, investment committee. They are different audiences."],
    ["What did they look at hardest before committing?", "Qu\u2019ont-ils examin\u00e9 le plus attentivement avant de s\u2019engager ?", ""],
  ],
  partnership: [
    ["What had just changed there when the partnership started?", "Qu\u2019est-ce qui venait de changer quand le partenariat a commenc\u00e9 ?", "Partnerships start when something on their side made yours worth the effort."],
    ["Who owned it on their side, and who had to sign?", "Qui le portait chez eux, et qui devait signer ?", ""],
    ["What were they doing about this before you?", "Que faisaient-ils \u00e0 ce sujet avant vous ?", ""],
  ],
  recruiting: [
    ["What made them say yes, in their own words?", "Qu\u2019est-ce qui les a fait dire oui, dans leurs mots ?", "Not what you offered. What they told you mattered. These are rarely the same."],
    ["Who else were they talking to, and why did you win?", "\u00c0 qui d\u2019autre parlaient-ils, et pourquoi avez-vous gagn\u00e9 ?", ""],
    ["Where were they when you found them?", "O\u00f9 \u00e9taient-ils quand vous les avez trouv\u00e9s ?", "The channel that produced your best hire, not the ones you post on most."],
  ],
  retail: [
    ["What had just changed there when they took you on?", "Qu\u2019est-ce qui venait de changer quand ils vous ont r\u00e9f\u00e9renc\u00e9 ?", "A category review, a gap on shelf, a competitor delisted."],
    ["Who decided, and who else had to agree?", "Qui a d\u00e9cid\u00e9, et qui d\u2019autre devait \u00eatre d\u2019accord ?", "Buyer, category manager, head office. Naming the layer changes the pitch."],
    ["What were they stocking instead?", "Que r\u00e9f\u00e9ren\u00e7aient-ils \u00e0 la place ?", ""],
  ],
  nonprofit: [
    ["What had just changed when they decided to fund you?", "Qu\u2019est-ce qui venait de changer quand ils ont d\u00e9cid\u00e9 de vous financer ?", "A new strategy, a funding cycle, a gap in their portfolio."],
    ["Who championed it inside the funder, and who approved?", "Qui l\u2019a port\u00e9 chez le financeur, et qui a approuv\u00e9 ?", "Programme officer, committee, trustee board. They read different things."],
    ["What were they funding in this area before you?", "Que finan\u00e7aient-ils dans ce domaine avant vous ?", ""],
  ],
};

function evidenceStep(o: Objective, branch: Branch, fr: boolean): Step {
  const who = WHO[o][fr ? 1 : 0];

  // The hypothesis branch cannot ask about a history that does not exist.
  // Question three does the work question five does on the other branch: who
  // did NOT care is more informative than who did.
  if (branch === "startup") {
    return {
      id: "evidence",
      title: fr ? "Ce que vous avez d\u00e9j\u00e0 vu" : "What you have seen so far",
      intro: fr
        ? "Vous n\u2019avez pas encore d\u2019historique, donc ceci sera marqu\u00e9 comme une hypoth\u00e8se. Les questions portent sur des personnes r\u00e9elles \u00e0 qui vous avez parl\u00e9, pas sur des personas."
        : "You do not have a track record yet, so this will be labelled a hypothesis. The questions ask about real people you have spoken to, not personas.",
      fields: [
        { id: "person", kind: "long", weight: true, label: fr ? "D\u00e9crivez une personne r\u00e9elle \u00e0 qui vous avez parl\u00e9" : "Describe one real person you have spoken to", hint: fr ? "Pas un persona. Quelqu\u2019un \u00e0 qui vous avez parl\u00e9." : "Not a persona. Someone you talked to." },
        { id: "today", kind: "long", label: fr ? "Que font-ils \u00e0 ce sujet aujourd\u2019hui ?" : "What are they doing about it today?", hint: fr ? "M\u00eame si la r\u00e9ponse est un tableur et des jurons." : "Even if the answer is a spreadsheet and swearing." },
        { id: "litup", kind: "long", weight: true, label: fr ? "Qui s\u2019est illumin\u00e9 quand vous l\u2019avez d\u00e9crit, et qui non ?" : "Who lit up when you described it, and who did not?", hint: fr ? "Incluez ceux qui s\u2019en fichaient. C\u2019est plus instructif." : "Include the people who did not care. That is more informative than who did." },
        { id: "urgent", kind: "long", weight: true, label: fr ? "Que doit-il \u00eatre vrai pour que ce soit urgent plut\u00f4t qu\u2019int\u00e9ressant ?" : "What has to be true for this to be urgent rather than interesting?" },
        { id: "found", kind: "long", label: fr ? "O\u00f9 avez-vous trouv\u00e9 ces personnes ?" : "Where did you find the people you have spoken to?" },
        { id: "buy", kind: "long", label: fr ? "Que faudrait-il pour que quelqu\u2019un s\u2019engage ce trimestre ?" : "What would have to happen for someone to commit this quarter?" },
      ],
    };
  }

  const e = EVIDENCE[o];
  return {
    id: "evidence",
    title: fr ? "Maintenant, la partie qui pr\u00e9dit vraiment" : "Now the part that actually predicts",
    intro: fr
      ? "Demander \u00e0 quoi ressemble un bon profil produit un croquis d\u00e9mographique. Demander des personnes pr\u00e9cises, un moment pr\u00e9cis et ceux qui se sont mal pass\u00e9s produit quelque chose d\u2019utilisable."
      : "Asking what a good one looks like produces a demographic sketch. Asking about specific people, a specific moment, and the ones that went wrong produces something usable.",
    fields: [
      {
        id: "best", kind: "text", weight: true,
        label: fr ? "Votre meilleur " + who + ", nomm\u00e9ment" : "Your single best " + who,
        hint: fr ? "Un vrai, par son nom. Pas un type." : "A real one, by name. Not a type.",
      },
      { id: "moment", kind: "long", weight: true, label: fr ? e[0][1] : e[0][0], hint: e[0][2] || undefined },
      { id: "room", kind: "long", label: fr ? e[1][1] : e[1][0], hint: e[1][2] || undefined },
      { id: "before", kind: "long", label: fr ? e[2][1] : e[2][0], hint: e[2][2] || undefined },
      {
        id: "badfit", kind: "long", weight: true,
        label: fr ? "Nommez deux " + who + "s qui n\u2019\u00e9taient pas les bons" : "Name two " + who + "s who were a bad fit",
        hint: fr ? "Et ce qu\u2019ils avaient en commun. Cette question fait plus de travail que toutes celles au-dessus." : "And what they had in common. This does more work than any question above it.",
      },
      {
        id: "gather", kind: "long",
        label: fr ? "O\u00f9 ces personnes se retrouvent-elles d\u00e9j\u00e0 ?" : "Where do these people already gather?",
        hint: fr ? "Seulement celles o\u00f9 vous les avez vraiment vues." : "Only ones you have actually seen them in.",
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

export function weightedIds(objective: Objective, branch: Branch): string[] {
  return allFields(objective, branch).filter((f) => f.weight).map((f) => f.id);
}

export const SELLS_ID = "sells";

/** Every objective, for the picker. All seven are built. */
export const OBJECTIVES: { id: Objective; en: string; fr: string; hintEn: string; hintFr: string }[] = [
  { id: "outbound", en: "Outbound sales", fr: "Vente sortante", hintEn: "You are selling a product and need lists, personas and openers. Output leans on buying committee and triggers.", hintFr: "Vous vendez un produit et vous avez besoin de listes, de personas et d\u2019accroches." },
  { id: "client", en: "Client prospecting", fr: "Prospection client", hintEn: "Agency or consultancy work. Output leans on account triggers like a new CMO, a funding round or an agency review.", hintFr: "Agence ou conseil. S\u2019appuie sur les d\u00e9clencheurs de compte." },
  { id: "investor", en: "Investor prospecting", fr: "Recherche d\u2019investisseurs", hintEn: "Raising. Firmographics are replaced by fund stage, cheque size, thesis fit and portfolio conflicts.", hintFr: "Lev\u00e9e de fonds. Les firmographies c\u00e8dent la place au stade du fonds et \u00e0 la taille de ticket." },
  { id: "partnership", en: "Partnerships", fr: "Partenariats", hintEn: "Referral, reseller or integration partners. Output leans on audience overlap, incentive and who owns partnerships there.", hintFr: "Partenaires de r\u00e9f\u00e9rencement, revendeurs ou int\u00e9grations." },
  { id: "recruiting", en: "Recruiting", fr: "Recrutement", hintEn: "You are selling a role to a candidate. Deal size becomes seniority and salary, and the committee is whoever they talk to at home.", hintFr: "Vous vendez un poste \u00e0 un candidat. La taille d\u2019affaire devient niveau et salaire." },
  { id: "retail", en: "Distribution and retail", fr: "Distribution et vente au d\u00e9tail", hintEn: "Getting stocked. The buyer is not the user, and the trigger is usually a category review or a gap on shelf.", hintFr: "\u00catre r\u00e9f\u00e9renc\u00e9. L\u2019acheteur n\u2019est pas l\u2019utilisateur." },
  { id: "nonprofit", en: "Grants and nonprofit", fr: "Subventions et associations", hintEn: "Funders rather than customers. Cheque size becomes grant size, and the committee is a programme officer, a panel and a board.", hintFr: "Des financeurs plut\u00f4t que des clients. Le comit\u00e9 est un charg\u00e9 de programme, un jury et un conseil." },
];
