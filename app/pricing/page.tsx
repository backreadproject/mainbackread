import MarketingNav from "../MarketingNav";

// Prices live here. Edit freely. Personal is the funnel default (Most popular).
// Both company plans carry a 7-day free trial. No watermark on any plan, ever.
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
  audience: string;
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
    period: "to try it",
    audience: "For a first look",
    tagline: "A taste of the real thing. Not enough to run on.",
    cta: "Start free",
    href: "/login",
    features: [
      "2 documents a month",
      "2 verdicts per document a month",
      "1 recipient per document, 5 sends a month",
      "Ask-the-document companion",
      "Reader tracking: opens, dwell, timeline",
    ],
  },
  {
    id: "personal",
    name: "Personal",
    price: "$20",
    period: "per month",
    audience: "Founders, freelancers, solo sellers",
    tagline: "Everything, for one person who closes.",
    cta: "Choose Personal",
    href: "/login",
    popular: true,
    includes: "Everything in Free, plus",
    features: [
      "Unlimited documents, verdicts, recipients and sends",
      "Projects to group your documents",
      "Send by email with a personal note",
      "Saved reader conversations and verdict history",
      "Compose workspace to act on a read",
      "Link customization: branding, expiry, password, preview",
      "Weekly activity digest and data export",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$59",
    period: "per month",
    audience: "Sales and deal teams",
    tagline: "Your whole team, reading together.",
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
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "$99",
    period: "per month",
    audience: "Companies that need control",
    tagline: "Unlimited seats, fully locked down.",
    cta: "Start 7-day trial",
    href: "/login",
    includes: "Everything in Team, plus",
    features: [
      "Unlimited seats",
      "SSO and SAML",
      "Granular, custom permissions",
      "Audit log and custom data retention",
      "A/B document versions",
      "Slack and webhook alerts",
      "Zapier and Make integration",
    ],
  },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Is this just a read receipt?", a: "No. A receipt says a file was opened. BackRead shows what they read closely, what they asked, where they doubted, and whether they are ready to move. Attention is not intent, and only one of them wins deals." },
  { q: "Will my reader feel watched?", a: "They open a clean document on a neutral domain, no BackRead branding anywhere. What they do stays private to you. They get the document, you get the read." },
  { q: "What does Free actually leave out?", a: "Sending by email, saved conversations, verdict history, projects, and all but a couple of documents a month. Enough to see it work, not enough to work on. Real pipelines run on Personal and up." },
  { q: "Which plan is right for me?", a: "On your own, Personal. Selling as a team, Team. Seats without limits, plus SSO and audit, Business." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F7FBF9", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: INK, letterSpacing: "-0.005em" }}>
      <style>{`
        .price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-items: start; }
        @media (max-width: 1000px) { .price-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .price-grid { grid-template-columns: 1fr; } }
        .tier-cta { transition: background .15s, transform .05s; }
        .tier-cta:active { transform: translateY(1px); }
        .hero-cta { transition: transform .05s, background .15s; }
        .hero-cta:active { transform: translateY(1px); }
      `}</style>

      <MarketingNav />

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, color: "#fff", padding: "88px 20px 104px", textAlign: "center" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 16 }}>Pricing</div>
          <h1 style={{ fontSize: 44, lineHeight: 1.06, fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.02em" }}>Stop guessing where your deals stand.</h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", margin: "0 0 30px" }}>A read receipt says they opened it. BackRead tells you what they wanted, where they hesitated, and whether they are ready to move. Pick the plan that keeps you ahead of the room.</p>
          <a href="#plans" className="hero-cta" style={{ display: "inline-block", background: BRAND, color: NIGHT, textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 30px", borderRadius: 11 }}>See the plans</a>
        </div>
      </section>

      {/* Plan cards */}
      <section id="plans" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px", transform: "translateY(-52px)", scrollMarginTop: 80 }}>
        <div className="price-grid">
          {TIERS.map((t) => (
            <div key={t.id} style={{
              background: "#fff",
              border: t.popular ? `2px solid ${GREEN}` : `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              boxShadow: t.popular ? "0 22px 56px rgba(11,122,75,0.18)" : "0 12px 40px rgba(15,23,41,0.06)",
              position: "relative",
              marginTop: t.popular ? -8 : 0,
            }}>
              {t.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>Most popular</span>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{t.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: BRAND, margin: "6px 0 10px" }}>{t.audience}</div>
              <div style={{ fontSize: 13, color: BODY, marginBottom: 16, minHeight: 38, lineHeight: 1.45 }}>{t.tagline}</div>
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
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "8px 20px" }}>
        <div style={{ background: SOFT, border: "1px solid #CDEBD8", borderRadius: 14, padding: "16px 20px", textAlign: "center", fontSize: 13.5, color: "#1B4332", lineHeight: 1.6 }}>
          Every plan runs on a private reader domain, works on mobile, speaks English and French, and never puts a watermark on your document.
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "56px 20px 20px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 28px", letterSpacing: "-0.02em" }}>Before you decide</h2>
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
        <div style={{ maxWidth: 640, margin: "0 auto", background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, borderRadius: 20, padding: "46px 28px", color: "#fff" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Your readers are telling you everything.</h2>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.78)", margin: "0 0 26px", lineHeight: 1.6 }}>Read receipts were never enough. Start free, then pick the plan that keeps you a step ahead.</p>
          <a href="#plans" className="hero-cta" style={{ display: "inline-block", background: BRAND, color: NIGHT, textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 30px", borderRadius: 11 }}>Choose your plan</a>
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
