import { cookies } from "next/headers";
import MarketingNav from "../MarketingNav";

// Locale-aware. Reads the same "locale" cookie the MarketingNav toggle writes, so
// FR/EN switching works here like the rest of the marketing site. All copy for both
// languages lives in COPY below. Prices are placeholders you can edit freely.
const NIGHT = "#082019";
const GREEN = "#0B7A4B";
const BRAND = "#1FA971";
const INK = "#0F1729";
const BODY = "#475467";
const MUTE = "#8A9299";
const BORDER = "#EAECEF";
const SOFT = "#E7F6EF";

type Tier = {
  id: string; name: string; price: string; period: string; audience: string;
  tagline: string; cta: string; href: string; popular?: boolean; includes?: string; features: string[];
};
type Copy = {
  eyebrow: string; h1: string; sub: string;
  tiers: Tier[];
  baseline: string;
  faqHeading: string; faqSub: string; faq: { q: string; a: string }[];
  closeH: string; closeSub: string; closeCta: string;
  footer: { home: string; pricing: string; privacy: string; terms: string; tag: string };
};

const COPY: Record<"en" | "fr", Copy> = {
  en: {
    eyebrow: "Pricing",
    h1: "Stop guessing where your deals stand.",
    sub: "A read receipt says they opened it. ReadProspects tells you what they wanted, where they hesitated, and whether they are ready to move. Pick the plan that keeps you ahead of the room.",
    tiers: [
      { id: "free", name: "Free", price: "$0", period: "to try it", audience: "For a first look", tagline: "A taste of the real thing. Not enough to run on.", cta: "Start free", href: "/login",
        features: ["2 documents a month", "2 verdicts per document a month", "1 recipient per document, 5 sends a month", "Ask-the-document companion", "Reader tracking: opens, dwell, timeline"] },
      { id: "personal", name: "Personal", price: "$20", period: "per month", audience: "Founders, freelancers, solo sellers", tagline: "Everything, for one person who closes.", cta: "Choose Personal", href: "/login", popular: true, includes: "Everything in Free, plus",
        features: ["Unlimited documents, verdicts, recipients and sends", "Projects to group your documents", "Send by email with a personal note", "Saved reader conversations and verdict history", "Compose workspace to act on a read", "Link customization: branding, expiry, password, preview", "Weekly activity digest and data export"] },
      { id: "team", name: "Team", price: "$59", period: "per month", audience: "Sales and deal teams", tagline: "Your whole team, reading together.", cta: "Start 7-day trial", href: "/login", includes: "Everything in Personal, plus",
        features: ["Run an organization with roles", "Up to 20 seats", "Shared workspace and access grants", "Team activity feed", "Compare readers across a document", "Account-level analytics"] },
      { id: "business", name: "Business", price: "$99", period: "per month", audience: "Companies that need control", tagline: "Unlimited seats, fully locked down.", cta: "Start 7-day trial", href: "/login", includes: "Everything in Team, plus",
        features: ["Unlimited seats", "Granular, custom permissions", "Audit log and custom data retention", "A/B document versions", "Slack and webhook alerts", "Zapier and Make integration"] },
    ],
    baseline: "Every plan runs on a private reader domain, works on mobile, speaks English and French, and never puts a watermark on your document.",
    faqHeading: "Before you decide",
    faqSub: "The honest answers, so the choice is easy.",
    faq: [
      { q: "How is this different from analytics tools I already have?", a: "Those count opens and clicks. ReadProspects reads the reader: it turns raw behaviour into a call on where the deal actually stands." },
      { q: "Is it worth paying for?", a: "One deal you almost let go cold, saved because you knew the exact moment to follow up, pays for a year. The real question is how many reads you have already missed." },
      { q: "Can I try the team features before paying?", a: "Yes. Team and Business both start with a 7-day free trial, no card to begin." },
      { q: "Can I switch plans later?", a: "Any time, in a click, with everything intact. Move up for seats and control, and your documents and history come with you." },
      { q: "Will my reader feel watched?", a: "They open a clean document on a neutral domain, with no ReadProspects branding anywhere. What they do stays yours alone. They get the document, you get the read." },
      { q: "Does my reader need an account or an app?", a: "No. They click a link and read. Nothing to install, nothing to sign up for." },
      { q: "Is there a watermark on my document?", a: "Never, on any plan. Your document goes out as your document." },
      { q: "Can my team see the same reads?", a: "On Team and Business, yes. Shared workspace, roles, and a team activity feed, so the whole deal team sees what the document saw." },
      { q: "What happens when I hit a Free limit?", a: "The action pauses and points you to the plan that lifts it. Nothing you have already sent or captured is touched." },
    ],
    closeH: "Your readers are telling you everything.",
    closeSub: "Read receipts were never enough. Start free, then pick the plan that keeps you a step ahead.",
    closeCta: "Start free",
    footer: { home: "Home", pricing: "Pricing", privacy: "Privacy", terms: "Terms", tag: "The document reads the reader." },
  },
  fr: {
    eyebrow: "Tarifs",
    h1: "Ne devinez plus o\u00f9 en sont vos affaires.",
    sub: "Un accus\u00e9 de lecture indique qu'ils ont ouvert le document. ReadProspects vous dit ce qu'ils cherchaient, o\u00f9 ils ont h\u00e9sit\u00e9, et s'ils sont pr\u00eats \u00e0 avancer. Choisissez le forfait qui vous garde une longueur d'avance.",
    tiers: [
      { id: "free", name: "Gratuit", price: "0 $", period: "pour essayer", audience: "Pour un premier aper\u00e7u", tagline: "Un aper\u00e7u du produit r\u00e9el. Pas assez pour travailler.", cta: "Commencer gratuitement", href: "/login",
        features: ["2 documents par mois", "2 verdicts par document par mois", "1 destinataire par document, 5 envois par mois", "Compagnon Interroger le document", "Suivi du lecteur : ouvertures, temps de lecture, chronologie"] },
      { id: "personal", name: "Personnel", price: "20 $", period: "par mois", audience: "Fondateurs, ind\u00e9pendants, vendeurs solo", tagline: "Tout, pour une personne qui conclut.", cta: "Choisir Personnel", href: "/login", popular: true, includes: "Tout ce qu'il y a dans Gratuit, plus",
        features: ["Documents, verdicts, destinataires et envois illimit\u00e9s", "Projets pour regrouper vos documents", "Envoi par courriel avec une note personnelle", "Conversations de lecteur enregistr\u00e9es et historique des verdicts", "Espace de r\u00e9daction pour agir sur une lecture", "Personnalisation des liens : marque, expiration, mot de passe, aper\u00e7u", "R\u00e9sum\u00e9 hebdomadaire d'activit\u00e9 et export des donn\u00e9es"] },
      { id: "team", name: "\u00c9quipe", price: "59 $", period: "par mois", audience: "\u00c9quipes de vente", tagline: "Toute votre \u00e9quipe, qui lit ensemble.", cta: "Essai gratuit de 7 jours", href: "/login", includes: "Tout ce qu'il y a dans Personnel, plus",
        features: ["Une organisation avec des r\u00f4les", "Jusqu'\u00e0 20 si\u00e8ges", "Espace partag\u00e9 et acc\u00e8s accord\u00e9s", "Fil d'activit\u00e9 de l'\u00e9quipe", "Comparer les lecteurs d'un m\u00eame document", "Analyses au niveau du compte"] },
      { id: "business", name: "Entreprise", price: "99 $", period: "par mois", audience: "Entreprises qui exigent le contr\u00f4le", tagline: "Si\u00e8ges illimit\u00e9s, parfaitement verrouill\u00e9.", cta: "Essai gratuit de 7 jours", href: "/login", includes: "Tout ce qu'il y a dans \u00c9quipe, plus",
        features: ["Si\u00e8ges illimit\u00e9s", "Permissions personnalis\u00e9es et granulaires", "Journal d'audit et r\u00e9tention des donn\u00e9es personnalis\u00e9e", "Versions A/B des documents", "Alertes Slack et webhooks", "Int\u00e9gration Zapier et Make"] },
    ],
    baseline: "Chaque forfait fonctionne sur un domaine de lecture priv\u00e9, s'adapte au mobile, parle fran\u00e7ais et anglais, et n'appose jamais de filigrane sur votre document.",
    faqHeading: "Avant de d\u00e9cider",
    faqSub: "Des r\u00e9ponses franches, pour que le choix soit simple.",
    faq: [
      { q: "En quoi est-ce diff\u00e9rent des outils d'analyse que j'ai d\u00e9j\u00e0 ?", a: "Ceux-l\u00e0 comptent les ouvertures et les clics. ReadProspects lit le lecteur : il transforme le comportement brut en un verdict sur l'\u00e9tat r\u00e9el de l'affaire." },
      { q: "Est-ce que \u00e7a vaut la peine de payer ?", a: "Une seule affaire que vous avez failli laisser refroidir, sauv\u00e9e parce que vous saviez le moment exact pour relancer, paie une ann\u00e9e enti\u00e8re. La vraie question, c'est combien de lectures vous avez d\u00e9j\u00e0 manqu\u00e9es." },
      { q: "Puis-je essayer les fonctions d'\u00e9quipe avant de payer ?", a: "Oui. \u00c9quipe et Entreprise commencent par un essai gratuit de 7 jours, sans carte pour d\u00e9buter." },
      { q: "Puis-je changer de forfait plus tard ?", a: "\u00c0 tout moment, en un clic, sans rien perdre. Montez en gamme pour les si\u00e8ges et le contr\u00f4le, et vos documents et votre historique vous suivent." },
      { q: "Mon lecteur se sentira-t-il surveill\u00e9 ?", a: "Il ouvre un document \u00e9pur\u00e9 sur un domaine neutre, sans aucune marque ReadProspects. Ce qu'il fait reste \u00e0 vous seul. Il re\u00e7oit le document, vous recevez la lecture." },
      { q: "Mon lecteur a-t-il besoin d'un compte ou d'une application ?", a: "Non. Il clique sur un lien et lit. Rien \u00e0 installer, aucune inscription." },
      { q: "Y a-t-il un filigrane sur mon document ?", a: "Jamais, quel que soit le forfait. Votre document part tel qu'il est, le v\u00f4tre." },
      { q: "Mon \u00e9quipe peut-elle voir les m\u00eames lectures ?", a: "Sur \u00c9quipe et Entreprise, oui. Espace partag\u00e9, r\u00f4les et fil d'activit\u00e9, pour que toute l'\u00e9quipe voie ce que le document a vu." },
      { q: "Que se passe-t-il quand j'atteins une limite du forfait Gratuit ?", a: "L'action se met en pause et vous oriente vers le forfait qui l\u00e8ve la limite. Rien de ce que vous avez d\u00e9j\u00e0 envoy\u00e9 ou captur\u00e9 n'est touch\u00e9." },
    ],
    closeH: "Vos lecteurs vous disent tout.",
    closeSub: "Les accus\u00e9s de lecture n'ont jamais suffi. Commencez gratuitement, puis choisissez le forfait qui vous garde une longueur d'avance.",
    closeCta: "Commencer gratuitement",
    footer: { home: "Accueil", pricing: "Tarifs", privacy: "Confidentialit\u00e9", terms: "Conditions", tag: "Le document lit le lecteur." },
  },
};

export default async function PricingPage() {
  const jar = await cookies();
  const locale = jar.get("locale")?.value === "fr" ? "fr" : "en";
  const c = COPY[locale];

  return (
    <div style={{ background: "#F7FBF9", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: INK, letterSpacing: "-0.005em" }}>
      <style>{`
        .price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
        @media (max-width: 1000px) { .price-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .price-grid { grid-template-columns: 1fr; } }
        .tier-cta { transition: background .15s, transform .05s; }
        .tier-cta:active { transform: translateY(1px); }
        .hero-cta { transition: transform .05s, background .15s; }
        .hero-cta:active { transform: translateY(1px); }
        .faq-list { border-bottom: 1px solid ${BORDER}; }
        .faq-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 44px; padding: 30px 6px; border-top: 1px solid ${BORDER}; }
        @media (max-width: 680px) { .faq-row { grid-template-columns: 1fr; gap: 10px; padding: 24px 4px; } }
      `}</style>

      <MarketingNav />

      <section style={{ background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, color: "#fff", padding: "108px 20px 140px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 20 }}>{c.eyebrow}</div>
          <h1 style={{ fontSize: 46, lineHeight: 1.08, fontWeight: 700, margin: "0 0 24px", letterSpacing: "-0.02em" }}>{c.h1}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", margin: "0 auto", maxWidth: 660 }}>{c.sub}</p>
        </div>
      </section>

      <section id="plans" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px", transform: "translateY(-58px)", scrollMarginTop: 80 }}>
        <div className="price-grid">
          {c.tiers.map((t) => (
            <div key={t.id} style={{
              background: "#fff", border: t.popular ? `2px solid ${GREEN}` : `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 24px",
              display: "flex", flexDirection: "column", boxShadow: t.popular ? "0 24px 60px rgba(11,122,75,0.18)" : "0 14px 44px rgba(15,23,41,0.06)", position: "relative", marginTop: t.popular ? -10 : 0,
            }}>
              {t.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 13px", borderRadius: 20, whiteSpace: "nowrap" }}>{locale === "fr" ? "Le plus populaire" : "Most popular"}</span>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{t.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: BRAND, margin: "7px 0 11px" }}>{t.audience}</div>
              <div style={{ fontSize: 13, color: BODY, marginBottom: 18, minHeight: 38, lineHeight: 1.45 }}>{t.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>{t.price}</span>
                <span style={{ fontSize: 13, color: MUTE }}>{t.period}</span>
              </div>
              <a href={t.href} className="tier-cta" style={{
                display: "block", textAlign: "center", textDecoration: "none", background: t.popular ? GREEN : "#fff", color: t.popular ? "#fff" : INK,
                border: t.popular ? `1px solid ${GREEN}` : `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 600, margin: "18px 0 22px",
              }}>{t.cta}</a>
              {t.includes && <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 12 }}>{t.includes}</div>}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {t.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: 9, fontSize: 14, color: BODY, lineHeight: 1.45 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6L9 17l-5-5" /></svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 20px" }}>
        <div style={{ background: SOFT, border: "1px solid #CDEBD8", borderRadius: 14, padding: "16px 20px", textAlign: "center", fontSize: 14, color: "#1B4332", lineHeight: 1.6 }}>{c.baseline}</div>
      </section>

      <section style={{ maxWidth: 940, margin: "0 auto", padding: "80px 20px 24px" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{c.faqHeading}</h2>
        <p style={{ fontSize: 15, color: BODY, textAlign: "center", margin: "0 0 40px" }}>{c.faqSub}</p>
        <div className="faq-list">
          {c.faq.map((f, i) => (
            <div key={i} className="faq-row">
              <div style={{ fontSize: 18, fontWeight: 700, color: INK, lineHeight: 1.35 }}>{f.q}</div>
              <div style={{ fontSize: 16, color: BODY, lineHeight: 1.7 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "64px 20px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", background: `linear-gradient(160deg, ${NIGHT}, #0a2b20)`, borderRadius: 20, padding: "52px 30px", color: "#fff" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em" }}>{c.closeH}</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", margin: "0 0 28px", lineHeight: 1.65 }}>{c.closeSub}</p>
          <a href="/login" className="hero-cta" style={{ display: "inline-block", background: BRAND, color: NIGHT, textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 11 }}>{c.closeCta}</a>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "28px 20px", textAlign: "center", color: MUTE, fontSize: 13 }}>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <a href="/" style={{ color: BODY, textDecoration: "none" }}>{c.footer.home}</a>
          <a href="/pricing" style={{ color: BODY, textDecoration: "none" }}>{c.footer.pricing}</a>
          <a href="/privacy" style={{ color: BODY, textDecoration: "none" }}>{c.footer.privacy}</a>
          <a href="/terms" style={{ color: BODY, textDecoration: "none" }}>{c.footer.terms}</a>
        </div>
        <div>{c.footer.tag}</div>
      </footer>
    </div>
  );
}


