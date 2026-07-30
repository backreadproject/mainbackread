import MarketingNav from "../MarketingNav";
import { getLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Privacy policy",
  description: "How ReadProspects handles personal data, who the controller is, what the verdict engine does, and the rights available to readers.",
  alternates: { canonical: "https://readprospects.com/privacy" },
};

// BILINGUAL, English governing. The French carries a line saying so.
//
// NOT REVIEWED BY A LAWYER, in either language. The controller/processor split
// in section 3 and the profiling disclosure in section 9 are the two that most
// need a qualified eye, and both versions belong in one review.
const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Table = { head: string[]; rows: string[][] };
type Block = string | string[] | Table;
type Section = { id: string; h: string; body: Block[] };
const isTable = (b: Block): b is Table => typeof b === "object" && !Array.isArray(b) && "head" in b;

const SECTIONS: Section[] = [
  {
    id: "who",
    h: "1. Who we are",
    body: [
      "ReadProspects is operated by ReadProspects Technologies Nigeria (RC 9702396), registered at 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "This policy explains how we handle personal data across readprospects.com and app.readprospects.com. Our document delivery service at relaydocuments.com has its own notice, which readers see when they open a document.",
      "For all privacy matters, contact privacy@readprospects.com.",
    ],
  },
  {
    id: "short",
    h: "2. The short version",
    body: [
      "If you hold an account with us, we collect what we need to run your account and process what you upload. If someone shared a document with you and you opened it, we recorded how you read it on behalf of the person who sent it. Section 6 explains that.",
      "We use AI to answer readers' questions and to analyse how documents are read. Document content and reader questions are sent to our AI provider. Section 8 covers this, and section 9 covers the fact that our verdict feature profiles individual readers. Those two sections matter most.",
      "We do not sell personal data. We do not use it to train AI models.",
    ],
  },
  {
    id: "roles",
    h: "3. Our two roles",
    body: [
      "We handle two different kinds of personal data, and our legal responsibility differs for each.",
      [
        "Data about you, our account holder. Here we are the controller. We decide what to collect and why: your email, name, organization, billing status, and how you use the service.",
        "Data about readers of your documents. Here we act as a processor on your instructions. You decide who receives a document, so you are the controller of that data, and you are responsible for having a lawful basis to share it with us and for telling that person their reading is recorded.",
      ],
      "Because we design the analytics and AI features that operate on reader data, a supervisory authority may treat us as a joint controller for some of it. We accept that possibility and have written this policy to describe that processing openly rather than hide behind the processor label.",
    ],
  },
  {
    id: "account-data",
    h: "4. Data we collect about account holders",
    body: [
      [
        "Identity and account: email address, password (stored only as a hash by our authentication provider, never in readable form), first and last name, profile photo if you upload one, account type, and your workspace or organization name.",
        "Organization data: organization name, domain, members and their roles, pending invitations including the invitee's name and email, projects, and the access grants that control who can see what.",
        "Content you upload: documents in their original file form, the text we extract from them, page counts, and any variants you create for A/B testing.",
        "Usage and billing: which features you use, how many documents and verdicts you generate, your plan, trial status, and subscription state. Card details are handled entirely by our payment provider and do not reach our systems.",
        "Technical data: IP address, browser and device type, and diagnostic logs generated automatically when you use the service.",
        "Integration data: if you connect Slack, webhooks or our API, we store the endpoint URLs, a hashed API key, and delivery logs.",
      ],
    ],
  },
  {
    id: "lawful",
    h: "5. Why we process account data, and our legal basis",
    body: [
      "Under the Nigeria Data Protection Act 2023 and the GDPR where it applies, every use of personal data needs a lawful basis. Ours are:",
      {
        head: ["Purpose", "Legal basis"],
        rows: [
          ["Creating and running your account", "Performance of a contract with you"],
          ["Providing document, reader and verdict features", "Performance of a contract"],
          ["Billing and collecting payment", "Performance of a contract"],
          ["Security, abuse prevention, rate limiting", "Legitimate interests"],
          ["Product improvement and diagnostics", "Legitimate interests"],
          ["Service announcements and support", "Performance of a contract"],
          ["Marketing emails", "Consent, withdrawable at any time"],
          ["Meeting legal, tax and regulatory duties", "Legal obligation"],
        ],
      },
      "Where we rely on legitimate interests, we have weighed those against your rights and concluded they do not override them. You can ask us for that assessment.",
    ],
  },
  {
    id: "reader-data",
    h: "6. Data we process about readers",
    body: [
      "This is the part of our service most likely to affect someone who never signed up with us, so we describe it plainly.",
      "When you share a document, we process the recipient's name and email address as supplied by you, and we record how they read it: when they opened it, which pages they viewed and for how long, whether they returned to a page, any questions they typed into the document, and whether they forwarded it and to whom. Our hosting and database providers also log the reader's IP address as part of normal operation.",
      "We store the full conversation between a reader and the document's AI companion. In the sender's dashboard, senders see the questions asked but not the AI's answers. If a sender has configured Slack or webhook alerts, both the question and the AI's answer are delivered to their chosen destination at the moment the question is asked.",
      "If a reader forwards a document, we record the name and email of each colleague they send it to, because the reader entered those details in order to send it. Those colleagues can ask us to erase them, and we have a specific tool to do so.",
      "Your obligations as the sender. By sharing a document, you confirm that you have a lawful basis to provide us with that person's details, and that you will tell them their engagement with the document is recorded and analysed where the law requires it. The reader has no relationship with us, so only you can tell them. You indemnify us against claims arising from a failure to do so, as set out in our Terms.",
    ],
  },
  {
    id: "processors",
    h: "7. Sub-processors and service providers",
    body: [
      "We use the following providers. Each processes personal data on our behalf under contractual terms.",
      {
        head: ["Provider", "What they do", "Where"],
        rows: [
          ["Supabase", "Database, file storage, authentication", "United States"],
          ["Vercel", "Application hosting and delivery", "United States and global edge"],
          ["Anthropic", "AI processing of document content and reader questions", "United States"],
          ["Resend", "Sending emails to you and to your recipients", "United States"],
          ["GitHub", "Source code hosting (no customer personal data)", "United States"],
          ["Flutterwave", "Payment processing and subscription billing", "Nigeria"],
        ],
      },
      "We will update this list before adding a new provider that processes personal data.",
    ],
  },
  {
    id: "ai",
    h: "8. Artificial intelligence",
    body: [
      "We want to be specific here, because it is the processing least visible to the people affected by it.",
      "What is sent. When a reader asks a question, we send the document's extracted text and their question to Anthropic to generate an answer. When a document is an image or a scanned PDF, the image itself is sent to Anthropic so that its text can be read. When you run a verdict, we send the document text together with that reader's behavioural signals, meaning opens, page dwell, re-reads, questions and forwards, and the reader's name and organization.",
      "What comes back. An answer for the reader, or an assessment for you of what the reader appears to be thinking and what you might do next.",
      "What does not happen. Anthropic does not use this data to train their models. We do not use your documents or reader data to train any model. We do not sell this data.",
      "Its limits. AI output is generated text. It can be wrong, and a verdict is an inference from limited behavioural evidence, not a fact about a person. It should not be the sole basis for a consequential decision about anyone.",
    ],
  },
  {
    id: "profiling",
    h: "9. Profiling",
    body: [
      "Our verdict feature analyses an identified individual's behaviour and produces an assessment of their intent and likely next step. Under data protection law this is profiling, and we describe it as such rather than call it analytics.",
      "The profiling is not fully automated decision-making with legal or similarly significant effects, because a person, the sender, reads the assessment and decides what to do. Readers retain the right to object to profiling and to ask for erasure, as set out in section 12.",
    ],
  },
  {
    id: "transfers",
    h: "10. International transfers",
    body: [
      "Your data and your readers' data are transferred outside Nigeria, principally to the United States, because our infrastructure providers are based there.",
      "For transfers from Nigeria we rely on the safeguards permitted under the Nigeria Data Protection Act 2023, including contractual protections with each provider. For transfers of data originating in the European Economic Area or United Kingdom, we rely on Standard Contractual Clauses or an equivalent approved mechanism with each provider.",
    ],
  },
  {
    id: "security",
    h: "11. Security",
    body: [
      "Data is encrypted in transit and at rest. Document files are served through short-lived signed links rather than public URLs. Profile photos are stored in a public bucket and are accessible to anyone holding the link. Row-level database security separates one customer's data from another's, and the reader conversation transcript is restricted so that account holders cannot query it directly.",
      "Administrative access to customer data is restricted to authorised personnel. Every administrative action that changes or deletes data is recorded in an audit log. Administrative read access is not currently logged.",
      "No system is perfectly secure. If a breach occurs that is likely to result in risk to affected individuals, we will notify the Nigeria Data Protection Commission within 72 hours where required, and affected individuals without undue delay.",
    ],
  },
  {
    id: "retention",
    h: "12. How long we keep data, and your rights",
    body: [
      "Retention. We keep your account data for as long as your account is open. Documents and their associated reader data remain until you delete them or close your account. Deleting a document removes its recipients, their signals, their conversations and the underlying file. Closing your account removes your documents, their files, your profile photo and all associated reader data. After closure we retain limited records where we must for legal, tax or accounting reasons.",
      "Compliance records. Where we erase someone's data on request, we retain a minimal record of the request and the action taken, including the identifier used to make it, as evidence that we honoured it. Audit records of administrative actions are kept as a security control.",
      "Your rights. Subject to legal limits, you may ask us to give you a copy of your data, correct it, delete it, restrict or object to how we use it, provide it in a portable format, or withdraw consent where consent is the basis. You will not be treated less favourably for exercising any of these.",
      "If you are a reader, not an account holder, you have the same rights. The person who sent you the document is the controller of your data, so contacting them is usually fastest, but you may write to us at privacy@readprospects.com and we will act on your request, including erasing everything we hold about your reading of a document. If you were named as a colleague when someone forwarded a document, you may ask us to erase you, and we will remove your name and address from those records.",
      "We respond within 30 days.",
      "Complaints. You may complain to the Nigeria Data Protection Commission at ndpc.gov.ng. If you are in the European Economic Area or the United Kingdom, you may complain to your local supervisory authority.",
    ],
  },
  {
    id: "cookies",
    h: "13. Cookies",
    body: [
      "We use only cookies that are necessary to keep you signed in, remember your language, and keep the service secure. We do not use advertising cookies. If we introduce analytics or other non-essential cookies, we will ask for your consent first.",
    ],
  },
  {
    id: "children",
    h: "14. Children",
    body: [
      "The service is not intended for anyone under 18, and we do not knowingly collect their data. If you believe a child has provided us with personal data, contact us and we will delete it.",
    ],
  },
  {
    id: "changes",
    h: "15. Changes",
    body: [
      "We will post any change here and update the date above. If a change materially affects your rights, we will tell you directly before it takes effect.",
    ],
  },
  {
    id: "contact",
    h: "16. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "Email privacy@readprospects.com for any privacy question or to exercise a right.",
    ],
  },
];

const SECTIONS_FR: Section[] = [
  {
    id: "who",
    h: "1. Qui nous sommes",
    body: [
      "ReadProspects est exploit\u00e9 par ReadProspects Technologies Nigeria (RC 9702396), immatricul\u00e9e au 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "La pr\u00e9sente politique explique comment nous traitons les donn\u00e9es personnelles sur readprospects.com et app.readprospects.com. Notre service de livraison de documents relaydocuments.com dispose de son propre avis, que les lecteurs voient en ouvrant un document.",
      "Pour toute question de confidentialit\u00e9, \u00e9crivez \u00e0 privacy@readprospects.com.",
    ],
  },
  {
    id: "short",
    h: "2. En bref",
    body: [
      "Si vous avez un compte chez nous, nous collectons ce dont nous avons besoin pour le faire fonctionner et nous traitons ce que vous t\u00e9l\u00e9versez. Si quelqu\u2019un a partag\u00e9 un document avec vous et que vous l\u2019avez ouvert, nous avons enregistr\u00e9 votre lecture pour le compte de l\u2019exp\u00e9diteur. La section 6 l\u2019explique.",
      "Nous utilisons l\u2019IA pour r\u00e9pondre aux questions des lecteurs et analyser la fa\u00e7on dont les documents sont lus. Le contenu des documents et les questions des lecteurs sont transmis \u00e0 notre fournisseur d\u2019IA. La section 8 traite de ce point, et la section 9 du fait que notre fonction de verdict profile des lecteurs individuels. Ce sont les deux sections les plus importantes.",
      "Nous ne vendons pas de donn\u00e9es personnelles. Nous ne les utilisons pas pour entra\u00eener des mod\u00e8les d\u2019IA.",
    ],
  },
  {
    id: "roles",
    h: "3. Nos deux r\u00f4les",
    body: [
      "Nous traitons deux types de donn\u00e9es personnelles, et notre responsabilit\u00e9 juridique diff\u00e8re pour chacun.",
      [
        "Les donn\u00e9es vous concernant, titulaire du compte. Nous en sommes le responsable de traitement. Nous d\u00e9cidons de ce qui est collect\u00e9 et pourquoi : votre e-mail, votre nom, votre organisation, votre statut de facturation, et votre usage du service.",
        "Les donn\u00e9es concernant les lecteurs de vos documents. Nous agissons en qualit\u00e9 de sous-traitant, sur vos instructions. C\u2019est vous qui d\u00e9cidez qui re\u00e7oit un document : vous \u00eates donc le responsable de traitement de ces donn\u00e9es, et il vous revient de disposer d\u2019une base l\u00e9gale pour nous les transmettre et d\u2019informer la personne que sa lecture est enregistr\u00e9e.",
      ],
      "Parce que nous con\u00e7evons les fonctions d\u2019analyse et d\u2019IA qui op\u00e8rent sur les donn\u00e9es des lecteurs, une autorit\u00e9 de contr\u00f4le pourrait nous consid\u00e9rer comme responsable conjoint pour une partie d\u2019entre elles. Nous admettons cette possibilit\u00e9 et avons r\u00e9dig\u00e9 cette politique pour d\u00e9crire ce traitement ouvertement plut\u00f4t que de nous abriter derri\u00e8re la qualit\u00e9 de sous-traitant.",
    ],
  },
  {
    id: "account-data",
    h: "4. Donn\u00e9es que nous collectons sur les titulaires de compte",
    body: [
      [
        "Identit\u00e9 et compte : adresse e-mail, mot de passe (conserv\u00e9 uniquement sous forme de hachage par notre fournisseur d\u2019authentification, jamais en clair), pr\u00e9nom et nom, photo de profil si vous en t\u00e9l\u00e9versez une, type de compte, et le nom de votre espace de travail ou de votre organisation.",
        "Donn\u00e9es d\u2019organisation : nom de l\u2019organisation, domaine, membres et leurs r\u00f4les, invitations en attente y compris le nom et l\u2019e-mail de l\u2019invit\u00e9, projets, et les autorisations d\u2019acc\u00e8s qui d\u00e9terminent qui voit quoi.",
        "Contenus que vous t\u00e9l\u00e9versez : les documents dans leur format d\u2019origine, le texte que nous en extrayons, le nombre de pages, et les variantes cr\u00e9\u00e9es pour les tests A/B.",
        "Usage et facturation : les fonctionnalit\u00e9s utilis\u00e9es, le nombre de documents et de verdicts g\u00e9n\u00e9r\u00e9s, votre forfait, l\u2019\u00e9tat de votre essai et de votre abonnement. Les coordonn\u00e9es bancaires sont trait\u00e9es enti\u00e8rement par notre prestataire de paiement et ne parviennent pas \u00e0 nos syst\u00e8mes.",
        "Donn\u00e9es techniques : adresse IP, type de navigateur et d\u2019appareil, et journaux de diagnostic g\u00e9n\u00e9r\u00e9s automatiquement lors de votre utilisation du service.",
        "Donn\u00e9es d\u2019int\u00e9gration : si vous connectez Slack, des webhooks ou notre API, nous conservons les URL de destination, une cl\u00e9 d\u2019API hach\u00e9e, et les journaux de livraison.",
      ],
    ],
  },
  {
    id: "lawful",
    h: "5. Pourquoi nous traitons les donn\u00e9es de compte, et sur quelle base l\u00e9gale",
    body: [
      "Au titre de la loi nig\u00e9riane sur la protection des donn\u00e9es de 2023 et du RGPD lorsqu\u2019il s\u2019applique, tout usage de donn\u00e9es personnelles requiert une base l\u00e9gale. Les n\u00f4tres sont :",
      {
        head: ["Finalit\u00e9", "Base l\u00e9gale"],
        rows: [
          ["Cr\u00e9er et faire fonctionner votre compte", "Ex\u00e9cution d\u2019un contrat avec vous"],
          ["Fournir les fonctions document, lecteur et verdict", "Ex\u00e9cution d\u2019un contrat"],
          ["Facturation et encaissement", "Ex\u00e9cution d\u2019un contrat"],
          ["S\u00e9curit\u00e9, pr\u00e9vention des abus, limitation de d\u00e9bit", "Int\u00e9r\u00eats l\u00e9gitimes"],
          ["Am\u00e9lioration du produit et diagnostics", "Int\u00e9r\u00eats l\u00e9gitimes"],
          ["Annonces de service et assistance", "Ex\u00e9cution d\u2019un contrat"],
          ["E-mails marketing", "Consentement, retirable \u00e0 tout moment"],
          ["Obligations l\u00e9gales, fiscales et r\u00e9glementaires", "Obligation l\u00e9gale"],
        ],
      },
      "Lorsque nous invoquons les int\u00e9r\u00eats l\u00e9gitimes, nous les avons mis en balance avec vos droits et conclu qu\u2019ils ne pr\u00e9valent pas sur eux. Vous pouvez nous demander cette analyse.",
    ],
  },
  {
    id: "reader-data",
    h: "6. Donn\u00e9es que nous traitons sur les lecteurs",
    body: [
      "C\u2019est la partie de notre service la plus susceptible de concerner une personne qui ne s\u2019est jamais inscrite chez nous : nous la d\u00e9crivons donc clairement.",
      "Lorsque vous partagez un document, nous traitons le nom et l\u2019adresse e-mail du destinataire tels que vous les fournissez, et nous enregistrons sa lecture : quand il l\u2019a ouvert, quelles pages il a consult\u00e9es et combien de temps, s\u2019il est revenu sur une page, les questions qu\u2019il a saisies dans le document, et s\u2019il l\u2019a transf\u00e9r\u00e9 et \u00e0 qui. Nos h\u00e9bergeurs et notre fournisseur de base de donn\u00e9es enregistrent \u00e9galement l\u2019adresse IP du lecteur dans le cadre du fonctionnement normal.",
      "Nous conservons l\u2019int\u00e9gralit\u00e9 de la conversation entre un lecteur et le compagnon d\u2019IA du document. Dans le tableau de bord de l\u2019exp\u00e9diteur, celui-ci voit les questions pos\u00e9es mais non les r\u00e9ponses de l\u2019IA. Si l\u2019exp\u00e9diteur a configur\u00e9 des alertes Slack ou webhook, la question et la r\u00e9ponse de l\u2019IA sont toutes deux transmises \u00e0 la destination choisie au moment o\u00f9 la question est pos\u00e9e.",
      "Si un lecteur transf\u00e8re un document, nous enregistrons le nom et l\u2019e-mail de chaque coll\u00e8gue \u00e0 qui il l\u2019envoie, puisque le lecteur a saisi ces coordonn\u00e9es pour proc\u00e9der \u00e0 l\u2019envoi. Ces coll\u00e8gues peuvent nous demander leur effacement, et nous disposons d\u2019un outil sp\u00e9cifique \u00e0 cet effet.",
      "Vos obligations en tant qu\u2019exp\u00e9diteur. En partageant un document, vous confirmez disposer d\u2019une base l\u00e9gale pour nous transmettre les coordonn\u00e9es de cette personne, et que vous l\u2019informerez que son interaction avec le document est enregistr\u00e9e et analys\u00e9e lorsque la loi l\u2019exige. Le lecteur n\u2019a aucune relation avec nous : vous seul pouvez l\u2019en informer. Vous nous garantissez contre les r\u00e9clamations d\u00e9coulant d\u2019un manquement \u00e0 cette obligation, comme pr\u00e9vu dans nos Conditions.",
    ],
  },
  {
    id: "processors",
    h: "7. Sous-traitants ult\u00e9rieurs et prestataires",
    body: [
      "Nous recourons aux prestataires suivants. Chacun traite des donn\u00e9es personnelles pour notre compte dans un cadre contractuel.",
      {
        head: ["Prestataire", "R\u00f4le", "Lieu"],
        rows: [
          ["Supabase", "Base de donn\u00e9es, stockage de fichiers, authentification", "\u00c9tats-Unis"],
          ["Vercel", "H\u00e9bergement et diffusion de l\u2019application", "\u00c9tats-Unis et r\u00e9seau mondial"],
          ["Anthropic", "Traitement par IA du contenu des documents et des questions des lecteurs", "\u00c9tats-Unis"],
          ["Resend", "Envoi des e-mails \u00e0 vous et \u00e0 vos destinataires", "\u00c9tats-Unis"],
          ["GitHub", "H\u00e9bergement du code source (aucune donn\u00e9e personnelle client)", "\u00c9tats-Unis"],
          ["Flutterwave", "Traitement des paiements et facturation des abonnements", "Nigeria"],
        ],
      },
      "Nous mettrons cette liste \u00e0 jour avant d\u2019ajouter un nouveau prestataire traitant des donn\u00e9es personnelles.",
    ],
  },
  {
    id: "ai",
    h: "8. Intelligence artificielle",
    body: [
      "Nous voulons \u00eatre pr\u00e9cis ici, car c\u2019est le traitement le moins visible pour les personnes qu\u2019il concerne.",
      "Ce qui est envoy\u00e9. Lorsqu\u2019un lecteur pose une question, nous transmettons \u00e0 Anthropic le texte extrait du document et sa question pour g\u00e9n\u00e9rer une r\u00e9ponse. Lorsqu\u2019un document est une image ou un PDF num\u00e9ris\u00e9, l\u2019image elle-m\u00eame est envoy\u00e9e \u00e0 Anthropic afin d\u2019en lire le texte. Lorsque vous g\u00e9n\u00e9rez un verdict, nous envoyons le texte du document ainsi que les signaux comportementaux de ce lecteur \u2014 ouvertures, temps pass\u00e9 par page, relectures, questions et transferts \u2014 ainsi que son nom et son organisation.",
      "Ce qui revient. Une r\u00e9ponse pour le lecteur, ou une \u00e9valuation \u00e0 votre intention de ce que le lecteur semble penser et de ce que vous pourriez faire ensuite.",
      "Ce qui n\u2019a pas lieu. Anthropic n\u2019utilise pas ces donn\u00e9es pour entra\u00eener ses mod\u00e8les. Nous n\u2019utilisons ni vos documents ni les donn\u00e9es des lecteurs pour entra\u00eener un mod\u00e8le. Nous ne vendons pas ces donn\u00e9es.",
      "Ses limites. Une production d\u2019IA est du texte g\u00e9n\u00e9r\u00e9. Elle peut \u00eatre erron\u00e9e, et un verdict est une inf\u00e9rence tir\u00e9e de preuves comportementales limit\u00e9es, non un fait concernant une personne. Il ne doit pas constituer le seul fondement d\u2019une d\u00e9cision cons\u00e9quente \u00e0 l\u2019\u00e9gard de quiconque.",
    ],
  },
  {
    id: "profiling",
    h: "9. Profilage",
    body: [
      "Notre fonction de verdict analyse le comportement d\u2019une personne identifi\u00e9e et produit une \u00e9valuation de son intention et de son \u00e9tape suivante probable. En droit de la protection des donn\u00e9es, il s\u2019agit d\u2019un profilage, et nous le d\u00e9signons comme tel plut\u00f4t que de parler d\u2019analyse.",
      "Ce profilage ne constitue pas une d\u00e9cision enti\u00e8rement automatis\u00e9e produisant des effets juridiques ou significatifs comparables, car une personne \u2014 l\u2019exp\u00e9diteur \u2014 lit l\u2019\u00e9valuation et d\u00e9cide de la suite. Les lecteurs conservent le droit de s\u2019opposer au profilage et de demander l\u2019effacement, comme indiqu\u00e9 \u00e0 la section 12.",
    ],
  },
  {
    id: "transfers",
    h: "10. Transferts internationaux",
    body: [
      "Vos donn\u00e9es et celles de vos lecteurs sont transf\u00e9r\u00e9es hors du Nigeria, principalement vers les \u00c9tats-Unis, car nos prestataires d\u2019infrastructure y sont \u00e9tablis.",
      "Pour les transferts depuis le Nigeria, nous nous appuyons sur les garanties admises par la loi nig\u00e9riane sur la protection des donn\u00e9es de 2023, y compris des protections contractuelles avec chaque prestataire. Pour les transferts de donn\u00e9es provenant de l\u2019Espace \u00e9conomique europ\u00e9en ou du Royaume-Uni, nous nous appuyons sur les clauses contractuelles types ou un m\u00e9canisme approuv\u00e9 \u00e9quivalent avec chaque prestataire.",
    ],
  },
  {
    id: "security",
    h: "11. S\u00e9curit\u00e9",
    body: [
      "Les donn\u00e9es sont chiffr\u00e9es en transit et au repos. Les fichiers des documents sont servis par des liens sign\u00e9s de courte dur\u00e9e plut\u00f4t que par des URL publiques. Les photos de profil sont stock\u00e9es dans un espace public et accessibles \u00e0 quiconque d\u00e9tient le lien. La s\u00e9curit\u00e9 au niveau des lignes s\u00e9pare les donn\u00e9es d\u2019un client de celles d\u2019un autre, et la transcription des conversations avec les lecteurs est restreinte de sorte que les titulaires de compte ne puissent pas l\u2019interroger directement.",
      "L\u2019acc\u00e8s administratif aux donn\u00e9es clients est limit\u00e9 au personnel autoris\u00e9. Toute action administrative qui modifie ou supprime des donn\u00e9es est consign\u00e9e dans un journal d\u2019audit. Les acc\u00e8s administratifs en lecture ne sont pas actuellement journalis\u00e9s.",
      "Aucun syst\u00e8me n\u2019est parfaitement s\u00fbr. En cas de violation susceptible d\u2019entra\u00eener un risque pour les personnes concern\u00e9es, nous en informerons la Nigeria Data Protection Commission dans les 72 heures lorsque cela est requis, et les personnes concern\u00e9es sans retard injustifi\u00e9.",
    ],
  },
  {
    id: "retention",
    h: "12. Dur\u00e9e de conservation et vos droits",
    body: [
      "Conservation. Nous conservons les donn\u00e9es de votre compte tant qu\u2019il reste ouvert. Les documents et les donn\u00e9es de lecture associ\u00e9es demeurent jusqu\u2019\u00e0 ce que vous les supprimiez ou fermiez votre compte. Supprimer un document supprime ses destinataires, leurs signaux, leurs conversations et le fichier sous-jacent. Fermer votre compte supprime vos documents, leurs fichiers, votre photo de profil et toutes les donn\u00e9es de lecture associ\u00e9es. Apr\u00e8s fermeture, nous conservons des enregistrements limit\u00e9s lorsque la loi, la fiscalit\u00e9 ou la comptabilit\u00e9 l\u2019exigent.",
      "Preuves de conformit\u00e9. Lorsque nous effa\u00e7ons les donn\u00e9es d\u2019une personne \u00e0 sa demande, nous conservons un enregistrement minimal de la demande et de l\u2019action men\u00e9e, y compris l\u2019identifiant utilis\u00e9, comme preuve que nous y avons donn\u00e9 suite. Les enregistrements d\u2019audit des actions administratives sont conserv\u00e9s \u00e0 titre de mesure de s\u00e9curit\u00e9.",
      "Vos droits. Sous r\u00e9serve des limites l\u00e9gales, vous pouvez nous demander une copie de vos donn\u00e9es, leur rectification, leur suppression, la limitation de leur usage ou vous y opposer, leur portabilit\u00e9, ou retirer votre consentement lorsque celui-ci est la base du traitement. Vous ne serez pas trait\u00e9 moins favorablement pour avoir exerc\u00e9 l\u2019un de ces droits.",
      "Si vous \u00eates lecteur et non titulaire d\u2019un compte, vous disposez des m\u00eames droits. La personne qui vous a envoy\u00e9 le document est le responsable de traitement de vos donn\u00e9es : la contacter est g\u00e9n\u00e9ralement le plus rapide, mais vous pouvez nous \u00e9crire \u00e0 privacy@readprospects.com et nous donnerons suite \u00e0 votre demande, y compris en effa\u00e7ant tout ce que nous d\u00e9tenons sur votre lecture d\u2019un document. Si vous avez \u00e9t\u00e9 d\u00e9sign\u00e9 comme coll\u00e8gue lors d\u2019un transfert, vous pouvez nous demander votre effacement, et nous retirerons votre nom et votre adresse de ces enregistrements.",
      "Nous r\u00e9pondons sous 30 jours.",
      "R\u00e9clamations. Vous pouvez saisir la Nigeria Data Protection Commission sur ndpc.gov.ng. Si vous vous trouvez dans l\u2019Espace \u00e9conomique europ\u00e9en ou au Royaume-Uni, vous pouvez saisir votre autorit\u00e9 de contr\u00f4le locale.",
    ],
  },
  {
    id: "cookies",
    h: "13. Cookies",
    body: [
      "Nous n\u2019utilisons que les cookies n\u00e9cessaires pour vous maintenir connect\u00e9, m\u00e9moriser votre langue et assurer la s\u00e9curit\u00e9 du service. Nous n\u2019utilisons pas de cookies publicitaires. Si nous introduisons des cookies d\u2019analyse ou d\u2019autres cookies non essentiels, nous demanderons d\u2019abord votre consentement.",
    ],
  },
  {
    id: "children",
    h: "14. Mineurs",
    body: [
      "Le service n\u2019est pas destin\u00e9 aux personnes de moins de 18 ans, et nous ne collectons pas sciemment leurs donn\u00e9es. Si vous pensez qu\u2019un mineur nous a communiqu\u00e9 des donn\u00e9es personnelles, contactez-nous et nous les supprimerons.",
    ],
  },
  {
    id: "changes",
    h: "15. Modifications",
    body: [
      "Nous publierons ici toute modification et mettrons \u00e0 jour la date ci-dessus. Si un changement affecte substantiellement vos droits, nous vous en informerons directement avant son entr\u00e9e en vigueur.",
    ],
  },
  {
    id: "contact",
    h: "16. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "\u00c9crivez \u00e0 privacy@readprospects.com pour toute question de confidentialit\u00e9 ou pour exercer un droit.",
    ],
  },
];

const COPY = {
  en: {
    updated: "24th July 2026",
    badge: "NDPR and GDPR aligned",
    h1: "Privacy Policy",
    lead: "Your documents, and the trust of the people who read them, are yours. Here is exactly how we protect both.",
    lastUpdated: "Last updated:",
    summary: "Summary",
    points: [
      "We collect only what we need to run ReadProspects well.",
      "We never sell your data, and we never train AI models on your documents.",
      "Document text and reader questions are sent to our AI provider, Anthropic.",
      "Our verdict feature profiles individual readers. We say so plainly in section 9.",
      "Readers, and people named in a forward, can ask us to erase them at any time.",
    ],
    tagline: "ReadProspects, the document reads the reader.",
    fPricing: "Pricing", fPrivacy: "Privacy", fTerms: "Terms", fSignin: "Sign in",
    governing: "",
  },
  fr: {
    updated: "24 juillet 2026",
    badge: "Conforme NDPR et RGPD",
    h1: "Politique de confidentialit\u00e9",
    lead: "Vos documents, et la confiance de ceux qui les lisent, vous appartiennent. Voici exactement comment nous prot\u00e9geons les deux.",
    lastUpdated: "Derni\u00e8re mise \u00e0 jour :",
    summary: "En r\u00e9sum\u00e9",
    points: [
      "Nous ne collectons que ce dont nous avons besoin pour bien faire fonctionner ReadProspects.",
      "Nous ne vendons jamais vos donn\u00e9es, et nous n\u2019entra\u00eenons jamais de mod\u00e8les d\u2019IA sur vos documents.",
      "Le texte des documents et les questions des lecteurs sont transmis \u00e0 notre fournisseur d\u2019IA, Anthropic.",
      "Notre fonction de verdict profile des lecteurs individuels. Nous le disons clairement \u00e0 la section 9.",
      "Les lecteurs, et les personnes nomm\u00e9es lors d\u2019un transfert, peuvent demander leur effacement \u00e0 tout moment.",
    ],
    tagline: "ReadProspects, le document lit le lecteur.",
    fPricing: "Tarifs", fPrivacy: "Confidentialit\u00e9", fTerms: "Conditions", fSignin: "Se connecter",
    governing: "Cette traduction est fournie pour votre commodit\u00e9. En cas de divergence, la version anglaise fait foi.",
  },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const sections = locale === "fr" ? SECTIONS_FR : SECTIONS;
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`.lg-a{color:${GREEN_TEXT};text-decoration:none}.lg-a:hover{text-decoration:underline}@media(max-width:640px){.lg-h1{font-size:34px!important}.lg-body{font-size:15px!important}}`}</style>
      <MarketingNav locale={locale} />

      <section style={{ background: GRADIENT, color: "#fff", padding: "148px 0 76px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(216,232,74,0.14)", border: "1px solid rgba(216,232,74,0.40)", color: LEMON, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 22, textTransform: "uppercase" }}>{c.badge}</div>
          <h1 className="lg-h1" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>{c.h1}</h1>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 auto", maxWidth: 560, lineHeight: 1.55 }}>{c.lead}</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "18px 0 0" }}>{c.lastUpdated} {c.updated}</p>
        </div>
      </section>

      <section style={{ padding: "56px 0 40px" }}>
        <div style={wrap}>
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 26, marginBottom: 44, boxShadow: "0 8px 30px rgba(11,122,75,0.08)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, margin: "0 0 14px" }}>{c.summary}</h2>
            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {c.points.map((t, i) => (
                <li key={i} style={{ fontSize: 16, lineHeight: 1.5, color: BODY }}>{t}</li>
              ))}
            </ul>
          </div>

          {sections.map((sec) => (
            <div key={sec.id} id={sec.id} style={{ marginBottom: 38, scrollMarginTop: 90 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: "0 0 12px" }}>{sec.h}</h2>
              {sec.body.map((b, i) =>
                isTable(b) ? (
                  <div key={i} style={{ overflowX: "auto", margin: "0 0 16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                      <thead>
                        <tr>
                          {b.head.map((h, k) => (
                            <th key={k} style={{ textAlign: "left", padding: "10px 12px 10px 0", borderBottom: `2px solid ${LINE}`, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, k) => (
                          <tr key={k}>
                            {r.map((cell, j) => (
                              <td key={j} style={{ padding: "11px 12px 11px 0", borderBottom: `1px solid ${LINE}`, color: j === 0 ? INK : BODY, fontWeight: j === 0 ? 600 : 400, lineHeight: 1.55, verticalAlign: "top" }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : Array.isArray(b) ? (
                  <ul key={i} style={{ margin: "0 0 14px", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {b.map((item, j) => (
                      <li key={j} className="lg-body" style={{ fontSize: 16, lineHeight: 1.65, color: BODY }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="lg-body" style={{ fontSize: 16, lineHeight: 1.7, color: BODY, margin: "0 0 14px" }}>{b}</p>
                )
              )}
            </div>
          ))}

          {c.governing ? (
            <p style={{ fontSize: 14, color: MUTE, lineHeight: 1.6, marginTop: 30, paddingTop: 20, borderTop: `1px solid ${LINE}` }}>{c.governing}</p>
          ) : null}
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <a href="/" style={{ fontSize: 14, color: MUTE, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em", filter: "drop-shadow(0 0 3px rgba(51,230,162,0.55))" }}><circle cx="12" cy="12" r="9" stroke="#33E6A2" strokeWidth="2.4" /><circle cx="12" cy="12" r="3.5" fill="#33E6A2" /></svg></span> {c.tagline}</a>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <a href="https://www.linkedin.com/company/readprospects" target="_blank" rel="noopener noreferrer" aria-label="ReadProspects on LinkedIn" style={{ color: MUTE, display: "flex", alignItems: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18.5h2.67V9.5zM7 5.9a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zM18.34 18.5v-4.94c0-2.64-1.41-3.87-3.29-3.87-1.52 0-2.2.84-2.58 1.43V9.5h-2.67V18.5h2.67v-4.77c0-1.26.24-2.48 1.8-2.48 1.54 0 1.56 1.44 1.56 2.56v4.69h2.78z"/></svg></a>
            <a href="/pricing" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>{c.fPricing}</a>
            <a href="/privacy" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>{c.fPrivacy}</a>
            <a href="/terms" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>{c.fTerms}</a>
            <a href="/login" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>{c.fSignin}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}