import MarketingNav from "../MarketingNav";

// Prices are placeholders you can edit right here in the TIERS array. Company II
// is set to a placeholder monthly price; switch it to "Custom" with a contact CTA
// anytime if you'd rather sell it as contact-sales. Both company plans carry a
// 7-day free trial. No watermark on any plan, ever.
const NIGHT = "#082019";
const GREEN = "#0B7A4B";
const BRAND = "#1FA971";
const INK = "#0F1729";
const BODY = "#475467";
const MUTE = "#8A9299";
const BORDER = "#EAECEF";
const SOFT = "#E7F6EF";

type Tier = {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  href: string;
  popular?: boolean;
  includes?: string;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "A taste of the real thing.",
    cta: "Start free",
    href: "/login",
    features: [
      "2 documents per month",
      "2 verdicts per document each month",
      "1 recipient per document, 5 email sends a month",
      "Ask-the-document companion",
      "Reader tracking: opens, dwell, timeline",
      "Reader questions and intent capture",
    ],
  },
  {
    id: "personal",
    name: "Personal",
    price: "$29",
    period: "per month",
    tagline: "Everything, for one person.",
    cta: "Start free",
    href: "/login",
    popular: true,
    includes: "Everything in Free, plus",
    features: [
      "Unlimited documents, verdicts, recipients and sends",
      "Projects to group your documents",
      "Send by email with a personal note",
      "Saved reader conversations",
      "Verdict history",
      "Compose workspace to act on a read",
      "Link customization: branding, expiry, password, preview",
      "Weekly activity digest and data export",
    ],
  },
  {
    id: "company_1",
    name: "Company I",
    price: "$99",
    period: "per month",
    tagline: "Your team, one workspace.",
    cta: "Start 7-day trial",
    href: "/login",
    includes: "Everything in Personal, plus",
    features: [
      "Run an organization with roles",
      "Up to 20 seats",
      "Shared workspace and access grants",
      "Team activity feed",
      "Compare readers across a document",
      "Account-level analytics",
      "7-day free trial",
    ],
  },
  {
    id: "company_2",
    name: "Company II",
    price: "$249",
    period: "per month",
    tagline: "Scale, security and control.",
    cta: "Start 7-day trial",
    href: "/login",
    includes: "Everything in Company I, plus",
    features: [
      "Unlimited seats",
      "SSO and SAML",
      "Granular, custom permissions",
      "Audit log",
      "Custom data retention",
      "A/B document versions",
      "Slack and webhook alerts",
      "Zapier and Make integration",
      "7-day free trial",
    ],
  },
];

const FAQ: { q: string; a: string }[] = [
  { q: "What counts as a document?", a: "Any file you upload to share and track. On Free you can start two new documents each month; paid plans are unlimited." },
  { q: "When do the Free limits reset?", a: "On the first of each month. Your documents, verdicts and sends refill then." },
  { q: "Do the company plans really include a free trial?", a: "Yes. Company I and Company II both start with a 7-day free trial, no card needed to begin." },
  { q: "Can I change plans later?", a: "Anytime. Move up when you need seats or the security features, and your work stays exactly where it is." },
  { q: "Is my reader's activity private to them?", a: "Reader links live on a separate, neutral domain, and there is no BackRead watermark on any plan. What a reader does is shown only to you, the sender." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F7FBF9", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: INK, letterSpacing: "-0.005em" }}>
      <style>{`
        .price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        @media (max-width: 1000px) { .price-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .price-grid { grid-template-columns: 1fr; } }
        .tier-cta { transition: background .15s, transform .05s; }
        .tier-cta:active { transform: translateY(1px); }
      `}</style>

      <MarketingNav />

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, color: "#fff", padding: "84px 20px 96px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 14 }}>Pricing</div>
          <h1 style={{ fontSize: 42, lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>Pay for how much you need to know.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", margin: 0 }}>Start free and see your readers read. Move up when you want to send more, run a team, or lock things down. Every plan captures intent, not just attention.</p>
        </div>
      </section>

      {/* Plan cards */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px", transform: "translateY(-48px)" }}>
        <div className="price-grid">
          {TIERS.map((t) => (
            <div key={t.id} style={{
              background: "#fff",
              border: t.popular ? `2px solid ${GREEN}` : `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              boxShadow: t.popular ? "0 18px 50px rgba(11,122,75,0.16)" : "0 12px 40px rgba(15,23,41,0.06)",
              position: "relative",
            }}>
              {t.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20 }}>Most popular</span>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{t.name}</div>
              <div style={{ fontSize: 13, color: BODY, margin: "4px 0 16px", minHeight: 34, lineHeight: 1.4 }}>{t.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>{t.price}</span>
                <span style={{ fontSize: 13, color: MUTE }}>{t.period}</span>
              </div>
              <a href={t.href} className="tier-cta" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                background: t.popular ? GREEN : "#fff",
                color: t.popular ? "#fff" : INK,
                border: t.popular ? `1px solid ${GREEN}` : `1px solid ${BORDER}`,
                borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 600, margin: "16px 0 20px",
              }}>{t.cta}</a>
              {t.includes && <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 10 }}>{t.includes}</div>}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {t.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: 9, fontSize: 13.5, color: BODY, lineHeight: 1.45 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6L9 17l-5-5" /></svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Baseline strip */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "8px 20px 8px" }}>
        <div style={{ background: SOFT, border: `1px solid #CDEBD8`, borderRadius: 14, padding: "16px 20px", textAlign: "center", fontSize: 13.5, color: "#1B4332", lineHeight: 1.6 }}>
          Every plan includes the private reader domain, a mobile-ready reader, English and French, and no watermark, ever.
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "56px 20px 20px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 28px", letterSpacing: "-0.02em" }}>Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FAQ.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontSize: 14, color: BODY, lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ padding: "56px 20px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, borderRadius: 20, padding: "44px 28px", color: "#fff" }}>
          <h2 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>See your next document read the room.</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", margin: "0 0 24px", lineHeight: 1.6 }}>Start on Free in a couple of minutes. No card, no watermark.</p>
          <a href="/login" style={{ display: "inline-block", background: BRAND, color: NIGHT, textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 11 }}>Start free</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "28px 20px", textAlign: "center", color: MUTE, fontSize: 13 }}>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <a href="/" style={{ color: BODY, textDecoration: "none" }}>Home</a>
          <a href="/pricing" style={{ color: BODY, textDecoration: "none" }}>Pricing</a>
          <a href="/privacy" style={{ color: BODY, textDecoration: "none" }}>Privacy</a>
          <a href="/terms" style={{ color: BODY, textDecoration: "none" }}>Terms</a>
        </div>
        <div>The document reads the reader.</div>
      </footer>
    </div>
  );
}
