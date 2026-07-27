import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const metadata = {
  title: "What the words mean \u2014 ReadProspects",
  description: "Signals, dwell, intent, verdicts and confidence: what ReadProspects measures, what it infers, and what it cannot tell you.",
};
// The vocabulary, defined once.
//
// On the MARKETING host rather than inside the app, deliberately: the same
// words need explaining to a prospect deciding whether to buy and to a customer
// working out what a screen is telling them. One page, two audiences, and the
// version that also brings people in from search costs nothing extra.
//
// The honest sections are not a disclaimer. A product that claims to read minds
// from page dwell gets believed once; saying plainly what a signal can and
// cannot support is what makes the confident parts worth trusting.
type Section = { id: string; h: string; body: (string | { list: string[] })[] };
const SECTIONS: Section[] = [
  {
    id: "signals",
    h: "Signals",
    body: [
      "Everything ReadProspects knows about a reader comes from six things they do. In order of how much each one is worth:",
      { list: [
        "A reply. They wrote back. This is not evidence to weigh up, it is the answer.",
        "A question. They asked the document something. Stated intent, and worth more than everything below it combined.",
        "A forward. They sent it to a colleague, which tells you the conversation has moved inside their company.",
        "A re-read. They came back to a page. Either friction, or the thing they are weighing.",
        "Dwell. How long they spent on a page. A weak proxy, and treated as one.",
        "An open. They looked at it. Engagement, nothing more.",
      ] },
      "That order is the whole intellectual claim of this product. A tool that treats an open like an answer is counting, not reading.",
    ],
  },
  {
    id: "dwell",
    h: "Dwell, and why we distrust it",
    body: [
      "Dwell is the time a page was on screen. It is the easiest thing to measure and the easiest to over-read.",
      "A reader who spent ninety seconds on your pricing page may have been studying it. They may also have been getting coffee. We cap dwell at fifteen minutes for exactly this reason, and a verdict is never built on dwell alone.",
      "Where dwell earns its place is in aggregate. One reader lingering on page four is that reader's habit. Ten readers stopping on page four is a fact about page four.",
    ],
  },
  {
    id: "companion",
    h: "The document companion",
    body: [
      "Your reader can ask your document a question while they read it, and get an answer drawn from the document itself.",
      "This is the part that is genuinely different. A prospect reading your proposal at eleven at night can ask whether the annual commitment is negotiable, get a straight answer, and carry on. You find out in the morning what they asked.",
      "The companion answers from your document and does not invent terms you have not offered. When something falls outside what the document says, it says so rather than guessing.",
    ],
  },
  {
    id: "verdict",
    h: "The verdict",
    body: [
      "A verdict is a read on the deal, not on the document. It answers what this person seems to be thinking and what to do about it.",
      "It is deliberately blunt: one headline, a short piece of reasoning, and one concrete next move. Not \u201cfollow up\u201d. Something specific enough to do today.",
      "When a reader has replied, the verdict reports what they said rather than inferring around it. Once someone tells you what they think, estimating what they think is worse than useless.",
    ],
  },
  {
    id: "confidence",
    h: "Confidence",
    body: [
      "Every verdict carries high, medium or low confidence, and it means what it says.",
      "Low confidence is not hedging. It means the signals are thin \u2014 an open, a little dwell, no questions \u2014 and that anything more assertive would be invention. When you see it, the honest move is usually to wait.",
      "A confident verdict on thin evidence is worse than no verdict, because you would act on it.",
    ],
  },
  {
    id: "intent",
    h: "Intent, and the field",
    body: [
      "Intent is a single number summarising how far along a reader appears to be. The Intent Field on your overview places every reader by that number: the closer to the centre, the more ready they look.",
      "Three bands, and the names are the claim:",
      { list: [
        "Glanced. They opened it. That is all you know.",
        "Warming. Repeat visits or real time on the pages that matter.",
        "Ready to move. Questions, forwarding, or a pattern of reading that says this is live.",
      ] },
      "A reader who replies is shown as Replied and sits above all three, because a reply is not an estimate.",
    ],
  },
  {
    id: "neutral",
    h: "Why your reader sees a different domain",
    body: [
      "Documents open on relaydocuments.com, not on ReadProspects. Your reader sees a clean document with no branding of ours and no account to create.",
      "That is for them, not for concealment. A prospect asked to sign up before reading your proposal simply does not read it, and a document plastered in a vendor's logo reads as marketing rather than as your work.",
      "What is collected, and that the sender can see it, is set out in the privacy notice linked from the reader itself.",
    ],
  },
  {
    id: "forwarding",
    h: "Forwarding",
    body: [
      "A reader can pass your document to a colleague from inside the reader. When they do, the colleague gets their own link and their own reading is tracked separately.",
      "Forwarding is one of the strongest signals available, because it is the moment your document starts being discussed by people you have never met.",
    ],
  },
  {
    id: "versions",
    h: "A and B versions",
    body: [
      "Upload two or more versions of the same document and readers are split between them automatically.",
      "You then see which version holds attention, which one draws questions, and which one loses people \u2014 measured on real readers rather than on opinion.",
      "Under about six readers per version, the difference is noise. The panel says so rather than declaring a winner.",
    ],
  },
  {
    id: "reports",
    h: "Reports",
    body: [
      "A report is the whole picture as a document you can send to someone else: who is worth acting on this week, what the engaged readers have in common, and what your document is doing to people.",
      "It is not a stack of individual verdicts. Twenty-three verdicts in a row is a spreadsheet with adjectives. The useful part is the shortlist \u2014 which three of the twenty-three deserve your Tuesday.",
    ],
  },
  {
    id: "limits",
    h: "What none of this can tell you",
    body: [
      "It cannot tell you what someone thought. It can tell you what they did, and make a careful case about what that implies.",
      "It cannot see reading that happens outside the link. A printed copy, a forwarded screenshot, a conversation in a meeting: invisible to us and often decisive.",
      "It cannot make a silent reader mean something. Most people who never open a document simply never opened it.",
      "Where the evidence is thin, ReadProspects says so. That is the part that makes the rest worth reading.",
    ],
  },
];
export default function ConceptsPage() {
  const link = { color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder };
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <a href="/" style={{ fontSize: 15.5, fontWeight: 600, color: T.heading, textDecoration: "none" }}>ReadProspects</a>
          <a href="/pricing" style={{ marginLeft: "auto", fontSize: 13, color: T.muted, textDecoration: "none" }}>Pricing</a>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 100px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          What the words mean
        </h1>
        <p style={{ fontSize: 15, color: T.muted, margin: "10px 0 0", lineHeight: 1.6, maxWidth: 580 }}>
          ReadProspects uses a handful of terms that are specific to it. This page defines each one, and says plainly
          where the evidence behind it is strong and where it is not.
        </p>

        <nav aria-label="On this page" style={{ margin: "30px 0 0", paddingTop: 22, borderTop: "1px solid " + T.border }}>
          <div style={{ fontSize: 11, letterSpacing: "0.09em", color: T.faint, marginBottom: 12 }}>ON THIS PAGE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SECTIONS.map((s, i) => (
              <a key={s.id} href={"#" + s.id}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  border: "1px solid " + T.border, borderRadius: T.rBtn,
                  padding: "6px 11px", fontSize: 13, color: T.body, textDecoration: "none",
                  background: T.card,
                }}>
                <span style={{ fontSize: 11, color: T.faint, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                {s.h}
              </a>
            ))}
          </div>
        </nav>

        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} style={{ marginTop: 38, paddingTop: 30, borderTop: "1px solid " + T.borderSoft, scrollMarginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 10px" }}>{s.h}</h2>
            {s.body.map((b, i) =>
              typeof b === "string" ? (
                <p key={i} style={{ fontSize: 14.5, color: T.body, lineHeight: 1.7, margin: i ? "12px 0 0" : 0 }}>{b}</p>
              ) : (
                <ul key={i} style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                  {b.list.map((item, k) => (
                    <li key={k} style={{ display: "flex", gap: 11, marginBottom: 8 }}>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: T.green, marginTop: 9, flex: "none" }} />
                      <span style={{ fontSize: 14.5, color: T.body, lineHeight: 1.65 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        ))}

        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: "40px 0 0", paddingTop: 20, borderTop: "1px solid " + T.border }}>
          Still unclear on something? <a href="/pricing" style={link}>See what each plan includes</a>, or write to{" "}
          <a href="mailto:support@readprospects.com" style={link}>support@readprospects.com</a> and a person will answer.
        </p>
      </main>
    </div>
  );
}