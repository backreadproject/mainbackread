import MarketingNav from "../MarketingNav";

const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Section = { id: string; h: string; body: (string | string[])[] };

const UPDATED = "1st July 2026";

const SECTIONS: Section[] = [
  {
    id: "intro",
    h: "1. Who we are",
    body: [
      "BackRead is a document intelligence service that lets you share documents and understand how they are read. This Privacy Policy explains what personal data we collect, why we collect it, how we protect it, and the rights you have over it.",
      "For the purposes of the Nigeria Data Protection Regulation (NDPR), the Nigeria Data Protection Act 2023, and, where it applies, the EU and UK General Data Protection Regulation (GDPR), BackRead is the data controller for the account and marketing data we hold about our users, and a data processor for the document and reader data our users choose to process through the service.",
      "We designed BackRead so that understanding your readers never comes at the cost of their privacy or yours. Reading this policy should leave you reassured, not uneasy.",
    ],
  },
  {
    id: "collect",
    h: "2. The data we collect",
    body: [
      "We collect only what we need to run the service well. We group it into four categories:",
      [
        "Account data: your name, email address, password (stored only as a secure hash, never in plain text), and, for organization accounts, your company name and team membership.",
        "Document data: the documents you upload, their contents, and any metadata attached to them. These are yours. We store them so we can display them to the people you share them with.",
        "Reader data: when someone opens a document you shared, we record activity such as pages viewed, time on page, questions typed into the document, and the resulting signals used to produce a verdict. This is captured to give you the insight the product exists to provide.",
        "Technical data: IP address, browser type, device information, and similar diagnostic data collected automatically to keep the service secure and working.",
      ],
      "We do not collect special categories of personal data (such as health, religion, or biometric data) and we ask that you do not upload documents whose primary purpose is to process such data through BackRead.",
    ],
  },
  {
    id: "lawful",
    h: "3. Our lawful basis for processing",
    body: [
      "Under the NDPR and GDPR we must have a lawful basis for every use of personal data. Ours are:",
      [
        "Contract: we process your account and document data because it is necessary to provide the service you signed up for.",
        "Legitimate interests: we process technical and limited usage data to secure, maintain, and improve the service, balanced carefully against your rights.",
        "Consent: where we rely on consent, for example non-essential cookies or marketing email, you may withdraw it at any time without affecting your use of the product.",
        "Legal obligation: we may process data where the law of the Federal Republic of Nigeria requires it.",
      ],
      "Readers whose activity is captured are informed that the document is a BackRead document. As the person sharing a document, you are responsible for having a lawful basis to share it and to observe how it is read.",
    ],
  },
  {
    id: "use",
    h: "4. How we use your data",
    body: [
      "We use personal data to operate the document companion, produce reading signals and verdicts, show you reader activity, secure your account, provide support, and, where you have opted in, send you product updates. We never sell your personal data, and we never use the contents of your documents to train external models or for any purpose other than delivering the service to you.",
    ],
  },
  {
    id: "sharing",
    h: "5. When we share data, and when we do not",
    body: [
      "We do not sell, rent, or trade personal data. We share it only in these limited situations:",
      [
        "Service providers: vetted infrastructure partners (such as hosting and email delivery) who process data strictly on our instructions under written agreements that meet NDPR and GDPR standards.",
        "Your own instructions: when you share a document, its intended recipients can see it. That is the point of the product, and it happens only when you choose it.",
        "Legal requirements: where we are compelled by a valid order under Nigerian law, disclosed only to the extent required.",
        "Business transfers: if BackRead is ever involved in a merger or acquisition, data would transfer under the same protections described here, and you would be notified.",
      ],
      "Beyond these, your data stays within BackRead.",
    ],
  },
  {
    id: "security",
    h: "6. How we protect your data",
    body: [
      "Security is not a feature we bolt on; it is how the service is built. We apply layered technical and organizational measures designed to prevent data leaks:",
      [
        "Encryption in transit and at rest for documents and account data.",
        "Strict access controls, so that documents are visible only to the account that owns them and the readers that account explicitly shares with. Enforced at the database level, not just in the interface.",
        "Row-level security policies that make it technically impossible for one account to read another account's documents or reader data.",
        "Hashed, salted passwords, so that even we cannot see your password.",
        "Continuous monitoring, least-privilege internal access, and prompt patching.",
      ],
      "No system can promise perfection, but we hold ourselves to a high standard and treat any incident with the seriousness it deserves. If a breach ever affected your personal data, we would notify the National Data Protection Commission and affected individuals in line with the timelines set by Nigerian law and the GDPR.",
    ],
  },
  {
    id: "retention",
    h: "7. How long we keep data",
    body: [
      "We keep personal data only as long as we need it. Documents and reader data remain until you delete them or close your account. Account data is retained for the life of your account and for a short, defined period afterward to meet legal and accounting obligations, then securely erased. You can delete individual documents at any time, which removes their associated reader data.",
    ],
  },
  {
    id: "rights",
    h: "8. Your rights",
    body: [
      "Under the NDPR, the Nigeria Data Protection Act, and the GDPR where it applies, you have the right to:",
      [
        "Access the personal data we hold about you.",
        "Correct data that is inaccurate or incomplete.",
        "Erase your data (the right to be forgotten), subject to our legal obligations.",
        "Restrict or object to certain processing.",
        "Data portability, receiving your data in a structured, commonly used format.",
        "Withdraw consent at any time where processing is based on consent.",
        "Lodge a complaint with the Nigeria Data Protection Commission.",
      ],
      "To exercise any of these rights, contact us using the details below. We will respond within the timeframe required by law, and we will never charge you for making a request in ordinary circumstances.",
    ],
  },
  {
    id: "transfers",
    h: "9. International transfers",
    body: [
      "Where personal data is transferred outside Nigeria, we ensure an adequate level of protection through appropriate safeguards, such as contractual clauses that bind the recipient to standards equivalent to the NDPR and GDPR. We transfer data internationally only where it is necessary to provide the service and lawful to do so.",
    ],
  },
  {
    id: "cookies",
    h: "10. Cookies",
    body: [
      "We use a small number of essential cookies to keep you signed in and to keep the service secure. Any non-essential cookies, for example analytics, are used only with your consent, which you can manage or withdraw at any time.",
    ],
  },
  {
    id: "children",
    h: "11. Children",
    body: [
      "BackRead is a business tool and is not directed at children. We do not knowingly collect personal data from anyone under the age of 18. If you believe a child has provided us data, contact us and we will remove it.",
    ],
  },
  {
    id: "changes",
    h: "12. Changes to this policy",
    body: [
      "We may update this policy as the service or the law evolves. When we make a material change, we will update the date at the top and, where appropriate, notify you directly. Continued use of BackRead after a change means you accept the updated policy.",
    ],
  },
  {
    id: "contact",
    h: "13. Contact us",
    body: [
      "If you have any question about this policy, or wish to exercise a right, please contact our data protection team. We treat every message from a user or a reader with care and respond promptly.",
      "Contact details will be published here before launch.",
    ],
  },
];

export default function PrivacyPage() {
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`.lg-a{color:${GREEN_TEXT};text-decoration:none}.lg-a:hover{text-decoration:underline}@media(max-width:640px){.lg-h1{font-size:34px!important}.lg-body{font-size:15px!important}}`}</style>
      <MarketingNav />

      <section style={{ background: GRADIENT, color: "#fff", padding: "148px 0 76px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(216,232,74,0.14)", border: "1px solid rgba(216,232,74,0.40)", color: LEMON, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 22, textTransform: "uppercase" }}>NDPR and GDPR aligned</div>
          <h1 className="lg-h1" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 auto", maxWidth: 560, lineHeight: 1.55 }}>Your documents, and the trust of the people who read them, are yours. Here is exactly how we protect both.</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "18px 0 0" }}>Last updated: {UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "56px 0 40px" }}>
        <div style={wrap}>
          {/* quick summary card */}
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 26, marginBottom: 44, boxShadow: "0 8px 30px rgba(11,122,75,0.08)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, margin: "0 0 14px" }}>The short version</h2>
            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "We collect only what we need to run BackRead well.",
                "We never sell your data, and we never train outside models on your documents.",
                "Your documents are visible only to you and the readers you choose.",
                "You can access, correct, or delete your data at any time.",
                "We build to prevent data leaks, and we comply with the NDPR, the Nigeria Data Protection Act, and the GDPR.",
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 15.5, lineHeight: 1.5, color: BODY }}>{t}</li>
              ))}
            </ul>
          </div>

          {SECTIONS.map((sec) => (
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
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <a href="/" style={{ fontSize: 14, color: MUTE, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg></span> BackRead, the document reads the reader.</a>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <a href="https://www.linkedin.com/company/backread/" target="_blank" rel="noopener noreferrer" aria-label="BackRead on LinkedIn" style={{ color: MUTE, display: "flex", alignItems: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18.5h2.67V9.5zM7 5.9a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zM18.34 18.5v-4.94c0-2.64-1.41-3.87-3.29-3.87-1.52 0-2.2.84-2.58 1.43V9.5h-2.67V18.5h2.67v-4.77c0-1.26.24-2.48 1.8-2.48 1.54 0 1.56 1.44 1.56 2.56v4.69h2.78z"/></svg></a>
            <a href="/pricing" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>Pricing</a>
            <a href="/privacy" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>Privacy</a>
            <a href="/terms" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>Terms</a>
            <a href="/login" style={{ color: MUTE, fontSize: 13, textDecoration: "none" }}>Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
