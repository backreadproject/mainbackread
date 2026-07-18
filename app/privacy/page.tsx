import MarketingNav from "../MarketingNav";
const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";
const SECTIONS: [string, string][] = [["What we collect", "We collect the documents you upload, the reading activity of people you share them with, and basic account information. Details to be finalized."],["How we use it", "We use this information to provide the product: to answer reader questions, produce verdicts, and show you reading activity. Details to be finalized."],["Data retention", "You can delete documents and account data at any time. Retention specifics to be finalized."],["Contact", "Questions about privacy can be directed to our team. Contact details to be finalized."]];
export default function PrivacyPage() {
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <MarketingNav />
      <section style={{ background: GRADIENT, color: "#fff", padding: "128px 0 72px", textAlign: "center" }}>
        <div style={wrap}>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 17, color: CLOUD, margin: 0 }}>Last updated: coming soon</p>
        </div>
      </section>
      <section style={{ padding: "56px 0 80px" }}>
        <div style={wrap}>
          <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 36px", padding: "14px 18px", background: "#FEF7EC", border: "1px solid #FDE7C7", borderRadius: 10, color: "#B54708" }}>This is placeholder privacy content. Replace it with your finalized privacy policy before launch.</p>
          {SECTIONS.map(([h, b], i) => (
            <div key={i} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: "0 0 10px" }}>{h}</h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: BODY, margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>
      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <a href="/" style={{ fontSize: 14, color: MUTE, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg></span> BackRead, the document reads the reader.</a>
          <div style={{ display: "flex", gap: 24 }}>
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
