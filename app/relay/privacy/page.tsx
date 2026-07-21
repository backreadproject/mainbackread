import type { Metadata } from "next";

// Privacy notice for the reader-delivery domain (relaydocuments.com/relay/privacy).
// Neutral and self-contained: it describes document delivery and the reading activity
// that is measured and shared with the sender, in plain language. It names RelayDocuments
// as the controller and gives an objection/contact route (supports the Article 14 notice
// carried in forwarded-document emails). Not legal advice.
export const metadata: Metadata = {
  title: { absolute: "Privacy notice \u2014 RelayDocuments" },
  description: "How RelayDocuments handles the information involved in delivering shared documents.",
  robots: { index: false, follow: false },
};

const INK = "#0F1729", BODY = "#475467", MUTE = "#98A2B3", GREEN = "#0B7A4B", GREEN_SOFT = "#E7F6EF", LINE = "#EEF0EC", CANVAS = "#F8FAF8", CARD = "#FFFFFF";
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

export default function RelayPrivacy() {
  const updated = "July 2026";
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
          <h1 style={{ fontSize: 27, fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Privacy notice</h1>
          <p style={{ fontSize: 13, color: MUTE, margin: "0 0 4px" }}>Last updated {updated}</p>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.65, margin: "18px 0 0" }}>
            RelayDocuments is a service for sharing documents by secure link. When someone sends or forwards you a document,
            RelayDocuments delivers it and lets the person who shared it see how it was received. This notice explains, in
            plain language, what information is involved and the choices you have. RelayDocuments Inc is responsible for this
            processing.
          </p>

          <Section title="What we handle">
            When a document is shared or forwarded to you, we handle: the name and email address provided by the person who
            shared it, so we can deliver the link and address the message to you; and your activity on the document once you
            open it, such as which pages you view, how long you spend, and any questions you type into the document. We also
            process the basic technical information a browser sends in order to load the document.
          </Section>

          <Section title="Why we handle it">
            To deliver the document you were sent, and to give the person or organisation who shared it a view of how their
            document was received. This is the core purpose of the service, and it is the basis on which documents are shared
            through RelayDocuments.
          </Section>

          <Section title="Who can see it">
            Your reading activity on a shared document is available to the person or organisation that shared it with you.
            If you use the "Forward to a colleague" option, we email that colleague their own link, they can see that you were
            the one who shared it, and the fact that the document was forwarded is available to the original sender. We do not
            sell your information, and we do not use it for advertising.
          </Section>

          <Section title="How long we keep it">
            We keep the delivery and activity information for as long as the shared document remains active, so the sender can
            refer back to it. You can ask us to delete information relating to you at any time using the contact below.
          </Section>

          <Section title="Your choices">
            You are never obliged to open a document that was sent to you, nothing is recorded until you choose to open the
            link. You can ask us for a copy of the information we hold about you, ask us to correct or delete it, or object to
            our handling of it. To do any of these, contact us and we will respond.
          </Section>

          <Section title="Contact">
            RelayDocuments Inc. Email <a href="mailto:privacy@relaydocuments.com" style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}>privacy@relaydocuments.com</a> and
            we will get back to you.
          </Section>

          <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "28px 0 0", paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
            This notice is provided for transparency and is not legal advice. If you have questions about your rights under
            the GDPR, Nigeria&rsquo;s NDPA, or another applicable law, please seek qualified advice.
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
