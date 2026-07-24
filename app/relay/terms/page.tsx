import type { Metadata } from "next";

// Terms of use for the reader-delivery domain (relaydocuments.com/terms, rewritten from
// /relay/terms by middleware). Names the real operating entity, sets out what the service
// does including the measurement, and allocates responsibility for content to the sender.
// Not legal advice.
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
      <div style={{ fontSize: 14.5, color: BODY, lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

export default function RelayTerms() {
  const updated = "24 July 2026";
  const mail = { color: GREEN, fontWeight: 600, textDecoration: "none" };
  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: FONT, color: BODY }}>
      <header style={{ background: CARD, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Mark />
          <span style={{ fontSize: 17, fontWeight: 700, color: INK }}>Relay</span>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px 72px" }}>
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(9,30,22,0.05), 0 10px 30px rgba(9,30,22,0.05)", padding: "34px 34px 40px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Terms of use</h1>
          <p style={{ fontSize: 13, color: MUTE, margin: "0 0 4px" }}>Last updated {updated}</p>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.65, margin: "18px 0 0" }}>
            RelayDocuments is a service for delivering documents by secure link, operated by ReadProspects Technologies
            Nigeria (RC 9702396). These terms apply when you receive, open, or forward a document through RelayDocuments. If
            you do not agree with them, do not open the document.
          </p>

          <Section title="What the service does">
            RelayDocuments delivers a document that someone chose to share with you. Once you open it, the person who shared
            it can see how it was read, including any questions you ask inside the document. Our privacy notice explains
            exactly what is recorded and what the sender receives. You can read the document, ask questions of the document
            companion, and, if you choose, forward it to a colleague, in which case that colleague receives their own link.
          </Section>

          <Section title="Acceptable use">
            Use RelayDocuments only to read and share documents you are entitled to. Do not attempt to access documents that
            were not shared with you, probe or interfere with the service, use automated means to access it, or use it to
            distribute unlawful, harmful or infringing material. We may suspend a link that is being misused.
          </Section>

          <Section title="The documents are not ours">
            Documents shared through RelayDocuments belong to the people and organisations that share them. We deliver them
            on their behalf. We do not write, review, endorse or verify the content of any shared document, and we are not
            responsible for it. Any question about a document, including why it was sent to you, should go to the person who
            sent it.
          </Section>

          <Section title="Forwarding">
            If you use the forwarding option, you confirm that you have a legitimate reason to share the document with the
            people you name, and that you are entitled to give us their contact details for that purpose. Each person you
            name receives their own link and can see that you shared it, and the sender is told the document was forwarded.
            You are responsible for who you forward to.
          </Section>

          <Section title="Availability">
            We work to keep the service available and reliable, but we provide it as is and as available. We do not warrant
            that it will be uninterrupted, error-free, or that a document will render correctly on every device or browser.
            The document companion produces generated text and can be inaccurate, so do not rely on it as a substitute for
            reading the document itself or for advice from the sender.
          </Section>

          <Section title="Liability">
            To the fullest extent permitted by law, ReadProspects Technologies Nigeria is not liable for indirect,
            incidental or consequential loss arising from your use of the service, for the content of any document shared
            through it, or for decisions you make in reliance on anything the document companion tells you. Nothing here
            excludes liability that cannot lawfully be excluded, including for fraud or for death or personal injury caused
            by negligence.
          </Section>

          <Section title="Privacy">
            Our privacy notice sets out what information is involved when you open a document, what the sender can see, and
            the rights you have, including the right to ask us to erase you. Read it at{" "}
            <a href="/privacy" style={mail}>relaydocuments.com/privacy</a>.
          </Section>

          <Section title="Governing law">
            These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of the Federal Capital
            Territory, Abuja have jurisdiction. Nothing here deprives you of protections available under the mandatory law of
            your country of residence.
          </Section>

          <Section title="Changes">
            We may update these terms as the service or the law evolves. When we make a material change we will update the
            date above. Continuing to use RelayDocuments after a change means you accept the updated terms.
          </Section>

          <Section title="Contact">
            ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. Email{" "}
            <a href="mailto:privacy@readprospects.com" style={mail}>privacy@readprospects.com</a>.
          </Section>

          <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "28px 0 0", paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
            These terms are provided for transparency and are not legal advice.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: MUTE }}>
          <a href="/privacy" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>Privacy notice</a>
          <span style={{ margin: "0 10px" }}>&middot;</span>
          <a href="/terms" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>Terms of use</a>
        </div>
      </main>
    </div>
  );
}
