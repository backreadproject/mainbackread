import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";

// The public landing page for the reader-delivery domain (relaydocuments.com).
// A complete, realistic product page for "Relay". It explains document delivery and
// recipient privacy -- and deliberately says NOTHING about reading analytics,
// verdicts, or how the sender sees engagement. A curious reader who trims a /read/
// link lands here and sees a legitimate, self-explanatory delivery service.
export default async function RelayLanding() {
  const locale = await getLocale();
  const r = getDict(locale).relayPage;

  const INK = "#0F1729", BODY = "#475467", MUTE = "#98A2B3", GREEN = "#0B7A4B", GREEN_SOFT = "#E7F6EF", GREEN_TEXT = "#067647", LINE = "#EEF0EC", CANVAS = "#F8FAF8", CARD = "#FFFFFF";
  const font = "var(--font-dm-sans), system-ui, sans-serif";

  const mark = (size: number) => (
    <span style={{ width: size, height: size, borderRadius: size * 0.29, background: GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );

  const feature = (icon: React.ReactNode, title: string, body: string) => (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 22 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: GREEN_SOFT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 13 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: BODY, lineHeight: 1.55 }}>{body}</div>
    </div>
  );

  const step = (n: string, title: string, body: string) => (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: GREEN_SOFT, color: GREEN_TEXT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{n}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: BODY, lineHeight: 1.55 }}>{body}</div>
    </div>
  );

  const secItem = (icon: React.ReactNode, title: string, body: string) => (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: GREEN_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: BODY, lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );

  const faq = (q: string, a: string) => (
    <div style={{ borderBottom: `1px solid ${LINE}`, padding: "18px 0" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 6 }}>{q}</div>
      <div style={{ fontSize: 14, color: BODY, lineHeight: 1.55 }}>{a}</div>
    </div>
  );

  const ic = (path: string) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
  );

  const year = new Date().getFullYear();

  return (
    <div style={{ fontFamily: font, color: INK, background: CARD, minHeight: "100vh", letterSpacing: "-0.006em" }}>
      <header style={{ borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(8px)", zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {mark(28)}
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{r.brand}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 14, color: BODY }}>
            <a href="#how" style={{ color: BODY, textDecoration: "none" }} className="rl-nav">{r.navHow}</a>
            <a href="#security" style={{ color: BODY, textDecoration: "none" }} className="rl-nav">{r.navSecurity}</a>
            <a href="#faq" style={{ color: BODY, textDecoration: "none" }} className="rl-nav">{r.navFaq}</a>
          </div>
        </div>
      </header>
      <style>{`.rl-nav:hover{color:${INK}}`}</style>

      <section style={{ background: CANVAS, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 64px", textAlign: "center" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: GREEN_TEXT, background: GREEN_SOFT, borderRadius: 20, padding: "6px 14px", marginBottom: 22 }}>{r.heroBadge}</span>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 18px" }}>{r.heroTitle}</h1>
          <p style={{ fontSize: 17, color: BODY, lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 520 }}>{r.heroBody}</p>
          <div style={{ fontSize: 14, color: MUTE }}>{r.heroNote}</div>
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {feature(ic('<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>'), r.featDeliveredTitle, r.featDeliveredBody)}
          {feature(ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'), r.featPrivateTitle, r.featPrivateBody)}
          {feature(ic('<path d="M4 4h11l5 5v11H4z"/><path d="M15 4v5h5"/>'), r.featAnyTitle, r.featAnyBody)}
        </div>
      </section>

      <section id="how" style={{ background: CANVAS, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px", textAlign: "center" }}>{r.howTitle}</h2>
          <p style={{ fontSize: 16, color: BODY, textAlign: "center", margin: "0 auto 40px", maxWidth: 480, lineHeight: 1.55 }}>{r.howSubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
            {step("1", r.how1Title, r.how1Body)}
            {step("2", r.how2Title, r.how2Body)}
            {step("3", r.how3Title, r.how3Body)}
          </div>
        </div>
      </section>

      <section id="security" style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px", textAlign: "center" }}>{r.secTitle}</h2>
        <p style={{ fontSize: 16, color: BODY, textAlign: "center", margin: "0 auto 40px", maxWidth: 520, lineHeight: 1.55 }}>{r.secSubtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 26, maxWidth: 860, margin: "0 auto" }}>
          {secItem(ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'), r.sec1Title, r.sec1Body)}
          {secItem(ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'), r.sec2Title, r.sec2Body)}
          {secItem(ic('<path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z"/><path d="M9.5 12l2 2 3.5-3.5"/>'), r.sec3Title, r.sec3Body)}
        </div>
      </section>

      <section id="faq" style={{ background: CANVAS, borderTop: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 28px", textAlign: "center" }}>{r.faqTitle}</h2>
          <div>
            {faq(r.faq1Q, r.faq1A)}
            {faq(r.faq2Q, r.faq2A)}
            {faq(r.faq3Q, r.faq3A)}
            {faq(r.faq4Q, r.faq4A)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ background: GREEN_SOFT, borderRadius: 16, padding: "40px 28px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: "0 0 8px" }}>{r.ctaTitle}</h2>
          <p style={{ fontSize: 16, color: BODY, lineHeight: 1.55, margin: "0 auto", maxWidth: 420 }}>{r.ctaBody}</p>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mark(24)}
            <span style={{ fontSize: 15, fontWeight: 700 }}>{r.brand}</span>
            <span style={{ fontSize: 13, color: MUTE, marginLeft: 6 }}>{r.footerTagline}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <a href="/privacy" style={{ fontSize: 13, color: MUTE, textDecoration: "none" }}>{locale === "fr" ? "Confidentialit\u00e9" : "Privacy"}</a>
            <a href="/terms" style={{ fontSize: 13, color: MUTE, textDecoration: "none" }}>{locale === "fr" ? "Conditions" : "Terms"}</a>
            <span style={{ fontSize: 13, color: MUTE }}>&copy; {year} {r.brand}. {r.footerRights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
