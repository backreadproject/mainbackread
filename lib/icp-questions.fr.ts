import type { IcpQuestion } from "./icp-questions";

// French strings are \uXXXX escapes throughout, matching the convention in
// lib/i18n.ts. The risk is not the file: it is an accented character passing
// through a PowerShell console into a here-string on the way here.
export const OPERATING_FR: IcpQuestion[] = [
  { id: "sells", label: "Ce que vous vendez", q: "Que vendez-vous, en une phrase ?",
    why: "Des mots simples, comme vous le diriez \u00e0 quelqu\u2019un en face de vous. Le jargon de cat\u00e9gorie rend chaque ligne du r\u00e9sultat g\u00e9n\u00e9rique." },
  { id: "best", label: "Votre meilleur client", weight: true, q: "Nommez votre meilleur client. Pas un type de client, un vrai.",
    why: "Celui que vous voudriez cloner. Qui il est, ce qu\u2019il fait, sa taille approximative." },
  { id: "moment", label: "Ce qui a chang\u00e9", weight: true, q: "Que se passait-il dans son entreprise au moment de l\u2019achat ? Qu\u2019est-ce qui avait chang\u00e9 ?",
    why: "Le moment, pas la raison. Un recrutement, une lev\u00e9e de fonds, la victoire d\u2019un concurrent, un projet qui a \u00e9chou\u00e9, une date de renouvellement. C\u2019est la r\u00e9ponse qui transforme une description d\u2019acheteur en quelque chose que vous pouvez r\u00e9ellement aller chercher." },
  { id: "room", label: "Qui a sign\u00e9", q: "Qui a sign\u00e9, et qui d\u2019autre \u00e9tait dans la pi\u00e8ce ?",
    why: "Les intitul\u00e9s suffisent. Incluez toute personne qui aurait pu bloquer, m\u00eame si elle ne l\u2019a pas fait." },
  { id: "before", label: "Ce qu\u2019ils faisaient avant", q: "Que faisaient-ils avant vous ? Qu\u2019ont-ils remplac\u00e9 ou arr\u00eat\u00e9 ?",
    why: "Si la r\u00e9ponse honn\u00eate est rien, dites rien. Remplacer une habitude n\u2019est pas la m\u00eame vente que remplacer un fournisseur." },
  { id: "badfit", label: "Deux mauvais clients", weight: true, q: "Nommez deux clients qui n\u2019\u00e9taient pas faits pour vous. Qu\u2019avaient-ils en commun ?",
    why: "La question la plus utile ici. Partis, n\u00e9gociant sans fin, jamais vraiment d\u00e9marr\u00e9s, ou simplement \u00e9puisants. Ce qu\u2019ils partagent devient votre liste de disqualifiants, et les disqualifiants font gagner plus de temps que le ciblage." },
  { id: "deal", label: "Montant et dur\u00e9e", q: "Montant habituel, et temps n\u00e9cessaire pour conclure.",
    why: "Une fourchette suffit. Pr\u00e9cisez s\u2019il s\u2019agit d\u2019un forfait mensuel, d\u2019un projet, ou d\u2019un abonnement." },
  { id: "gather", label: "O\u00f9 ils se retrouvent", q: "O\u00f9 ces personnes se retrouvent-elles d\u00e9j\u00e0 ?",
    why: "Communaut\u00e9s, \u00e9v\u00e9nements, publications, newsletters, groupes de discussion. Nommez les vraies, pas les cat\u00e9gories." },
];

export const STARTUP_FR: IcpQuestion[] = [
  { id: "sells", label: "Ce que vous vendez", q: "Que vendez-vous, et qu\u2019est-ce que cela supprime ?",
    why: "Ce qui dispara\u00eet quand quelqu\u2019un ach\u00e8te. Du temps, du co\u00fbt, du risque, ou une t\u00e2che dont personne ne veut." },
  { id: "person", label: "Une personne r\u00e9elle", weight: true, q: "D\u00e9crivez une personne \u00e0 qui vous avez r\u00e9ellement parl\u00e9 et qui a ce probl\u00e8me s\u00e9rieusement.",
    why: "Pas un persona. Quelqu\u2019un \u00e0 qui vous avez parl\u00e9. Son r\u00f4le, son entreprise, et ce qu\u2019elle a dit." },
  { id: "today", label: "Ce qu\u2019ils font aujourd\u2019hui", q: "Que font-ils \u00e0 ce sujet aujourd\u2019hui ?",
    why: "M\u00eame si la r\u00e9ponse est un tableur et des jurons. Le statu quo est le concurrent que vous affrontez vraiment." },
  { id: "litup", label: "Qui a r\u00e9agi", weight: true, q: "Qui s\u2019est anim\u00e9 quand vous l\u2019avez d\u00e9crit, et qui non ?",
    why: "Ceux que cela n\u2019a pas int\u00e9ress\u00e9s comptent davantage. Un accord poli ne vous apprend rien. L\u2019indiff\u00e9rence vous montre o\u00f9 s\u2019arr\u00eate votre march\u00e9, et c\u2019est la seule preuve dont vous disposez avant que quelqu\u2019un paie." },
  { id: "urgent", label: "Ce qui rend urgent", q: "Que doit-il \u00eatre vrai d\u2019une entreprise pour que ce soit urgent plut\u00f4t qu\u2019int\u00e9ressant ?",
    why: "Int\u00e9ressant n\u2019obtient pas de budget. Nommez la condition qui en fait un probl\u00e8me de ce trimestre." },
  { id: "found", label: "O\u00f9 vous les avez trouv\u00e9s", q: "O\u00f9 avez-vous trouv\u00e9 les personnes \u00e0 qui vous avez d\u00e9j\u00e0 parl\u00e9 ?",
    why: "Soyez pr\u00e9cis, et dites si elles viennent toutes du m\u00eame endroit. Six conversations issues d\u2019un seul canal, c\u2019est un canal, pas un march\u00e9." },
  { id: "buy", label: "Ce qui d\u00e9clencherait l\u2019achat", q: "Que faudrait-il pour que quelqu\u2019un ach\u00e8te ce trimestre ?",
    why: "Le d\u00e9clencheur concret, pas la proposition de valeur." },
];