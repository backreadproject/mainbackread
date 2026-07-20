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
  { q: "How is this different from analytics tools I already have?", a: "Those count opens and clicks. BackRead reads the reader: it turns raw behaviour into a call on where the deal actually stands." },
  { q: "Is it worth paying for?", a: "One deal you almost let go cold, saved because you knew the exact moment to follow up, pays for a year. The real question is how many reads you have already missed." },
  { q: "Can I try the team features before paying?", a: "Yes. Team and Business both start with a 7-day free trial, no card to begin." },
  { q: "Can I switch plans later?", a: "Any time, in a click, with everything intact. Move up for seats and control, and your documents and history come with you." },
  { q: "Will my reader feel watched?", a: "They open a clean document on a neutral domain, with no BackRead branding anywhere. What they do stays yours alone. They get the document, you get the read." },
  { q: "Does my reader need an account or an app?", a: "No. They click a link and read. Nothing to install, nothing to sign up for." },
  { q: "Is there a watermark on my document?", a: "Never, on any plan. Your document goes out as your document." },
  { q: "Can my team see the same reads?", a: "On Team and Business, yes. Shared workspace, roles, and a team activity feed, so the whole deal team sees what the document saw." },
  { q: "What happens when I hit a Free limit?", a: "The action pauses and points you to the plan that lifts it. Nothing you have already sent or captured is touched." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F7FBF9", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: INK, letterSpacing: "-0.005em" }}>
      <style>{`
        .price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
        @media (max-width: 1000px) { .price-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .price-grid { grid-template-columns: 1fr; } }
        .tier-cta { transition: background .15s, transform .05s; }
        .tier-cta:active { transform: translateY(1px); }
        .hero-cta { transition: transform .05s, background .15s; }
        .hero-cta:active { transform: translateY(1px); }
        .faq-list { border-bottom: 1px solid ${BORDER}; }
        .faq-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 44px; padding: 30px 6px; border-top: 1px solid ${BORDER}; }
        @media (max-width: 680px) { .faq-row { grid-template-columns: 1fr; gap: 10px; padding: 24px 4px; } }
      `}</style>

      <MarketingNav />

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, color: "#fff", padding: "108px 20px 140px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 20 }}>Pricing</div>
          <h1 style={{ fontSize: 46, lineHeight: 1.08, fontWeight: 700, margin: "0 0 24px", letterSpacing: "-0.02em" }}>Stop guessing where your deals stand.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", margin: "0 auto", maxWidth: 660 }}>A read receipt says they opened it. BackRead tells you what they wanted, where they hesitated, and whether they are ready to move. Pick the plan that keeps you ahead of the room.</p>
        </div>
      </section>

      {/* Plan cards */}
      <section id="plans" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px", transform: "translateY(-58px)", scrollMarginTop: 80 }}>
        <div className="price-grid">
          {TIERS.map((t) => (
            <div key={t.id} style={{
              background: "#fff",
              border: t.popular ? `2px solid ${GREEN}` : `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: t.popular ? "0 24px 60px rgba(11,122,75,0.18)" : "0 14px 44px rgba(15,23,41,0.06)",
              position: "relative",
              marginTop: t.popular ? -10 : 0,
            }}>
              {t.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 13px", borderRadius: 20, whiteSpace: "nowrap" }}>Most popular</span>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{t.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: BRAND, margin: "7px 0 11px" }}>{t.audience}</div>
              <div style={{ fontSize: 13, color: BODY, marginBottom: 18, minHeight: 38, lineHeight: 1.45 }}>{t.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>{t.price}</span>
                <span style={{ fontSize: 13, color: MUTE }}>{t.period}</span>
              </div>
              <a href={t.href} className="tier-cta" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                background: t.popular ? GREEN : "#fff",
                color: t.popular ? "#fff" : INK,
                border: t.popular ? `1px solid ${GREEN}` : `1px solid ${BORDER}`,
                borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 600, margin: "18px 0 22px",
              }}>{t.cta}</a>
              {t.includes && <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 12 }}>{t.includes}</div>}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
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
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 20px" }}>
        <div style={{ background: SOFT, border: "1px solid #CDEBD8", borderRadius: 14, padding: "16px 20px", textAlign: "center", fontSize: 13.5, color: "#1B4332", lineHeight: 1.6 }}>
          Every plan runs on a private reader domain, works on mobile, speaks English and French, and never puts a watermark on your document.
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "80px 20px 24px" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Before you decide</h2>
        <p style={{ fontSize: 15, color: BODY, textAlign: "center", margin: "0 0 40px" }}>The honest answers, so the choice is easy.</p>
        <div className="faq-list">
          {FAQ.map((f, i) => (
            <div key={i} className="faq-row">
              <div style={{ fontSize: 18, fontWeight: 700, color: INK, lineHeight: 1.35 }}>{f.q}</div>
              <div style={{ fontSize: 15.5, color: BODY, lineHeight: 1.7 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ padding: "64px 20px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, borderRadius: 20, padding: "52px 30px", color: "#fff" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em" }}>Your readers are telling you everything.</h2>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.78)", margin: "0 0 28px", lineHeight: 1.65 }}>Read receipts were never enough. Start free, then pick the plan that keeps you a step ahead.</p>
          <a href="/login" className="hero-cta" style={{ display: "inline-block", background: BRAND, color: NIGHT, textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 11 }}>Start free</a>
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
