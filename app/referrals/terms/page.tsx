import { T } from "@/lib/theme";
import { getLocale } from "@/lib/locale-server";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
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
//
// BILINGUAL, English governing. Referrers are recruited from wherever they are,
// so a French speaker should be able to read the terms of a programme that owes
// them money. The French carries a line saying the English governs -- and note
// that translating an unreviewed document does not review it: BOTH versions need
// the same qualified look.
const ENTITY = "ReadProspects Technologies Nigeria";
const RC = "RC 9702396";
const ADDRESS = "325 Enugu Road, FCDA, Bwari, Abuja, Nigeria";
const CONTACT = "support@readprospects.com";
const MIN_PAYOUT = "USD 100";
type Sec = { h: string; p: string[] };
const SECTIONS: Sec[] = [
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
const SECTIONS_FR: Sec[] = [
  {
    h: "1. Ce que vous gagnez",
    p: [
      "Vous gagnez 25 % du montant qu\u2019un filleul nous paie r\u00e9ellement, et non 25 % de notre prix affich\u00e9. Lorsqu\u2019une remise s\u2019est appliqu\u00e9e \u00e0 son paiement, la commission est calcul\u00e9e sur le montant effectivement d\u00e9bit\u00e9.",
      "Sur un forfait mensuel, vous gagnez sur ses trois premiers paiements mensuels. Sur un forfait annuel, vous gagnez une seule fois, sur ce paiement unique.",
      "La commission n\u2019est acquise que lorsqu\u2019un paiement aboutit. Rien n\u2019est acquis \u00e0 l\u2019avance, et rien n\u2019est d\u00fb pour un paiement qui n\u2019a pas lieu.",
    ],
  },
  {
    h: "2. Ce que re\u00e7oivent vos filleuls",
    p: [
      "Toute personne qui s\u2019inscrit via votre lien re\u00e7oit 10 % de r\u00e9duction sur son premier paiement mensuel. La remise s\u2019applique aux forfaits mensuels uniquement, et au premier paiement uniquement : tous les paiements suivants sont au prix standard. Les forfaits annuels ne sont pas remis\u00e9s.",
      "Le forfait Gratuit ne comporte aucune remise et ne g\u00e9n\u00e8re aucune commission.",
    ],
  },
  {
    h: "3. Attribution",
    p: [
      "Une inscription est attribu\u00e9e au premier lien de parrainage par lequel elle est arriv\u00e9e. Cette attribution est d\u00e9finitive et ne peut \u00eatre transf\u00e9r\u00e9e, y compris par nous.",
      "Si une personne arrive par votre lien et s\u2019inscrit plus tard, vous \u00eates tout de m\u00eame cr\u00e9dit\u00e9, \u00e0 condition qu\u2019elle s\u2019inscrive dans les 60 jours depuis le m\u00eame navigateur.",
      "Si un filleul r\u00e9silie son abonnement, votre commission sur ce filleul prend fin d\u00e9finitivement. S\u2019il se r\u00e9abonne ensuite, aucune commission suppl\u00e9mentaire n\u2019est acquise, car il est alors revenu de lui-m\u00eame et non par votre parrainage.",
    ],
  },
  {
    h: "4. Quand vous pouvez \u00eatre pay\u00e9",
    p: [
      "La commission est retenue 30 jours \u00e0 compter du paiement qui l\u2019a g\u00e9n\u00e9r\u00e9e. Ce n\u2019est pas un d\u00e9lai \u00e0 notre avantage : c\u2019est la p\u00e9riode pendant laquelle un paiement par carte peut \u00eatre annul\u00e9, et payer avant sa cl\u00f4ture reviendrait \u00e0 verser de l\u2019argent que nous pourrions devoir rembourser.",
      "Apr\u00e8s 30 jours, la commission devient disponible au retrait.",
      "Vous pouvez demander un versement d\u00e8s que votre solde disponible atteint " + MIN_PAYOUT + ". En de\u00e7\u00e0, les frais de transfert absorbent une part trop importante du montant.",
      "Nous pouvons examiner un premier versement avant de le lib\u00e9rer. C\u2019est une proc\u00e9dure de routine qui s\u2019applique \u00e0 tout le monde.",
    ],
  },
  {
    h: "5. Quand la commission est annul\u00e9e",
    p: [
      "Si un paiement est rembours\u00e9, contest\u00e9, ou s\u2019av\u00e8re avoir \u00e9t\u00e9 effectu\u00e9 avec un moyen de paiement vol\u00e9 ou non autoris\u00e9, la commission acquise dessus est annul\u00e9e. Cela s\u2019applique qu\u2019elle soit d\u00e9j\u00e0 devenue disponible ou non.",
      "Si une commission a d\u00e9j\u00e0 \u00e9t\u00e9 vers\u00e9e puis est annul\u00e9e, le montant est d\u00e9duit de vos gains futurs. En l\u2019absence de gains futurs, nous pouvons vous demander de le restituer.",
    ],
  },
  {
    h: "6. Ce qui n\u2019est pas autoris\u00e9",
    p: [
      "Vous parrainer vous-m\u00eame. Vous pouvez d\u00e9tenir \u00e0 la fois un compte de parrain et un compte ReadProspects sur la m\u00eame adresse e-mail, et vous \u00eates libre de souscrire en tant que client. Vous ne pouvez pas percevoir de commission sur votre propre abonnement, ni sur un abonnement que vous contr\u00f4lez.",
      "La publicit\u00e9 payante sur notre nom. Vous ne pouvez ench\u00e9rir sur \u00ab ReadProspects \u00bb, sur nos noms de produits, ni sur leurs variantes proches, sur aucune plateforme publicitaire. Les clients qui nous cherchent par notre nom sont d\u00e9j\u00e0 les n\u00f4tres, et r\u00e9clamer une commission sur eux n\u2019est pas un parrainage.",
      "Les messages non sollicit\u00e9s. Pas de spam, pas de listes achet\u00e9es, pas de d\u00e9marchage automatis\u00e9 qu\u2019il ne nous serait pas l\u00e9gal d\u2019envoyer nous-m\u00eames.",
      "La fausse repr\u00e9sentation. Ne pr\u00e9tendez pas \u00eatre ReadProspects, \u00eatre employ\u00e9 par nous, ou \u00eatre autoris\u00e9 \u00e0 parler en notre nom. Ne promettez pas de tarifs, de fonctionnalit\u00e9s ou de conditions que nous n\u2019offrons pas.",
      "Les sites de coupons, de cashback ou d\u2019agr\u00e9gation de r\u00e9ductions, sauf accord \u00e9crit de notre part.",
    ],
  },
  {
    h: "7. Retenue et r\u00e9siliation",
    p: [
      "Nous pouvons retenir un versement, annuler une commission ou fermer un compte de parrain en pr\u00e9sence d\u2019\u00e9l\u00e9ments raisonnables de manipulation, de tout comportement vis\u00e9 \u00e0 la section 6, ou d\u2019une activit\u00e9 nous exposant \u00e0 des pertes pour fraude.",
      "Lorsque nous retenons un versement, nous vous en indiquons la raison. Si vous n\u2019\u00eates pas d\u2019accord, \u00e9crivez-nous et une personne l\u2019examinera.",
      "Vous pouvez fermer votre compte de parrain \u00e0 tout moment. Les commissions d\u00e9j\u00e0 acquises et sorties de leur p\u00e9riode de retenue seront tout de m\u00eame vers\u00e9es.",
    ],
  },
  {
    h: "8. Fiscalit\u00e9",
    p: [
      "Vous \u00eates responsable de tout imp\u00f4t d\u00fb sur ce que vous gagnez, dans le pays o\u00f9 vous r\u00e9sidez. Nous ne pr\u00e9levons pas d\u2019imp\u00f4t \u00e0 la source et nous ne donnons pas de conseil fiscal.",
      "Nous pouvons vous demander les informations n\u00e9cessaires pour effectuer un paiement de mani\u00e8re l\u00e9gale, y compris des \u00e9l\u00e9ments d\u2019identit\u00e9 ou fiscaux. Nous ne pouvons pas vous payer sans elles.",
    ],
  },
  {
    h: "9. Paiements",
    p: [
      "Les versements sont envoy\u00e9s vers la destination que vous nous indiquez, dans la devise de votre compte. Vous \u00eates responsable de l\u2019exactitude de ces coordonn\u00e9es ; nous ne pouvons pas r\u00e9cup\u00e9rer un paiement envoy\u00e9 vers des coordonn\u00e9es que vous avez mal renseign\u00e9es.",
      "Lorsqu\u2019une conversion de devise est n\u00e9cessaire, le taux appliqu\u00e9 est celui que notre prestataire de paiement pratique au moment du transfert.",
    ],
  },
  {
    h: "10. Modifications",
    p: [
      "Nous pouvons modifier ces conditions. Les commissions d\u00e9j\u00e0 acquises sont calcul\u00e9es selon les conditions en vigueur au moment o\u00f9 elles ont \u00e9t\u00e9 acquises, et non selon les nouvelles.",
      "Si une modification r\u00e9duit ce que vous gagneriez sur de futurs parrainages, nous vous en informerons avant son entr\u00e9e en vigueur.",
    ],
  },
];
const COPY = {
  en: {
    referrals: "Referrals", back: "Back to console",
    h1: "Referral programme terms",
    contactLine: "Questions and disputes:",
    short: "The short version: you earn a quarter of what your referrals pay for their first three months, the money is held for 30 days in case a payment is reversed, and you can withdraw once you have " + MIN_PAYOUT + ". The rest of this page is the detail behind those three sentences.",
    footerA: "These terms govern the referral programme only. Use of ReadProspects itself is governed by our",
    footerTerms: "Terms of Use", footerAnd: "and", footerPrivacy: "Privacy Policy",
    governing: "",
  },
  fr: {
    referrals: "Parrainage", back: "Retour \u00e0 la console",
    h1: "Conditions du programme de parrainage",
    contactLine: "Questions et litiges :",
    short: "En bref : vous gagnez un quart de ce que paient vos filleuls pendant leurs trois premiers mois, la somme est retenue 30 jours au cas o\u00f9 un paiement serait annul\u00e9, et vous pouvez retirer d\u00e8s que vous avez " + MIN_PAYOUT + ". Le reste de cette page est le d\u00e9tail derri\u00e8re ces trois phrases.",
    footerA: "Ces conditions r\u00e9gissent uniquement le programme de parrainage. L\u2019utilisation de ReadProspects est r\u00e9gie par nos",
    footerTerms: "Conditions d\u2019utilisation", footerAnd: "et notre", footerPrivacy: "Politique de confidentialit\u00e9",
    governing: "Cette traduction est fournie pour votre commodit\u00e9. En cas de divergence, la version anglaise fait foi.",
  },
};
export default async function ReferralTerms() {
  const locale = await getLocale();
  const c = COPY[locale];
  const sections = locale === "fr" ? SECTIONS_FR : SECTIONS;
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard } as const;
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: T.heading }}>ReadProspects</span>
          <span style={{ fontSize: 13, color: T.muted, marginLeft: 4 }}>{c.referrals}</span>
          <a href="/referrals" style={{ marginLeft: "auto", fontSize: 13, color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>{c.back}</a>
          <LanguageSwitcher current={locale} dark={false} />
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "34px 20px 100px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0 }}>{c.h1}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "8px 0 0", lineHeight: 1.6 }}>
          {ENTITY} ({RC}), {ADDRESS}. {c.contactLine} {CONTACT}
        </p>
        <div style={{ ...card, padding: "16px 18px", margin: "22px 0 0" }}>
          <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, margin: 0 }}>{c.short}</p>
        </div>
        {sections.map((s) => (
          <section key={s.h} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 8px" }}>{s.h}</h2>
            {s.p.map((line, i) => (
              <p key={i} style={{ fontSize: 13.5, color: T.body, lineHeight: 1.65, margin: i ? "10px 0 0" : 0 }}>{line}</p>
            ))}
          </section>
        ))}
        <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.6, margin: "34px 0 0", paddingTop: 18, borderTop: "1px solid " + T.border }}>
          {c.footerA}{" "}
          <a href="https://readprospects.com/terms" style={{ color: T.muted }}>{c.footerTerms}</a> {c.footerAnd}{" "}
          <a href="https://readprospects.com/privacy" style={{ color: T.muted }}>{c.footerPrivacy}</a>.
          {c.governing ? <><br /><br />{c.governing}</> : null}
        </p>
      </main>
    </div>
  );
}