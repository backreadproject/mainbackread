import type { Metadata } from "next";

// Privacy notice for the reader-delivery domain (relaydocuments.com/privacy, rewritten
// from /relay/privacy by middleware). It names the real operating entity, and discloses
// the reading measurement, the AI companion and the verdict profiling in plain language.
// Neutral in tone, complete in substance. Not legal advice.
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

export default function RelayPrivacy() {
  const updated = "25 July 2026";
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
          <h1 style={{ fontSize: 27, fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Privacy notice</h1>
          <p style={{ fontSize: 13, color: MUTE, margin: "0 0 4px" }}>Last updated {updated}</p>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.65, margin: "18px 0 0" }}>
            RelayDocuments is a service for sharing documents by secure link, operated by ReadProspects Technologies Nigeria
            (RC 9702396). When someone sends or forwards you a document, we deliver it, and we report back to them on how it
            was read. You did not sign up for this service, so this notice sets out plainly what that involves.
          </p>

          <Section title="What we handle">
            The name and email address the sender provided for you, so we can deliver the link and address the message. How
            you read the document once you open it: when you opened it, which pages you viewed and for how long, whether you
            returned to a page, any questions you type into the document, and whether you forward it. We also process the
            technical information your browser sends, including your IP address, which our hosting providers record in order
            to deliver the page.
            <br /><br />
            If you choose to reply to the sender, we also handle the message you write and the email address you give us for
            them to reply to. Unlike everything above, you supply this yourself, and only if you decide to.
          </Section>

          <Section title="Why we handle it">
            To deliver the document you were sent, and to give the person or organisation who shared it a view of how their
            document was received. This is the purpose of the service, and it is the basis on which documents are shared
            through RelayDocuments. The person who sent you the document decides what is collected and why.
          </Section>

          <Section title="What the sender can see">
            The person who shared the document can see your reading activity, including the questions you asked. If they have
            connected an alert service such as Slack, your question and the answer are delivered to them at the moment you
            ask. The same applies to a reply: if you send one, it reaches them by email, in their account, and at any alert
            service they have connected.
          </Section>

          <Section title="Assessment of your reading">
            The sender can also generate an assessment of how you read. It analyses your behaviour, what you spent time on,
            what you returned to, what you asked, whether you forwarded it, and anything you replied, and produces a written
            interpretation of what you appear to be considering and what the sender might do next. Under data protection law this is profiling, and you
            can object to it using the contact below.
            <br /><br />
            An assessment of this kind is an inference drawn from limited evidence. It can be wrong, and it is not a
            statement of fact about you.
          </Section>

          <Section title="The document companion">
            If you ask the document a question, the document&rsquo;s text and your question are sent to Anthropic, our AI
            provider in the United States, which generates the answer. Your conversation is stored. Anthropic does not use it
            to train their models, and neither do we.
          </Section>

          <Section title="Who else is involved">
            We use Supabase for our database and file storage, Vercel for hosting, Anthropic for the document companion and
            assessments, and Resend for email delivery. All four are based in the United States, so information about you is
            transferred outside Nigeria under contractual safeguards. We do not sell your information, and we do not use it
            for advertising.
          </Section>

          <Section title="If you reply to the sender">
            The document page has a reply button. If you use it, your message and the email address you enter are sent to the
            person who shared the document with you: by email, in their ReadProspects account, and to any alert service they
            have connected, such as Slack. They can reply to you directly at the address you gave.
            <br /><br />
            We keep the address so that the person who shared the document can contact you about it. Your message is also read
            by the assessment described above when the sender generates one, which means it is sent to Anthropic in the United
            States along with the document. It is not used to train any AI model.
            <br /><br />
            You do not have to reply, and nothing is sent until you press send. If you would rather not give an email address,
            you can simply not use the button.
          </Section>
          <Section title="If you forward the document">
            Each colleague you name receives their own link and can see that you shared it. The sender is told that the
            document was forwarded. Please provide someone&rsquo;s contact details only if you are entitled to.
          </Section>

          <Section title="Your rights">
            You can ask us for a copy of the information we hold about you, ask us to correct it, ask us to delete it
            entirely, or object to the assessment described above. This covers anything you sent us through the reply button,
            including the address you gave. If someone forwarded a document to you and gave us your
            details, you can ask us to remove them.
            <br /><br />
            The person who sent you the document decides what is collected, so contacting them directly is often fastest. You
            can also write to us and we will act on your request within 30 days. Nothing is recorded until you choose to open
            the link.
          </Section>

          <Section title="How long we keep it">
            Until the sender deletes the document or closes their account, or until you ask us to erase you, whichever comes
            first.
          </Section>

          <Section title="Complaints">
            You may complain to the Nigeria Data Protection Commission at ndpc.gov.ng. If you are in the European Economic
            Area or the United Kingdom, you may complain to your local supervisory authority.
          </Section>

          <Section title="Contact">
            ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria. Email{" "}
            <a href="mailto:privacy@readprospects.com" style={mail}>privacy@readprospects.com</a> and we will get back to you.
          </Section>

          <p style={{ fontSize: 13, color: MUTE, lineHeight: 1.6, margin: "28px 0 0", paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
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

