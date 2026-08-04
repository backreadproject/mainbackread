import type { Locale } from "./i18n";

/**
 * Where to find them, in each platform's own language.
 *
 * This is deterministic. The filters come from the activation pass, which has
 * already been generated; turning them into six formats is mapping, not
 * reasoning, so it costs nothing and it cannot drift from the personas.
 *
 * We never connect to any of these. The customer gets the criteria and runs it
 * themselves, which means we never hold their key, never spend their credits,
 * and the GDPR Article 14 obligation stays with the vendor and the user.
 */

export interface ProspectFilters {
  titles: string[];
  excludeTitles: string[];
  headcount: string;
  industries: string[];
  excludeIndustries: string[];
  geographies: string[];
  technologies: string[];
  keywords: string[];
  hiringSignals: string[];
  fundingStages: string[];
  searchStrings: { tool: string; query: string }[];
}

export type PlatformId = "apollo" | "salesnav" | "clay" | "crunchbase" | "google" | "pdl";

export interface CriteriaRow {
  field: string;
  value: string;
  why: string;
}

export interface CriteriaBlock {
  label: string;
  code: string;
}

export interface PlatformCriteria {
  id: PlatformId;
  label: string;
  /** One line on what this platform is for, and what it cannot do. */
  note: string;
  rows: CriteriaRow[];
  blocks: CriteriaBlock[];
  /** Shown under the table. Usually how to make the search keep working. */
  footer: string;
}

export const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "apollo", label: "Apollo" },
  { id: "salesnav", label: "LinkedIn Sales Navigator" },
  { id: "clay", label: "Clay" },
  { id: "crunchbase", label: "Crunchbase" },
  { id: "google", label: "Google X-ray" },
  { id: "pdl", label: "People Data Labs" },
];

const list = (a: string[] | undefined): string => (a ?? []).filter(Boolean).join(", ");
const has = (a: string[] | undefined): boolean => Boolean(a && a.filter(Boolean).length);

/** Quotes each term and joins with OR, which is what every Boolean box expects. */
function orQuoted(a: string[]): string {
  return a.filter(Boolean).map((s) => '"' + s.replace(/"/g, "") + '"').join(" OR ");
}

/** Apollo wants ranges like 51,200. Best effort from whatever prose we were given. */
function headcountRanges(h: string): string {
  const nums = (h.match(/\d[\d,]*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
  if (nums.length >= 2) return nums[0] + "," + nums[1];
  if (nums.length === 1) return nums[0] + ",100000";
  return "";
}

/** Sales Navigator has fixed headcount bands rather than free ranges. */
function salesNavBands(h: string): string {
  const nums = (h.match(/\d[\d,]*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
  const lo = nums[0] ?? 0;
  const hi = nums[1] ?? 100000;
  const bands: [number, number, string][] = [
    [1, 10, "1-10"],
    [11, 50, "11-50"],
    [51, 200, "51-200"],
    [201, 500, "201-500"],
    [501, 1000, "501-1000"],
    [1001, 5000, "1001-5000"],
    [5001, 10000, "5001-10000"],
    [10001, 1000000, "10001+"],
  ];
  const hit = bands.filter(([a, b]) => b >= lo && a <= hi).map(([, , s]) => s);
  return hit.join(", ");
}

/** True when the activation pass gave us nothing to search on. Static advice
 *  rows must not render on their own: a tab of generic guidance dressed as
 *  criteria is worse than an empty tab that says so. */
export function nothingToSearchOn(f: ProspectFilters): boolean {
  return !has(f.titles) && !has(f.industries) && !has(f.geographies) &&
    !has(f.keywords) && !has(f.technologies) && !has(f.fundingStages) && !f.headcount.trim();
}

export function criteriaFor(
  platform: PlatformId,
  f: ProspectFilters,
  locale: Locale = "en",
): PlatformCriteria {
  const fr = locale === "fr";
  const label = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
  const rows: CriteriaRow[] = [];
  const blocks: CriteriaBlock[] = [];
  let note = "";
  let footer = "";

  const push = (field: string, value: string, why: string) => {
    if (value.trim()) rows.push({ field, value, why });
  };

  if (platform === "apollo") {
    note = fr
      ? "Apollo nomme ses filtres d\u2019apr\u00e8s ses champs d\u2019API, donc ceux-ci correspondent \u00e0 l\u2019\u00e9cran de recherche comme \u00e0 l\u2019API."
      : "Apollo names its filters after API fields, so these map onto both the search screen and the API.";
    push("person_titles", list(f.titles), fr ? "Variantes de titre pour un m\u00eame poste." : "Title variants for one job.");
    push("person_not_titles", list(f.excludeTitles), fr ? "Collisions de titres courantes." : "Common title collisions.");
    push("organization_num_employees_ranges", headcountRanges(f.headcount), fr ? "Votre disqualificateur, transform\u00e9 en filtre." : "Your disqualifier, made into a filter.");
    push("q_organization_keyword_tags", list(f.industries.concat(f.keywords)), fr ? "Cat\u00e9gorie plut\u00f4t que code sectoriel, plus fiable pour le logiciel." : "Category tags rather than industry codes, which are noisy for software.");
    push("not_organization_keyword_tags", list(f.excludeIndustries), fr ? "Ce qui ressemble \u00e0 votre cible sans en \u00eatre." : "What looks right and is not.");
    push("organization_latest_funding_stage_cd", list(f.fundingStages), fr ? "Le moment o\u00f9 le besoin appara\u00eet." : "When the need opens up.");
    push("person_locations", list(f.geographies), fr ? "Vos march\u00e9s actifs." : "Your active markets.");
    push("currently_using_any_of_technologies", list(f.technologies), fr ? "Une pile technique implique une fonction, donc un responsable." : "A stack implies a function implies an owner.");
    footer = fr
      ? "Enregistrez-la comme recherche nomm\u00e9e : Apollo la relance et fait remonter les personnes qui viennent de correspondre."
      : "Save it as a named search. Apollo re-runs saved searches and surfaces people who newly match.";
  }

  if (platform === "salesnav") {
    note = fr
      ? "Sales Navigator n\u2019a pas de noms de champs. Voici les panneaux de filtres tels qu\u2019ils apparaissent \u00e0 l\u2019\u00e9cran."
      : "Sales Navigator has no field names. These are the filter panels by the labels on screen.";
    push(fr ? "Intitul\u00e9 de poste actuel" : "Current job title", orQuoted(f.titles), fr ? "Utilisez le panneau des titres, pas les mots-cl\u00e9s." : "Use the title panel, not keywords. Keywords match anywhere on a profile.");
    push(fr ? "Effectif de l\u2019entreprise" : "Company headcount", salesNavBands(f.headcount), fr ? "Bandes fixes, arrondies \u00e0 partir de votre fourchette." : "Fixed bands, rounded out from your range.");
    push(fr ? "Secteur" : "Industry", list(f.industries), fr ? "La taxonomie LinkedIn est plus large que la v\u00f4tre." : "LinkedIn's taxonomy is broader than yours. Expect to trim.");
    push(fr ? "Zone g\u00e9ographique" : "Geography", list(f.geographies), fr ? "Vos march\u00e9s." : "Your markets.");
    if (has(f.hiringSignals)) {
      push(fr ? "A chang\u00e9 de poste ces 90 jours" : "Changed jobs in past 90 days", fr ? "Activ\u00e9" : "On", fr ? "Votre d\u00e9clencheur le plus fort, et un filtre en un clic ici. Aucun autre outil ne le donne aussi proprement." : "Your strongest trigger, and a one click filter here. No other tool gives it this cleanly.");
    }
    push(fr ? "Exclure" : "Exclude", fr ? "Contact\u00e9s ces 90 jours, vus ces 30 jours" : "Contacted in past 90 days, viewed in past 30 days", fr ? "\u00c9vite de retravailler la m\u00eame liste." : "Stops you re-working the same list.");
    const bool = [orQuoted(f.titles), has(f.excludeTitles) ? "NOT (" + orQuoted(f.excludeTitles) + ")" : ""].filter(Boolean).join(" ");
    if (bool) blocks.push({ label: fr ? "Champ mots-cl\u00e9s, si vous pr\u00e9f\u00e9rez une seule cha\u00eene" : "Keyword box, if you want one string", code: bool });
    footer = fr
      ? "Enregistrez comme liste de prospects et activez les alertes : Sales Navigator vous pr\u00e9viendra quand quelqu\u2019un correspond, ce qui est le d\u00e9clencheur qui arrive tout seul."
      : "Save as a lead list and turn on alerts. Sales Navigator tells you when someone new matches, which is the trigger arriving on its own.";
  }

  if (platform === "clay") {
    note = fr
      ? "Clay est un flux de travail plut\u00f4t qu\u2019une requ\u00eate. Voici la table \u00e0 construire, dans l\u2019ordre."
      : "Clay is a workflow rather than a query, so this is the table to build, in order.";
    rows.push({
      field: "1",
      value: fr ? "Source : Find People" : "Source: Find People",
      why: [list(f.titles) && "titles: " + list(f.titles), f.headcount && "headcount: " + f.headcount, list(f.geographies) && "locations: " + list(f.geographies)].filter(Boolean).join("\n"),
    });
    rows.push({ field: "2", value: fr ? "Enrichir : Find Company" : "Enrich: Find Company", why: fr ? "R\u00e9cup\u00e8re le stade de financement, l\u2019effectif et la pile technique pour que l\u2019\u00e9tape suivante puisse filtrer dessus." : "Pull funding stage, headcount and tech stack onto each row so the next step can filter on them." });
    const filt = [
      has(f.fundingStages) ? "funding_stage in (" + list(f.fundingStages) + ")" : "",
      has(f.excludeIndustries) ? "NOT company_type contains " + list(f.excludeIndustries) : "",
    ].filter(Boolean).join("\n");
    if (filt) rows.push({ field: "3", value: fr ? "Filtrer" : "Filter", why: filt });
    if (has(f.hiringSignals)) {
      rows.push({ field: "4", value: fr ? "Enrichir : signal de changement de poste" : "Enrich: job change signal", why: list(f.hiringSignals) });
    }
    rows.push({ field: String(rows.length + 1), value: fr ? "Invite Claygent" : "Claygent prompt", why: fr ? "Posez directement la question qui d\u00e9finit vraiment votre cible, plut\u00f4t que de vous fier \u00e0 l\u2019effectif comme approximation." : "Ask the question that actually defines your buyer, rather than trusting headcount as a proxy for it." });
    rows.push({ field: String(rows.length + 1), value: fr ? "Exporter" : "Export", why: fr ? "CSV vers votre s\u00e9quenceur, ou directement dans ReadProspects." : "CSV into your sequencer, or straight into ReadProspects as recipients." });
    footer = fr
      ? "L\u2019\u00e9tape Claygent est celle qui vaut son prix : l\u2019effectif est une approximation de votre disqualificateur, Clay peut aller v\u00e9rifier la chose elle-m\u00eame."
      : "The Claygent step is the one worth paying for. Headcount is a proxy for your disqualifier; Clay can go and check the actual thing.";
  }

  if (platform === "crunchbase") {
    note = fr
      ? "Crunchbase cherche des entreprises, pas des personnes. Servez-vous-en pour la liste de comptes, puis trouvez la personne ailleurs."
      : "Crunchbase searches companies, not people. Use it to build the account list, then find the person elsewhere.";
    push(fr ? "Secteurs" : "Industries", list(f.industries), fr ? "Les \u00e9tiquettes Crunchbase sont plus larges que ce que vous voulez." : "Crunchbase tags are broader than you want. Expect to trim.");
    push(fr ? "Dernier type de financement" : "Last funding type", list(f.fundingStages), fr ? "Votre fourchette de stade." : "Your stage band.");
    push(fr ? "Effectif" : "Number of employees", f.headcount, fr ? "Les bandes Crunchbase ne correspondent pas \u00e0 celles d\u2019Apollo." : "Crunchbase bands do not match Apollo's. These are the closest.");
    push(fr ? "Si\u00e8ge social" : "Headquarters location", list(f.geographies), fr ? "Vos march\u00e9s." : "Your markets.");
    push(fr ? "Statut" : "Operating status", fr ? "Actif" : "Active", fr ? "\u00c9limine les entreprises mortes, que Crunchbase conserve." : "Removes the dead ones, which Crunchbase keeps.");
    footer = fr
      ? "Exportez la liste d\u2019entreprises, puis passez les domaines dans Apollo ou Sales Navigator pour trouver la personne. Crunchbase est la source du d\u00e9clencheur, pas du contact."
      : "Export the company list, then run those domains through Apollo or Sales Navigator to find the person. Crunchbase is the trigger source, not the contact source.";
  }

  if (platform === "google") {
    note = fr
      ? "\u00c0 coller dans Google. Plus lent que les autres et gratuit, ce qui compte si vous testez encore si ce march\u00e9 m\u00e9rite un abonnement."
      : "Paste into Google. Slower than the others and it costs nothing, which matters if you are still testing whether this market is worth a subscription.";
    const excl = (f.excludeTitles.concat(f.excludeIndustries)).filter(Boolean).map((s) => "-" + s.split(/\s+/)[0]).join(" ");
    if (has(f.titles)) {
      blocks.push({
        label: fr ? "Les personnes" : "The people",
        code: ["site:linkedin.com/in", "(" + orQuoted(f.titles) + ")", has(f.industries) ? "(" + orQuoted(f.industries) + ")" : "", excl].filter(Boolean).join(" "),
      });
      blocks.push({
        label: fr ? "Le d\u00e9clencheur : ceux qui viennent d\u2019arriver" : "The trigger, people who just started",
        code: ['site:linkedin.com/posts ("excited to join" OR "starting a new role")', "(" + orQuoted(f.titles) + ")"].join(" "),
      });
    }
    footer = fr
      ? "Ajoutez un terme de localisation \u00e0 l\u2019une ou l\u2019autre. Google ne respecte pas de mani\u00e8re fiable un op\u00e9rateur de pays."
      : "Add a location term to any of these. Google will not respect a country operator reliably.";
  }

  if (platform === "pdl") {
    note = fr
      ? "PDL prend un corps JSON de style Elasticsearch. Voici la requ\u00eate, pr\u00eate \u00e0 envoyer."
      : "PDL takes an Elasticsearch style JSON body. This is the query itself, ready to send.";
    const must: string[] = [];
    if (has(f.titles)) must.push('        { "terms": { "job_title_levels": [' + f.titles.slice(0, 4).map((t) => '"' + t.toLowerCase().split(/\s+/)[0] + '"').join(", ") + "] } }");
    if (has(f.geographies)) must.push('        { "terms": { "location_country": [' + f.geographies.map((g) => '"' + g.toLowerCase() + '"').join(", ") + "] } }");
    if (has(f.industries)) must.push('        { "match": { "job_company_industry": "' + f.industries[0].toLowerCase() + '" } }');
    if (f.headcount.trim()) must.push('        { "terms": { "job_company_size": ["' + f.headcount.trim() + '"] } }');
    const mustNot = has(f.excludeIndustries)
      ? '      "must_not": [\n        { "terms": { "job_company_industry": [' + f.excludeIndustries.map((s) => '"' + s.toLowerCase() + '"').join(", ") + "] } }\n      ]"
      : "";
    blocks.push({
      label: fr ? "Corps de la requ\u00eate" : "Person Search query",
      code: ["{", '  "query": {', '    "bool": {', '      "must": [', must.join(",\n"), "      ]" + (mustNot ? "," : ""), mustNot, "    }", "  },", '  "size": 100', "}"].filter(Boolean).join("\n"),
    });
    footer = fr
      ? "Les noms de champs viennent du sch\u00e9ma PDL. V\u00e9rifiez-les dans leur documentation avant un gros lot : le sch\u00e9ma \u00e9volue."
      : "Field names are from the PDL person schema. Confirm against their current docs before a large run, since the schema does change.";
  }

  // Anything the model wrote for a named tool, kept verbatim rather than
  // reformatted: it knew what it was writing for.
  for (const s of f.searchStrings ?? []) {
    if (!s.query) continue;
    if (s.tool.toLowerCase().includes(platform) || (platform === "salesnav" && /sales|linkedin/i.test(s.tool))) {
      blocks.push({ label: s.tool, code: s.query });
    }
  }

  if (nothingToSearchOn(f)) return { id: platform, label, note, rows: [], blocks: [], footer: "" };
  return { id: platform, label, note, rows, blocks, footer };
}

export function allCriteria(f: ProspectFilters, locale: Locale = "en"): PlatformCriteria[] {
  return PLATFORMS.map((p) => criteriaFor(p.id, f, locale));
}

/** Plain text for the copy button, in the platform's own vocabulary. */
export function criteriaAsText(c: PlatformCriteria): string {
  const lines: string[] = [c.label, ""];
  for (const r of c.rows) lines.push(r.field + ": " + r.value);
  for (const b of c.blocks) lines.push("", b.label, b.code);
  return lines.join("\n");
}
