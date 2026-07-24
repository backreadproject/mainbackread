import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";

// The customer-facing name for each plan. lib/plans.ts still uses the internal
// names (Company I, Company II) while the pricing page sells Team and Business.
// Support must speak the customer's language, so map here.
const DISPLAY: Record<PlanId, string> = {
  free: "Free",
  personal: "Personal",
  company_1: "Team",
  company_2: "Business",
};

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
      `PLAN: ${DISPLAY[id]}`,
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
that create new content are blocked while existing data stays accessible. Paid billing
is not live yet, so nobody can be charged today.

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
   Billing is not live yet.
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
    a: "You can cancel at any time and it takes effect at the end of your current period. Billing is not live yet, so nobody can be charged today.",
  },
];
