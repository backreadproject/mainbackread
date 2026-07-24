import MarketingNav from "../MarketingNav";

const NIGHT = "#082019", INK = "#0F1729", CANVAS = "#F8F9FA", GREEN = "#0B7A4B", GREEN_TEXT = "#067647", BRAND = "#1FA971", BODY = "#475467", MUTE = "#98A2B3", LINE = "#EAECEF", CLOUD = "rgba(255,255,255,0.72)";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #061711 0%, #0B2E22 60%, #0E3A2C 100%)";

type Section = { id: string; h: string; body: (string | string[])[] };

const UPDATED = "24th July 2026";

const SECTIONS: Section[] = [
  {
    id: "agreement",
    h: "1. Agreement",
    body: [
      "These Terms are a contract between you and ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "By creating an account or using the service you accept these Terms. If you accept them on behalf of a company, you confirm you are authorised to bind it, and \"you\" means that company.",
      "If you do not accept these Terms, do not use the service.",
    ],
  },
  {
    id: "service",
    h: "2. What the service does",
    body: [
      "ReadProspects lets you share a document with a named recipient through a private link, records how that person reads it, lets them ask questions of an AI companion attached to the document, and produces an AI assessment, which we call a verdict, of what their reading behaviour suggests.",
      "You must be 18 or older and legally able to enter a contract.",
    ],
  },
  {
    id: "account",
    h: "3. Your account",
    body: [
      "You are responsible for your account credentials and for everything done through your account. Tell us promptly at privacy@readprospects.com if you believe it has been compromised.",
      "You must give accurate registration details. We may suspend accounts registered with false information.",
      "If you create an organization, you are responsible for the people you invite, and organization owners and administrators can see and manage content belonging to members.",
    ],
  },
  {
    id: "billing",
    h: "4. Plans, trials and payment",
    body: [
      "We offer Free, Personal, Team and Business plans, with limits described on our pricing page. Company plans include a 7-day trial. When a trial ends without a subscription, actions that create new content are blocked while existing data remains accessible.",
      "Paid plans are billed in advance for the period chosen. Fees exclude taxes, which you are responsible for where applicable. Fees are non-refundable except where the law requires otherwise. You may cancel at any time, effective from the end of your current period.",
      "We may change prices on notice. Changes take effect at your next renewal.",
    ],
  },
  {
    id: "acceptable",
    h: "5. Acceptable use",
    body: [
      "You must not:",
      [
        "Upload a document you do not have the right to share, or that infringes anyone's rights.",
        "Upload unlawful, defamatory, or malicious content, or malware.",
        "Share documents with people whose personal data you have no lawful basis to process.",
        "Use the service to harass, stalk, deceive or covertly surveil any individual.",
        "Attempt to bypass plan limits, rate limits, or access another customer's data.",
        "Reverse engineer the service, or use it to build a competing product.",
        "Resell or sublicense access without our written agreement.",
        "Use automated means to access the service other than through our documented API.",
      ],
      "We may suspend or terminate access for breach of this section, and may do so immediately where there is risk of harm.",
    ],
  },
  {
    id: "content",
    h: "6. Your content",
    body: [
      "You keep all rights in the documents you upload. You grant us a limited, worldwide, royalty-free licence to host, store, transmit, extract text from, display and process them solely to provide the service to you, including sending content to our AI provider as described in our Privacy Policy. This licence ends when you delete the content or close your account.",
      "You are responsible for the accuracy and legality of what you upload, and for anything the AI companion says in response to questions about your document, since its answers are derived from your content.",
    ],
  },
  {
    id: "recipients",
    h: "7. Recipients and reader data, your responsibilities",
    body: [
      "This section is important. Read it.",
      "The service records the behaviour of people who did not sign up with us and who have no relationship with us. You choose those people. That places specific obligations on you.",
      "You represent and warrant that, for every recipient whose details you provide:",
      [
        "You have a lawful basis under applicable data protection law to provide their personal data to us and to have it processed as described in our Privacy Policy.",
        "You have given them any notice, and obtained any consent, that the law requires, including notice that their engagement with the document is recorded and analysed.",
        "You will not use the service where doing so would breach a duty you owe them, or any law applicable to you or to them.",
      ],
      "You are the controller of recipient personal data. We act as your processor, on your instructions, except where we determine the purposes of processing ourselves.",
      "Verdicts must not be used for consequential decisions about individuals. You must not use a verdict, or any behavioural data from the service, as a basis for a decision about a person's employment, credit, insurance, housing, education, immigration status, or any other decision producing legal or similarly significant effects for them. Verdicts are commercial inferences, not assessments of a person's character, competence or intentions.",
      "You will indemnify us against all claims, losses, fines and reasonable costs arising from your breach of this section, including claims brought by recipients or by a data protection authority.",
    ],
  },
  {
    id: "ai",
    h: "8. Artificial intelligence",
    body: [
      "The AI companion and the verdict engine produce generated text. They can be inaccurate, incomplete, or wrong in ways that appear confident.",
      "A verdict is an inference from a small amount of behavioural evidence. Time spent on a page does not reliably indicate interest, and a question does not reliably indicate intent. You must apply your own judgement before acting, and you accept the risk of relying on AI output.",
      "We do not warrant that AI output will be accurate, suitable for any purpose, or free from bias. Our AI provider may change its models, which may change output over time.",
    ],
  },
  {
    id: "availability",
    h: "9. Availability and changes",
    body: [
      "We aim to keep the service available but do not guarantee uninterrupted access. We do not offer a service level agreement unless separately agreed in writing.",
      "We may modify, add or remove features. Where a change materially reduces a paid feature you rely on, we will give reasonable notice and, at your option, a pro-rated refund for the unused portion of your current period.",
      "We may impose rate limits and reasonable usage limits to protect the service.",
    ],
  },
  {
    id: "third-party",
    h: "10. Third-party services",
    body: [
      "The service depends on third-party providers listed in our Privacy Policy. Their failures may affect availability. If you connect Slack, webhooks, our API or any other integration, your use of that third-party service is governed by its own terms, and you are responsible for the endpoints you configure and the data sent to them.",
    ],
  },
  {
    id: "ip",
    h: "11. Our intellectual property",
    body: [
      "We own the service, its software, design, and all associated intellectual property. These Terms grant you a limited, non-exclusive, non-transferable right to use it during your subscription. Feedback you give us may be used freely without obligation to you.",
    ],
  },
  {
    id: "confidentiality",
    h: "12. Confidentiality",
    body: [
      "Each party will protect the other's confidential information with reasonable care and use it only for the purposes of these Terms. This does not apply to information that is public, independently developed, or lawfully received from a third party, or where disclosure is legally required.",
    ],
  },
  {
    id: "termination",
    h: "13. Suspension and termination",
    body: [
      "You may close your account at any time. Closing it deletes your documents, their files, and associated reader data as described in our Privacy Policy.",
      "We may suspend or terminate your access if you materially breach these Terms, if payment fails, if your use creates legal risk or risk of harm to others, or if we are required to by law. Where practical we will give notice and an opportunity to fix the problem.",
      "On termination your right to use the service ends. Sections 6, 7, 8, 11, 12, 14, 15, 16 and 18 survive.",
    ],
  },
  {
    id: "disclaimers",
    h: "14. Disclaimers",
    body: [
      "To the fullest extent permitted by law, the service is provided \"as is\" and \"as available\". We disclaim all implied warranties, including merchantability, fitness for a particular purpose, non-infringement, and any warranty that the service will be uninterrupted, secure, error-free, or that AI output will be accurate.",
      "We do not warrant that recipients will be unaware the document is tracked, or that tracking will function in every email client, browser or device.",
    ],
  },
  {
    id: "liability",
    h: "15. Limitation of liability",
    body: [
      "To the fullest extent permitted by law:",
      "We are not liable for indirect, incidental, special, consequential or punitive damages; loss of profits, revenue, business, goodwill, anticipated savings, or opportunity; loss or corruption of data; or losses arising from decisions you made in reliance on AI output, whether or not we were advised such losses were possible.",
      "Our total aggregate liability arising out of or relating to these Terms or the service is limited to the greater of the fees you paid us in the twelve months before the event giving rise to the claim, or USD 100.",
      "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability under applicable consumer protection or data protection law that cannot be limited by contract.",
      "You acknowledge these limits reflect a reasonable allocation of risk, and that our pricing depends on them.",
    ],
  },
  {
    id: "indemnity",
    h: "16. Indemnity",
    body: [
      "You will defend and indemnify us against claims, damages, fines and reasonable legal costs arising from your content, your use of the service, your breach of these Terms, your breach of section 7, or your infringement of a third party's rights.",
    ],
  },
  {
    id: "data",
    h: "17. Data protection",
    body: [
      "Our Privacy Policy describes how we handle personal data and forms part of these Terms. Where we process recipient personal data as your processor, we do so on your documented instructions, apply appropriate security measures, use the sub-processors listed in our Privacy Policy, assist you with data subject requests so far as reasonable, and delete or return data as described there. If you require a separate data processing agreement, contact us.",
    ],
  },
  {
    id: "law",
    h: "18. Governing law and disputes",
    body: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria.",
      "We will each try in good faith to resolve any dispute informally first. Write to us at privacy@readprospects.com. If we cannot resolve it within 30 days, the courts of the Federal Capital Territory, Abuja have exclusive jurisdiction, except that either party may seek injunctive relief in any competent court to protect intellectual property or confidential information.",
      "Nothing here deprives a consumer of protections available under the mandatory law of their country of residence.",
    ],
  },
  {
    id: "general",
    h: "19. General",
    body: [
      [
        "Changes. We may update these Terms. Material changes take effect 30 days after we notify you, or immediately if required by law or if they benefit you. Continuing to use the service after that means you accept them.",
        "Assignment. You may not assign these Terms without our consent. We may assign them to an affiliate or in connection with a merger or sale of assets.",
        "Severability. If a provision is unenforceable, the rest remains in force.",
        "No waiver. Failure to enforce a provision is not a waiver of it.",
        "Force majeure. Neither party is liable for failure caused by events beyond reasonable control.",
        "Entire agreement. These Terms and the Privacy Policy are the whole agreement between us regarding the service.",
        "Notices. We will contact you at your account email. You may contact us at privacy@readprospects.com or the registered address above.",
      ],
    ],
  },
  {
    id: "contact",
    h: "20. Contact",
    body: [
      "ReadProspects Technologies Nigeria (RC 9702396), 325 Enugu Road, FCDA, Bwari, Abuja, Nigeria.",
      "Email privacy@readprospects.com with any question about these Terms.",
    ],
  },
];

export default function TermsPage() {
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "0 32px" } as const;
  return (
    <div style={{ fontFamily: DM, letterSpacing: "-0.011em", color: INK, background: CANVAS, fontWeight: 400, minHeight: "100vh" }}>
      <style>{`.lg-a{color:${GREEN_TEXT};text-decoration:none}.lg-a:hover{text-decoration:underline}@media(max-width:640px){.lg-h1{font-size:34px!important}.lg-body{font-size:15px!important}}`}</style>
      <MarketingNav />

      <section style={{ background: GRADIENT, color: "#fff", padding: "148px 0 76px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(216,232,74,0.14)", border: "1px solid rgba(216,232,74,0.40)", color: LEMON, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 20, marginBottom: 22, textTransform: "uppercase" }}>Governed by the laws of Nigeria</div>
          <h1 className="lg-h1" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Terms of Service</h1>
          <p style={{ fontSize: 18, color: CLOUD, margin: "0 auto", maxWidth: 560, lineHeight: 1.55 }}>Clear terms, written in plain language, so you always know where you stand with ReadProspects.</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "18px 0 0" }}>Last updated: {UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "56px 0 40px" }}>
        <div style={wrap}>
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 26, marginBottom: 44, boxShadow: "0 8px 30px rgba(11,122,75,0.08)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: GREEN_TEXT, margin: "0 0 14px" }}>Summary</h2>
            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "You own your documents. We only host and process them to serve you.",
                "You are responsible for having a lawful basis to share a recipient with us.",
                "Verdicts are AI inferences. Never use them for employment, credit or similar decisions.",
                "Free and paid plans, billed in advance, cancel any time.",
                "These terms are governed by the laws of Nigeria.",
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 16, lineHeight: 1.5, color: BODY }}>{t}</li>
              ))}
            </ul>
          </div>

          {SECTIONS.map((sec) => (
            <div key={sec.id} id={sec.id} style={{ marginBottom: 38, scrollMarginTop: 90 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: "0 0 12px" }}>{sec.h}</h2>
              {sec.body.map((b, i) =>
                Array.isArray(b) ? (
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
            <a href="https://www.linkedin.com/company/backread/" target="_blank" rel="noopener noreferrer" aria-label="ReadProspects on LinkedIn" style={{ color: MUTE, display: "flex", alignItems: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18.5h2.67V9.5zM7 5.9a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zM18.34 18.5v-4.94c0-2.64-1.41-3.87-3.29-3.87-1.52 0-2.2.84-2.58 1.43V9.5h-2.67V18.5h2.67v-4.77c0-1.26.24-2.48 1.8-2.48 1.54 0 1.56 1.44 1.56 2.56v4.69h2.78z"/></svg></a>
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



