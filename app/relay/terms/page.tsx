import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import LanguageSwitcher from "@/lib/LanguageSwitcher";

// Terms of use for the reader-delivery domain (relaydocuments.com/terms, rewritten from
// /relay/terms by middleware). Names the real operating entity, sets out what the service
// does including the measurement, and allocates responsibility for content to the sender.
// Not legal advice.
//
// BILINGUAL, English governing. Same reasoning as the privacy notice next to it: the
// reader interface is EN/FR, so a French reader should be able to read the terms that
// apply to them. The French carries a line saying the English governs.
export const metadata: Metadata = {
  title: { absolute: "Terms of use \u2014 RelayDocuments" },
  description: "The terms that apply when you receive or open a document shared through RelayDocuments.",
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
    updated: "24 July 2026",
    lastUpdated: "Last updated",
    h1: "Terms of use",
    intro: "RelayDocuments is a service for delivering documents by secure link, operated by ReadProspects Technologies Nigeria (RC 9702396). These terms apply when you receive, open, or forward a document through RelayDocuments. If you do not agree with them, do not open the document.",
    hWhat: "What the service does",
    what: "RelayDocuments delivers a document that someone chose to share with you. Once you open it, the person who shared it can see how it was read, including any questions you ask inside the document. Our privacy notice explains exactly what is recorded and what the sender receives. You can read the document, ask questions of the document companion, and, if you choose, forward it to a colleague, in which case that colleague receives their own link.",
    hUse: "Acceptable use",
    use: "Use RelayDocuments only to read and share documents you are entitled to. Do not attempt to access documents that were not shared with you, probe or interfere with the service, use automated means to access it, or use it to distribute unlawful, harmful or infringing material. We may suspend a link that is being misused.",
    hNotOurs: "The documents are not ours",
    notOurs: "Documents shared through RelayDocuments belong to the people and organisations that share them. We deliver them on their behalf. We do not write, review, endorse or verify the content of any shared document, and we are not responsible for it. Any question about a document, including why it was sent to you, should go to the person who sent it.",
    hForward: "Forwarding",
    forward: "If you use the forwarding option, you confirm that you have a legitimate reason to share the document with the people you name, and that you are entitled to give us their contact details for that purpose. Each person you name receives their own link and can see that you shared it, and the sender is told the document was forwarded. You are responsible for who you forward to.",
    hAvail: "Availability",
    avail: "We work to keep the service available and reliable, but we provide it as is and as available. We do not warrant that it will be uninterrupted, error-free, or that a document will render correctly on every device or browser. The document companion produces generated text and can be inaccurate, so do not rely on it as a substitute for reading the document itself or for advice from the sender.",
    hLiability: "Liability",
    liability: "To the fullest extent permitted by law, ReadProspects Technologies Nigeria is not liable for indirect, incidental or consequential loss arising from your use of the service, for the content of any document shared through it, or for decisions you make in reliance on anything the document companion tells you. Nothing here excludes liability that cannot lawfully be excluded, including for fraud or for death or personal injury caused by negligence.",
    hPrivacy: "Privacy",
    privacy: "Our privacy notice sets out what information is involved when you open a document, what the sender can see, and the rights you have, including the right to ask us to erase you. Read it at",
    hLaw: "Governing law",
    law: "These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of the Federal Capital Territory, Abuja have jurisdiction. Nothing here deprives you of protections available under the mandatory law of your country of residence.",
    hChanges: "Changes",
    changes: "We may update these terms as the service or the law evolves. When we make a material change we will update the date above. Continuing to use RelayDocuments after a change means you accept the updated terms.",
    hContact: "Contact",
    contact: "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. Email",
    footer: "These terms are provided for transparency and are not legal advice.",
    governing: "",
    linkPrivacy: "Privacy notice",
    linkTerms: "Terms of use",
  },
  fr: {
    updated: "24 juillet 2026",
    lastUpdated: "Derni\u00e8re mise \u00e0 jour",
    h1: "Conditions d\u2019utilisation",
    intro: "RelayDocuments est un service de livraison de documents par lien s\u00e9curis\u00e9, exploit\u00e9 par ReadProspects Technologies Nigeria (RC 9702396). Ces conditions s\u2019appliquent lorsque vous recevez, ouvrez ou transf\u00e9rez un document via RelayDocuments. Si vous ne les acceptez pas, n\u2019ouvrez pas le document.",
    hWhat: "Ce que fait le service",
    what: "RelayDocuments livre un document que quelqu\u2019un a choisi de partager avec vous. Une fois que vous l\u2019ouvrez, la personne qui l\u2019a partag\u00e9 peut voir comment il a \u00e9t\u00e9 lu, y compris les questions que vous posez \u00e0 l\u2019int\u00e9rieur du document. Notre avis de confidentialit\u00e9 explique pr\u00e9cis\u00e9ment ce qui est enregistr\u00e9 et ce que re\u00e7oit l\u2019exp\u00e9diteur. Vous pouvez lire le document, poser des questions au compagnon du document et, si vous le souhaitez, le transf\u00e9rer \u00e0 un coll\u00e8gue, qui recevra alors son propre lien.",
    hUse: "Usage acceptable",
    use: "N\u2019utilisez RelayDocuments que pour lire et partager des documents auxquels vous avez droit. N\u2019essayez pas d\u2019acc\u00e9der \u00e0 des documents qui ne vous ont pas \u00e9t\u00e9 partag\u00e9s, de sonder ou de perturber le service, d\u2019y acc\u00e9der par des moyens automatis\u00e9s, ni de l\u2019utiliser pour diffuser des contenus illicites, nuisibles ou contrefaisants. Nous pouvons suspendre un lien qui fait l\u2019objet d\u2019un usage abusif.",
    hNotOurs: "Les documents ne sont pas les n\u00f4tres",
    notOurs: "Les documents partag\u00e9s via RelayDocuments appartiennent aux personnes et organisations qui les partagent. Nous les livrons pour leur compte. Nous n\u2019\u00e9crivons, n\u2019examinons, n\u2019approuvons ni ne v\u00e9rifions le contenu d\u2019aucun document partag\u00e9, et nous n\u2019en sommes pas responsables. Toute question sur un document, y compris la raison pour laquelle il vous a \u00e9t\u00e9 envoy\u00e9, doit \u00eatre adress\u00e9e \u00e0 la personne qui l\u2019a envoy\u00e9.",
    hForward: "Le transfert",
    forward: "Si vous utilisez l\u2019option de transfert, vous confirmez avoir un motif l\u00e9gitime de partager le document avec les personnes que vous d\u00e9signez, et \u00eatre en droit de nous communiquer leurs coordonn\u00e9es \u00e0 cette fin. Chaque personne d\u00e9sign\u00e9e re\u00e7oit son propre lien et peut voir que vous l\u2019avez partag\u00e9, et l\u2019exp\u00e9diteur est inform\u00e9 que le document a \u00e9t\u00e9 transf\u00e9r\u00e9. Vous \u00eates responsable des personnes \u00e0 qui vous le transf\u00e9rez.",
    hAvail: "Disponibilit\u00e9",
    avail: "Nous nous effor\u00e7ons de maintenir le service disponible et fiable, mais nous le fournissons en l\u2019\u00e9tat et selon disponibilit\u00e9. Nous ne garantissons pas qu\u2019il sera ininterrompu, exempt d\u2019erreurs, ni qu\u2019un document s\u2019affichera correctement sur tous les appareils ou navigateurs. Le compagnon du document produit du texte g\u00e9n\u00e9r\u00e9 et peut se tromper : ne vous y fiez pas comme substitut \u00e0 la lecture du document lui-m\u00eame ou aux explications de l\u2019exp\u00e9diteur.",
    hLiability: "Responsabilit\u00e9",
    liability: "Dans toute la mesure permise par la loi, ReadProspects Technologies Nigeria n\u2019est pas responsable des pertes indirectes, accessoires ou cons\u00e9cutives d\u00e9coulant de votre utilisation du service, du contenu de tout document partag\u00e9 par son interm\u00e9diaire, ni des d\u00e9cisions que vous prenez en vous fiant \u00e0 ce que vous dit le compagnon du document. Rien ici n\u2019exclut une responsabilit\u00e9 qui ne peut l\u00e9galement \u00eatre exclue, notamment en cas de fraude, de d\u00e9c\u00e8s ou de dommage corporel caus\u00e9 par une n\u00e9gligence.",
    hPrivacy: "Confidentialit\u00e9",
    privacy: "Notre avis de confidentialit\u00e9 expose quelles informations sont en jeu lorsque vous ouvrez un document, ce que l\u2019exp\u00e9diteur peut voir, et les droits dont vous disposez, y compris celui de demander votre effacement. \u00c0 lire sur",
    hLaw: "Droit applicable",
    law: "Ces conditions sont r\u00e9gies par le droit de la R\u00e9publique f\u00e9d\u00e9rale du Nigeria, et les tribunaux du Territoire de la capitale f\u00e9d\u00e9rale, Abuja, sont comp\u00e9tents. Rien ici ne vous prive des protections pr\u00e9vues par les lois imp\u00e9ratives de votre pays de r\u00e9sidence.",
    hChanges: "Modifications",
    changes: "Nous pouvons mettre \u00e0 jour ces conditions \u00e0 mesure que le service ou la loi \u00e9voluent. En cas de modification importante, nous mettrons \u00e0 jour la date ci-dessus. Continuer \u00e0 utiliser RelayDocuments apr\u00e8s une modification vaut acceptation des conditions mises \u00e0 jour.",
    hContact: "Contact",
    contact: "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. \u00c9crivez \u00e0",
    footer: "Ces conditions sont fournies \u00e0 titre de transparence et ne constituent pas un conseil juridique.",
    governing: "Cette traduction est fournie pour votre commodit\u00e9. En cas de divergence, la version anglaise fait foi.",
    linkPrivacy: "Avis de confidentialit\u00e9",
    linkTerms: "Conditions d\u2019utilisation",
  },
};

export default async function RelayTerms() {
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

          <Section title={c.hWhat}>{c.what}</Section>
          <Section title={c.hUse}>{c.use}</Section>
          <Section title={c.hNotOurs}>{c.notOurs}</Section>
          <Section title={c.hForward}>{c.forward}</Section>
          <Section title={c.hAvail}>{c.avail}</Section>
          <Section title={c.hLiability}>{c.liability}</Section>

          <Section title={c.hPrivacy}>
            {c.privacy}{" "}
            <a href="/privacy" style={mail}>relaydocuments.com/privacy</a>.
          </Section>

          <Section title={c.hLaw}>{c.law}</Section>
          <Section title={c.hChanges}>{c.changes}</Section>

          <Section title={c.hContact}>
            {c.contact}{" "}
            <a href="mailto:privacy@readprospects.com" style={mail}>privacy@readprospects.com</a>.
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