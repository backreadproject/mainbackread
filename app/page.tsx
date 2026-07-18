// BackRead landing. Design: green-black ink base, forest-green primary, a "reader's
// trail" signature line threading the how-it-works section. Editorial, restrained,
// dash-free copy. Body face DM Sans (loaded globally); mono utility for step markers.

const INK = "#0A1410";        // green-black base
const FOREST = "#0E5C3F";     // deep forest primary
const LIVING = "#3B9C78";     // living green accent (used sparingly)
const LIVING_SOFT = "#E4F1EB";
const PAPER = "#F6F8F6";       // light paper
const CARD = "#FFFFFF";
const HAIR = "#E3EAE5";        // hairline
const SAGE = "#5A6B62";        // muted body
const CLOUD = "rgba(255,255,255,0.68)";
const CLOUDDIM = "rgba(255,255,255,0.42)";
const FONT = "var(--font-dm-sans), system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export default function LandingPage() {
  const wrap = { maxWidth: 1120, margin: "0 auto", padding: "0 28px" } as const;
  const eyebrow = { fontFamily: MONO, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: LIVING };

  return (
    <div style={{ fontFamily: FONT, color: INK, background: PAPER, fontWeight: 400, overflowX: "hidden" }}>
      <style>{`
        .lp-a{text-decoration:none}
        .lp-cta{transition:transform .12s, box-shadow .15s}
        .lp-cta:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(14,92,63,0.32)}
        .lp-cta:active{transform:translateY(0)}
        .lp-ghost{transition:background .15s,border-color .15s}
        .lp-ghost:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.28)}
        .lp-card{transition:transform .16s, box-shadow .16s, border-color .16s}
        .lp-card:hover{transform:translateY(-3px);box-shadow:0 18px 48px rgba(10,20,16,0.10);border-color:#3B9C78}
        .lp-link{transition:color .15s}.lp-link:hover{color:#fff}
        .lp-step:hover .lp-node{background:#3B9C78;box-shadow:0 0 0 6px #E4F1EB}
        @media(max-width:860px){
          .lp-nav-links{display:none!important}
          .lp-hero-h1{font-size:46px!important}
          .lp-two{grid-template-columns:1fr!important;gap:36px!important}
          .lp-three{grid-template-columns:1fr!important}
          .lp-four{grid-template-columns:1fr 1fr!important}
          .lp-trail{padding-left:0!important}
          .lp-trail-line{display:none!important}
        }
        @media(max-width:860px){
          .lp-hero-pad{padding:56px 28px 64px!important}
          .lp-hero-h1{font-size:42px!important}
          .lp-hero-sub{font-size:18px!important}
        }
        @media(max-width:520px){
          .lp-hero-h1{font-size:32px!important;margin-bottom:18px!important}
          .lp-hero-sub{font-size:16px!important;margin-bottom:26px!important}
          .lp-hero-badge{margin-bottom:20px!important}
          .lp-pad{padding-left:20px!important;padding-right:20px!important}
          .lp-hero-pad{padding:40px 20px 52px!important}
          .lp-sec{padding-top:56px!important;padding-bottom:56px!important}
          .lp-four{grid-template-columns:1fr!important}
          .lp-cta-h2{font-size:30px!important}
          .lp-hero-fine{font-size:11px!important;margin-top:20px!important}
          .lp-hero-ctas{flex-direction:column!important;align-items:stretch!important}
          .lp-hero-ctas a{text-align:center!important}
          h2{font-size:30px!important}
        }
      `}</style>

      {/* ===== NAV (sticky) ===== */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,20,16,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <nav className="lp-pad" style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={LIVING} strokeWidth="2.2" /><circle cx="12" cy="12" r="3.4" fill={LIVING} /></svg>
            BackRead
          </span>
          <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <a href="#how" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 15 }}>How it works</a>
            <a href="#why" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 15 }}>Why BackRead</a>
            <a href="#uses" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 15 }}>Use cases</a>
            <a href="/pricing" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 15 }}>Pricing</a>
            <a href="/login" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 15 }}>Sign in</a>
          </div>
          <a href="/login" className="lp-a lp-cta" style={{ background: LIVING, color: INK, fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 10 }}>Start free</a>
        </nav>
      </div>

      {/* ===== HERO ===== */}
      <section style={{ background: INK, color: "#fff", position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", top: 0, right: -80, height: "100%", opacity: 0.5, pointerEvents: "none" }} width="620" height="600" viewBox="0 0 620 600" fill="none">
          <path d="M40 540 C 200 480, 160 340, 300 300 S 500 220, 560 60" stroke={FOREST} strokeWidth="1.5" strokeDasharray="4 8" fill="none" />
          <circle cx="300" cy="300" r="4" fill={LIVING} />
          <circle cx="560" cy="60" r="4" fill={LIVING} />
          <circle cx="40" cy="540" r="4" fill={LIVING} />
        </svg>
        <div className="lp-hero-pad" style={{ ...wrap, padding: "96px 28px 108px", position: "relative", zIndex: 2 }}>
          <div className="lp-hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(59,156,120,0.12)", border: "1px solid rgba(59,156,120,0.32)", color: LIVING, fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 30 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: LIVING }} />
            NOW IN BETA, FREE FOR EARLY USERS
          </div>
          <h1 className="lp-hero-h1" style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.035em", margin: "0 0 26px", maxWidth: 780 }}>
            Every reader leaves a trail.<br /><span style={{ color: LIVING }}>Now you can follow it.</span>
          </h1>
          <p className="lp-hero-sub" style={{ fontSize: 20, lineHeight: 1.5, margin: "0 0 38px", color: CLOUD, maxWidth: 560 }}>
            BackRead turns every document you send into a live companion that answers your reader's questions, watches how it is read, and tells you where the deal really stands.
          </p>
          <div className="lp-hero-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/login" className="lp-a lp-cta" style={{ background: LIVING, color: INK, fontSize: 16, fontWeight: 600, padding: "14px 28px", borderRadius: 12 }}>Start free</a>
            <a href="#how" className="lp-a lp-ghost" style={{ color: "#fff", fontSize: 16, fontWeight: 500, padding: "14px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)" }}>See how it works</a>
          </div>
          <p className="lp-hero-fine" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", color: CLOUDDIM, margin: "26px 0 0" }}>NO CARD REQUIRED. YOUR FIRST DOCUMENT LIVE IN MINUTES.</p>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 92, paddingBottom: 92 }}>
        <div className="lp-two" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 64, alignItems: "start" }}>
          <div>
            <p style={{ ...eyebrow, margin: "0 0 16px" }}>The blind spot</p>
            <h2 style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.025em", margin: 0 }}>You send the document. Then the silence begins.</h2>
          </div>
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: SAGE, margin: "0 0 20px" }}>
              A proposal, a deck, a memo goes out. You wait. You do not know who opened it, which page made them pause, what question they never asked out loud, or whether the deal is warm or already gone.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: SAGE, margin: 0 }}>
              Read receipts tell you a file was opened. Analytics tell you seconds on a page. Neither tells you what the reader actually wanted. BackRead was built to close that gap.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (the trail) ===== */}
      <section id="how" style={{ background: INK, color: "#fff" }}>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 100 }}>
          <p style={{ ...eyebrow, margin: "0 0 16px" }}>How it works</p>
          <h2 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 60px", maxWidth: 620 }}>
            Three things happen the moment your reader opens it.
          </h2>
          <div className="lp-trail" style={{ position: "relative", paddingLeft: 8 }}>
            <div className="lp-trail-line" aria-hidden="true" style={{ position: "absolute", left: 19, top: 12, bottom: 12, width: 1.5, background: "linear-gradient(180deg, transparent, rgba(59,156,120,0.5), transparent)" }} />
            {[
              ["01", "The document answers, in your voice", "Your reader asks a question inside the document itself. BackRead answers from what you approved, and when a question crosses into territory only you should handle, it holds the line and flags it for you instead of guessing."],
              ["02", "It watches how the reading goes", "Every pause, re-read, and question becomes a signal. You see which sections held attention, which were skipped, and where a reader hesitated, the quiet tells that a reply email never contains."],
              ["03", "It returns a verdict on the deal", "BackRead reads the pattern of the whole reading and tells you where things stand, so you know whether to push, to wait, or to rewrite before you send it to the next person."],
            ].map(([n, title, body], i) => (
              <div className="lp-step" key={i} style={{ display: "flex", gap: 26, alignItems: "flex-start", paddingBottom: i < 2 ? 44 : 0, position: "relative" }}>
                <div className="lp-node" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(59,156,120,0.14)", border: "1.5px solid " + LIVING, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: MONO, fontSize: 13, fontWeight: 600, color: LIVING, transition: "background .16s, box-shadow .16s", position: "relative", zIndex: 2 }}>{n}</div>
                <div style={{ paddingTop: 4 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{title}</h3>
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: CLOUD, margin: 0, maxWidth: 620 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY BACKREAD ===== */}
      <section id="why" className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 96 }}>
        <p style={{ ...eyebrow, margin: "0 0 16px" }}>Why BackRead</p>
        <h2 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 14px", maxWidth: 640 }}>
          Attention is not intent.
        </h2>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: SAGE, margin: "0 0 52px", maxWidth: 620 }}>
          Everyone else measures whether eyes were on the page. BackRead reads what the reader was actually trying to decide.
        </p>
        <div className="lp-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {[
            ["The document reads the reader", "Instead of a static file, you send something that listens. It captures stated intent, the questions a reader types, not just the seconds they linger."],
            ["A verdict on the deal, not the document", "You do not get another dashboard to interpret. You get a plain read on where the relationship stands and what to do next."],
            ["It compounds with every send", "Each document learns from the readings before it. What you send tomorrow is sharper than what you sent today, because it remembers."],
          ].map(([title, body], i) => (
            <div className="lp-card" key={i} style={{ background: CARD, border: "1px solid " + HAIR, borderRadius: 16, padding: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: LIVING_SOFT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, background: FOREST }} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 10px", color: INK }}>{title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: SAGE, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section id="uses" style={{ background: PAPER, borderTop: "1px solid " + HAIR, borderBottom: "1px solid " + HAIR }}>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 88, paddingBottom: 88 }}>
          <div className="lp-two" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 56, alignItems: "center", marginBottom: 48 }}>
            <div>
              <p style={{ ...eyebrow, margin: "0 0 16px" }}>Use cases</p>
              <h2 style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.025em", margin: 0 }}>For any document that matters after it leaves your hands.</h2>
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: SAGE, margin: 0, paddingTop: 4 }}>
              If a document carries a decision, and you cannot be in the room when it is read, BackRead goes in your place. It works the same whether you are raising, selling, reporting, or being diligenced.
            </p>
          </div>
          <div className="lp-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              ["Fundraising", "Send a deck that answers an investor's questions and tells you which ones to prepare for."],
              ["Sales proposals", "Know whether a proposal landed before the follow up call, not after the deal goes quiet."],
              ["Board and investor updates", "See which parts of a memo drew scrutiny, and walk into the meeting already knowing."],
              ["Diligence and data rooms", "Watch how a serious reader moves through the material, page by page, question by question."],
            ].map(([title, body], i) => (
              <div className="lp-card" key={i} style={{ background: CARD, border: "1px solid " + HAIR, borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px", color: INK }}>{title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: SAGE, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPOUNDING BAND ===== */}
      <section className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 84, paddingBottom: 84 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ ...eyebrow, margin: "0 0 18px" }}>The long game</p>
          <p style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.34, letterSpacing: "-0.02em", color: INK, margin: 0 }}>
            The first document you send with BackRead already reads its reader. The hundredth one knows what to say before the question is asked. That gap is the moat, and it grows every time you hit send.
          </p>
        </div>
      </section>

      {/* ===== CLOSING CTA ===== */}
      <section style={{ background: INK, color: "#fff", position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", bottom: -60, left: -40, opacity: 0.45, pointerEvents: "none" }} width="500" height="360" viewBox="0 0 500 360" fill="none">
          <path d="M20 340 C 160 300, 140 180, 260 150 S 440 90, 480 20" stroke={FOREST} strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="260" cy="150" r="4" fill={LIVING} />
        </svg>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 100, paddingBottom: 104, position: "relative", zIndex: 2, textAlign: "center" }}>
          <h2 className="lp-cta-h2" style={{ fontSize: 46, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 auto 20px", maxWidth: 640 }}>
            Stop sending documents into the dark.
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: CLOUD, margin: "0 auto 34px", maxWidth: 520 }}>
            Send your next document with BackRead and read the reader back. Free while we are in beta.
          </p>
          <a href="/login" className="lp-a lp-cta" style={{ display: "inline-block", background: LIVING, color: INK, fontSize: 17, fontWeight: 600, padding: "15px 34px", borderRadius: 12 }}>Start free</a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="lp-pad" style={{ ...wrap, padding: "30px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", fontSize: 16, fontWeight: 600 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={LIVING} strokeWidth="2.2" /><circle cx="12" cy="12" r="3.4" fill={LIVING} /></svg>
            BackRead
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: CLOUDDIM }}>THE DOCUMENT READS THE READER.</span>
          <div style={{ display: "flex", gap: 22 }}>
            <a href="/login" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 14 }}>Sign in</a>
            <a href="/pricing" className="lp-a lp-link" style={{ color: CLOUD, fontSize: 14 }}>Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
