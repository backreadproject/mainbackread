import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";


const FEATURE_LABEL: Record<string, string> = {
  emailSend: "send documents by email",
  projects: "group documents into projects",
  linkCustomization: "customise reader links",
  conversationPersistence: "keep reader conversations",
  verdictHistory: "keep a history of verdicts",
  composeWorkspace: "the compose workspace for drafting follow-ups",
  attachDraftContext: "attach context to a draft",
  compoundingAcrossSends: "insight that compounds across sends",
  weeklyDigest: "the weekly digest",
  exportData: "export your data",
  organizations: "run an organization with roles and seats",
  compareReaders: "compare readers",
  accountAnalytics: "account analytics",
  granularPermissions: "granular, custom permissions",
  auditLog: "an audit log",
  customRetention: "custom data retention",
  abVersions: "A/B document versions",
  webhookAlerts: "Slack and webhook alerts",
  zapier: "the API, for Zapier and Make",
};

function cap(v: number | null): string {
  return v === null ? "unlimited" : String(v);
}

/** Plan facts, generated from the real config so support can never quote a
 *  stale limit. If lib/plans.ts changes, this changes with it. */
function planFacts(): string {
  return PLAN_ORDER.map((id) => {
    const p = PLANS[id];
    const l = p.limits;
    const on = Object.entries(p.features).filter(([, v]) => v).map(([k]) => FEATURE_LABEL[k] ?? k);
    return [
      `PLAN: ${PLANS[id].name}`,
      `  documents per month: ${cap(l.documentsPerMonth)}`,
      `  verdicts per document per month: ${cap(l.verdictsPerDocumentPerMonth)}`,
      `  recipients per document: ${cap(l.recipientsPerDocument)}`,
      `  email sends per month: ${cap(l.sendsPerMonth)}`,
      `  seats: ${cap(l.seats)}`,
      on.length ? `  includes: ${on.join("; ")}` : "  includes: the core reading intelligence only",
    ].join("\n");
  }).join("\n\n");
}

const PRODUCT = `
WHAT READPROSPECTS IS
ReadProspects lets you share a document with a named person through a private link,
then tells you how they read it. You see when they opened it, which pages held them,
what they re-read, what they asked, and whether they forwarded it. From that it
produces a verdict: a short read on what that person appears to be thinking and one
concrete thing to do next.

HOW SHARING WORKS
You upload a document and share it with a recipient by name. They get a private link
on relaydocuments.com, a neutral delivery domain, so the reader page carries no
ReadProspects branding. Each recipient gets their own link. You can send it by email
from inside ReadProspects, or copy the link and send it yourself.

THE DOCUMENT COMPANION
Readers can ask questions inside the document and get answers drawn from its contents.
Those questions are the strongest signal in the product: a question is stated intent.
Senders see the questions asked. Senders on Business who have configured Slack or
webhook alerts also receive the answer.

FORWARDING
A reader can forward the document to a colleague, who receives their own link. The
sender is told the document was forwarded and to how many people.

FILE TYPES
PDFs and images (JPEG, PNG, WebP, GIF). Word and PowerPoint are not supported yet:
export them as PDF first, which also means the reader sees the document exactly as
it was designed.

A/B VERSIONS (Business)
Upload two to four versions of the same document. Readers are split between them
automatically, or you can assign a version per recipient. The document page compares
readers, open rate, questions and forwards per version. Under six readers the product
says plainly that the sample is too small to call a winner.

CSV IMPORT
On a document page you can import recipients from a CSV. Download the template, upload
your file, fix anything flagged inline, then choose to create links only or send emails.

TRIALS AND BILLING
Company accounts get a 7-day trial. When a trial ends without a subscription, actions
that create new content are blocked while existing data stays accessible. Reader links
already sent keep working. Subscriptions are paid by card, monthly or annually.

PRIVACY
The privacy policy at readprospects.com/privacy explains what is collected. Readers have
their own notice at relaydocuments.com/privacy. Document text and reader questions are
sent to Anthropic, our AI provider, to generate answers and verdicts. Anthropic does not
train on this data. Senders are responsible for having a lawful basis to share a
recipient's details.
`.trim();

const FAQ = `
Q: Does the reader know they are being tracked?
A: The reader page is neutral and carries no ReadProspects branding. A privacy notice is
   linked from it, which explains plainly what is recorded and what the sender sees. As
   the sender, you are responsible for giving any notice the law requires where you are.

Q: Is there a watermark on my document?
A: No, on any plan. Your document goes out as your document.

Q: What happens when I hit a Free limit?
A: The action pauses and points you to the plan that lifts it. Nothing you have already
   sent or captured is touched.

Q: Can I use a verdict to make a decision about someone?
A: Not for anything consequential. Our terms forbid using verdicts for decisions about
   employment, credit, insurance, housing or anything with a similar effect on a person.
   A verdict is a commercial inference from limited evidence and can be wrong.

Q: Can I delete a reader's data?
A: Yes. Deleting a document removes its recipients, their signals and their conversations.
   A reader can also write to privacy@readprospects.com and ask to be erased.

Q: How do I cancel?
A: You can cancel at any time and it takes effect at the end of your current period.
   You keep everything you have created, and reader links already sent keep working.
`.trim();

export function supportKnowledge(): string {
  return [PRODUCT, "", "PLANS AND LIMITS", planFacts(), "", "COMMON QUESTIONS", FAQ].join("\n");
}

/** The FAQ as structured data, for the Help tab in the support widget.
 *  Kept here so the bot and the help articles never drift apart. */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How does sharing a document work?",
    a: "Upload a document, then share it with a recipient by name. They get a private link on relaydocuments.com, a neutral delivery domain, so the reader page carries no ReadProspects branding. Each recipient gets their own link. You can send it by email from inside ReadProspects, or copy the link and send it yourself.",
  },
  {
    q: "What is a verdict?",
    a: "A verdict reads one person's behaviour on one document: what held them, what they re-read, what they asked, whether they forwarded it. It returns a short assessment of what they appear to be thinking and one concrete thing to do next. Under six readers or with thin signals, it says so rather than inventing a story.",
  },
  {
    q: "What file types can I upload?",
    a: "PDFs and images (JPEG, PNG, WebP, GIF). Word and PowerPoint are not supported yet. Export them as PDF first, which also means your reader sees the document exactly as you designed it.",
  },
  {
    q: "Does the reader know they are being tracked?",
    a: "The reader page is neutral and carries no ReadProspects branding. A privacy notice is linked from it, which explains plainly what is recorded and what the sender sees. As the sender, you are responsible for giving any notice the law requires where you are.",
  },
  {
    q: "Is there a watermark on my document?",
    a: "No, on any plan. Your document goes out as your document.",
  },
  {
    q: "What happens when I hit a Free limit?",
    a: "The action pauses and points you to the plan that lifts it. Nothing you have already sent or captured is touched.",
  },
  {
    q: "Can I use a verdict to make a decision about someone?",
    a: "Not for anything consequential. Our terms forbid using verdicts for decisions about employment, credit, insurance, housing or anything with a similar effect on a person. A verdict is a commercial inference from limited evidence and can be wrong.",
  },
  {
    q: "How do A/B document versions work?",
    a: "On Business, upload two to four versions of the same document. Readers are split between them automatically, or you can assign a version per recipient. The document page compares readers, open rate, questions and forwards per version.",
  },
  {
    q: "Can I delete a reader's data?",
    a: "Yes. Deleting a document removes its recipients, their signals and their conversations. A reader can also write to privacy@readprospects.com and ask to be erased.",
  },
  {
    q: "How do I cancel?",
    a: "You can cancel at any time and it takes effect at the end of your current period. You keep everything you have created, and reader links you already sent keep working.",
  },
];

/** The same questions in French. Rendered verbatim in the widget, so unlike the
 *  knowledge base these cannot be left to the model to translate at runtime. */
export const FAQ_ITEMS_FR: { q: string; a: string }[] = [
  {
    q: "Comment fonctionne le partage d\u2019un document ?",
    a: "T\u00e9l\u00e9versez un document, puis partagez-le avec un destinataire nomm\u00e9. Il re\u00e7oit un lien priv\u00e9 sur relaydocuments.com, un domaine de livraison neutre, afin que la page de lecture ne porte aucune marque ReadProspects. Chaque destinataire a son propre lien. Vous pouvez l\u2019envoyer par e-mail depuis ReadProspects, ou copier le lien et l\u2019envoyer vous-m\u00eame.",
  },
  {
    q: "Qu\u2019est-ce qu\u2019un verdict ?",
    a: "Un verdict lit le comportement d\u2019une personne sur un document : ce qui l\u2019a retenue, ce qu\u2019elle a relu, ce qu\u2019elle a demand\u00e9, si elle l\u2019a transf\u00e9r\u00e9. Il rend une courte appr\u00e9ciation de ce qu\u2019elle semble penser et une chose concr\u00e8te \u00e0 faire ensuite. En dessous de six lecteurs ou avec des signaux faibles, il le dit plut\u00f4t que d\u2019inventer une histoire.",
  },
  {
    q: "Quels types de fichiers puis-je t\u00e9l\u00e9verser ?",
    a: "Des PDF et des images (JPEG, PNG, WebP, GIF). Word et PowerPoint ne sont pas encore pris en charge. Exportez-les d\u2019abord en PDF, ce qui garantit aussi que votre lecteur voit le document exactement tel que vous l\u2019avez con\u00e7u.",
  },
  {
    q: "Le lecteur sait-il qu\u2019il est suivi ?",
    a: "La page de lecture est neutre et ne porte aucune marque ReadProspects. Un avis de confidentialit\u00e9 y est li\u00e9, qui explique clairement ce qui est enregistr\u00e9 et ce que voit l\u2019exp\u00e9diteur. En tant qu\u2019exp\u00e9diteur, il vous revient de donner l\u2019information exig\u00e9e par la loi dans votre pays.",
  },
  {
    q: "Y a-t-il un filigrane sur mon document ?",
    a: "Non, sur aucun forfait. Votre document part tel qu\u2019il est.",
  },
  {
    q: "Que se passe-t-il quand j\u2019atteins une limite du forfait Gratuit ?",
    a: "L\u2019action s\u2019interrompt et vous indique le forfait qui l\u00e8ve cette limite. Rien de ce que vous avez d\u00e9j\u00e0 envoy\u00e9 ou captur\u00e9 n\u2019est touch\u00e9.",
  },
  {
    q: "Puis-je utiliser un verdict pour prendre une d\u00e9cision concernant quelqu\u2019un ?",
    a: "Pas pour quoi que ce soit de cons\u00e9quent. Nos conditions interdisent d\u2019utiliser les verdicts pour des d\u00e9cisions d\u2019emploi, de cr\u00e9dit, d\u2019assurance, de logement ou tout ce qui a un effet comparable sur une personne. Un verdict est une inf\u00e9rence commerciale tir\u00e9e de preuves limit\u00e9es et peut se tromper.",
  },
  {
    q: "Comment fonctionnent les versions A/B ?",
    a: "Avec Business, t\u00e9l\u00e9versez deux \u00e0 quatre versions du m\u00eame document. Les lecteurs sont r\u00e9partis automatiquement, ou vous pouvez attribuer une version par destinataire. La page du document compare lecteurs, taux d\u2019ouverture, questions et transferts par version.",
  },
  {
    q: "Puis-je supprimer les donn\u00e9es d\u2019un lecteur ?",
    a: "Oui. Supprimer un document supprime ses destinataires, leurs signaux et leurs conversations. Un lecteur peut aussi \u00e9crire \u00e0 privacy@readprospects.com pour demander son effacement.",
  },
  {
    q: "Comment r\u00e9silier ?",
    a: "Vous pouvez r\u00e9silier \u00e0 tout moment, avec effet \u00e0 la fin de la p\u00e9riode en cours. Vous conservez tout ce que vous avez cr\u00e9\u00e9, et les liens de lecture d\u00e9j\u00e0 envoy\u00e9s continuent de fonctionner.",
  },
];

/** The set for a given language. */
export function faqFor(locale: "en" | "fr") {
  return locale === "fr" ? FAQ_ITEMS_FR : FAQ_ITEMS;
}
