import MarketingNav from "./MarketingNav";
const NIGHT = "#082019", FOREST = "#0B2E22", INK = "#0F1729", CANVAS = "#F8F9FA", CARD = "#FFFFFF", GREEN = "#0B7A4B", GREEN_SOFT = "#E7F6EF", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #082019 0%, #0B2E22 55%, #0E3A2C 100%)";

export default function LandingPage() {
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 32px" } as const;
  const eyebrow = { fontSize: 14, fontWeight: 600, color: GREEN, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 12px" };

  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400 }}>
      <style>{`
        .m-a{text-decoration:none}
        .m-cta{transition:background .15s,transform .1s}.m-cta:hover{background:#0A6A41}.m-cta:active{transform:translateY(1px)}
        .m-ghost{transition:background .15s}.m-ghost:hover{background:rgba(255,255,255,0.08)}
        .m-card{transition:transform .15s,box-shadow .15s}.m-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(15,23,41,0.1)}
        @media(max-width:820px){.m-h1{font-size:44px!important}.m-row{grid-template-columns:1fr!important;gap:28px!important}.m-3{grid-template-columns:1fr!important}.m-nav-links{display:none!important}.m-uses{grid-template-columns:1fr!important}}
      `}</style>

      <MarketingNav />

      <section style={{ background: GRADIENT, color: "#fff", position: "relative", overflow: "hidden", marginTop: -72, paddingTop: 72 }}>
        <div style={{ ...wrap, padding: "84px 32px 100px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(31,169,113,0.14)", border: "1px solid rgba(31,169,113,0.35)", color: "#7FE3B8", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: BRAND }} />
            Now in beta, free for early users
          </div>
          <h1 className="m-h1" style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px", maxWidth: 820 }}>
            Your document goes into the room. Now you can too.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: CLOUD, margin: "0 0 36px", maxWidth: 580 }}>
            BackRead sends a living version of your deck. It answers their questions, watches how they read, and tells you exactly what to do next.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/login" className="m-a m-cta" style={{ background: GREEN, color: "#fff", fontSize: 16, fontWeight: 600, padding: "14px 26px", borderRadius: 10 }}>Send your first document</a>
            <a href="#how" className="m-a m-ghost" style={{ color: "#fff", fontSize: 16, fontWeight: 500, padding: "14px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}>See how it works</a>
          </div>
          <p style={{ fontSize: 13, color: MUTE, margin: "20px 0 0" }}>No credit card. Free for your first 5 documents.</p>
        </div>
        <svg width="100%" height="200" style={{ position: "absolute", right: 0, bottom: -20, opacity: 0.5, zIndex: 1 }} aria-hidden="true">
          <defs><linearGradient id="mrt" x1="0" x2="1"><stop offset="0" stopColor={BRAND} stopOpacity="0" /><stop offset="0.6" stopColor={BRAND} /><stop offset="1" stopColor="#7FE3B8" stopOpacity="0.6" /></linearGradient></defs>
          <path d="M-50 120 Q 300 40, 620 110 T 1300 80" stroke="url(#mrt)" strokeWidth="2.5" fill="none" />
          <circle cx="620" cy="110" r="5" fill={BRAND} /><circle cx="980" cy="93" r="4" fill="#7FE3B8" />
        </svg>
      </section>

      <section style={{ background: INK, color: "#fff", padding: "26px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: MUTE }}>Built for every send that decides money:</span>
          {["Pitch decks", "Sales proposals", "Investor updates", "Statements of work"].map((t) => (<span key={t} style={{ fontSize: 15, fontWeight: 600, color: CLOUD }}>{t}</span>))}
        </div>
      </section>

      <section style={{ padding: "88px 0" }}>
        <div style={{ ...wrap, maxWidth: 780 }}>
          <p style={eyebrow}>The problem</p>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 24px" }}>You hit send, and the document goes dark.</h2>
          <p style={{ fontSize: 19, color: BODY, lineHeight: 1.5, margin: "0 0 20px" }}>
            The most important conversation about your company happens in a room you are not in. A prospect forwards your deck to their CFO. An investor re-reads your pricing three times and says nothing. Someone gets stuck on slide 7 and quietly closes the tab.
          </p>
          <p style={{ fontSize: 19, color: BODY, lineHeight: 1.5, margin: 0 }}>
            You get none of it. A read receipt, maybe. A heatmap, if you are lucky, which tells you where the eyes went and leaves you to guess what the mind did. So you follow up blind, at the wrong time, about the wrong thing. <span style={{ color: INK, fontWeight: 600 }}>BackRead ends the guessing.</span>
          </p>
        </div>
      </section>

      <section style={{ background: "#fff", padding: "80px 0", borderTop: `1px solid ${LINE}` }}>
        <div className="m-row" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <p style={eyebrow}>Ask BackRead</p>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>The document that answers their questions</h2>
            <p style={{ fontSize: 17, color: BODY, lineHeight: 1.5, margin: "0 0 16px" }}>
              Your reader opens the deck and finds a reader beside them. They ask what they were too polite to email, and get an answer, grounded only in your material, in your voice, inside the limits you set.
            </p>
            <p style={{ fontSize: 17, color: BODY, lineHeight: 1.5, margin: 0 }}>
              A heatmap is a guess at interest. A question <span style={{ color: INK, fontWeight: 600 }}>is</span> interest, and every one lands in your inbox as a signal.
            </p>
          </div>
          <div style={{ background: CANVAS, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 14 }}>Ask BackRead</div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10 }}>Is the annual commit negotiable?</div>
            <div style={{ background: GREEN_SOFT, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: GREEN_TEXT, lineHeight: 1.45 }}>That is a commercial question I cannot answer on the sender's behalf. I have flagged it, and they will come back to you directly.</div>
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 0" }}>
        <div className="m-row" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${LINE}`, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: BODY }}>Verdict, Sarah at Meridian</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 16, background: GREEN_SOFT, color: GREEN_TEXT }}>high confidence</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em", margin: "0 0 12px" }}>Pricing is the blocker, not the product.</p>
            <p style={{ fontSize: 14, color: BODY, lineHeight: 1.5, margin: "0 0 16px" }}>She is convinced by the traction and stuck on the annual commit. Finance is already involved.</p>
            <div style={{ background: CANVAS, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 3 }}>Do this next</div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Send commercial terms addressing the commit, not another call.</p>
            </div>
          </div>
          <div>
            <p style={eyebrow}>Read the reader</p>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>It does not send you charts. It sends you a verdict.</h2>
            <p style={{ fontSize: 17, color: BODY, lineHeight: 1.5, margin: "0 0 16px" }}>
              Dwell, scroll-backs, re-opens, forwards, questions asked. BackRead fuses every signal into a read of the deal, not the document.
            </p>
            <p style={{ fontSize: 17, color: BODY, lineHeight: 1.5, margin: 0 }}>
              You should not have to be an analyst to read your own deck. The chart is the receipt. The verdict is the product.
            </p>
          </div>
        </div>
      </section>

      <section id="how" style={{ background: "#fff", padding: "88px 0", borderTop: `1px solid ${LINE}` }}>
        <div style={wrap}>
          <p style={eyebrow}>How it works</p>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 44px", maxWidth: 560 }}>Three steps from send to signal</h2>
          <div className="m-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { n: "01", t: "Upload your document", b: "Drop in a PDF or deck. It is stored privately, so only the people you share with ever see it." },
              { n: "02", t: "Share a tracked link", b: "Send one link per recipient. No account needed on their end. They just open and read." },
              { n: "03", t: "Read the reader", b: "As they read, BackRead captures intent and hands you a verdict, and the move to make next." },
            ].map((s) => (
              <div key={s.n} className="m-card" style={{ background: CANVAS, borderRadius: 14, padding: 26, border: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: GREEN, marginBottom: 14 }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{s.t}</h3>
                <p style={{ fontSize: 15, color: BODY, lineHeight: 1.5, margin: 0 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" style={{ background: NIGHT, color: "#fff", padding: "80px 0" }}>
        <div style={{ ...wrap, maxWidth: 820 }}>
          <p style={{ ...eyebrow, color: BRAND }}>Why BackRead</p>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 20px" }}>Everyone else measures attention. We capture intent.</h2>
          <p style={{ fontSize: 19, color: CLOUD, lineHeight: 1.5, margin: 0 }}>
            Page views and time on slide are a proxy. They tell you where the eyes went and leave you to guess the rest. The moment a document can answer questions, the guessing ends. The reader tells you the objection, and BackRead tells you what to do about it. That is a capability a dashboard structurally cannot have.
          </p>
        </div>
      </section>

      <section style={{ padding: "88px 0" }}>
        <div style={wrap}>
          <p style={eyebrow}>Use cases</p>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 44px", maxWidth: 560 }}>Built for every send that actually matters</h2>
          <div className="m-uses" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { t: "Pitch decks", b: "Know which slide killed the round, and fix it before the next partner meeting." },
              { t: "Sales proposals", b: "Get the pricing objection in writing, before they ghost." },
              { t: "Investor updates", b: "Catch the LP who stopped reading three quarters ago." },
              { t: "Statements of work", b: "See exactly which clause is holding up sign-off." },
              { t: "Partnership decks", b: "Watch it climb to the decision-maker in real time." },
              { t: "Case studies", b: "Measure how far it spreads inside the account." },
            ].map((u) => (
              <div key={u.t} style={{ background: CARD, borderRadius: 12, padding: 22, border: `1px solid ${LINE}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{u.t}</h3>
                <p style={{ fontSize: 14, color: BODY, lineHeight: 1.45, margin: 0 }}>{u.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: GRADIENT, color: "#fff", padding: "96px 0", textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 16px" }}>Stop guessing what they thought.</h2>
          <p style={{ fontSize: 19, color: CLOUD, margin: "0 0 32px" }}>Send one document. Read the reader back.</p>
          <a href="/login" className="m-a m-cta" style={{ display: "inline-block", background: GREEN, color: "#fff", fontSize: 17, fontWeight: 600, padding: "15px 32px", borderRadius: 10 }}>Start free, no card needed</a>
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{display:"inline-block",verticalAlign:"-0.1em"}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg></span> BackRead, the document reads the reader.</span>
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
