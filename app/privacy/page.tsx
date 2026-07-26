import MarketingNav from "../MarketingNav";

const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Table = { head: string[]; rows: string[][] };
type Block = string | string[] | Table;
type Section = { id: string; h: string; body: Block[] };
const isTable = (b: Block): b is Table => typeof b === "object" && !Array.isArray(b) && "head" in b;

const UPDATED = "24th July 2026";

const SECTIONS: Section[] = [
  {
    id: "who",
    h: "1. Who we are",
    body: [
      "ReadProspects is operated by ReadProspects Technologies Nigeria (RC 9702396), registered at 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "This policy explains how we handle personal data across readprospects.com and app.readprospects.com. Our document delivery service at relaydocuments.com has its own notice, which readers see when they open a document.",
      "For all privacy matters, contact privacy@readprospects.com.",
    ],
  },
  {
    id: "short",
    h: "2. The short version",
    body: [
      "If you hold an account with us, we collect what we need to run your account and process what you upload. If someone shared a document with you and you opened it, we recorded how you read it on behalf of the person who sent it. Section 6 explains that.",
      "We use AI to answer readers' questions and to analyse how documents are read. Document content and reader questions are sent to our AI provider. Section 8 covers this, and section 9 covers the fact that our verdict feature profiles individual readers. Those two sections matter most.",
      "We do not sell personal data. We do not use it to train AI models.",
    ],
  },
  {
    id: "roles",
    h: "3. Our two roles",
    body: [
      "We handle two different kinds of personal data, and our legal responsibility differs for each.",
      [
        "Data about you, our account holder. Here we are the controller. We decide what to collect and why: your email, name, organization, billing status, and how you use the service.",
        "Data about readers of your documents. Here we act as a processor on your instructions. You decide who receives a document, so you are the controller of that data, and you are responsible for having a lawful basis to share it with us and for telling that person their reading is recorded.",
      ],
      "Because we design the analytics and AI features that operate on reader data, a supervisory authority may treat us as a joint controller for some of it. We accept that possibility and have written this policy to describe that processing openly rather than hide behind the processor label.",
    ],
  },
  {
    id: "account-data",
    h: "4. Data we collect about account holders",
    body: [
      [
        "Identity and account: email address, password (stored only as a hash by our authentication provider, never in readable form), first and last name, profile photo if you upload one, account type, and your workspace or organization name.",
        "Organization data: organization name, domain, members and their roles, pending invitations including the invitee's name and email, projects, and the access grants that control who can see what.",
        "Content you upload: documents in their original file form, the text we extract from them, page counts, and any variants you create for A/B testing.",
        "Usage and billing: which features you use, how many documents and verdicts you generate, your plan, trial status, and subscription state. When paid plans launch, card details will be handled entirely by our payment provider and will not reach our systems.",
        "Technical data: IP address, browser and device type, and diagnostic logs generated automatically when you use the service.",
        "Integration data: if you connect Slack, webhooks or our API, we store the endpoint URLs, a hashed API key, and delivery logs.",
      ],
    ],
  },
  {
    id: "lawful",
    h: "5. Why we process account data, and our legal basis",
    body: [
      "Under the Nigeria Data Protection Act 2023 and the GDPR where it applies, every use of personal data needs a lawful basis. Ours are:",
      {
        head: ["Purpose", "Legal basis"],
        rows: [
          ["Creating and running your account", "Performance of a contract with you"],
          ["Providing document, reader and verdict features", "Performance of a contract"],
          ["Billing and collecting payment", "Performance of a contract"],
          ["Security, abuse prevention, rate limiting", "Legitimate interests"],
          ["Product improvement and diagnostics", "Legitimate interests"],
          ["Service announcements and support", "Performance of a contract"],
          ["Marketing emails", "Consent, withdrawable at any time"],
          ["Meeting legal, tax and regulatory duties", "Legal obligation"],
        ],
      },
      "Where we rely on legitimate interests, we have weighed those against your rights and concluded they do not override them. You can ask us for that assessment.",
    ],
  },
  {
    id: "reader-data",
    h: "6. Data we process about readers",
    body: [
      "This is the part of our service most likely to affect someone who never signed up with us, so we describe it plainly.",
      "When you share a document, we process the recipient's name and email address as supplied by you, and we record how they read it: when they opened it, which pages they viewed and for how long, whether they returned to a page, any questions they typed into the document, and whether they forwarded it and to whom. Our hosting and database providers also log the reader's IP address as part of normal operation.",
      "We store the full conversation between a reader and the document's AI companion. In the sender's dashboard, senders see the questions asked but not the AI's answers. If a sender has configured Slack or webhook alerts, both the question and the AI's answer are delivered to their chosen destination at the moment the question is asked.",
      "If a reader forwards a document, we record the name and email of each colleague they send it to, because the reader entered those details in order to send it. Those colleagues can ask us to erase them, and we have a specific tool to do so.",
      "Your obligations as the sender. By sharing a document, you confirm that you have a lawful basis to provide us with that person's details, and that you will tell them their engagement with the document is recorded and analysed where the law requires it. The reader has no relationship with us, so only you can tell them. You indemnify us against claims arising from a failure to do so, as set out in our Terms.",
    ],
  },
  {
    id: "processors",
    h: "7. Sub-processors and service providers",
    body: [
      "We use the following providers. Each processes personal data on our behalf under contractual terms.",
      {
        head: ["Provider", "What they do", "Where"],
        rows: [
          ["Supabase", "Database, file storage, authentication", "United States"],
          ["Vercel", "Application hosting and delivery", "United States and global edge"],
          ["Anthropic", "AI processing of document content and reader questions", "United States"],
          ["Resend", "Sending emails to you and to your recipients", "United States"],
          ["GitHub", "Source code hosting (no customer personal data)", "United States"],
          ["Paystack", "Payment processing (not yet active)", "Nigeria"],
        ],
      },
      "We will update this list before adding a new provider that processes personal data.",
    ],
  },
  {
    id: "ai",
    h: "8. Artificial intelligence",
    body: [
      "We want to be specific here, because it is the processing least visible to the people affected by it.",
      "What is sent. When a reader asks a question, we send the document's extracted text and their question to Anthropic to generate an answer. When a document is an image or a scanned PDF, the image itself is sent to Anthropic so that its text can be read. When you run a verdict, we send the document text together with that reader's behavioural signals, meaning opens, page dwell, re-reads, questions and forwards, and the reader's name and organization.",
      "What comes back. An answer for the reader, or an assessment for you of what the reader appears to be thinking and what you might do next.",
      "What does not happen. Anthropic does not use this data to train their models. We do not use your documents or reader data to train any model. We do not sell this data.",
      "Its limits. AI output is generated text. It can be wrong, and a verdict is an inference from limited behavioural evidence, not a fact about a person. It should not be the sole basis for a consequential decision about anyone.",
    ],
  },
  {
    id: "profiling",
    h: "9. Profiling",
    body: [
      "Our verdict feature analyses an identified individual's behaviour and produces an assessment of their intent and likely next step. Under data protection law this is profiling, and we describe it as such rather than call it analytics.",
      "The profiling is not fully automated decision-making with legal or similarly significant effects, because a person, the sender, reads the assessment and decides what to do. Readers retain the right to object to profiling and to ask for erasure, as set out in section 12.",
    ],
  },
  {
    id: "transfers",
    h: "10. International transfers",
    body: [
      "Your data and your readers' data are transferred outside Nigeria, principally to the United States, because our infrastructure providers are based there.",
      "For transfers from Nigeria we rely on the safeguards permitted under the Nigeria Data Protection Act 2023, including contractual protections with each provider. For transfers of data originating in the European Economic Area or United Kingdom, we rely on Standard Contractual Clauses or an equivalent approved mechanism with each provider.",
    ],
  },
  {
    id: "security",
    h: "11. Security",
    body: [
      "Data is encrypted in transit and at rest. Document files are served through short-lived signed links rather than public URLs. Profile photos are stored in a public bucket and are accessible to anyone holding the link. Row-level database security separates one customer's data from another's, and the reader conversation transcript is restricted so that account holders cannot query it directly.",
      "Administrative access to customer data is restricted to authorised personnel. Every administrative action that changes or deletes data is recorded in an audit log. Administrative read access is not currently logged.",
      "No system is perfectly secure. If a breach occurs that is likely to result in risk to affected individuals, we will notify the Nigeria Data Protection Commission within 72 hours where required, and affected individuals without undue delay.",
    ],
  },
  {
    id: "retention",
    h: "12. How long we keep data, and your rights",
    body: [
      "Retention. We keep your account data for as long as your account is open. Documents and their associated reader data remain until you delete them or close your account. Deleting a document removes its recipients, their signals, their conversations and the underlying file. Closing your account removes your documents, their files, your profile photo and all associated reader data. After closure we retain limited records where we must for legal, tax or accounting reasons.",
      "Compliance records. Where we erase someone's data on request, we retain a minimal record of the request and the action taken, including the identifier used to make it, as evidence that we honoured it. Audit records of administrative actions are kept as a security control.",
      "Your rights. Subject to legal limits, you may ask us to give you a copy of your data, correct it, delete it, restrict or object to how we use it, provide it in a portable format, or withdraw consent where consent is the basis. You will not be treated less favourably for exercising any of these.",
      "If you are a reader, not an account holder, you have the same rights. The person who sent you the document is the controller of your data, so contacting them is usually fastest, but you may write to us at privacy@readprospects.com and we will act on your request, including erasing everything we hold about your reading of a document. If you were named as a colleague when someone forwarded a document, you may ask us to erase you, and we will remove your name and address from those records.",
      "We respond within 30 days.",
      "Complaints. You may complain to the Nigeria Data Protection Commission at ndpc.gov.ng. If you are in the European Economic Area or the United Kingdom, you may complain to your local supervisory authority.",
    ],
  },
  {
    id: "cookies",
    h: "13. Cookies",
    body: [
      "We use only cookies that are necessary to keep you signed in, remember your language, and keep the service secure. We do not use advertising cookies. If we introduce analytics or other non-essential cookies, we will ask for your consent first.",
    ],
  },
  {
    id: "children",
    h: "14. Children",
    body: [
      "The service is not intended for anyone under 18, and we do not knowingly collect their data. If you believe a child has provided us with personal data, contact us and we will delete it.",
    ],
  },
  {
    id: "changes",
    h: "15. Changes",
    body: [
      "We will post any change here and update the date above. If a change materially affects your rights, we will tell you directly before it takes effect.",
    ],
  },
  {
    id: "contact",
    h: "16. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "Email privacy@readprospects.com for any privacy question or to exercise a right.",
    ],
  },
];

export default function PrivacyPage() {
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`.lg-a{color:${GREEN_TEXT};text-decoration:none}.lg-a:hover{text-decoration:underline}@media(max-width:640px){.lg-h1{font-size:34px!important}.lg-body{font-size:15px!important}}`}</style>
      <MarketingNav />

      <section style={{ background: GRADIENT, color: "#fff", padding: "148px 0 76px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(216,232,74,0.14)", border: "1px solid rgba(216,232,74,0.40)", color: LEMON, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 22, textTransform: "uppercase" }}>NDPR and GDPR aligned</div>
          <h1 className="lg-h1" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 auto", maxWidth: 560, lineHeight: 1.55 }}>Your documents, and the trust of the people who read them, are yours. Here is exactly how we protect both.</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "18px 0 0" }}>Last updated: {UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "56px 0 40px" }}>
        <div style={wrap}>
          {/* quick summary card */}
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 26, marginBottom: 44, boxShadow: "0 8px 30px rgba(11,122,75,0.08)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, margin: "0 0 14px" }}>Summary</h2>
            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "We collect only what we need to run ReadProspects well.",
                "We never sell your data, and we never train AI models on your documents.",
                "Document text and reader questions are sent to our AI provider, Anthropic.",
                "Our verdict feature profiles individual readers. We say so plainly in section 9.",
                "Readers, and people named in a forward, can ask us to erase them at any time.",
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 16, lineHeight: 1.5, color: BODY }}>{t}</li>
              ))}
            </ul>
          </div>

          {SECTIONS.map((sec) => (
            <div key={sec.id} id={sec.id} style={{ marginBottom: 38, scrollMarginTop: 90 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: "0 0 12px" }}>{sec.h}</h2>
              {sec.body.map((b, i) =>
                isTable(b) ? (
                  <div key={i} style={{ overflowX: "auto", margin: "0 0 16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                      <thead>
                        <tr>
                          {b.head.map((h, k) => (
                            <th key={k} style={{ textAlign: "left", padding: "10px 12px 10px 0", borderBottom: `2px solid ${LINE}`, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, k) => (
                          <tr key={k}>
                            {r.map((cell, j) => (
                              <td key={j} style={{ padding: "11px 12px 11px 0", borderBottom: `1px solid ${LINE}`, color: j === 0 ? INK : BODY, fontWeight: j === 0 ? 600 : 400, lineHeight: 1.55, verticalAlign: "top" }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : Array.isArray(b) ? (
                  <ul key={i} style={{ margin: "0 0 14px", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {b.map((item, j) => (
                      <li key={j} className="lg-body" style={{ fontSize: 16, lineHeight: 1.65, color: BODY }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="lg-body" style={{ fontSize: 16, lineHeight: 1.7, color: BODY, margin: "0 0 14px" }}>{b}</p>
                )
              )}
            </div>
          ))}
        </div>
      </section>

      <footer style={{ background: NIGHT, borderTop: "1px solid rgba(255,255,255,0.08)", color: MUTE, padding: "36px 0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <a href="/" style={{ fontSize: 14, color: MUTE, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: BRAND }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em", filter: "drop-shadow(0 0 3px rgba(51,230,162,0.55))" }}><circle cx="12" cy="12" r="9" stroke="#33E6A2" strokeWidth="2.4" /><circle cx="12" cy="12" r="3.5" fill="#33E6A2" /></svg></span> ReadProspects, the document reads the reader.</a>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <a href="https://www.linkedin.com/company/readprospects" target="_blank" rel="noopener noreferrer" aria-label="ReadProspects on LinkedIn" style={{ color: MUTE, display: "flex", alignItems: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18.5h2.67V9.5zM7 5.9a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zM18.34 18.5v-4.94c0-2.64-1.41-3.87-3.29-3.87-1.52 0-2.2.84-2.58 1.43V9.5h-2.67V18.5h2.67v-4.77c0-1.26.24-2.48 1.8-2.48 1.54 0 1.56 1.44 1.56 2.56v4.69h2.78z"/></svg></a>
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





