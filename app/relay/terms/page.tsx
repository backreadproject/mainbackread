import type { Metadata } from "next";

// Terms of use for the reader-delivery domain (relaydocuments.com/terms). Neutral and
// self-contained: it covers what RelayDocuments does, acceptable use, whose content the
// documents are, and the forwarding condition. Not legal advice.
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
  const updated = "July 2026";
  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: FONT, color: BODY }}>
      <header style={{ background: CARD, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Mark />
          <span style={{ fontSize: 17, fontWeight: 700, color: INK }}>Relay</span>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px 40px" }}>
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(9,30,22,0.05), 0 10px 30px rgba(9,30,22,0.05)", padding: "34px 34px 40px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Terms of use</h1>
          <p style={{ fontSize: 13, color: MUTE, margin: "0 0 4px" }}>Last updated {updated}</p>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.65, margin: "18px 0 0" }}>
            RelayDocuments is a service, operated by RelayDocuments Inc, for delivering documents by secure link. These terms
            apply when you receive, open, or forward a document through RelayDocuments. If you do not agree with them, please
            do not open the document.
          </p>

          <Section title="What the service does">
            RelayDocuments delivers a document that someone chose to share with you and, once you open it, lets the person who
            shared it see how it was received. You can read the document, ask questions inside it, and, if you choose, forward
            it to a colleague, in which case that colleague receives their own link.
          </Section>

          <Section title="Acceptable use">
            Please use RelayDocuments only to read and share documents you are entitled to. Do not attempt to access documents
            that were not shared with you, interfere with or probe the service, or use it to distribute unlawful, harmful, or
            infringing material. We may suspend access to a link that is being misused.
          </Section>

          <Section title="The documents are not ours">
            Documents shared through RelayDocuments belong to the people and organisations that share them, not to
            RelayDocuments. We deliver them on their behalf. We do not endorse, verify, or take responsibility for the content
            of any shared document, and any questions about a document should go to the person who sent it to you.
          </Section>

          <Section title="Forwarding">
            If you use the forwarding option, you confirm that you have a legitimate reason to share the document with the
            people you name, and that you are entitled to provide their contact details for that purpose. Each person you
            forward to is emailed their own link and can see that you shared it.
          </Section>

          <Section title="Availability and liability">
            We work to keep the service available and reliable, but we provide it on an "as is" basis and cannot guarantee it
            will always be uninterrupted or error-free. To the extent permitted by law, RelayDocuments Inc is not liable for
            indirect or consequential loss arising from your use of the service.
          </Section>

          <Section title="Changes">
            We may update these terms as the service or the law evolves. When we make a material change we will update the date
            above. Continuing to use RelayDocuments after a change means you accept the updated terms.
          </Section>

          <Section title="Contact">
            RelayDocuments Inc. Email <a href="mailto:hello@relaydocuments.com" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>hello@relaydocuments.com</a>.
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
