import MarketingNav from "../MarketingNav";
const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", CARD = "#FFFFFF", GREEN = "#0B7A4B", GREEN_SOFT = "#E7F6EF", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #082019 0%, #0B2E22 55%, #0E3A2C 100%)";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "For trying BackRead on a real send.",
    cta: "Start free",
    highlight: false,
    features: ["Up to 5 documents", "Reader tracking and read traces", "Per-reader timelines", "1 workspace"],
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    tagline: "For founders and sellers who send often.",
    cta: "Start Pro",
    highlight: true,
    features: ["Unlimited documents", "Ask BackRead companion", "The verdict engine", "Question and intent signals", "Email alerts on every open", "Priority support"],
  },
  {
    name: "Business",
    price: "$99",
    cadence: "per month",
    tagline: "For teams reading their pipeline together.",
    cta: "Start Business",
    highlight: false,
    features: ["Everything in Pro", "Up to 10 team seats", "Shared workspace", "Team activity feed", "Advanced verdict history", "Onboarding session"],
  },
];

const FAQ = [
  { q: "Do my readers need an account?", a: "No. They open a link and read. BackRead captures intent without asking anything of them." },
  { q: "Can I change plans later?", a: "Yes. Upgrade or downgrade at any time, and the change applies from your next cycle." },
  { q: "Is my document data private?", a: "Documents are stored privately and only visible to the people you share a link with. You can delete anything at any time." },
  { q: "What counts as a document?", a: "Any PDF or deck you upload and share. Reads, questions, and verdicts on it are all included in your plan." },
];

export default function PricingPage() {
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 32px" } as const;

  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`
        .m-a{text-decoration:none}
        .m-cta{transition:background .15s,transform .1s}.m-cta:hover{background:#0A6A41}.m-cta:active{transform:translateY(1px)}
        .m-card{transition:transform .15s,box-shadow .15s}.m-card:hover{transform:translateY(-3px)}
        @media(max-width:820px){.m-tiers{grid-template-columns:1fr!important}.m-nav-links{display:none!important}}
      `}</style>

      <MarketingNav activePricing />

      <section style={{ background: GRADIENT, color: "#fff", padding: "72px 0 130px", textAlign: "center", marginTop: -72, paddingTop: 130 }}>
        <div style={wrap}>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Pricing that scales with your sends</h1>
          <p style={{ fontSize: 19, color: CLOUD, margin: 0, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>Start free. Upgrade when reading your readers becomes part of how you close.</p>
        </div>
      </section>

      <section style={{ marginTop: -90, position: "relative", zIndex: 2, paddingBottom: 80 }}>
        <div className="m-tiers" style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
          {TIERS.map((t) => (
            <div key={t.name} className="m-card" style={{ background: CARD, borderRadius: 16, border: t.highlight ? `2px solid ${GREEN}` : `1px solid ${LINE}`, padding: 28, boxShadow: t.highlight ? "0 12px 40px rgba(11,122,75,0.16)" : "0 1px 3px rgba(15,23,41,0.04), 0 8px 24px rgba(15,23,41,0.05)", position: "relative" }}>
              {t.highlight && <div style={{ position: "absolute", top: -12, left: 28, background: GREEN, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Most popular</div>}
              <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>{t.name}</div>
              <p style={{ fontSize: 13, color: BODY, margin: "0 0 18px", lineHeight: 1.4, minHeight: 36 }}>{t.tagline}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 22 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: INK, letterSpacing: "-0.03em" }}>{t.price}</span>
                <span style={{ fontSize: 14, color: MUTE }}>{t.cadence}</span>
              </div>
              <a href="/login" className="m-a m-cta" style={{ display: "block", textAlign: "center", background: t.highlight ? GREEN : "#fff", color: t.highlight ? "#fff" : INK, border: t.highlight ? "none" : `1px solid ${LINE}`, fontSize: 15, fontWeight: 600, padding: "12px", borderRadius: 10, marginBottom: 24 }}>{t.cta}</a>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {t.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: GREEN, flexShrink: 0, marginTop: 2 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>
                    <span style={{ fontSize: 14, color: BODY, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff", borderTop: `1px solid ${LINE}`, padding: "80px 0" }}>
        <div style={{ ...wrap, maxWidth: 760 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 32px", textAlign: "center" }}>Questions, answered</h2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ borderBottom: `1px solid ${LINE}`, padding: "20px 0" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 6 }}>{f.q}</div>
              <p style={{ fontSize: 15, color: BODY, lineHeight: 1.5, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: GRADIENT, color: "#fff", padding: "80px 0", textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Start reading your readers today.</h2>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 0 30px" }}>Free for your first 5 documents. No card needed.</p>
          <a href="/login" className="m-a m-cta" style={{ display: "inline-block", background: GREEN, color: "#fff", fontSize: 16, fontWeight: 600, padding: "14px 30px", borderRadius: 10 }}>Start free</a>
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <a href="/" className="m-a" style={{ fontSize: 14, color: MUTE, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{display:"inline-block",verticalAlign:"-0.1em"}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg></span> BackRead, the document reads the reader.</a>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="/pricing" className="m-a" style={{ color: MUTE, fontSize: 13 }}>Pricing</a>
            <a href="#" className="m-a" style={{ color: MUTE, fontSize: 13 }}>Privacy</a>
            <a href="#" className="m-a" style={{ color: MUTE, fontSize: 13 }}>Terms</a>
            <a href="/login" className="m-a" style={{ color: MUTE, fontSize: 13 }}>Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
