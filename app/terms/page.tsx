import MarketingNav from "../MarketingNav";
import { getLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Terms of use",
  description: "The terms under which ReadProspects is provided, including acceptable use, liability limits, and what verdicts may not be used to decide.",
  alternates: { canonical: "https://readprospects.com/terms" },
};

// BILINGUAL, English governing. The app is EN/FR and sells into French-speaking
// markets, so a French customer should be able to read what they are agreeing
// to. The French carries a line saying the English governs.
//
// NOT REVIEWED BY A LAWYER, in either language. Section 7 in particular -- the
// prohibition on using verdicts for employment, credit, insurance or housing
// decisions -- is the most protective clause in the pack, and a clause that
// fails to bind in French is worse than no clause, because it looks like
// protection that is not there. Both versions belong in one review.
const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Section = { id: string; h: string; body: (string | string[])[] };

const SECTIONS: Section[] = [
  {
    id: "agreement",
    h: "1. Agreement",
    body: [
      "These Terms are a contract between you and ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "By creating an account or using the service you accept these Terms. If you accept them on behalf of a company, you confirm you are authorised to bind it, and \"you\" means that company.",
      "If you do not accept these Terms, do not use the service.",
    ],
  },
  {
    id: "service",
    h: "2. What the service does",
    body: [
      "ReadProspects lets you share a document with a named recipient through a private link, records how that person reads it, lets them ask questions of an AI companion attached to the document, and produces an AI assessment, which we call a verdict, of what their reading behaviour suggests.",
      "You must be 18 or older and legally able to enter a contract.",
    ],
  },
  {
    id: "account",
    h: "3. Your account",
    body: [
      "You are responsible for your account credentials and for everything done through your account. Tell us promptly at privacy@readprospects.com if you believe it has been compromised.",
      "You must give accurate registration details. We may suspend accounts registered with false information.",
      "If you create an organization, you are responsible for the people you invite, and organization owners and administrators can see and manage content belonging to members.",
    ],
  },
  {
    id: "billing",
    h: "4. Plans, trials and payment",
    body: [
      "We offer Free, Personal, Team and Business plans, with limits described on our pricing page. Company plans include a 7-day trial. When a trial ends without a subscription, actions that create new content are blocked while existing data remains accessible.",
      "Paid plans are billed in advance for the period chosen. Fees exclude taxes, which you are responsible for where applicable. Fees are non-refundable except where the law requires otherwise. You may cancel at any time, effective from the end of your current period.",
      "We may change prices on notice. Changes take effect at your next renewal.",
    ],
  },
  {
    id: "acceptable",
    h: "5. Acceptable use",
    body: [
      "You must not:",
      [
        "Upload a document you do not have the right to share, or that infringes anyone's rights.",
        "Upload unlawful, defamatory, or malicious content, or malware.",
        "Share documents with people whose personal data you have no lawful basis to process.",
        "Use the service to harass, stalk, deceive or covertly surveil any individual.",
        "Attempt to bypass plan limits, rate limits, or access another customer's data.",
        "Reverse engineer the service, or use it to build a competing product.",
        "Resell or sublicense access without our written agreement.",
        "Use automated means to access the service other than through our documented API.",
      ],
      "We may suspend or terminate access for breach of this section, and may do so immediately where there is risk of harm.",
    ],
  },
  {
    id: "content",
    h: "6. Your content",
    body: [
      "You keep all rights in the documents you upload. You grant us a limited, worldwide, royalty-free licence to host, store, transmit, extract text from, display and process them solely to provide the service to you, including sending content to our AI provider as described in our Privacy Policy. This licence ends when you delete the content or close your account.",
      "You are responsible for the accuracy and legality of what you upload, and for anything the AI companion says in response to questions about your document, since its answers are derived from your content.",
    ],
  },
  {
    id: "recipients",
    h: "7. Recipients and reader data, your responsibilities",
    body: [
      "This section is important. Read it.",
      "The service records the behaviour of people who did not sign up with us and who have no relationship with us. You choose those people. That places specific obligations on you.",
      "You represent and warrant that, for every recipient whose details you provide:",
      [
        "You have a lawful basis under applicable data protection law to provide their personal data to us and to have it processed as described in our Privacy Policy.",
        "You have given them any notice, and obtained any consent, that the law requires, including notice that their engagement with the document is recorded and analysed.",
        "You will not use the service where doing so would breach a duty you owe them, or any law applicable to you or to them.",
      ],
      "You are the controller of recipient personal data. We act as your processor, on your instructions, except where we determine the purposes of processing ourselves.",
      "Verdicts must not be used for consequential decisions about individuals. You must not use a verdict, or any behavioural data from the service, as a basis for a decision about a person's employment, credit, insurance, housing, education, immigration status, or any other decision producing legal or similarly significant effects for them. Verdicts are commercial inferences, not assessments of a person's character, competence or intentions.",
      "You will indemnify us against all claims, losses, fines and reasonable costs arising from your breach of this section, including claims brought by recipients or by a data protection authority.",
    ],
  },
  {
    id: "ai",
    h: "8. Artificial intelligence",
    body: [
      "The AI companion and the verdict engine produce generated text. They can be inaccurate, incomplete, or wrong in ways that appear confident.",
      "A verdict is an inference from a small amount of behavioural evidence. Time spent on a page does not reliably indicate interest, and a question does not reliably indicate intent. You must apply your own judgement before acting, and you accept the risk of relying on AI output.",
      "We do not warrant that AI output will be accurate, suitable for any purpose, or free from bias. Our AI provider may change its models, which may change output over time.",
    ],
  },
  {
    id: "availability",
    h: "9. Availability and changes",
    body: [
      "We aim to keep the service available but do not guarantee uninterrupted access. We do not offer a service level agreement unless separately agreed in writing.",
      "We may modify, add or remove features. Where a change materially reduces a paid feature you rely on, we will give reasonable notice and, at your option, a pro-rated refund for the unused portion of your current period.",
      "We may impose rate limits and reasonable usage limits to protect the service.",
    ],
  },
  {
    id: "third-party",
    h: "10. Third-party services",
    body: [
      "The service depends on third-party providers listed in our Privacy Policy. Their failures may affect availability. If you connect Slack, webhooks, our API or any other integration, your use of that third-party service is governed by its own terms, and you are responsible for the endpoints you configure and the data sent to them.",
    ],
  },
  {
    id: "ip",
    h: "11. Our intellectual property",
    body: [
      "We own the service, its software, design, and all associated intellectual property. These Terms grant you a limited, non-exclusive, non-transferable right to use it during your subscription. Feedback you give us may be used freely without obligation to you.",
    ],
  },
  {
    id: "confidentiality",
    h: "12. Confidentiality",
    body: [
      "Each party will protect the other's confidential information with reasonable care and use it only for the purposes of these Terms. This does not apply to information that is public, independently developed, or lawfully received from a third party, or where disclosure is legally required.",
    ],
  },
  {
    id: "termination",
    h: "13. Suspension and termination",
    body: [
      "You may close your account at any time. Closing it deletes your documents, their files, and associated reader data as described in our Privacy Policy.",
      "We may suspend or terminate your access if you materially breach these Terms, if payment fails, if your use creates legal risk or risk of harm to others, or if we are required to by law. Where practical we will give notice and an opportunity to fix the problem.",
      "On termination your right to use the service ends. Sections 6, 7, 8, 11, 12, 14, 15, 16 and 18 survive.",
    ],
  },
  {
    id: "disclaimers",
    h: "14. Disclaimers",
    body: [
      "To the fullest extent permitted by law, the service is provided \"as is\" and \"as available\". We disclaim all implied warranties, including merchantability, fitness for a particular purpose, non-infringement, and any warranty that the service will be uninterrupted, secure, error-free, or that AI output will be accurate.",
      "We do not warrant that recipients will be unaware the document is tracked, or that tracking will function in every email client, browser or device.",
    ],
  },
  {
    id: "liability",
    h: "15. Limitation of liability",
    body: [
      "To the fullest extent permitted by law:",
      "We are not liable for indirect, incidental, special, consequential or punitive damages; loss of profits, revenue, business, goodwill, anticipated savings, or opportunity; loss or corruption of data; or losses arising from decisions you made in reliance on AI output, whether or not we were advised such losses were possible.",
      "Our total aggregate liability arising out of or relating to these Terms or the service is limited to the greater of the fees you paid us in the twelve months before the event giving rise to the claim, or USD 100.",
      "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability under applicable consumer protection or data protection law that cannot be limited by contract.",
      "You acknowledge these limits reflect a reasonable allocation of risk, and that our pricing depends on them.",
    ],
  },
  {
    id: "indemnity",
    h: "16. Indemnity",
    body: [
      "You will defend and indemnify us against claims, damages, fines and reasonable legal costs arising from your content, your use of the service, your breach of these Terms, your breach of section 7, or your infringement of a third party's rights.",
    ],
  },
  {
    id: "data",
    h: "17. Data protection",
    body: [
      "Our Privacy Policy describes how we handle personal data and forms part of these Terms. Where we process recipient personal data as your processor, we do so on your documented instructions, apply appropriate security measures, use the sub-processors listed in our Privacy Policy, assist you with data subject requests so far as reasonable, and delete or return data as described there. If you require a separate data processing agreement, contact us.",
    ],
  },
  {
    id: "law",
    h: "18. Governing law and disputes",
    body: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria.",
      "We will each try in good faith to resolve any dispute informally first. Write to us at privacy@readprospects.com. If we cannot resolve it within 30 days, the courts of the Federal Capital Territory, Abuja have exclusive jurisdiction, except that either party may seek injunctive relief in any competent court to protect intellectual property or confidential information.",
      "Nothing here deprives a consumer of protections available under the mandatory law of their country of residence.",
    ],
  },
  {
    id: "general",
    h: "19. General",
    body: [
      [
        "Changes. We may update these Terms. Material changes take effect 30 days after we notify you, or immediately if required by law or if they benefit you. Continuing to use the service after that means you accept them.",
        "Assignment. You may not assign these Terms without our consent. We may assign them to an affiliate or in connection with a merger or sale of assets.",
        "Severability. If a provision is unenforceable, the rest remains in force.",
        "No waiver. Failure to enforce a provision is not a waiver of it.",
        "Force majeure. Neither party is liable for failure caused by events beyond reasonable control.",
        "Entire agreement. These Terms and the Privacy Policy are the whole agreement between us regarding the service.",
        "Notices. We will contact you at your account email. You may contact us at privacy@readprospects.com or the registered address above.",
      ],
    ],
  },
  {
    id: "contact",
    h: "20. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "Email privacy@readprospects.com with any question about these Terms.",
    ],
  },
];

const SECTIONS_FR: Section[] = [
  {
    id: "agreement",
    h: "1. Accord",
    body: [
      "Les pr\u00e9sentes Conditions constituent un contrat entre vous et ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "En cr\u00e9ant un compte ou en utilisant le service, vous acceptez ces Conditions. Si vous les acceptez au nom d\u2019une entreprise, vous confirmez \u00eatre habilit\u00e9 \u00e0 l\u2019engager, et \u00ab vous \u00bb d\u00e9signe cette entreprise.",
      "Si vous n\u2019acceptez pas ces Conditions, n\u2019utilisez pas le service.",
    ],
  },
  {
    id: "service",
    h: "2. Ce que fait le service",
    body: [
      "ReadProspects vous permet de partager un document avec un destinataire nomm\u00e9 via un lien priv\u00e9, enregistre la fa\u00e7on dont cette personne le lit, lui permet de poser des questions \u00e0 un compagnon d\u2019IA attach\u00e9 au document, et produit une \u00e9valuation par IA, que nous appelons un verdict, de ce que son comportement de lecture sugg\u00e8re.",
      "Vous devez avoir 18 ans ou plus et \u00eatre l\u00e9galement capable de conclure un contrat.",
    ],
  },
  {
    id: "account",
    h: "3. Votre compte",
    body: [
      "Vous \u00eates responsable de vos identifiants et de tout ce qui est fait via votre compte. Signalez-nous rapidement \u00e0 privacy@readprospects.com si vous pensez qu\u2019il a \u00e9t\u00e9 compromis.",
      "Vous devez fournir des informations d\u2019inscription exactes. Nous pouvons suspendre les comptes cr\u00e9\u00e9s avec de fausses informations.",
      "Si vous cr\u00e9ez une organisation, vous \u00eates responsable des personnes que vous invitez, et les propri\u00e9taires et administrateurs de l\u2019organisation peuvent voir et g\u00e9rer les contenus appartenant aux membres.",
    ],
  },
  {
    id: "billing",
    h: "4. Forfaits, essais et paiement",
    body: [
      "Nous proposons les forfaits Gratuit, Personnel, \u00c9quipe et Business, avec les limites d\u00e9crites sur notre page de tarifs. Les forfaits d\u2019entreprise comprennent un essai de 7 jours. \u00c0 la fin d\u2019un essai sans abonnement, les actions qui cr\u00e9ent de nouveaux contenus sont bloqu\u00e9es tandis que les donn\u00e9es existantes restent accessibles.",
      "Les forfaits payants sont factur\u00e9s d\u2019avance pour la p\u00e9riode choisie. Les tarifs s\u2019entendent hors taxes, dont vous \u00eates redevable le cas \u00e9ch\u00e9ant. Les sommes vers\u00e9es ne sont pas remboursables, sauf lorsque la loi l\u2019exige. Vous pouvez r\u00e9silier \u00e0 tout moment, avec effet \u00e0 la fin de votre p\u00e9riode en cours.",
      "Nous pouvons modifier nos prix moyennant pr\u00e9avis. Les changements prennent effet lors de votre prochain renouvellement.",
    ],
  },
  {
    id: "acceptable",
    h: "5. Usage acceptable",
    body: [
      "Vous ne devez pas :",
      [
        "T\u00e9l\u00e9verser un document que vous n\u2019avez pas le droit de partager, ou qui porte atteinte aux droits d\u2019autrui.",
        "T\u00e9l\u00e9verser des contenus illicites, diffamatoires ou malveillants, ni de logiciels malveillants.",
        "Partager des documents avec des personnes dont vous n\u2019avez aucune base l\u00e9gale pour traiter les donn\u00e9es personnelles.",
        "Utiliser le service pour harceler, traquer, tromper ou surveiller secr\u00e8tement une personne.",
        "Tenter de contourner les limites du forfait, les limitations de d\u00e9bit, ou d\u2019acc\u00e9der aux donn\u00e9es d\u2019un autre client.",
        "Proc\u00e9der \u00e0 de l\u2019ing\u00e9nierie inverse du service, ou l\u2019utiliser pour cr\u00e9er un produit concurrent.",
        "Revendre ou sous-licencier l\u2019acc\u00e8s sans notre accord \u00e9crit.",
        "Acc\u00e9der au service par des moyens automatis\u00e9s autrement que via notre API document\u00e9e.",
      ],
      "Nous pouvons suspendre ou r\u00e9silier l\u2019acc\u00e8s en cas de manquement \u00e0 cette section, et le faire imm\u00e9diatement en cas de risque de pr\u00e9judice.",
    ],
  },
  {
    id: "content",
    h: "6. Vos contenus",
    body: [
      "Vous conservez tous les droits sur les documents que vous t\u00e9l\u00e9versez. Vous nous accordez une licence limit\u00e9e, mondiale et gratuite pour les h\u00e9berger, les stocker, les transmettre, en extraire le texte, les afficher et les traiter uniquement afin de vous fournir le service, y compris l\u2019envoi de contenus \u00e0 notre fournisseur d\u2019IA comme d\u00e9crit dans notre Politique de confidentialit\u00e9. Cette licence prend fin lorsque vous supprimez le contenu ou fermez votre compte.",
      "Vous \u00eates responsable de l\u2019exactitude et de la l\u00e9galit\u00e9 de ce que vous t\u00e9l\u00e9versez, ainsi que de ce que le compagnon d\u2019IA r\u00e9pond aux questions portant sur votre document, ses r\u00e9ponses \u00e9tant tir\u00e9es de votre contenu.",
    ],
  },
  {
    id: "recipients",
    h: "7. Destinataires et donn\u00e9es de lecture, vos responsabilit\u00e9s",
    body: [
      "Cette section est importante. Lisez-la.",
      "Le service enregistre le comportement de personnes qui ne se sont pas inscrites chez nous et qui n\u2019ont aucune relation avec nous. C\u2019est vous qui choisissez ces personnes. Cela vous impose des obligations pr\u00e9cises.",
      "Vous d\u00e9clarez et garantissez que, pour chaque destinataire dont vous fournissez les coordonn\u00e9es :",
      [
        "Vous disposez d\u2019une base l\u00e9gale, au titre du droit applicable \u00e0 la protection des donn\u00e9es, pour nous transmettre ses donn\u00e9es personnelles et les faire traiter comme d\u00e9crit dans notre Politique de confidentialit\u00e9.",
        "Vous lui avez donn\u00e9 toute information, et obtenu tout consentement, exig\u00e9s par la loi, y compris l\u2019information selon laquelle son interaction avec le document est enregistr\u00e9e et analys\u00e9e.",
        "Vous n\u2019utiliserez pas le service lorsque cela contreviendrait \u00e0 une obligation que vous avez envers cette personne, ou \u00e0 une loi qui vous est applicable ou qui lui est applicable.",
      ],
      "Vous \u00eates le responsable de traitement des donn\u00e9es personnelles des destinataires. Nous agissons comme votre sous-traitant, sur vos instructions, sauf lorsque nous d\u00e9terminons nous-m\u00eames les finalit\u00e9s du traitement.",
      "Les verdicts ne doivent pas servir \u00e0 des d\u00e9cisions cons\u00e9quentes concernant des personnes. Vous ne devez pas utiliser un verdict, ni aucune donn\u00e9e comportementale issue du service, comme fondement d\u2019une d\u00e9cision relative \u00e0 l\u2019emploi, au cr\u00e9dit, \u00e0 l\u2019assurance, au logement, \u00e0 l\u2019\u00e9ducation, au statut migratoire d\u2019une personne, ni de toute autre d\u00e9cision produisant \u00e0 son \u00e9gard des effets juridiques ou des effets significatifs comparables. Les verdicts sont des inf\u00e9rences commerciales, et non des appr\u00e9ciations du caract\u00e8re, des comp\u00e9tences ou des intentions d\u2019une personne.",
      "Vous nous garantirez contre toutes r\u00e9clamations, pertes, amendes et frais raisonnables d\u00e9coulant de votre manquement \u00e0 cette section, y compris les r\u00e9clamations introduites par des destinataires ou par une autorit\u00e9 de protection des donn\u00e9es.",
    ],
  },
  {
    id: "ai",
    h: "8. Intelligence artificielle",
    body: [
      "Le compagnon d\u2019IA et le moteur de verdicts produisent du texte g\u00e9n\u00e9r\u00e9. Ils peuvent \u00eatre inexacts, incomplets, ou se tromper d\u2019une mani\u00e8re qui para\u00eet assur\u00e9e.",
      "Un verdict est une inf\u00e9rence tir\u00e9e d\u2019un petit nombre d\u2019indices comportementaux. Le temps pass\u00e9 sur une page n\u2019indique pas de mani\u00e8re fiable un int\u00e9r\u00eat, et une question n\u2019indique pas de mani\u00e8re fiable une intention. Vous devez exercer votre propre jugement avant d\u2019agir, et vous acceptez le risque li\u00e9 au fait de vous fier \u00e0 une production d\u2019IA.",
      "Nous ne garantissons pas que les productions d\u2019IA seront exactes, adapt\u00e9es \u00e0 un usage donn\u00e9, ni exemptes de biais. Notre fournisseur d\u2019IA peut modifier ses mod\u00e8les, ce qui peut faire \u00e9voluer les r\u00e9sultats dans le temps.",
    ],
  },
  {
    id: "availability",
    h: "9. Disponibilit\u00e9 et \u00e9volutions",
    body: [
      "Nous nous effor\u00e7ons de maintenir le service disponible mais ne garantissons pas un acc\u00e8s ininterrompu. Nous ne proposons pas d\u2019engagement de niveau de service, sauf accord \u00e9crit distinct.",
      "Nous pouvons modifier, ajouter ou retirer des fonctionnalit\u00e9s. Lorsqu\u2019un changement r\u00e9duit substantiellement une fonctionnalit\u00e9 payante dont vous d\u00e9pendez, nous vous en informerons dans un d\u00e9lai raisonnable et, \u00e0 votre choix, vous rembourserons au prorata la partie non utilis\u00e9e de votre p\u00e9riode en cours.",
      "Nous pouvons appliquer des limitations de d\u00e9bit et des limites d\u2019usage raisonnables pour prot\u00e9ger le service.",
    ],
  },
  {
    id: "third-party",
    h: "10. Services tiers",
    body: [
      "Le service d\u00e9pend de prestataires tiers list\u00e9s dans notre Politique de confidentialit\u00e9. Leurs d\u00e9faillances peuvent affecter la disponibilit\u00e9. Si vous connectez Slack, des webhooks, notre API ou toute autre int\u00e9gration, votre utilisation de ce service tiers est r\u00e9gie par ses propres conditions, et vous \u00eates responsable des points de terminaison que vous configurez et des donn\u00e9es qui leur sont envoy\u00e9es.",
    ],
  },
  {
    id: "ip",
    h: "11. Notre propri\u00e9t\u00e9 intellectuelle",
    body: [
      "Nous sommes propri\u00e9taires du service, de son logiciel, de son design et de toute la propri\u00e9t\u00e9 intellectuelle associ\u00e9e. Les pr\u00e9sentes Conditions vous accordent un droit limit\u00e9, non exclusif et non transf\u00e9rable de l\u2019utiliser pendant la dur\u00e9e de votre abonnement. Les retours que vous nous adressez peuvent \u00eatre utilis\u00e9s librement, sans obligation envers vous.",
    ],
  },
  {
    id: "confidentiality",
    h: "12. Confidentialit\u00e9",
    body: [
      "Chaque partie prot\u00e9gera les informations confidentielles de l\u2019autre avec un soin raisonnable et ne les utilisera qu\u2019aux fins des pr\u00e9sentes Conditions. Cela ne s\u2019applique pas aux informations publiques, d\u00e9velopp\u00e9es de mani\u00e8re ind\u00e9pendante, ou re\u00e7ues l\u00e9galement d\u2019un tiers, ni lorsque la divulgation est l\u00e9galement requise.",
    ],
  },
  {
    id: "termination",
    h: "13. Suspension et r\u00e9siliation",
    body: [
      "Vous pouvez fermer votre compte \u00e0 tout moment. Sa fermeture supprime vos documents, leurs fichiers et les donn\u00e9es de lecture associ\u00e9es, comme d\u00e9crit dans notre Politique de confidentialit\u00e9.",
      "Nous pouvons suspendre ou r\u00e9silier votre acc\u00e8s en cas de manquement substantiel aux pr\u00e9sentes Conditions, d\u2019\u00e9chec de paiement, si votre usage cr\u00e9e un risque juridique ou un risque de pr\u00e9judice pour autrui, ou si la loi nous y oblige. Lorsque cela est possible, nous vous en informerons et vous laisserons la possibilit\u00e9 de rem\u00e9dier au probl\u00e8me.",
      "\u00c0 la r\u00e9siliation, votre droit d\u2019utiliser le service prend fin. Les sections 6, 7, 8, 11, 12, 14, 15, 16 et 18 survivent.",
    ],
  },
  {
    id: "disclaimers",
    h: "14. Exclusions de garantie",
    body: [
      "Dans toute la mesure permise par la loi, le service est fourni \u00ab en l\u2019\u00e9tat \u00bb et \u00ab selon disponibilit\u00e9 \u00bb. Nous excluons toute garantie implicite, y compris de qualit\u00e9 marchande, d\u2019ad\u00e9quation \u00e0 un usage particulier, d\u2019absence de contrefa\u00e7on, ainsi que toute garantie que le service sera ininterrompu, s\u00fbr, exempt d\u2019erreurs, ou que les productions d\u2019IA seront exactes.",
      "Nous ne garantissons pas que les destinataires ignoreront que le document est suivi, ni que le suivi fonctionnera dans tous les clients de messagerie, navigateurs ou appareils.",
    ],
  },
  {
    id: "liability",
    h: "15. Limitation de responsabilit\u00e9",
    body: [
      "Dans toute la mesure permise par la loi :",
      "Nous ne sommes pas responsables des dommages indirects, accessoires, sp\u00e9ciaux, cons\u00e9cutifs ou punitifs ; de la perte de b\u00e9n\u00e9fices, de chiffre d\u2019affaires, d\u2019activit\u00e9, de client\u00e8le, d\u2019\u00e9conomies escompt\u00e9es ou d\u2019opportunit\u00e9s ; de la perte ou de l\u2019alt\u00e9ration de donn\u00e9es ; ni des pertes d\u00e9coulant de d\u00e9cisions que vous avez prises en vous fiant \u00e0 une production d\u2019IA, que nous ayons \u00e9t\u00e9 avertis ou non de la possibilit\u00e9 de telles pertes.",
      "Notre responsabilit\u00e9 totale cumul\u00e9e d\u00e9coulant des pr\u00e9sentes Conditions ou du service, ou s\u2019y rapportant, est limit\u00e9e au plus \u00e9lev\u00e9 des deux montants suivants : les sommes que vous nous avez vers\u00e9es au cours des douze mois pr\u00e9c\u00e9dant le fait g\u00e9n\u00e9rateur, ou 100 USD.",
      "Rien dans les pr\u00e9sentes Conditions n\u2019exclut ni ne limite une responsabilit\u00e9 qui ne peut l\u00e9galement l\u2019\u00eatre, notamment en cas de fraude, de d\u00e9claration frauduleuse, de d\u00e9c\u00e8s ou de dommage corporel caus\u00e9 par une n\u00e9gligence, ou toute responsabilit\u00e9 au titre du droit applicable de la consommation ou de la protection des donn\u00e9es qui ne peut \u00eatre limit\u00e9e par contrat.",
      "Vous reconnaissez que ces limites refl\u00e8tent une r\u00e9partition raisonnable des risques, et que notre tarification en d\u00e9pend.",
    ],
  },
  {
    id: "indemnity",
    h: "16. Garantie d\u2019indemnisation",
    body: [
      "Vous nous d\u00e9fendrez et nous indemniserez contre les r\u00e9clamations, dommages, amendes et frais juridiques raisonnables d\u00e9coulant de vos contenus, de votre utilisation du service, de votre manquement aux pr\u00e9sentes Conditions, de votre manquement \u00e0 la section 7, ou de votre atteinte aux droits d\u2019un tiers.",
    ],
  },
  {
    id: "data",
    h: "17. Protection des donn\u00e9es",
    body: [
      "Notre Politique de confidentialit\u00e9 d\u00e9crit comment nous traitons les donn\u00e9es personnelles et fait partie int\u00e9grante des pr\u00e9sentes Conditions. Lorsque nous traitons les donn\u00e9es personnelles des destinataires en qualit\u00e9 de sous-traitant, nous le faisons sur vos instructions document\u00e9es, appliquons des mesures de s\u00e9curit\u00e9 appropri\u00e9es, recourons aux sous-traitants ult\u00e9rieurs list\u00e9s dans notre Politique de confidentialit\u00e9, vous assistons raisonnablement pour les demandes des personnes concern\u00e9es, et supprimons ou restituons les donn\u00e9es comme il y est d\u00e9crit. Si vous avez besoin d\u2019un accord de traitement distinct, contactez-nous.",
    ],
  },
  {
    id: "law",
    h: "18. Droit applicable et litiges",
    body: [
      "Les pr\u00e9sentes Conditions sont r\u00e9gies par le droit de la R\u00e9publique f\u00e9d\u00e9rale du Nigeria.",
      "Nous nous efforcerons chacun, de bonne foi, de r\u00e9soudre d\u2019abord tout litige de mani\u00e8re informelle. \u00c9crivez-nous \u00e0 privacy@readprospects.com. Si nous ne pouvons pas le r\u00e9soudre sous 30 jours, les tribunaux du Territoire de la capitale f\u00e9d\u00e9rale, Abuja, ont comp\u00e9tence exclusive, sauf que chaque partie peut demander des mesures conservatoires devant toute juridiction comp\u00e9tente pour prot\u00e9ger sa propri\u00e9t\u00e9 intellectuelle ou ses informations confidentielles.",
      "Rien ici ne prive un consommateur des protections pr\u00e9vues par les lois imp\u00e9ratives de son pays de r\u00e9sidence.",
    ],
  },
  {
    id: "general",
    h: "19. Dispositions g\u00e9n\u00e9rales",
    body: [
      [
        "Modifications. Nous pouvons mettre \u00e0 jour ces Conditions. Les changements substantiels prennent effet 30 jours apr\u00e8s notification, ou imm\u00e9diatement si la loi l\u2019exige ou s\u2019ils vous sont favorables. Continuer \u00e0 utiliser le service au-del\u00e0 vaut acceptation.",
        "Cession. Vous ne pouvez pas c\u00e9der les pr\u00e9sentes Conditions sans notre accord. Nous pouvons les c\u00e9der \u00e0 une soci\u00e9t\u00e9 affili\u00e9e ou dans le cadre d\u2019une fusion ou d\u2019une cession d\u2019actifs.",
        "Divisibilit\u00e9. Si une clause est inapplicable, le reste demeure en vigueur.",
        "Absence de renonciation. Le fait de ne pas faire appliquer une clause ne vaut pas renonciation \u00e0 celle-ci.",
        "Force majeure. Aucune partie n\u2019est responsable d\u2019un manquement caus\u00e9 par des \u00e9v\u00e9nements \u00e9chappant \u00e0 son contr\u00f4le raisonnable.",
        "Int\u00e9gralit\u00e9 de l\u2019accord. Les pr\u00e9sentes Conditions et la Politique de confidentialit\u00e9 constituent l\u2019int\u00e9gralit\u00e9 de l\u2019accord entre nous concernant le service.",
        "Notifications. Nous vous contacterons \u00e0 l\u2019adresse e-mail de votre compte. Vous pouvez nous contacter \u00e0 privacy@readprospects.com ou \u00e0 l\u2019adresse enregistr\u00e9e ci-dessus.",
      ],
    ],
  },
  {
    id: "contact",
    h: "20. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "\u00c9crivez \u00e0 privacy@readprospects.com pour toute question sur ces Conditions.",
    ],
  },
];

const COPY = {
  en: {
    updated: "24th July 2026",
    badge: "Governed by the laws of Nigeria",
    h1: "Terms of Service",
    lead: "Clear terms, written in plain language, so you always know where you stand with ReadProspects.",
    lastUpdated: "Last updated:",
    summary: "Summary",
    points: [
      "You own your documents. We only host and process them to serve you.",
      "You are responsible for having a lawful basis to share a recipient with us.",
      "Verdicts are AI inferences. Never use them for employment, credit or similar decisions.",
      "Free and paid plans, billed in advance, cancel any time.",
      "These terms are governed by the laws of Nigeria.",
    ],
    tagline: "ReadProspects, the document reads the reader.",
    fPricing: "Pricing", fPrivacy: "Privacy", fTerms: "Terms", fSignin: "Sign in",
    governing: "",
  },
  fr: {
    updated: "24 juillet 2026",
    badge: "R\u00e9gi par le droit du Nigeria",
    h1: "Conditions d\u2019utilisation",
    lead: "Des conditions claires, r\u00e9dig\u00e9es simplement, pour que vous sachiez toujours o\u00f9 vous en \u00eates avec ReadProspects.",
    lastUpdated: "Derni\u00e8re mise \u00e0 jour :",
    summary: "En r\u00e9sum\u00e9",
    points: [
      "Vos documents vous appartiennent. Nous les h\u00e9bergeons et les traitons uniquement pour vous servir.",
      "Il vous revient de disposer d\u2019une base l\u00e9gale pour nous transmettre un destinataire.",
      "Les verdicts sont des inf\u00e9rences d\u2019IA. Ne les utilisez jamais pour des d\u00e9cisions d\u2019emploi, de cr\u00e9dit ou similaires.",
      "Forfaits gratuits et payants, factur\u00e9s d\u2019avance, r\u00e9siliables \u00e0 tout moment.",
      "Ces conditions sont r\u00e9gies par le droit du Nigeria.",
    ],
    tagline: "ReadProspects, le document lit le lecteur.",
    fPricing: "Tarifs", fPrivacy: "Confidentialit\u00e9", fTerms: "Conditions", fSignin: "Se connecter",
    governing: "Cette traduction est fournie pour votre commodit\u00e9. En cas de divergence, la version anglaise fait foi.",
  },
};

export default async function TermsPage() {
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
                Array.isArray(b) ? (
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