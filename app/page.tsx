const NIGHT = "#070B14", INK = "#0B1220", CANVAS = "#F4F6FA", CARD = "#FFFFFF", BLUE = "#2D6BFF", BLUE_SOFT = "#EAF0FF", GREEN = "#10B981", GREEN_BG = "#E7F7EF", SLATE = "#64748B", MUTE = "#94A3B8", LINE = "#E7EBF2", CLOUD = "rgba(255,255,255,0.72)";
const INTER = "'Moderat', 'Inter', sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

export default function LandingPage() {
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 32px" } as const;
  const eyebrow = { fontSize: 14, fontWeight: 500, color: BLUE, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 12px" };

  return (
    <div style={{ fontFamily: INTER, color: INK, background: CANVAS, fontWeight: 400 }}>
      <style>{`
        .lp-a{text-decoration:none}
        .lp-cta{transition:box-shadow .15s,transform .1s}.lp-cta:hover{box-shadow:0 10px 30px rgba(45,107,255,0.4)}.lp-cta:active{transform:translateY(1px)}
        .lp-ghost{transition:background .15s}.lp-ghost:hover{background:rgba(255,255,255,0.08)}
        .lp-card{transition:transform .15s,box-shadow .15s}.lp-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(11,18,32,0.1)}
        @media(max-width:820px){.lp-h1{font-size:44px!important}.lp-row{grid-template-columns:1fr!important;gap:28px!important}.lp-3{grid-template-columns:1fr!important}.lp-nav-links{display:none!important}.lp-uses{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ background: NIGHT }}>
        <nav style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}>
          <span style={{ color: "#fff", fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em" }}>BackRead</span>
          <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a href="#how" className="lp-a" style={{ color: CLOUD, fontSize: 15 }}>How it works</a>
            <a href="#why" className="lp-a" style={{ color: CLOUD, fontSize: 15 }}>Why BackRead</a>
            <a href="#uses" className="lp-a" style={{ color: CLOUD, fontSize: 15 }}>Use cases</a>
            <a href="/login" className="lp-a" style={{ color: CLOUD, fontSize: 15 }}>Sign in</a>
          </div>
          <a href="/login" className="lp-a lp-cta" style={{ background: BLUE, color: "#fff", fontSize: 14, fontWeight: 500, padding: "9px 18px", borderRadius: 10, boxShadow: "0 4px 12px rgba(45,107,255,0.3)" }}>Start free</a>
        </nav>
      </div>

      <section style={{ background: NIGHT, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ ...wrap, padding: "84px 32px 100px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(45,107,255,0.12)", border: "1px solid rgba(45,107,255,0.3)", color: "#8FB4FF", fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: GREEN }} />
            Now in beta — free for early users
          </div>
          <h1 className="lp-h1" style={{ fontSize: 62, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px", maxWidth: 820 }}>
            Your document goes into the room. Now you can too.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: CLOUD, margin: "0 0 36px", maxWidth: 580 }}>
            BackRead sends a living version of your deck — one that answers their questions, watches how they read, and tells you exactly what to do next.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/login" className="lp-a lp-cta" style={{ background: BLUE, color: "#fff", fontSize: 16, fontWeight: 500, padding: "14px 26px", borderRadius: 12, boxShadow: "0 6px 20px rgba(45,107,255,0.35)" }}>Send your first document</a>
            <a href="#how" className="lp-a lp-ghost" style={{ color: "#fff", fontSize: 16, fontWeight: 400, padding: "14px 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)" }}>See how it works</a>
          </div>
          <p style={{ fontSize: 13, color: MUTE, margin: "20px 0 0" }}>No credit card. Free for your first 5 documents.</p>
        </div>
        <svg width="100%" height="200" style={{ position: "absolute", right: 0, bottom: -20, opacity: 0.5, zIndex: 1 }} aria-hidden="true">
          <defs><linearGradient id="lprt" x1="0" x2="1"><stop offset="0" stopColor={BLUE} stopOpacity="0" /><stop offset="0.6" stopColor={BLUE} /><stop offset="1" stopColor={GREEN} stopOpacity="0.6" /></linearGradient></defs>
          <path d="M-50 120 Q 300 40, 620 110 T 1300 80" stroke="url(#lprt)" strokeWidth="2.5" fill="none" />
          <circle cx="620" cy="110" r="5" fill={BLUE} /><circle cx="980" cy="93" r="4" fill={GREEN} />
        </svg>
      </section>

      <section style={{ background: INK, color: "#fff", padding: "26px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: MUTE }}>Built for every send that decides money:</span>
          {["Pitch decks", "Sales proposals", "Investor updates", "Statements of work"].map((t) => (
            <span key={t} style={{ fontSize: 15, fontWeight: 500, color: CLOUD }}>{t}</span>
          ))}
        </div>
      </section>

      <section style={{ padding: "88px 0" }}>
        <div style={{ ...wrap, maxWidth: 780 }}>
          <p style={eyebrow}>The problem</p>
          <h2 style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 24px" }}>
            You hit send, and the document goes dark.
          </h2>
          <p style={{ fontSize: 19, color: SLATE, lineHeight: 1.6, margin: "0 0 20px" }}>
            The most important conversation about your company happens in a room you're not in. A prospect forwards your deck to their CFO. An investor re-reads your pricing three times and says nothing. Someone gets stuck on slide 7 and quietly closes the tab.
          </p>
          <p style={{ fontSize: 19, color: SLATE, lineHeight: 1.6, margin: 0 }}>
            You get none of it. A read receipt, maybe. A heatmap, if you're lucky — which tells you where the eyes went, and leaves you to guess what the mind did. So you follow up blind, at the wrong time, about the wrong thing. <span style={{ color: INK, fontWeight: 500 }}>BackRead ends the guessing.</span>
          </p>
        </div>
      </section>

      <section style={{ background: "#fff", padding: "80px 0", borderTop: `1px solid ${LINE}` }}>
        <div className="lp-row" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <p style={eyebrow}>Ask BackRead</p>
            <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>The document that answers their questions</h2>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: "0 0 16px" }}>
              Your reader opens the deck and finds a reader beside them. They ask what they were too polite to email — and get an answer, grounded only in your material, in your voice, inside the limits you set.
            </p>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: 0 }}>
              A heatmap is a guess at interest. A question <span style={{ color: INK, fontWeight: 500 }}>is</span> interest — and every one lands in your inbox as a signal.
            </p>
          </div>
          <div style={{ background: CANVAS, borderRadius: 16, border: `1px solid ${LINE}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: BLUE, marginBottom: 14 }}>Ask BackRead</div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10 }}>Is the annual commit negotiable?</div>
            <div style={{ background: BLUE_SOFT, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#1E3A8A", lineHeight: 1.5 }}>That's a commercial question I can't answer on the sender's behalf — I've flagged it, and they'll come back to you directly.</div>
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 0" }}>
        <div className="lp-row" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div style={{ background: CARD, borderRadius: 16, padding: 24, boxShadow: SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: SLATE }}>Verdict · Sarah at Meridian</span>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: GREEN_BG, color: "#059669" }}>high confidence</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.01em", margin: "0 0 12px" }}>Pricing is the blocker — not the product.</p>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>She's convinced by the traction and stuck on the annual commit. Finance is already involved.</p>
            <div style={{ background: CANVAS, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: BLUE, marginBottom: 3 }}>Do this next</div>
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Send commercial terms addressing the commit — not another call.</p>
            </div>
          </div>
          <div>
            <p style={eyebrow}>Read the reader</p>
            <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>It doesn't send you charts. It sends you a verdict.</h2>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: "0 0 16px" }}>
              Dwell, scroll-backs, re-opens, forwards, questions asked — BackRead fuses every signal into a read of the deal, not the document.
            </p>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: 0 }}>
              You shouldn't have to be an analyst to read your own deck. The chart is the receipt. The verdict is the product.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "#fff", padding: "80px 0", borderTop: `1px solid ${LINE}` }}>
        <div className="lp-row" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <p style={eyebrow}>Your deck learns</p>
            <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>Every send makes the next one sharper</h2>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: "0 0 16px" }}>
              BackRead sees where readers stall, skim, and quietly give up — across every send, every recipient. Then it proposes the fix.
            </p>
            <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: 0 }}>
              You approve. It ships. Your deck gets better while you sleep — and nothing changes without your say-so.
            </p>
          </div>
          <div style={{ background: CANVAS, borderRadius: 16, border: `1px solid ${LINE}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: SLATE, marginBottom: 12 }}>Suggested rewrite · Slide 7</div>
            <p style={{ fontSize: 13, color: SLATE, margin: "0 0 12px" }}>Loses 60% of readers within 8 seconds.</p>
            <div style={{ borderLeft: `2px solid ${GREEN}`, paddingLeft: 14 }}>
              <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>Lead with the outcome, not the price. Move the tiering table below the ROI line.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" style={{ padding: "88px 0" }}>
        <div style={wrap}>
          <p style={eyebrow}>How it works</p>
          <h2 style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 44px", maxWidth: 560 }}>Three steps from send to signal</h2>
          <div className="lp-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { n: "01", t: "Upload your document", b: "Drop in a PDF or deck. It's stored privately — only the people you share with ever see it." },
              { n: "02", t: "Share a tracked link", b: "Send one link per recipient. No account needed on their end — they just open and read." },
              { n: "03", t: "Read the reader", b: "As they read, BackRead captures intent and hands you a verdict, and the move to make next." },
            ].map((s) => (
              <div key={s.n} className="lp-card" style={{ background: CARD, borderRadius: 16, padding: 26, boxShadow: SHADOW }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: BLUE, marginBottom: 14 }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{s.t}</h3>
                <p style={{ fontSize: 15, color: SLATE, lineHeight: 1.6, margin: 0 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" style={{ background: INK, color: "#fff", padding: "80px 0" }}>
        <div style={{ ...wrap, maxWidth: 820 }}>
          <p style={{ ...eyebrow, color: "#8FB4FF" }}>Why BackRead</p>
          <h2 style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 20px" }}>
            Everyone else measures attention. We capture intent.
          </h2>
          <p style={{ fontSize: 19, color: CLOUD, lineHeight: 1.6, margin: 0 }}>
            Page views and time-on-slide are a proxy — they tell you where the eyes went and leave you to guess the rest. The moment a document can answer questions, the guessing ends: the reader tells you the objection, and BackRead tells you what to do about it. That's a capability a dashboard structurally cannot have.
          </p>
        </div>
      </section>

      <section id="uses" style={{ padding: "88px 0" }}>
        <div style={wrap}>
          <p style={eyebrow}>Use cases</p>
          <h2 style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 44px", maxWidth: 560 }}>Built for every send that actually matters</h2>
          <div className="lp-uses" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { t: "Pitch decks", b: "Know which slide killed the round — and fix it before the next partner meeting." },
              { t: "Sales proposals", b: "Get the pricing objection in writing, before they ghost." },
              { t: "Investor updates", b: "Catch the LP who stopped reading three quarters ago." },
              { t: "Statements of work", b: "See exactly which clause is holding up sign-off." },
              { t: "Partnership decks", b: "Watch it climb to the decision-maker in real time." },
              { t: "Case studies", b: "Measure how far it spreads inside the account." },
            ].map((u) => (
              <div key={u.t} style={{ background: CARD, borderRadius: 14, padding: 22, boxShadow: SHADOW }}>
                <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 6px" }}>{u.t}</h3>
                <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.55, margin: 0 }}>{u.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: NIGHT, color: "#fff", padding: "96px 0", textAlign: "center" }}>
        <div style={wrap}>
          <h2 style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.025em", margin: "0 0 16px" }}>Stop guessing what they thought.</h2>
          <p style={{ fontSize: 19, color: CLOUD, margin: "0 0 32px" }}>Send one document. Read the reader back.</p>
          <a href="/login" className="lp-a lp-cta" style={{ display: "inline-block", background: BLUE, color: "#fff", fontSize: 17, fontWeight: 500, padding: "15px 32px", borderRadius: 12, boxShadow: "0 6px 20px rgba(45,107,255,0.4)" }}>Start free — no card needed</a>
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 14 }}>BackRead — the document reads the reader.</span>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#" className="lp-a" style={{ color: MUTE, fontSize: 13 }}>Privacy</a>
            <a href="#" className="lp-a" style={{ color: MUTE, fontSize: 13 }}>Terms</a>
            <a href="#" className="lp-a" style={{ color: MUTE, fontSize: 13 }}>Security</a>
            <a href="/login" className="lp-a" style={{ color: MUTE, fontSize: 13 }}>Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
