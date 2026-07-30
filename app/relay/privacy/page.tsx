import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import LanguageSwitcher from "@/lib/LanguageSwitcher";

// Privacy notice for the reader-delivery domain (relaydocuments.com/privacy, rewritten
// from /relay/privacy by middleware). It names the real operating entity, and discloses
// the reading measurement, the AI companion and the verdict profiling in plain language.
// Neutral in tone, complete in substance. Not legal advice.
//
// BILINGUAL. The reader interface is EN/FR, so a French reader arriving at a link
// should not meet an English-only notice -- transparency information that the data
// subject cannot read is weak transparency. The English text GOVERNS: the French is
// provided so the notice is usable, and the last line says so. Both versions need a
// qualified review before they are relied on.
export const metadata: Metadata = {
  title: { absolute: "Privacy notice \u2014 RelayDocuments" },
  description: "How RelayDocuments handles the information involved in delivering shared documents.",
  robots: { index: false, follow: false },
};

const INK = "#0F1729", BODY = "#475467", MUTE = "#98A2B3", GREEN = "#0B7A4B", LINE = "#EEF0EC", CANVAS = "#F8FAF8", CARD = "#FFFFFF";
const FONT = "var(--font-dm-sans), system-ui, sans-serif";

function Mark() {
  return (
    <span style={{ width: 30, height: 30, borderRadius: 9, background: GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: "0 0 8px" }}>{title}</h2>
      <div style={{ fontSize: 15, color: BODY, lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

const COPY = {
  en: {
    updated: "25 July 2026",
    lastUpdated: "Last updated",
    h1: "Privacy notice",
    intro: "RelayDocuments is a service for sharing documents by secure link, operated by ReadProspects Technologies Nigeria (RC 9702396). When someone sends or forwards you a document, we deliver it, and we report back to them on how it was read. You did not sign up for this service, so this notice sets out plainly what that involves.",
    hHandle: "What we handle",
    handle1: "The name and email address the sender provided for you, so we can deliver the link and address the message. How you read the document once you open it: when you opened it, which pages you viewed and for how long, whether you returned to a page, any questions you type into the document, and whether you forward it. We also process the technical information your browser sends, including your IP address, which our hosting providers record in order to deliver the page.",
    handle2: "If you choose to reply to the sender, we also handle the message you write and the email address you give us for them to reply to. Unlike everything above, you supply this yourself, and only if you decide to.",
    hWhy: "Why we handle it",
    why: "To deliver the document you were sent, and to give the person or organisation who shared it a view of how their document was received. This is the purpose of the service, and it is the basis on which documents are shared through RelayDocuments. The person who sent you the document decides what is collected and why.",
    hSender: "What the sender can see",
    sender: "The person who shared the document can see your reading activity, including the questions you asked. If they have connected an alert service such as Slack, your question and the answer are delivered to them at the moment you ask. The same applies to a reply: if you send one, it reaches them by email, in their account, and at any alert service they have connected.",
    hAssess: "Assessment of your reading",
    assess1: "The sender can also generate an assessment of how you read. It analyses your behaviour, what you spent time on, what you returned to, what you asked, whether you forwarded it, and anything you replied, and produces a written interpretation of what you appear to be considering and what the sender might do next. Under data protection law this is profiling, and you can object to it using the contact below.",
    assess2: "An assessment of this kind is an inference drawn from limited evidence. It can be wrong, and it is not a statement of fact about you.",
    hCompanion: "The document companion",
    companion: "If you ask the document a question, the document\u2019s text and your question are sent to Anthropic, our AI provider in the United States, which generates the answer. Your conversation is stored. Anthropic does not use it to train their models, and neither do we.",
    hOthers: "Who else is involved",
    others: "We use Supabase for our database and file storage, Vercel for hosting, Anthropic for the document companion and assessments, and Resend for email delivery. All four are based in the United States, so information about you is transferred outside Nigeria under contractual safeguards. We do not sell your information, and we do not use it for advertising.",
    hReply: "If you reply to the sender",
    reply1: "The document page has a reply button. If you use it, your message and the email address you enter are sent to the person who shared the document with you: by email, in their ReadProspects account, and to any alert service they have connected, such as Slack. They can reply to you directly at the address you gave.",
    reply2: "We keep the address so that the person who shared the document can contact you about it. Your message is also read by the assessment described above when the sender generates one, which means it is sent to Anthropic in the United States along with the document. It is not used to train any AI model.",
    reply3: "You do not have to reply, and nothing is sent until you press send. If you would rather not give an email address, you can simply not use the button.",
    hForward: "If you forward the document",
    forward: "Each colleague you name receives their own link and can see that you shared it. The sender is told that the document was forwarded. Please provide someone\u2019s contact details only if you are entitled to.",
    hRights: "Your rights",
    rights1: "You can ask us for a copy of the information we hold about you, ask us to correct it, ask us to delete it entirely, or object to the assessment described above. This covers anything you sent us through the reply button, including the address you gave. If someone forwarded a document to you and gave us your details, you can ask us to remove them.",
    rights2: "The person who sent you the document decides what is collected, so contacting them directly is often fastest. You can also write to us and we will act on your request within 30 days. Nothing is recorded until you choose to open the link.",
    hKeep: "How long we keep it",
    keep: "Until the sender deletes the document or closes their account, or until you ask us to erase you, whichever comes first.",
    hComplaints: "Complaints",
    complaints: "You may complain to the Nigeria Data Protection Commission at ndpc.gov.ng. If you are in the European Economic Area or the United Kingdom, you may complain to your local supervisory authority.",
    hContact: "Contact",
    contact: "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. Email",
    contactEnd: "and we will get back to you.",
    footer: "This notice is provided for transparency and is not legal advice. If you have questions about your rights under the GDPR, Nigeria\u2019s NDPA, or another applicable law, please seek qualified advice.",
    governing: "",
    linkPrivacy: "Privacy notice",
    linkTerms: "Terms of use",
  },
  fr: {
    updated: "25 juillet 2026",
    lastUpdated: "Derni\u00e8re mise \u00e0 jour",
    h1: "Avis de confidentialit\u00e9",
    intro: "RelayDocuments est un service de partage de documents par lien s\u00e9curis\u00e9, exploit\u00e9 par ReadProspects Technologies Nigeria (RC 9702396). Lorsqu\u2019une personne vous envoie ou vous transf\u00e8re un document, nous le livrons, et nous lui indiquons comment il a \u00e9t\u00e9 lu. Vous ne vous \u00eates pas inscrit \u00e0 ce service : cet avis expose donc clairement ce que cela implique.",
    hHandle: "Ce que nous traitons",
    handle1: "Le nom et l\u2019adresse e-mail que l\u2019exp\u00e9diteur a indiqu\u00e9s pour vous, afin que nous puissions livrer le lien et adresser le message. La fa\u00e7on dont vous lisez le document une fois ouvert : quand vous l\u2019avez ouvert, quelles pages vous avez consult\u00e9es et combien de temps, si vous \u00eates revenu sur une page, les questions que vous saisissez dans le document, et si vous le transf\u00e9rez. Nous traitons \u00e9galement les informations techniques envoy\u00e9es par votre navigateur, dont votre adresse IP, que nos h\u00e9bergeurs enregistrent pour livrer la page.",
    handle2: "Si vous choisissez de r\u00e9pondre \u00e0 l\u2019exp\u00e9diteur, nous traitons aussi le message que vous \u00e9crivez et l\u2019adresse e-mail que vous nous donnez pour qu\u2019il puisse vous r\u00e9pondre. Contrairement \u00e0 tout ce qui pr\u00e9c\u00e8de, vous fournissez cela vous-m\u00eame, et seulement si vous le d\u00e9cidez.",
    hWhy: "Pourquoi nous le traitons",
    why: "Pour livrer le document qui vous a \u00e9t\u00e9 envoy\u00e9, et pour donner \u00e0 la personne ou \u00e0 l\u2019organisation qui l\u2019a partag\u00e9 une vue de la fa\u00e7on dont son document a \u00e9t\u00e9 re\u00e7u. C\u2019est l\u2019objet du service, et c\u2019est la base sur laquelle les documents sont partag\u00e9s via RelayDocuments. La personne qui vous a envoy\u00e9 le document d\u00e9cide de ce qui est collect\u00e9 et pourquoi.",
    hSender: "Ce que l\u2019exp\u00e9diteur peut voir",
    sender: "La personne qui a partag\u00e9 le document peut voir votre activit\u00e9 de lecture, y compris les questions que vous avez pos\u00e9es. Si elle a connect\u00e9 un service d\u2019alerte tel que Slack, votre question et la r\u00e9ponse lui sont transmises au moment o\u00f9 vous la posez. Il en va de m\u00eame pour une r\u00e9ponse : si vous en envoyez une, elle lui parvient par e-mail, dans son compte, et sur tout service d\u2019alerte qu\u2019elle a connect\u00e9.",
    hAssess: "\u00c9valuation de votre lecture",
    assess1: "L\u2019exp\u00e9diteur peut aussi g\u00e9n\u00e9rer une \u00e9valuation de votre lecture. Elle analyse votre comportement, ce sur quoi vous avez pass\u00e9 du temps, ce sur quoi vous \u00eates revenu, ce que vous avez demand\u00e9, si vous avez transf\u00e9r\u00e9 le document, et tout ce que vous avez r\u00e9pondu, puis produit une interpr\u00e9tation \u00e9crite de ce que vous semblez envisager et de ce que l\u2019exp\u00e9diteur pourrait faire ensuite. En droit de la protection des donn\u00e9es, il s\u2019agit d\u2019un profilage, et vous pouvez vous y opposer en utilisant le contact ci-dessous.",
    assess2: "Une \u00e9valuation de ce type est une inf\u00e9rence tir\u00e9e de preuves limit\u00e9es. Elle peut \u00eatre erron\u00e9e, et elle ne constitue pas un \u00e9nonc\u00e9 de fait vous concernant.",
    hCompanion: "Le compagnon du document",
    companion: "Si vous posez une question au document, le texte du document et votre question sont envoy\u00e9s \u00e0 Anthropic, notre fournisseur d\u2019IA aux \u00c9tats-Unis, qui g\u00e9n\u00e8re la r\u00e9ponse. Votre conversation est conserv\u00e9e. Anthropic ne l\u2019utilise pas pour entra\u00eener ses mod\u00e8les, et nous non plus.",
    hOthers: "Qui d\u2019autre intervient",
    others: "Nous utilisons Supabase pour notre base de donn\u00e9es et le stockage des fichiers, Vercel pour l\u2019h\u00e9bergement, Anthropic pour le compagnon du document et les \u00e9valuations, et Resend pour l\u2019envoi des e-mails. Ces quatre prestataires sont \u00e9tablis aux \u00c9tats-Unis : les informations vous concernant sont donc transf\u00e9r\u00e9es hors du Nigeria sous garanties contractuelles. Nous ne vendons pas vos informations et ne les utilisons pas \u00e0 des fins publicitaires.",
    hReply: "Si vous r\u00e9pondez \u00e0 l\u2019exp\u00e9diteur",
    reply1: "La page du document comporte un bouton de r\u00e9ponse. Si vous l\u2019utilisez, votre message et l\u2019adresse e-mail que vous saisissez sont envoy\u00e9s \u00e0 la personne qui a partag\u00e9 le document avec vous : par e-mail, dans son compte ReadProspects, et sur tout service d\u2019alerte qu\u2019elle a connect\u00e9, tel que Slack. Elle peut vous r\u00e9pondre directement \u00e0 l\u2019adresse indiqu\u00e9e.",
    reply2: "Nous conservons cette adresse afin que la personne qui a partag\u00e9 le document puisse vous contacter \u00e0 son sujet. Votre message est \u00e9galement lu par l\u2019\u00e9valuation d\u00e9crite ci-dessus lorsque l\u2019exp\u00e9diteur en g\u00e9n\u00e8re une, ce qui signifie qu\u2019il est envoy\u00e9 \u00e0 Anthropic aux \u00c9tats-Unis avec le document. Il n\u2019est utilis\u00e9 pour entra\u00eener aucun mod\u00e8le d\u2019IA.",
    reply3: "Vous n\u2019\u00eates pas oblig\u00e9 de r\u00e9pondre, et rien n\u2019est envoy\u00e9 tant que vous n\u2019avez pas appuy\u00e9 sur envoyer. Si vous pr\u00e9f\u00e9rez ne pas donner d\u2019adresse e-mail, il vous suffit de ne pas utiliser ce bouton.",
    hForward: "Si vous transf\u00e9rez le document",
    forward: "Chaque coll\u00e8gue que vous d\u00e9signez re\u00e7oit son propre lien et peut voir que vous l\u2019avez partag\u00e9. L\u2019exp\u00e9diteur est inform\u00e9 que le document a \u00e9t\u00e9 transf\u00e9r\u00e9. Ne communiquez les coordonn\u00e9es d\u2019une personne que si vous \u00eates en droit de le faire.",
    hRights: "Vos droits",
    rights1: "Vous pouvez nous demander une copie des informations que nous d\u00e9tenons sur vous, nous demander de les corriger, de les supprimer enti\u00e8rement, ou vous opposer \u00e0 l\u2019\u00e9valuation d\u00e9crite ci-dessus. Cela couvre tout ce que vous nous avez transmis via le bouton de r\u00e9ponse, y compris l\u2019adresse que vous avez indiqu\u00e9e. Si quelqu\u2019un vous a transf\u00e9r\u00e9 un document en nous donnant vos coordonn\u00e9es, vous pouvez nous demander de les supprimer.",
    rights2: "La personne qui vous a envoy\u00e9 le document d\u00e9cide de ce qui est collect\u00e9 : la contacter directement est souvent le plus rapide. Vous pouvez aussi nous \u00e9crire et nous donnerons suite \u00e0 votre demande sous 30 jours. Rien n\u2019est enregistr\u00e9 tant que vous n\u2019avez pas choisi d\u2019ouvrir le lien.",
    hKeep: "Dur\u00e9e de conservation",
    keep: "Jusqu\u2019\u00e0 ce que l\u2019exp\u00e9diteur supprime le document ou ferme son compte, ou jusqu\u2019\u00e0 ce que vous nous demandiez de vous effacer, selon ce qui survient en premier.",
    hComplaints: "R\u00e9clamations",
    complaints: "Vous pouvez introduire une r\u00e9clamation aupr\u00e8s de la Nigeria Data Protection Commission sur ndpc.gov.ng. Si vous vous trouvez dans l\u2019Espace \u00e9conomique europ\u00e9en ou au Royaume-Uni, vous pouvez saisir votre autorit\u00e9 de contr\u00f4le locale.",
    hContact: "Contact",
    contact: "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. \u00c9crivez \u00e0",
    contactEnd: "et nous vous r\u00e9pondrons.",
    footer: "Cet avis est fourni \u00e0 titre de transparence et ne constitue pas un conseil juridique. Si vous avez des questions sur vos droits au titre du RGPD, de la NDPA nig\u00e9riane ou d\u2019une autre loi applicable, veuillez consulter un professionnel qualifi\u00e9.",
    governing: "Cette traduction est fournie pour votre commodit\u00e9. En cas de divergence, la version anglaise fait foi.",
    linkPrivacy: "Avis de confidentialit\u00e9",
    linkTerms: "Conditions d\u2019utilisation",
  },
};

export default async function RelayPrivacy() {
  const locale = await getLocale();
  const c = COPY[locale];
  const mail = { color: GREEN, fontWeight: 600, textDecoration: "none" };
  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: FONT, color: BODY }}>
      <header style={{ background: CARD, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Mark />
          <span style={{ fontSize: 17, fontWeight: 700, color: INK }}>Relay</span>
          <span style={{ marginLeft: "auto" }}><LanguageSwitcher current={locale} dark={false} /></span>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px 72px" }}>
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(9,30,22,0.05), 0 10px 30px rgba(9,30,22,0.05)", padding: "34px 34px 40px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{c.h1}</h1>
          <p style={{ fontSize: 13, color: MUTE, margin: "0 0 4px" }}>{c.lastUpdated} {c.updated}</p>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.65, margin: "18px 0 0" }}>{c.intro}</p>

          <Section title={c.hHandle}>
            {c.handle1}
            <br /><br />
            {c.handle2}
          </Section>

          <Section title={c.hWhy}>{c.why}</Section>

          <Section title={c.hSender}>{c.sender}</Section>

          <Section title={c.hAssess}>
            {c.assess1}
            <br /><br />
            {c.assess2}
          </Section>

          <Section title={c.hCompanion}>{c.companion}</Section>

          <Section title={c.hOthers}>{c.others}</Section>

          <Section title={c.hReply}>
            {c.reply1}
            <br /><br />
            {c.reply2}
            <br /><br />
            {c.reply3}
          </Section>

          <Section title={c.hForward}>{c.forward}</Section>

          <Section title={c.hRights}>
            {c.rights1}
            <br /><br />
            {c.rights2}
          </Section>

          <Section title={c.hKeep}>{c.keep}</Section>

          <Section title={c.hComplaints}>{c.complaints}</Section>

          <Section title={c.hContact}>
            {c.contact}{" "}
            <a href="mailto:privacy@readprospects.com" style={mail}>privacy@readprospects.com</a> {c.contactEnd}
          </Section>

          <p style={{ fontSize: 13, color: MUTE, lineHeight: 1.6, margin: "28px 0 0", paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
            {c.footer}
            {c.governing ? <><br /><br />{c.governing}</> : null}
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: MUTE }}>
          <a href="/privacy" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>{c.linkPrivacy}</a>
          <span style={{ margin: "0 10px" }}>&middot;</span>
          <a href="/terms" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>{c.linkTerms}</a>
        </div>
      </main>
    </div>
  );
}