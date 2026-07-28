import type { Locale } from "@/lib/i18n";

// Copy for the v2 report. Separate file from lib/icp-copy.ts on purpose: that
// one carries the form and the selector, this one carries the report, and
// keeping them apart means neither patch can disturb the other.
export interface ReportCopy {
  // provenance
  stated: string; inferred: string; market: string;
  basis: string; unless: string; follows: string;
  // bands
  strong: string; mixed: string; weak: string; unknown: string;
  // progress
  building: (s: string) => string;
  buildAll: string; runSection: string; retrySection: string;
  sectionsDone: (n: number, total: number) => string;
  confidence: string; confidenceThin: string;
  // sections
  sSummary: string; sOpportunity: string; sEconomics: string;
  sSegments: string; sPersonas: string; sCommittee: string; sPsych: string; sAnti: string;
  sPains: string; sOutcomes: string; sTriggers: string; sObjections: string;
  sCriteria: string; sJourney: string; sKillers: string;
  sStack: string; sChannels: string; sSearch: string; sContent: string;
  sNorms: string; sAlternatives: string; sSignals: string;
  sHooks: string; sMessages: string; sOutreach: string; sScoring: string;
  sQualify: string; sFilters: string; sPricing: string; sMotion: string;
  sFindings: string; sTensions: string; sDoNext: string; sRisks: string;
  sUnknowns: string; sProbes: string; sLimits: string;
  // field labels
  fJudged: string; fAuthority: string; fTenure: string; fReports: string;
  fWants: string; fFears: string; fWin: string; fInfluence: string;
  fSeverity: string; fFelt: string; fCost: string; fCadence: string;
  fTheyAsk: string; fTheyWant: string; fMeasured: string;
  fRealConcern: string; fAnswer: string; fRaisedBy: string;
  fStalls: string; fPrevent: string; fEarly: string;
  fWhere: string; fMeaning: string; fWhyChosen: string; fWeakness: string;
  fWorksBecause: string; fRestsOn: string; fFirstMove: string; fHowCheck: string;
  fAsk: string; fGood: string; fWalk: string; fExpect: string;
  fIfTrue: string; fCheckBy: string; fSoWhat: string; fNotThis: string;
  fFrequency: string; fPriority: string; fDiffers: string;
  copy: string; copied: string;
}

const en: ReportCopy = {
  stated: "You said", inferred: "Follows", market: "Market",
  basis: "From", unless: "Unless", follows: "Follows from",
  strong: "Strong", mixed: "Mixed", weak: "Weak", unknown: "Not known",
  building: (s) => "Building " + s,
  buildAll: "Build the full report", runSection: "Build this section", retrySection: "Try this section again",
  sectionsDone: (n, t) => n + " of " + t + " sections built",
  confidence: "Confidence", confidenceThin: "This rests on thin answers.",
  sSummary: "Summary", sOpportunity: "Opportunity", sEconomics: "Deal shape",
  sSegments: "Segments", sPersonas: "Who decides", sCommittee: "The room", sPsych: "What drives them", sAnti: "Looks right, is not",
  sPains: "What hurts", sOutcomes: "What they actually want", sTriggers: "What starts a search", sObjections: "What they push back on",
  sCriteria: "What decides it", sJourney: "How the purchase runs", sKillers: "What kills deals",
  sStack: "What they already run", sChannels: "Where they are", sSearch: "What they search for", sContent: "What they read",
  sNorms: "How they take cold contact", sAlternatives: "What they use instead", sSignals: "Signals you can see",
  sHooks: "Openers", sMessages: "Ready to send", sOutreach: "Where to spend", sScoring: "Scoring signals",
  sQualify: "Qualifying questions", sFilters: "Prospecting filters", sPricing: "Pricing", sMotion: "Sales motion",
  sFindings: "What follows from this", sTensions: "Where your answers pull apart", sDoNext: "Do next", sRisks: "What would sink this",
  sUnknowns: "What is missing", sProbes: "Answer these and this gets sharper", sLimits: "What this cannot tell you",
  fJudged: "Judged on", fAuthority: "Can", fTenure: "Tenure", fReports: "Reports to",
  fWants: "Wants", fFears: "Fears", fWin: "Win them with", fInfluence: "Influence",
  fSeverity: "Severity", fFelt: "Felt by", fCost: "Costs", fCadence: "How often",
  fTheyAsk: "They ask for", fTheyWant: "They want", fMeasured: "Measured by",
  fRealConcern: "Really means", fAnswer: "Answer", fRaisedBy: "Raised by",
  fStalls: "Stalls when", fPrevent: "Prevent", fEarly: "Early warning",
  fWhere: "Visible at", fMeaning: "Means", fWhyChosen: "Chosen because", fWeakness: "Weakness",
  fWorksBecause: "Works because", fRestsOn: "Rests on", fFirstMove: "First move", fHowCheck: "Check",
  fAsk: "Ask", fGood: "Good answer", fWalk: "Walk away if", fExpect: "Expect",
  fIfTrue: "If true", fCheckBy: "Check by", fSoWhat: "So", fNotThis: "Not this",
  fFrequency: "Frequency", fPriority: "Priority", fDiffers: "Differs by",
  copy: "Copy", copied: "Copied",
};

const fr: ReportCopy = {
  stated: "Vous avez dit", inferred: "D\u00e9coule", market: "March\u00e9",
  basis: "De", unless: "Sauf si", follows: "D\u00e9coule de",
  strong: "Solide", mixed: "Mitig\u00e9", weak: "Faible", unknown: "Inconnu",
  building: (s) => "Construction : " + s,
  buildAll: "Construire le rapport complet", runSection: "Construire cette section", retrySection: "R\u00e9essayer cette section",
  sectionsDone: (n, t) => n + " sections sur " + t + " construites",
  confidence: "Confiance", confidenceThin: "Ceci repose sur des r\u00e9ponses minces.",
  sSummary: "R\u00e9sum\u00e9", sOpportunity: "Opportunit\u00e9", sEconomics: "Forme de l\u2019affaire",
  sSegments: "Segments", sPersonas: "Qui d\u00e9cide", sCommittee: "Les personnes autour de la table", sPsych: "Ce qui les motive", sAnti: "Semble correspondre, mais non",
  sPains: "Ce qui fait mal", sOutcomes: "Ce qu\u2019ils veulent vraiment", sTriggers: "Ce qui d\u00e9clenche la recherche", sObjections: "Leurs objections",
  sCriteria: "Ce qui d\u00e9cide", sJourney: "Le d\u00e9roul\u00e9 de l\u2019achat", sKillers: "Ce qui tue les affaires",
  sStack: "Ce qu\u2019ils utilisent d\u00e9j\u00e0", sChannels: "O\u00f9 ils se trouvent", sSearch: "Ce qu\u2019ils recherchent", sContent: "Ce qu\u2019ils lisent",
  sNorms: "Leur tol\u00e9rance au d\u00e9marchage", sAlternatives: "Ce qu\u2019ils utilisent \u00e0 la place", sSignals: "Signaux observables",
  sHooks: "Accroches", sMessages: "Pr\u00eat \u00e0 envoyer", sOutreach: "O\u00f9 investir", sScoring: "Signaux de scoring",
  sQualify: "Questions de qualification", sFilters: "Filtres de prospection", sPricing: "Tarification", sMotion: "Mod\u00e8le de vente",
  sFindings: "Ce qui en d\u00e9coule", sTensions: "L\u00e0 o\u00f9 vos r\u00e9ponses se contredisent", sDoNext: "\u00c0 faire ensuite", sRisks: "Ce qui pourrait tout remettre en cause",
  sUnknowns: "Ce qui manque", sProbes: "R\u00e9pondez \u00e0 ceci et cela s\u2019affine", sLimits: "Ce que ceci ne peut pas vous dire",
  fJudged: "\u00c9valu\u00e9 sur", fAuthority: "Peut", fTenure: "Anciennet\u00e9", fReports: "Rend compte \u00e0",
  fWants: "Veut", fFears: "Craint", fWin: "Les convaincre par", fInfluence: "Influence",
  fSeverity: "Gravit\u00e9", fFelt: "Subi par", fCost: "Co\u00fbte", fCadence: "Fr\u00e9quence",
  fTheyAsk: "Ils demandent", fTheyWant: "Ils veulent", fMeasured: "Mesur\u00e9 par",
  fRealConcern: "Signifie vraiment", fAnswer: "R\u00e9ponse", fRaisedBy: "Soulev\u00e9 par",
  fStalls: "Bloque quand", fPrevent: "Pr\u00e9venir", fEarly: "Signe avant-coureur",
  fWhere: "Visible sur", fMeaning: "Signifie", fWhyChosen: "Choisi parce que", fWeakness: "Faiblesse",
  fWorksBecause: "Fonctionne parce que", fRestsOn: "Repose sur", fFirstMove: "Premier pas", fHowCheck: "V\u00e9rifier",
  fAsk: "Demander", fGood: "Bonne r\u00e9ponse", fWalk: "Renoncer si", fExpect: "Attendre",
  fIfTrue: "Si vrai", fCheckBy: "V\u00e9rifier par", fSoWhat: "Donc", fNotThis: "Pas ceci",
  fFrequency: "Fr\u00e9quence", fPriority: "Priorit\u00e9", fDiffers: "Se distingue par",
  copy: "Copier", copied: "Copi\u00e9",
};

export function reportCopy(locale: Locale): ReportCopy {
  return locale === "fr" ? fr : en;
}