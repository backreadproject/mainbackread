import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const metadata = {
  title: { absolute: "Referral programme terms \u2014 ReadProspects" },
  robots: { index: false, follow: false },
};
// The referral programme terms.
//
// This is the document that lets a payout be refused. Every clause here is a
// thing that would otherwise be argued about with someone who believes they are
// owed money, so it is written plainly rather than defensively: a referrer
// should be able to read it once and know exactly where they stand.
//
// Not reviewed by a lawyer. It creates a payment obligation to people in
// jurisdictions we know nothing about, and belongs in the same review as the
// privacy policy and the Terms of Use.
const ENTITY = "ReadProspects Technologies Nigeria";
const RC = "RC 9702396";
const ADDRESS = "325 Enugu Road, FCDA, Bwari, Abuja, Nigeria";
const CONTACT = "support@readprospects.com";
const MIN_PAYOUT = "USD 100";
const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "1. What you earn",
    p: [
      "You earn 25% of the amount a referral actually pays us, not 25% of our list price. Where a discount applied to their payment, the commission is calculated on the amount they were actually charged.",
      "On a monthly plan you earn on their first three monthly payments. On an annual plan you earn once, on that single payment.",
      "Commission is earned only when a payment succeeds. Nothing is earned in advance, and nothing is owed for a payment that does not happen.",
    ],
  },
  {
    h: "2. What your referrals get",
    p: [
      "Anyone who signs up through your link gets 10% off their first monthly payment. The discount applies to monthly plans only, and to the first payment only: every payment after that is at the standard price. Annual plans are not discounted.",
      "The Free plan carries no discount and earns no commission.",
    ],
  },
  {
    h: "3. Attribution",
    p: [
      "A signup is attributed to the first referral link it arrived through. That attribution is permanent and cannot be transferred, including by us.",
      "If someone visits through your link and signs up later, you are still credited, provided they sign up within 60 days on the same browser.",
      "If a referral cancels their subscription, your commission on that referral ends permanently. If they subscribe again afterwards, no further commission is earned, because at that point they returned on their own rather than through your referral.",
    ],
  },
  {
    h: "4. When you can be paid",
    p: [
      "Commission is held for 30 days from the payment it was earned on. This is not a delay for our benefit: it is the window in which a card payment can be reversed, and paying before it closes would mean paying out money we may have to return.",
      "After 30 days the commission becomes available to withdraw.",
      "You can request a payout once your available balance reaches " + MIN_PAYOUT + ". Below that, payout fees consume too much of the amount to be worth sending.",
      "We may review a first payout before it is released. This is routine and applies to everyone.",
    ],
  },
  {
    h: "5. When commission is reversed",
    p: [
      "If a payment is refunded, charged back, or found to have been made with a stolen or unauthorised payment method, the commission earned on it is reversed. This applies whether or not it has already become available.",
      "If commission has already been paid out and is later reversed, the amount is deducted from your future earnings. If there are no future earnings, we may ask you to return it.",
    ],
  },
  {
    h: "6. What is not allowed",
    p: [
      "Referring yourself. You may hold both a referrer account and a ReadProspects account on the same email address, and you are welcome to subscribe as a customer. You may not earn commission on your own subscription, or on one you control.",
      "Paid search on our name. You may not bid on \u201cReadProspects\u201d, our product names, or close variants of either, in any advertising platform. Customers searching for us by name are already ours, and claiming commission on them is not a referral.",
      "Unsolicited messaging. No spam, no purchased lists, no automated outreach that would not be lawful for us to send ourselves.",
      "Misrepresentation. Do not claim to be ReadProspects, to be employed by us, or to be authorised to speak for us. Do not promise pricing, features, or terms we do not offer.",
      "Coupon, cashback, or discount-aggregator listings, unless we have agreed in writing.",
    ],
  },
  {
    h: "7. Withholding and termination",
    p: [
      "We may withhold a payout, reverse commission, or close a referrer account where there is reasonable evidence of manipulation, of any conduct in section 6, or of activity that would expose us to fraud losses.",
      "Where we withhold a payout we will tell you why. If you disagree, write to us and a person will look at it.",
      "You can close your referrer account at any time. Commission already earned and past its hold period will still be paid.",
    ],
  },
  {
    h: "8. Tax",
    p: [
      "You are responsible for any tax due on what you earn, in whichever country you are resident. We do not withhold tax and we do not advise on it.",
      "We may ask you for information required to make a payment lawfully, including identity or tax details. We cannot pay you without it.",
    ],
  },
  {
    h: "9. Payments",
    p: [
      "Payouts are sent to the destination you give us, in the currency on your account. You are responsible for the accuracy of those details; we cannot recover a payment sent to details you supplied incorrectly.",
      "Where currency conversion is needed, the rate applied is the one our payment provider gives at the time of the transfer.",
    ],
  },
  {
    h: "10. Changes",
    p: [
      "We may change these terms. Commission already earned is calculated under the terms in force when it was earned, not under the new ones.",
      "If a change reduces what you would earn on future referrals, we will tell you before it takes effect.",
    ],
  },
];
export default function ReferralTerms() {
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard } as const;
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: T.heading }}>ReadProspects</span>
          <span style={{ fontSize: 13, color: T.muted, marginLeft: 4 }}>Referrals</span>
          <a href="/referrals" style={{ marginLeft: "auto", fontSize: 13, color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Back to console</a>
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "34px 20px 100px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0 }}>Referral programme terms</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "8px 0 0", lineHeight: 1.6 }}>
          {ENTITY} ({RC}), {ADDRESS}. Questions and disputes: {CONTACT}
        </p>
        <div style={{ ...card, padding: "16px 18px", margin: "22px 0 0" }}>
          <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, margin: 0 }}>
            The short version: you earn a quarter of what your referrals pay for their first three months, the money is
            held for 30 days in case a payment is reversed, and you can withdraw once you have {MIN_PAYOUT}. The rest of
            this page is the detail behind those three sentences.
          </p>
        </div>
        {SECTIONS.map((s) => (
          <section key={s.h} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 8px" }}>{s.h}</h2>
            {s.p.map((line, i) => (
              <p key={i} style={{ fontSize: 13.5, color: T.body, lineHeight: 1.65, margin: i ? "10px 0 0" : 0 }}>{line}</p>
            ))}
          </section>
        ))}
        <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.6, margin: "34px 0 0", paddingTop: 18, borderTop: "1px solid " + T.border }}>
          These terms govern the referral programme only. Use of ReadProspects itself is governed by our{" "}
          <a href="https://readprospects.com/terms" style={{ color: T.muted }}>Terms of Use</a> and{" "}
          <a href="https://readprospects.com/privacy" style={{ color: T.muted }}>Privacy Policy</a>.
        </p>
      </main>
    </div>
  );
}