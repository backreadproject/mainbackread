import type { Locale } from "@/lib/i18n";

// Interface copy for the buyer profile. Kept out of lib/i18n.ts on purpose:
// that file already carries three duplicate `nav` objects and two `sidebar`
// blocks, and every patch against it has to disambiguate which one it means.
// One flat object per language, no nesting, nothing to mis-anchor.
export interface IcpCopy {
  title: string;
  subSelector: string;
  subForm: string;
  subDefinition: string;
  subHypothesis: string;
  sharedSuffix: string;
  loading: string;
  nothingYet: string;

  gateHead: string;
  gateBody: string;
  seePlans: string;

  askCustomers: string;
  askCustomersSub: string;
  selected: string;
  optManyH: string; optManyP: string;
  optFewH: string; optFewP: string;
  optNoneH: string; optNoneP: string;
  startN: (n: number) => string;
  starting: string;
  backToProfile: string;
  timeHint: string;
  whyFiveH: string;
  whyFiveP: string;

  questions: string;
  carriesWeight: string;
  discard: string;
  back: string;
  cont: string;
  build: string;
  building: string;
  takesAMinute: string;
  notReady: string;
  howManyCustomers: string;
  saved: string;
  savedSecs: (n: number) => string;
  savedMins: (n: number) => string;
  resumeOtherBranch: string;

  asserted: string;
  hypothesisTag: string;
  reanswer: string;
  readFirstH: string;
  readFirstP: string;
  hDefinition: string; sDefinition: string;
  hHypothesis: string;
  hTriggers: string; sTriggers: string;
  hCommittee: string; sCommittee: string; committeeHead: string;
  hFind: string; sFind: string;
  titleVariants: string; seniority: string; headcount: string; techSignals: string; communities: string; noneNamed: string;
  hDisq: string; sDisq: string;
  hAngles: string; sAngles: string;
  hTest: string; sTest: string;
  hFindings: string; sFindings: string;
  basisLabel: string; soWhatLabel: string;
  hTensions: string; sTensions: string;
  hMarket: string; sMarket: string; cautionLabel: string;
  hUnknowns: string; sUnknowns: string;
  hProbes: string; sProbes: string; probePlaceholder: string;
  rebuild: string; rebuilding: string; probesHint: string;
  hLimits: string;
  limitsTail: string;
  noResult: string; noResultHint: string;

  errLoad: string; errStart: string; errBuild: string; errDiscard: string;
  stanceSigns: string; stanceChampions: string; stanceBlocks: string;
}

const en: IcpCopy = {
  title: "Buyer profile",
  subSelector: "Before anything else, one question. It decides which questions you get and how strongly the result is worded.",
  subForm: "Answers save as you type.",
  subDefinition: "A definition, built from what you told us about customers who paid.",
  subHypothesis: "A hypothesis. Not a definition, and it should not be treated as one.",
  sharedSuffix: " Shared with everyone in your workspace.",
  loading: "Loading.",
  nothingYet: "Nothing here yet.",

  gateHead: "Not on the {plan} plan",
  gateBody: "Buyer profile is included from Personal upward.",
  seePlans: "See plans",

  askCustomers: "Do you have paying customers?",
  askCustomersSub: "Paying, not trialling. Not letters of intent.",
  selected: "Selected",
  optManyH: "Yes, more than five",
  optManyP: "Questions about who actually bought, when, and which ones went wrong. The result is a definition.",
  optFewH: "A handful, fewer than five",
  optFewP: "Too few to generalise from. You will get the startup questions, and the result will say it is a hypothesis.",
  optNoneH: "Not yet",
  optNoneP: "Questions about the conversations you have had. The result is a hypothesis with a two-week test attached.",
  startN: (n) => "Start \u2014 " + n + " questions",
  starting: "Starting",
  backToProfile: "Back to your profile",
  timeHint: "About twelve minutes. Answers save as you go.",
  whyFiveH: "Why five",
  whyFiveP: "Under five customers, a pattern and a coincidence look identical. The startup questions ask what you have actually observed instead of asking you to summarise a trend you cannot see yet, and the result says so, so you do not build a quarter of outbound on it.",

  questions: "Questions",
  carriesWeight: "Carries weight",
  discard: "Discard this profile",
  back: "Back",
  cont: "Continue",
  build: "Build the profile",
  building: "Building",
  takesAMinute: "This takes up to a minute.",
  notReady: "Answer at least three questions, including what you sell. A profile built on less is guesswork wearing a format.",
  howManyCustomers: "Roughly how many paying customers?",
  saved: "Saved",
  savedSecs: (n) => "Saved " + n + " seconds ago",
  savedMins: (n) => "Saved " + n + " min ago",
  resumeOtherBranch: "You have an unfinished profile on the other set of questions. Carry on with it, or discard it to start here.",

  asserted: "Asserted",
  hypothesisTag: "hypothesis",
  reanswer: "Re-answer",
  readFirstH: "Read this first",
  readFirstP: "Nobody has paid you yet, so every line below is a guess with reasoning attached rather than a finding. The test is at the bottom of this page. Sending four hundred emails against this before running it turns a wrong guess into a lost month instead of a lost afternoon.",
  hDefinition: "The definition",
  sDefinition: "Firmographic and situational together. The second half is the part that matters.",
  hHypothesis: "The hypothesis",
  hTriggers: "Trigger events",
  sTriggers: "What makes them move this quarter instead of next year. This is what outreach should be watching for.",
  hCommittee: "The buying committee",
  sCommittee: "Who signs, who champions, who blocks, and what each one is actually worried about.",
  committeeHead: "From what you described",
  hFind: "Where to find them",
  sFind: "Specific enough to paste. These become the search when enrichment is switched on.",
  titleVariants: "Title variants",
  seniority: "Seniority",
  headcount: "Headcount",
  techSignals: "Technology signals",
  communities: "Named communities",
  noneNamed: "None named.",
  hDisq: "Disqualifiers",
  sDisq: "Who looks right and is not. These save more time than targeting does.",
  hAngles: "Message angles",
  sAngles: "What has to be true for each person to reply. Not subject lines.",
  hTest: "How to test this in two weeks",
  sTest: "The point of this page. Everything above is unverified until this is done.",
  hFindings: "What follows from this",
  sFindings: "Consequences of your answers that you did not state. Each one cites the answers it rests on, so you can check it.",
  basisLabel: "Follows from",
  soWhatLabel: "So",
  hTensions: "Where your answers pull against each other",
  sTensions: "Two things you said that cannot both be fully true. Worth resolving before you build outreach on either.",
  hMarket: "Generally true of this market",
  sMarket: "Not from your answers. What is usually true of the group you named, and what would make it not apply to you.",
  cautionLabel: "Unless",
  hUnknowns: "What is missing",
  sUnknowns: "Not gaps for their own sake. Each one limits a conclusion this page would otherwise be able to draw.",
  hProbes: "Answer these and this page gets sharper",
  sProbes: "Short questions, answerable from memory. Each one names what it would unlock.",
  probePlaceholder: "A sentence or two is enough",
  rebuild: "Rebuild with these answers",
  rebuilding: "Rebuilding",
  probesHint: "Answer at least one, then rebuild. Rebuilding without new answers costs nothing and changes nothing.",
  hLimits: "What this cannot tell you",
  limitsTail: "Nothing above has been checked against who actually reads your documents. That comparison starts once about twenty readers have gone past page three, and when it disagrees with this page, this page is the thing that was wrong.",
  noResult: "This profile has no result yet.",
  noResultHint: "Answer the questions and build it.",

  errLoad: "Could not load your buyer profile.",
  errStart: "Could not start.",
  errBuild: "Could not build the profile.",
  errDiscard: "Could not discard.",
  stanceSigns: "signs",
  stanceChampions: "champions",
  stanceBlocks: "blocks",
};

const fr: IcpCopy = {
  title: "Profil client",
  subSelector: "Avant tout, une question. Elle d\u00e9termine quelles questions vous recevez et avec quelle fermet\u00e9 le r\u00e9sultat est formul\u00e9.",
  subForm: "Les r\u00e9ponses sont enregistr\u00e9es au fur et \u00e0 mesure.",
  subDefinition: "Une d\u00e9finition, construite \u00e0 partir de ce que vous nous avez dit sur des clients qui ont pay\u00e9.",
  subHypothesis: "Une hypoth\u00e8se. Pas une d\u00e9finition, et elle ne doit pas \u00eatre trait\u00e9e comme telle.",
  sharedSuffix: " Partag\u00e9 avec tout votre espace de travail.",
  loading: "Chargement.",
  nothingYet: "Rien ici pour l\u2019instant.",

  gateHead: "Non inclus dans le forfait {plan}",
  gateBody: "Le profil client est inclus \u00e0 partir du forfait Personal.",
  seePlans: "Voir les forfaits",

  askCustomers: "Avez-vous des clients payants ?",
  askCustomersSub: "Payants, pas en essai. Pas des lettres d\u2019intention.",
  selected: "S\u00e9lectionn\u00e9",
  optManyH: "Oui, plus de cinq",
  optManyP: "Des questions sur qui a r\u00e9ellement achet\u00e9, quand, et lesquels se sont mal pass\u00e9s. Le r\u00e9sultat est une d\u00e9finition.",
  optFewH: "Quelques-uns, moins de cinq",
  optFewP: "Trop peu pour g\u00e9n\u00e9raliser. Vous aurez les questions de d\u00e9marrage, et le r\u00e9sultat dira qu\u2019il s\u2019agit d\u2019une hypoth\u00e8se.",
  optNoneH: "Pas encore",
  optNoneP: "Des questions sur les conversations que vous avez eues. Le r\u00e9sultat est une hypoth\u00e8se accompagn\u00e9e d\u2019un test de deux semaines.",
  startN: (n) => "Commencer \u2014 " + n + " questions",
  starting: "D\u00e9marrage",
  backToProfile: "Retour \u00e0 votre profil",
  timeHint: "Environ douze minutes. Les r\u00e9ponses sont enregistr\u00e9es au fur et \u00e0 mesure.",
  whyFiveH: "Pourquoi cinq",
  whyFiveP: "En dessous de cinq clients, une tendance et une co\u00efncidence se ressemblent exactement. Les questions de d\u00e9marrage demandent ce que vous avez r\u00e9ellement observ\u00e9 plut\u00f4t que de vous faire r\u00e9sumer une tendance que vous ne pouvez pas encore voir, et le r\u00e9sultat le dit, pour que vous ne construisiez pas un trimestre de prospection dessus.",

  questions: "Questions",
  carriesWeight: "Question d\u00e9cisive",
  discard: "Supprimer ce profil",
  back: "Retour",
  cont: "Continuer",
  build: "Construire le profil",
  building: "Construction",
  takesAMinute: "Cela peut prendre jusqu\u2019\u00e0 une minute.",
  notReady: "R\u00e9pondez \u00e0 au moins trois questions, dont ce que vous vendez. Un profil construit sur moins n\u2019est qu\u2019une supposition mise en forme.",
  howManyCustomers: "Combien de clients payants, approximativement ?",
  saved: "Enregistr\u00e9",
  savedSecs: (n) => "Enregistr\u00e9 il y a " + n + " secondes",
  savedMins: (n) => "Enregistr\u00e9 il y a " + n + " min",
  resumeOtherBranch: "Vous avez un profil inachev\u00e9 sur l\u2019autre s\u00e9rie de questions. Continuez-le, ou supprimez-le pour commencer ici.",

  asserted: "D\u00e9clar\u00e9",
  hypothesisTag: "hypoth\u00e8se",
  reanswer: "R\u00e9pondre \u00e0 nouveau",
  readFirstH: "\u00c0 lire en premier",
  readFirstP: "Personne ne vous a encore pay\u00e9, donc chaque ligne ci-dessous est une supposition argument\u00e9e et non un constat. Le test se trouve en bas de cette page. Envoyer quatre cents e-mails sur cette base avant de l\u2019avoir men\u00e9 transforme une mauvaise supposition en un mois perdu plut\u00f4t qu\u2019en un apr\u00e8s-midi perdu.",
  hDefinition: "La d\u00e9finition",
  sDefinition: "Le profil d\u2019entreprise et la situation ensemble. C\u2019est la seconde moiti\u00e9 qui compte.",
  hHypothesis: "L\u2019hypoth\u00e8se",
  hTriggers: "\u00c9v\u00e9nements d\u00e9clencheurs",
  sTriggers: "Ce qui les fait bouger ce trimestre plut\u00f4t que l\u2019an prochain. C\u2019est ce que votre prospection doit surveiller.",
  hCommittee: "Le comit\u00e9 d\u2019achat",
  sCommittee: "Qui signe, qui d\u00e9fend, qui bloque, et ce qui pr\u00e9occupe r\u00e9ellement chacun.",
  committeeHead: "D\u2019apr\u00e8s ce que vous avez d\u00e9crit",
  hFind: "O\u00f9 les trouver",
  sFind: "Assez pr\u00e9cis pour \u00eatre coll\u00e9 tel quel. Cela deviendra la recherche lorsque l\u2019enrichissement sera activ\u00e9.",
  titleVariants: "Variantes d\u2019intitul\u00e9",
  seniority: "Niveau hi\u00e9rarchique",
  headcount: "Effectif",
  techSignals: "Signaux technologiques",
  communities: "Communaut\u00e9s nomm\u00e9es",
  noneNamed: "Aucune nomm\u00e9e.",
  hDisq: "Disqualifiants",
  sDisq: "Ceux qui semblent correspondre et ne correspondent pas. Ils font gagner plus de temps que le ciblage.",
  hAngles: "Angles de message",
  sAngles: "Ce qui doit \u00eatre vrai pour que chaque personne r\u00e9ponde. Pas des objets d\u2019e-mail.",
  hTest: "Comment tester cela en deux semaines",
  sTest: "Le c\u0153ur de cette page. Tout ce qui pr\u00e9c\u00e8de reste non v\u00e9rifi\u00e9 tant que ce n\u2019est pas fait.",
  hFindings: "Ce qui en d\u00e9coule",
  sFindings: "Des cons\u00e9quences de vos r\u00e9ponses que vous n\u2019avez pas formul\u00e9es. Chacune cite les r\u00e9ponses sur lesquelles elle repose, pour que vous puissiez v\u00e9rifier.",
  basisLabel: "D\u00e9coule de",
  soWhatLabel: "Donc",
  hTensions: "L\u00e0 o\u00f9 vos r\u00e9ponses se contredisent",
  sTensions: "Deux choses que vous avez dites qui ne peuvent pas \u00eatre enti\u00e8rement vraies en m\u00eame temps. \u00c0 trancher avant de b\u00e2tir une prospection sur l\u2019une ou l\u2019autre.",
  hMarket: "G\u00e9n\u00e9ralement vrai de ce march\u00e9",
  sMarket: "Ne vient pas de vos r\u00e9ponses. Ce qui est habituellement vrai du groupe que vous avez nomm\u00e9, et ce qui ferait que cela ne s\u2019applique pas \u00e0 vous.",
  cautionLabel: "Sauf si",
  hUnknowns: "Ce qui manque",
  sUnknowns: "Pas des lacunes pour elles-m\u00eames. Chacune emp\u00eache une conclusion que cette page pourrait autrement tirer.",
  hProbes: "R\u00e9pondez \u00e0 ceci et cette page s\u2019affine",
  sProbes: "Des questions courtes, auxquelles on r\u00e9pond de m\u00e9moire. Chacune indique ce qu\u2019elle permettrait de d\u00e9bloquer.",
  probePlaceholder: "Une ou deux phrases suffisent",
  rebuild: "Reconstruire avec ces r\u00e9ponses",
  rebuilding: "Reconstruction",
  probesHint: "R\u00e9pondez \u00e0 au moins une, puis reconstruisez. Reconstruire sans nouvelle r\u00e9ponse ne co\u00fbte rien et ne change rien.",
  hLimits: "Ce que ceci ne peut pas vous dire",
  limitsTail: "Rien de ce qui pr\u00e9c\u00e8de n\u2019a \u00e9t\u00e9 confront\u00e9 \u00e0 ceux qui lisent r\u00e9ellement vos documents. Cette comparaison commence lorsque environ vingt lecteurs ont d\u00e9pass\u00e9 la troisi\u00e8me page, et lorsqu\u2019elle contredit cette page, c\u2019est cette page qui avait tort.",
  noResult: "Ce profil n\u2019a pas encore de r\u00e9sultat.",
  noResultHint: "R\u00e9pondez aux questions et construisez-le.",

  errLoad: "Impossible de charger votre profil client.",
  errStart: "Impossible de commencer.",
  errBuild: "Impossible de construire le profil.",
  errDiscard: "Impossible de supprimer.",
  stanceSigns: "signe",
  stanceChampions: "d\u00e9fend",
  stanceBlocks: "bloque",
};

export function icpCopy(locale: Locale): IcpCopy {
  return locale === "fr" ? fr : en;
}