import MarketingNav from "./MarketingNav";

// BackRead landing. Uses the shared MarketingNav (sticky, transparent over hero,
// auth-aware, blurs on scroll). DM Sans throughout. Existing brand palette.
// "Reader's trail" signature threads the how-it-works section. Dash-free copy.

const NIGHT = "#082019";       // deep night green (matches pricing GRADIENT top)
const INK = "#0F1729";         // near-black ink for body headings on light
const GREEN = "#0B7A4B";       // primary green
const GREEN_SOFT = "#E7F6EF";
const GREEN_TEXT = "#067647";
const BRAND = "#1FA971";       // brand accent
const CANVAS = "#F8F9FA";
const CARD = "#FFFFFF";
const BODY = "#475467";
const MUTE = "#98A2B3";
const LINE = "#EAECEF";
const CLOUD = "rgba(255,255,255,0.72)";
const CLOUDDIM = "rgba(255,255,255,0.45)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 45%, #15503A 80%, #2E6B4A 100%)";

export default function LandingPage() {
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 32px" } as const;
  const eyebrow = { fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: GREEN_TEXT };

  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, overflowX: "hidden" }}>
      <style>{`
        .lp-a{text-decoration:none}
        .lp-cta{transition:transform .12s, box-shadow .15s}.lp-cta:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(11,122,75,0.30)}.lp-cta:active{transform:translateY(0)}
        .lp-ghost{transition:background .15s,border-color .15s}.lp-ghost:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.30)}
        .lp-card{transition:transform .16s, box-shadow .16s, border-color .16s;box-shadow:0 0 0 1px rgba(31,169,113,0.08), 0 8px 30px rgba(11,122,75,0.10), 0 2px 10px rgba(15,23,41,0.04)}.lp-card:hover{transform:translateY(-3px);box-shadow:0 0 0 1px rgba(31,169,113,0.18), 0 18px 48px rgba(11,122,75,0.18);border-color:${BRAND}}
        .lp-step:hover .lp-node{background:${BRAND};box-shadow:0 0 0 6px rgba(31,169,113,0.14)}
        @media(max-width:860px){
          .lp-two{grid-template-columns:1fr!important;gap:36px!important}
          .lp-three{grid-template-columns:1fr!important}
          .lp-four{grid-template-columns:1fr 1fr!important}
          .lp-trail-line{display:none!important}
          .lp-hero-h1{font-size:44px!important}
          .lp-h1-a{font-size:49px!important;display:inline-block}
          .lp-h1-b{font-size:39px!important;display:inline-block}
          .lp-hero-sub{font-size:18px!important}
          .lp-hero-pad{padding:168px 32px 76px!important}
        }
        @media(max-width:520px){
          .lp-hero-h1{font-size:33px!important;margin-bottom:18px!important}
          .lp-h1-a{font-size:38px!important;line-height:1.04!important;display:inline-block}
          .lp-h1-b{font-size:28px!important;line-height:1.04!important;display:inline-block}
          .lp-hero-sub{font-size:16px!important;margin-bottom:26px!important}
          .lp-hero-badge{margin-bottom:20px!important}
          .lp-pad{padding-left:20px!important;padding-right:20px!important}
          .lp-hero-pad{padding:154px 20px 56px!important}
          .lp-sec{padding-top:56px!important;padding-bottom:56px!important}
          .lp-four{grid-template-columns:1fr!important}
          .lp-cta-h2{font-size:30px!important}
          .lp-hero-fine{font-size:11px!important;margin-top:20px!important}
          .lp-hero-ctas a{flex:1 1 0!important;text-align:center!important;padding-left:12px!important;padding-right:12px!important;font-size:15px!important;white-space:nowrap!important}
          h2{font-size:30px!important}
          .lp-longgame{font-size:21px!important;line-height:1.4!important}
          .lp-compare{font-size:13px!important}
          .lp-compare > div{padding-left:12px!important;padding-right:12px!important}
        }
      `}</style>

      {/* HERO wrapper carries the dark bg; MarketingNav sits transparent on top of it */}
      <section style={{ background: GRADIENT, color: "#fff", position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", top: 0, right: -80, height: "100%", opacity: 0.5, pointerEvents: "none" }} width="620" height="600" viewBox="0 0 620 600" fill="none">
          <path d="M40 540 C 200 480, 160 340, 300 300 S 500 220, 560 60" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 8" fill="none" />
          <circle cx="300" cy="300" r="4" fill={BRAND} />
          <circle cx="560" cy="60" r="4" fill={BRAND} />
          <circle cx="40" cy="540" r="4" fill={BRAND} />
        </svg>

        <MarketingNav />

        <div className="lp-hero-pad" style={{ ...wrap, padding: "128px 32px 104px", position: "relative", zIndex: 2 }}>
          <div className="lp-hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(31,169,113,0.12)", border: "1px solid rgba(31,169,113,0.34)", color: BRAND, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 28, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: BRAND }} />
            Join 5000+ users
          </div>
          <h1 className="lp-hero-h1" style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.035em", margin: "0 0 24px", maxWidth: 760 }}>
            <span className="lp-h1-a">Every reader leaves a trail.</span><br /><span className="lp-h1-b" style={{ color: BRAND }}>Now you can follow it.</span>
          </h1>
          <p className="lp-hero-sub" style={{ fontSize: 20, lineHeight: 1.5, margin: "0 0 36px", color: CLOUD, maxWidth: 560 }}>
            BackRead turns every document you send into a live companion that answers your reader's questions, watches how it is read, and tells you where the deal really stands.
          </p>
          <div className="lp-hero-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/login" className="lp-a lp-cta" style={{ background: GREEN, color: "#fff", fontSize: 16, fontWeight: 600, padding: "14px 28px", borderRadius: 12 }}>Start here</a>
            <a href="#how" className="lp-a lp-ghost" style={{ color: "#fff", fontSize: 16, fontWeight: 500, padding: "14px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.20)" }}>See how it works</a>
          </div>
          <p className="lp-hero-fine" style={{ fontSize: 12, letterSpacing: "0.04em", color: CLOUDDIM, margin: "26px 0 0", textTransform: "uppercase" }}>No card required. Your first document live in minutes.</p>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 92, paddingBottom: 92 }}>
        <div className="lp-two" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 64, alignItems: "start" }}>
          <div>
            <p style={{ ...eyebrow, margin: "0 0 16px" }}>The blind spot</p>
            <h2 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.025em", margin: 0, color: INK }}>You send the document. Then the silence begins.</h2>
          </div>
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: BODY, margin: "0 0 20px" }}>
              A proposal, a deck, a memo goes out. You wait. You do not know who opened it, which page made them pause, what question they never asked out loud, or whether the deal is warm or already gone.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: BODY, margin: 0 }}>
              Read receipts tell you a file was opened. Analytics tell you seconds on a page. Neither tells you what the reader actually wanted. BackRead was built to close that gap.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (the trail) */}
      <section id="how" style={{ background: GRADIENT, color: "#fff" }}>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 100 }}>
          <p style={{ ...eyebrow, color: BRAND, margin: "0 0 16px" }}>How it works</p>
          <h2 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 60px", maxWidth: 620 }}>
            Three things happen the moment your reader opens it.
          </h2>
          <div className="lp-trail" style={{ position: "relative" }}>
            {[
              ["01", "The document answers, in your voice", "Your reader asks a question inside the document itself. BackRead answers from what you approved, and when a question crosses into territory only you should handle, it holds the line and flags it for you instead of guessing."],
              ["02", "It watches how the reading goes", "Every pause, re-read, and question becomes a signal. You see which sections held attention, which were skipped, and where a reader hesitated, the quiet tells that a reply email never contains."],
              ["03", "It returns a verdict on the deal", "BackRead reads the pattern of the whole reading and tells you where things stand, so you know whether to push, to wait, or to rewrite before you send it to the next person."],
            ].map(([n, title, body], i) => (
              <div className="lp-step" key={i} style={{ display: "flex", gap: 26, alignItems: "flex-start", paddingBottom: i < 2 ? 44 : 0, position: "relative" }}>
                {/* connector: from the bottom of this circle to the top of the next one */}
                {i < 2 && <div className="lp-trail-line" aria-hidden="true" style={{ position: "absolute", left: 19.25, top: 44, bottom: 0, width: 1.5, background: "rgba(31,169,113,0.35)" }} />}
                <div className="lp-node" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(31,169,113,0.14)", border: "1.5px solid " + BRAND, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: BRAND, transition: "background .16s, box-shadow .16s", position: "relative", zIndex: 2 }}>{n}</div>
                <div style={{ paddingTop: 4 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{title}</h3>
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: CLOUD, margin: 0, maxWidth: 620 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY BACKREAD */}
      <section id="why" className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 96 }}>
        <p style={{ ...eyebrow, margin: "0 0 16px" }}>Why BackRead</p>
        <h2 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 14px", maxWidth: 640, color: INK }}>
          Attention is not intent.
        </h2>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: BODY, margin: "0 0 52px", maxWidth: 620 }}>
          Everyone else measures whether eyes were on the page. BackRead reads what the reader was actually trying to decide.
        </p>
        <div className="lp-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {[
            ["The document reads the reader", "Instead of a static file, you send something that listens. It captures stated intent, the questions a reader types, not just the seconds they linger."],
            ["A verdict on the deal, not the document", "You do not get another dashboard to interpret. You get a plain read on where the relationship stands and what to do next."],
            ["It compounds with every send", "Each document learns from the readings before it. What you send tomorrow is sharper than what you sent today, because it remembers."],
          ].map(([title, body], i) => (
            <div className="lp-card" key={i} style={{ background: CARD, border: "1px solid " + LINE, borderRadius: 16, padding: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: GREEN_SOFT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, background: GREEN }} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 10px", color: INK }}>{title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: BODY, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section id="uses" style={{ background: CANVAS, borderTop: "1px solid " + LINE, borderBottom: "1px solid " + LINE }}>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 88, paddingBottom: 88 }}>
          <div className="lp-two" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 56, alignItems: "center", marginBottom: 48 }}>
            <div>
              <p style={{ ...eyebrow, margin: "0 0 16px" }}>Use cases</p>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.025em", margin: 0, color: INK }}>For any document that matters after it leaves your hands.</h2>
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: BODY, margin: 0, paddingTop: 4 }}>
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
              <div className="lp-card" key={i} style={{ background: CARD, border: "1px solid " + LINE, borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px", color: INK }}>{title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: BODY, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW BACKREAD COMPARES */}
      <section id="compare" className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 96 }}>
        <p style={{ ...eyebrow, margin: "0 0 16px" }}>How BackRead compares</p>
        <h2 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 14px", maxWidth: 640, color: INK }}>
          You already have tools that watch. None of them listen.
        </h2>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: BODY, margin: "0 0 48px", maxWidth: 620 }}>
          Read receipts and document analytics tell you that something happened. BackRead tells you what it meant.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.1fr 1.2fr", gap: 0, border: "1px solid " + LINE, borderRadius: 16, overflow: "hidden", background: CARD }} className="lp-compare">
          {/* header row */}
          <div style={{ padding: "18px 22px", borderBottom: "1px solid " + LINE, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: MUTE }}>What you learn</div>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid " + LINE, borderLeft: "1px solid " + LINE, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: MUTE }}>Read receipts and analytics</div>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid " + LINE, background: GREEN_SOFT, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT }}>BackRead</div>
          {[
            ["Whether it was opened", "Yes", "Yes"],
            ["Time spent per page", "Sometimes", "Yes"],
            ["The questions the reader had", "No", "Yes, captured as they read"],
            ["What the reader was deciding", "No", "Read as stated intent"],
            ["A verdict on where the deal stands", "No", "Every time"],
            ["Gets sharper across sends", "No", "Compounds with every document"],
          ].map(([label, them, us], i, arr) => (
            <div key={i} style={{ display: "contents" }}>
              <div style={{ padding: "16px 22px", borderBottom: i < arr.length - 1 ? "1px solid " + LINE : "none", fontSize: 15, fontWeight: 600, color: INK }}>{label}</div>
              <div style={{ padding: "16px 22px", borderLeft: "1px solid " + LINE, borderBottom: i < arr.length - 1 ? "1px solid " + LINE : "none", fontSize: 14.5, color: BODY }}>{them}</div>
              <div style={{ padding: "16px 22px", borderBottom: i < arr.length - 1 ? "1px solid " + LINE : "none", fontSize: 14.5, color: INK, fontWeight: 600, background: "rgba(31,169,113,0.05)" }}>{us}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section style={{ background: GRADIENT, color: "#fff" }}>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 96, paddingBottom: 96 }}>
          <div className="lp-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <p style={{ ...eyebrow, color: BRAND, margin: "0 0 16px" }}>See it in action</p>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.025em", margin: "0 0 18px" }}>The verdict is the first thing you see.</h2>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: CLOUD, margin: "0 0 16px" }}>
                Open a document in BackRead and you do not start with a chart to decode. You start with a plain read on the relationship, written the way a sharp colleague would tell you across a desk.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: CLOUD, margin: 0 }}>
                Underneath it sits the trail: every question, every pause, every re-read that led to the call.
              </p>
            </div>
            {/* mock verdict card */}
            <div style={{ background: "#fff", borderRadius: 18, padding: 26, boxShadow: "0 24px 60px rgba(0,0,0,0.28)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9, background: BRAND }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: GREEN_TEXT }}>Verdict</span>
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.4, margin: "0 0 18px" }}>Warm. The reader went deep on pricing and terms, then came back to the summary twice. Prepare for a question about the annual commit.</p>
              <div style={{ borderTop: "1px solid " + LINE, paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Pricing page", "Read 3 times"], ["Terms and conditions", "Re-read, paused 40s"], ["Executive summary", "Returned to last"]].map(([a, b], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{a}</span>
                    <span style={{ fontSize: 13, color: BODY }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
        <div style={{ maxWidth: 760 }}>
          <p style={{ ...eyebrow, margin: "0 0 18px" }}>The long game</p>
          <p className="lp-longgame" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.34, letterSpacing: "-0.02em", color: INK, margin: 0 }}>
            The first document you send with BackRead already reads its reader. The hundredth one knows what to say before the question is asked. That gap is the moat, and it grows every time you hit send.
          </p>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={{ background: GRADIENT, color: "#fff", position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", bottom: -60, left: -40, opacity: 0.45, pointerEvents: "none" }} width="500" height="360" viewBox="0 0 500 360" fill="none">
          <path d="M20 340 C 160 300, 140 180, 260 150 S 440 90, 480 20" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="260" cy="150" r="4" fill={BRAND} />
        </svg>
        <div className="lp-sec lp-pad" style={{ ...wrap, paddingTop: 100, paddingBottom: 104, position: "relative", zIndex: 2, textAlign: "center" }}>
          <h2 className="lp-cta-h2" style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 auto 20px", maxWidth: 640 }}>
            Stop sending documents into the dark.
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: CLOUD, margin: "0 auto 34px", maxWidth: 520 }}>
            Send your next document with BackRead and read the reader back.
          </p>
          <a href="/login" className="lp-a lp-cta" style={{ display: "inline-block", background: GREEN, color: "#fff", fontSize: 17, fontWeight: 600, padding: "15px 34px", borderRadius: 12 }}>Start free</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="lp-pad" style={{ ...wrap, padding: "30px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: BRAND }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg></span>
            BackRead
          </span>
          <span style={{ fontSize: 13, letterSpacing: "0.02em", color: CLOUDDIM }}>The document reads the reader.</span>
          <div style={{ display: "flex", gap: 22 }}>
            <a href="/pricing" className="lp-a" style={{ color: CLOUD, fontSize: 14 }}>Pricing</a>
            <a href="/privacy" className="lp-a" style={{ color: CLOUD, fontSize: 14 }}>Privacy</a>
            <a href="/terms" className="lp-a" style={{ color: CLOUD, fontSize: 14 }}>Terms</a>
            <a href="/login" className="lp-a" style={{ color: CLOUD, fontSize: 14 }}>Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
