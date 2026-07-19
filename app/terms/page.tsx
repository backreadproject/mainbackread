import MarketingNav from "../MarketingNav";

const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Section = { id: string; h: string; body: (string | string[])[] };

const UPDATED = "1st July 2026";

const SECTIONS: Section[] = [
  {
    id: "agreement",
    h: "1. Agreement to these terms",
    body: [
      "These Terms of Service govern your use of BackRead. By creating an account or using the service, you agree to these terms. If you are using BackRead on behalf of an organization, you confirm that you have the authority to bind that organization to these terms.",
      "These terms are governed by the laws of the Federal Republic of Nigeria, and we have written them to sit alongside our Privacy Policy, which forms part of your agreement with us.",
    ],
  },
  {
    id: "service",
    h: "2. What BackRead provides",
    body: [
      "BackRead is a document intelligence service. It lets you share documents, allows your readers to ask questions inside those documents, captures how documents are read, and returns insight about that reading. We may improve, change, or add features over time, and we will not degrade the core service you rely on without reasonable notice.",
    ],
  },
  {
    id: "accounts",
    h: "3. Your account",
    body: [
      "You are responsible for keeping your login credentials secure and for all activity under your account. You agree to provide accurate account information and to keep it current. You must be at least 18 years old to use BackRead. If you believe your account has been accessed without authorization, tell us promptly.",
    ],
  },
  {
    id: "content",
    h: "4. Your content and ownership",
    body: [
      "You retain full ownership of every document you upload and all content within it. We claim no ownership over your documents.",
      "You grant us only the limited permission necessary to host, display, and process your documents so we can provide the service to you and to the readers you share with. This permission ends when you delete the content or close your account.",
      "You are responsible for ensuring you have the right to upload and share each document, and that doing so, along with observing how it is read, is lawful in your circumstances.",
    ],
  },
  {
    id: "acceptable",
    h: "5. Acceptable use",
    body: [
      "BackRead exists for legitimate professional use. You agree not to:",
      [
        "Upload or share content that is unlawful, infringing, or that you do not have the right to share.",
        "Use the service to deceive, harass, defraud, or harm others.",
        "Attempt to breach the security of the service, access data that is not yours, or interfere with other users.",
        "Reverse engineer, resell, or misuse the service outside these terms.",
        "Use BackRead to process sensitive personal data in ways that are unlawful or that its recipients have not been made aware of.",
      ],
      "We may suspend or terminate accounts that violate these rules, and we will act proportionately.",
    ],
  },
  {
    id: "privacy",
    h: "6. Privacy and data protection",
    body: [
      "Our handling of personal data is governed by our Privacy Policy, which is built to comply with the NDPR, the Nigeria Data Protection Act 2023, and the GDPR where it applies. Where you use BackRead to process the personal data of your readers, you act as the controller of that data and we act as your processor, handling it only on your instructions and with strong safeguards against data leaks.",
    ],
  },
  {
    id: "billing",
    h: "7. Plans and billing",
    body: [
      "BackRead offers a free plan and paid plans. Paid plans are billed in advance for the period you choose. You may upgrade or downgrade at any time, and changes take effect from your next billing cycle. Fees are non-refundable except where required by law. We will always tell you clearly before you are charged.",
    ],
  },
  {
    id: "availability",
    h: "8. Availability",
    body: [
      "We work hard to keep BackRead available and reliable, but we do not promise uninterrupted service. We may occasionally need to perform maintenance or suspend the service to protect it, and we will minimize disruption where we can.",
    ],
  },
  {
    id: "termination",
    h: "9. Suspension and termination",
    body: [
      "You may stop using BackRead and close your account at any time. We may suspend or terminate your access if you breach these terms, if required by law, or to protect the service and its users. On termination, you can request an export of your data within a reasonable window, after which it may be deleted in line with our Privacy Policy.",
    ],
  },
  {
    id: "liability",
    h: "10. Liability",
    body: [
      "BackRead is provided on a reasonable-efforts basis. To the fullest extent permitted by Nigerian law, we are not liable for indirect or consequential losses, and our total liability arising from the service is limited to the amount you paid us in the twelve months before the claim. Nothing in these terms excludes liability that cannot lawfully be excluded.",
    ],
  },
  {
    id: "indemnity",
    h: "11. Your responsibilities to us",
    body: [
      "You agree to indemnify us against claims arising from your unlawful use of the service or from content you had no right to share. This reflects that you control what you upload and who you share it with.",
    ],
  },
  {
    id: "law",
    h: "12. Governing law and disputes",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria. We will try to resolve any dispute with you amicably and in good faith first. Where that is not possible, the dispute will be subject to the jurisdiction of the courts of Nigeria.",
    ],
  },
  {
    id: "changes",
    h: "13. Changes to these terms",
    body: [
      "We may update these terms as the service or the law evolves. When we make a material change we will update the date above and, where appropriate, notify you. Continued use after a change means you accept the updated terms.",
    ],
  },
  {
    id: "contact",
    h: "14. Contact us",
    body: [
      "If you have a question about these terms, the fastest way to reach us is the live chat on our website. Our team is happy to help.",
    ],
  },
];

export default function TermsPage() {
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`.lg-a{color:${GREEN_TEXT};text-decoration:none}.lg-a:hover{text-decoration:underline}@media(max-width:640px){.lg-h1{font-size:34px!important}.lg-body{font-size:15px!important}}`}</style>
      <MarketingNav />

      <section style={{ background: GRADIENT, color: "#fff", padding: "148px 0 76px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(216,232,74,0.14)", border: "1px solid rgba(216,232,74,0.40)", color: LEMON, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 22, textTransform: "uppercase" }}>Governed by the laws of Nigeria</div>
          <h1 className="lg-h1" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Terms of Service</h1>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 auto", maxWidth: 560, lineHeight: 1.55 }}>Clear terms, written in plain language, so you always know where you stand with BackRead.</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "18px 0 0" }}>Last updated: {UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "56px 0 40px" }}>
        <div style={wrap}>
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 26, marginBottom: 44, boxShadow: "0 8px 30px rgba(11,122,75,0.08)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, margin: "0 0 14px" }}>Summary</h2>
            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "You own your documents. We only host and process them to serve you.",
                "Use BackRead lawfully and for legitimate professional purposes.",
                "Free and paid plans, billed in advance, cancel any time.",
                "We keep the service secure and comply with the NDPR and GDPR.",
                "These terms are governed by the laws of Nigeria.",
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
