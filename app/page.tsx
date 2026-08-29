import AppShot from "./AppShot";
import { MOCK_CSS, RecipientsShot, AskShot, DwellShot, VerdictShot, CompareShot } from "./MockShots";
import { cookies } from "next/headers";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import HomeJsonLd from "./HomeJsonLd";

export const metadata = {
  title: "Know how your proposal was actually read",
  description:
    "ReadProspects shows you which pages held your reader, what they asked the document, and who they forwarded it to. Then it tells you what to do about it.",
  alternates: { canonical: "https://readprospects.com" },
  openGraph: {
    title: "Know how your proposal was actually read",
    description: "Which pages held them, what they asked, who they forwarded it to, and what to do next.",
    url: "https://readprospects.com",
    siteName: "ReadProspects",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ReadProspects" }],
  },
};

// ReadProspects marketing landing. Dark skin. Bilingual via the locale cookie
// (same mechanism as the rest of the marketing site). All copy in COPY below.
// French accents are \uXXXX escapes so the file can never mojibake.
const LINKEDIN = "https://www.linkedin.com/company/readprospects";

type Plan = { name: string; price: string; per?: string; desc: string; hot?: boolean };
type Faq = { q: string; a: string };
type Copy = {
  nav: { why: string; how: string; platform: string; pricing: string; signin: string; start: string; startShort: string; openApp: string };
  hero: { eyebrow: string; t1: string; t2: string; sub: string; ctaOut: string; ctaLg: string; nocard: string };
  panel: { questions: string; verdict: string; ready: string; sig1: string; sig2: string; sig3: string;
           visits: string; time: string; q: string; intent: string };
  trusted: string;
  problem: { eyebrow: string; t1: string; t2: string; lead: string; cards: { h: string; p: string; s: string }[] };
  how: { eyebrow: string; t1: string; t2: string; lead: string; steps: { h: string; p: string }[] };
  platform: { eyebrow: string; t1: string; t2: string; lead: string; readers: string;
              cReader: string; cDoc: string; cReads: string; cDwell: string; cQ: string; cVerdict: string;
              vReady: string; vWarming: string; vGlance: string };
  caps: { eyebrow: string; title: string; lead: string;
          c1e: string; c1h: string; c1p: string; c1q1: string; c1a: string; c1q2: string; c1view: string;
          c2e: string; c2h: string; c2p: string; c2title: string; c2visits: string;
          c3e: string; c3h: string; c3p: string; c3read: string;
          c4e: string; c4h: string; c4p: string; c4visits: string; c4time: string; c4q: string; c4ready: string; c4glance: string };
  stats: { eyebrow: string; title: string; s1: string; s1b: string; s2: string; s2b: string; s3: string; s3b: string };
  pricing: { eyebrow: string; t1: string; t2: string; lead: string; plans: Plan[]; seeFull: string };
  faq: { eyebrow: string; title: string; items: Faq[] };
  cta: { title: string; sub: string; btn: string };
  footer: { pricing: string; privacy: string; terms: string; signin: string; tag: string };
};

const COPY: Record<Locale, Copy> = {
  en: {
    nav: { why: "Why ReadProspects", how: "How it works", platform: "Platform", pricing: "Pricing", signin: "Sign in", start: "Start here", startShort: "Start", openApp: "Open app" },
    hero: { eyebrow: "Document intelligence", t1: "Every reader leaves a trail.", t2: "Now you can follow it.",
      sub: "Monitor and understand how people move through the documents you send. Every open, every question, every hesitation, before your follow-up goes cold.",
      ctaOut: "See how it works", ctaLg: "Start 7-day trial", nocard: "Your document stays yours, no watermark" },
    panel: { questions: "Questions asked", verdict: "Verdict", ready: "Ready to move",
      sig1: "Reread the pricing three times", sig2: "Asked about the annual commit", sig3: "Forwarded to one colleague",
      visits: "Visits", time: "Time on doc", q: "Questions", intent: "Intent score" },
    trusted: "The document intelligence layer for teams who send to close",
    problem: { eyebrow: "The problem", t1: "The moment you hit send,", t2: "you are guessing.",
      lead: "A read receipt tells you a file was opened. It can't tell you what mattered, what stalled, or whether to follow up. So you chase on a hunch, or you wait and lose the moment.",
      cards: [
        { h: "Read receipts", p: "A green dot says it opened. It says nothing about who is serious.", s: "Opens are not answers" },
        { h: "Attention vs intent", p: "Clicks count eyeballs. They can't tell a skim from a deal-deciding read.", s: "Intent is what closes" },
        { h: "Timing", p: "By the time you act on a hunch, the reader has already moved on.", s: "The window is short" },
        { h: "Lost lessons", p: "Every send teaches what lands. Without capture, it evaporates.", s: "Nothing compounds" },
      ] },
    how: { eyebrow: "How ReadProspects works", t1: "From every signal", t2: "to one clear read.",
      lead: "Share a link and ReadProspects does the reading of the reader for you. No setup, no reader friction.",
      steps: [
        { h: "Share a link", p: "Upload a document and send a tracked link by email, or copy it yourself. Your reader clicks and reads. No account, no app." },
        { h: "Watch the read", p: "Every open, dwell time per page, the questions they ask the document, and exactly where they hesitate, in real time." },
        { h: "Get the verdict", p: "ReadProspects reads the trail and calls the deal: what they wanted, what they doubted, and whether they are ready to move." },
      ] },
    platform: { eyebrow: "The platform", t1: "Your readers,", t2: "at a glance.",
      lead: "Reads, questions, dwell, and a verdict on every recipient. Updated the moment they open the document.",
      readers: "Readers", cReader: "Reader", cDoc: "Document", cReads: "Reads", cDwell: "Dwell", cQ: "Questions", cVerdict: "Verdict",
      vReady: "Ready", vWarming: "Warming", vGlance: "Glance" },
    caps: { eyebrow: "Core capabilities", title: "Everything the document saw.", lead: "Four ways ReadProspects turns a quiet PDF into a read on the person holding it.",
      c1e: "Ask the document", c1h: "Readers ask. The document answers.", c1p: "Your reader asks in the margin and gets an answer from the document itself. You see every question, the clearest signal of intent there is.",
      c1q1: "Is the annual commit negotiable?", c1a: "The proposal lists a 12-month term at the quoted rate. For changes to commitment length, the sender is the right person to confirm.", c1q2: "What's included in onboarding?", c1view: "Reader view",
      c2e: "The reading trail", c2h: "Opens, dwell, and a page-by-page timeline.", c2p: "Follow how they actually moved: which page held them, which they skipped, when they came back for a second look.",
      c2title: "Dwell by page", c2visits: "two visits",
      c3e: "The verdict", c3h: "A read on the deal, not the document.", c3p: "ReadProspects reads the whole trail and calls it: what they wanted, where they hesitated, how ready they are. Plain language, not a dashboard to decode.",
      c3read: "Read Q3 Proposal.pdf twice",
      c4e: "Compare readers", c4h: "See who's serious, side by side.", c4p: "Put two readers of the same document next to each other and let the behaviour speak. One read once and left. One keeps coming back.",
      c4visits: "Visits", c4time: "Time on doc", c4q: "Questions", c4ready: "Ready to move", c4glance: "Just a glance" },
    stats: { eyebrow: "No friction", title: "Your reader does nothing but read.", s1: "No sign-up", s1b: "They click the link and the document opens. No account, no email gate.", s2: "No watermark", s2b: "Your document arrives looking like your document, on every plan.", s3: "One link", s3b: "Send it however you already send things. That is the whole setup." },
    pricing: { eyebrow: "Pricing", t1: "Start free.", t2: "Grow when it earns it.",
      lead: "Four plans, from a first look to a locked-down company workspace. No watermark on any of them, ever.",
      plans: [
        { name: "Free", price: "$0", desc: "A taste of the real thing." },
        { name: "Personal", price: "$20", per: "/mo", desc: "Everything, for one person who closes.", hot: true },
        { name: "Team", price: "$59", per: "/mo", desc: "Your whole team, reading together." },
        { name: "Business", price: "$99", per: "/mo", desc: "Unlimited seats, fully locked down." },
      ], seeFull: "See full pricing" },
    faq: { eyebrow: "Before you decide", title: "Common questions", items: [
      { q: "Is this just a read receipt?", a: "A receipt is a green dot. ReadProspects is a verdict: what they wanted, where they hesitated, and whether they are ready to move. Attention is cheap. Intent is what closes." },
      { q: "Will my reader feel watched?", a: "They open a clean document on a neutral domain, with no ReadProspects branding anywhere. What they do stays yours alone. They get the document, you get the read." },
      { q: "Does my reader need an account or an app?", a: "No. They click a link and read. Nothing to install, nothing to sign up for." },
      { q: "Is there a watermark on my document?", a: "Never, on any plan. Your document goes out as your document." },
    ] },
    cta: { title: "Your readers are telling you everything.", sub: "Read receipts were never enough. Start free, then pick the plan that keeps you a step ahead.", btn: "Start here" },
    footer: { pricing: "Pricing", privacy: "Privacy", terms: "Terms", signin: "Sign in", tag: "The document reads the reader." },
  },
  fr: {
    nav: { why: "Pourquoi ReadProspects", how: "Fonctionnement", platform: "Plateforme", pricing: "Tarifs", signin: "Connexion", start: "Commencer", startShort: "Commencer", openApp: "Ouvrir l'app" },
    hero: { eyebrow: "Intelligence documentaire", t1: "Chaque lecteur laisse une trace.", t2: "Suivez-la enfin.",
      sub: "Surveillez et comprenez comment vos lecteurs parcourent les documents que vous envoyez. Chaque ouverture, chaque question, chaque h\u00e9sitation, avant que votre relance ne refroidisse.",
      ctaOut: "Voir le fonctionnement", ctaLg: "Essai gratuit de 7 jours", nocard: "Votre document reste le v\u00f4tre, sans filigrane" },
    panel: { questions: "Questions pos\u00e9es", verdict: "Verdict", ready: "Pr\u00eat \u00e0 avancer",
      sig1: "A relu les tarifs trois fois", sig2: "A pos\u00e9 une question sur l'engagement annuel", sig3: "A transf\u00e9r\u00e9 \u00e0 un coll\u00e8gue",
      visits: "Visites", time: "Temps sur le doc", q: "Questions", intent: "Score d'intention" },
    trusted: "La couche d'intelligence documentaire pour les \u00e9quipes qui envoient pour conclure",
    problem: { eyebrow: "Le probl\u00e8me", t1: "D\u00e8s que vous cliquez sur envoyer,", t2: "vous devinez.",
      lead: "Un accus\u00e9 de lecture indique qu'un fichier a \u00e9t\u00e9 ouvert. Il ne dit pas ce qui a compt\u00e9, ce qui a bloqu\u00e9, ni s'il faut relancer. Alors vous relancez au jug\u00e9, ou vous attendez et perdez le moment.",
      cards: [
        { h: "Accus\u00e9s de lecture", p: "Un point vert dit que c'est ouvert. Il ne dit pas qui est s\u00e9rieux.", s: "Ouvrir n'est pas r\u00e9pondre" },
        { h: "Attention contre intention", p: "Les clics comptent les regards. Ils ne distinguent pas un survol d'une lecture d\u00e9cisive.", s: "L'intention conclut" },
        { h: "Le moment", p: "Le temps d'agir sur une intuition, le lecteur est d\u00e9j\u00e0 pass\u00e9 \u00e0 autre chose.", s: "La fen\u00eatre est courte" },
        { h: "Le\u00e7ons perdues", p: "Chaque envoi enseigne ce qui marche. Sans capture, cela s'\u00e9vapore.", s: "Rien ne se cumule" },
      ] },
    how: { eyebrow: "Comment fonctionne ReadProspects", t1: "De chaque signal", t2: "\u00e0 une lecture claire.",
      lead: "Partagez un lien et ReadProspects lit le lecteur pour vous. Aucune configuration, aucune friction pour le lecteur.",
      steps: [
        { h: "Partagez un lien", p: "T\u00e9l\u00e9versez un document et envoyez un lien suivi par courriel, ou copiez-le vous-m\u00eame. Votre lecteur clique et lit. Aucun compte, aucune application." },
        { h: "Observez la lecture", p: "Chaque ouverture, le temps pass\u00e9 par page, les questions pos\u00e9es au document, et exactement o\u00f9 ils h\u00e9sitent, en temps r\u00e9el." },
        { h: "Obtenez le verdict", p: "ReadProspects lit la trace et tranche : ce qu'ils voulaient, ce qui les faisait douter, et s'ils sont pr\u00eats \u00e0 avancer." },
      ] },
    platform: { eyebrow: "La plateforme", t1: "Vos lecteurs,", t2: "en un coup d'\u0153il.",
      lead: "Lectures, questions, temps de lecture et un verdict pour chaque destinataire. Mis \u00e0 jour d\u00e8s qu'ils ouvrent le document.",
      readers: "Lecteurs", cReader: "Lecteur", cDoc: "Document", cReads: "Lectures", cDwell: "Temps", cQ: "Questions", cVerdict: "Verdict",
      vReady: "Pr\u00eat", vWarming: "Ti\u00e8de", vGlance: "Survol" },
    caps: { eyebrow: "Capacit\u00e9s cl\u00e9s", title: "Tout ce que le document a vu.", lead: "Quatre fa\u00e7ons dont ReadProspects transforme un PDF silencieux en lecture de la personne qui le tient.",
      c1e: "Interroger le document", c1h: "Le lecteur demande. Le document r\u00e9pond.", c1p: "Votre lecteur pose une question dans la marge et re\u00e7oit une r\u00e9ponse tir\u00e9e du document lui-m\u00eame. Vous voyez chaque question, le signal d'intention le plus clair qui soit.",
      c1q1: "L'engagement annuel est-il n\u00e9gociable ?", c1a: "La proposition indique une dur\u00e9e de 12 mois au tarif indiqu\u00e9. Pour modifier la dur\u00e9e d'engagement, l'exp\u00e9diteur est la bonne personne \u00e0 confirmer.", c1q2: "Qu'est-ce qui est inclus dans l'int\u00e9gration ?", c1view: "Vue du lecteur",
      c2e: "La trace de lecture", c2h: "Ouvertures, temps et chronologie page par page.", c2p: "Suivez comment ils ont r\u00e9ellement progress\u00e9 : quelle page les a retenus, laquelle ils ont saut\u00e9e, quand ils sont revenus pour un second regard.",
      c2title: "Temps par page", c2visits: "deux visites",
      c3e: "Le verdict", c3h: "Une lecture de l'affaire, pas du document.", c3p: "ReadProspects lit toute la trace et tranche : ce qu'ils voulaient, o\u00f9 ils ont h\u00e9sit\u00e9, \u00e0 quel point ils sont pr\u00eats. En langage clair, pas un tableau de bord \u00e0 d\u00e9chiffrer.",
      c3read: "A lu Q3 Proposal.pdf deux fois",
      c4e: "Comparer les lecteurs", c4h: "Voyez qui est s\u00e9rieux, c\u00f4te \u00e0 c\u00f4te.", c4p: "Placez deux lecteurs d'un m\u00eame document c\u00f4te \u00e0 c\u00f4te et laissez le comportement parler. L'un a lu une fois et est parti. L'autre revient sans cesse.",
      c4visits: "Visites", c4time: "Temps sur le doc", c4q: "Questions", c4ready: "Pr\u00eat \u00e0 avancer", c4glance: "Un simple survol" },
    stats: { eyebrow: "Sans friction", title: "Votre lecteur n\u2019a rien \u00e0 faire, sauf lire.", s1: "Aucune inscription", s1b: "Il clique et le document s\u2019ouvre. Pas de compte, pas de mur d\u2019e-mail.", s2: "Aucun filigrane", s2b: "Votre document arrive tel quel, sur tous les forfaits.", s3: "Un seul lien", s3b: "Envoyez-le comme vous envoyez d\u00e9j\u00e0 tout le reste." },
    pricing: { eyebrow: "Tarifs", t1: "Commencez gratuitement.", t2: "\u00c9voluez quand \u00e7a le m\u00e9rite.",
      lead: "Quatre forfaits, d'un premier aper\u00e7u \u00e0 un espace d'entreprise verrouill\u00e9. Aucun filigrane, jamais.",
      plans: [
        { name: "Gratuit", price: "0 $", desc: "Un aper\u00e7u du produit r\u00e9el." },
        { name: "Personnel", price: "20 $", per: "/mois", desc: "Tout, pour une personne qui conclut.", hot: true },
        { name: "\u00c9quipe", price: "59 $", per: "/mois", desc: "Toute votre \u00e9quipe, qui lit ensemble." },
        { name: "Entreprise", price: "99 $", per: "/mois", desc: "Si\u00e8ges illimit\u00e9s, parfaitement verrouill\u00e9." },
      ], seeFull: "Voir tous les tarifs" },
    faq: { eyebrow: "Avant de d\u00e9cider", title: "Questions fr\u00e9quentes", items: [
      { q: "Est-ce juste un accus\u00e9 de lecture ?", a: "Un accus\u00e9 est un point vert. ReadProspects est un verdict : ce qu'ils voulaient, o\u00f9 ils ont h\u00e9sit\u00e9, et s'ils sont pr\u00eats \u00e0 avancer. L'attention est bon march\u00e9. L'intention conclut." },
      { q: "Mon lecteur se sentira-t-il surveill\u00e9 ?", a: "Il ouvre un document \u00e9pur\u00e9 sur un domaine neutre, sans aucune marque ReadProspects. Ce qu'il fait reste \u00e0 vous seul. Il re\u00e7oit le document, vous recevez la lecture." },
      { q: "Mon lecteur a-t-il besoin d'un compte ou d'une application ?", a: "Non. Il clique sur un lien et lit. Rien \u00e0 installer, aucune inscription." },
      { q: "Y a-t-il un filigrane sur mon document ?", a: "Jamais, quel que soit le forfait. Votre document part tel qu'il est, le v\u00f4tre." },
    ] },
    cta: { title: "Vos lecteurs vous disent tout.", sub: "Les accus\u00e9s de lecture n'ont jamais suffi. Commencez gratuitement, puis choisissez le forfait qui vous garde une longueur d'avance.", btn: "Commencer ici" },
    footer: { pricing: "Tarifs", privacy: "Confidentialit\u00e9", terms: "Conditions", signin: "Connexion", tag: "Le document lit le lecteur." },
  },
};

const READERS = [
  { n: "Dana Whitfield", d: "Q3 Proposal.pdf", r: "2", dw: "6m 40s", q: "3", v: "ready" },
  { n: "Marcus Cole", d: "Pricing.pdf", r: "1", dw: "1m 12s", q: "1", v: "warm" },
  { n: "Sam Rivera", d: "Q3 Proposal.pdf", r: "1", dw: "0m 22s", q: "0", v: "glance" },
  { n: "Aisha Bello", d: "SOW draft.pdf", r: "3", dw: "9m 05s", q: "2", v: "ready" },
  { n: "Elena Ross", d: "Q3 Proposal.pdf", r: "2", dw: "4m 30s", q: "1", v: "warm" },
];

const CSS = `
  .rp-page{min-height:100vh;background:#050F0A;color:#F2F7F4;font-family:var(--font-dm-sans),system-ui,sans-serif;letter-spacing:-0.011em}
  .rp-page *{box-sizing:border-box}
  .rp-page{overflow-x:hidden}
  .rp-page a{text-decoration:none}
  .rp-wrap{max-width:1160px;margin:0 auto;padding:0 28px}
  .rp-eyebrow{display:inline-block;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#33E6A2;padding:6px 12px;border:1px solid rgba(51,230,162,0.25);border-radius:20px;background:rgba(51,230,162,0.06)}
  .rp-h2{font-size:40px;line-height:1.08;font-weight:700;letter-spacing:-0.03em;color:#F2F7F4;margin:18px 0 0}
  .rp-h2 .g{color:#33E6A2}
  .rp-lead{font-size:17px;line-height:1.62;color:#93A79C;margin:16px 0 0;max-width:600px}
  .rp-sec{padding:96px 0;position:relative;overflow:hidden}
  .rp-center{text-align:center}.rp-center .rp-lead{margin-left:auto;margin-right:auto}
  .rp-card{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:16px}
  .rp-glow{display:none}
  .rp-heroglow{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
  .rp-btn{background:#D8E84A;color:#082019;font-weight:600;font-size:14px;padding:9px 18px;border-radius:8px;display:inline-block;white-space:nowrap;transition:background .15s}
  .rp-btn:hover{background:#CDDD3F}
  .rp-full{display:inline}.rp-short{display:none}
  .rp-btnlg{background:#1FA971;color:#04120C;font-weight:700;font-size:15px;padding:14px 26px;border-radius:12px;display:inline-block;box-shadow:0 8px 20px -8px rgba(0,0,0,0.5)}
  .rp-btnout{background:rgba(255,255,255,0.03);color:#F2F7F4;font-weight:600;font-size:15px;padding:14px 24px;border-radius:12px;border:1px solid rgba(255,255,255,0.09);display:inline-block}
  .rp-k{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5F7168}
  .rp-head{position:sticky;top:0;z-index:50;background:rgba(5,15,10,0.72);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.06)}
  .rp-nav{display:flex;align-items:center;justify-content:space-between;padding:15px 0}
  .rp-brand{display:flex;align-items:center;gap:9px;font-weight:700;font-size:19px}
  .rp-ring{width:19px;height:19px;border:2.4px solid #33E6A2;border-radius:50%;position:relative}
  .rp-ring::after{content:"";position:absolute;inset:5px;background:#33E6A2;border-radius:50%}
  .rp-links{display:flex;gap:28px;font-size:14px}.rp-links a{color:#93A79C}
  .rp-menu{display:none;position:relative}
  .rp-menu summary{list-style:none;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#93A79C}
  .rp-menu summary::-webkit-details-marker{display:none}
  .rp-menu[open] summary{color:#F2F7F4;border-color:rgba(255,255,255,0.24)}
  .rp-menupanel{position:absolute;right:0;top:42px;min-width:190px;background:#0A1710;border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:6px;z-index:60;box-shadow:0 18px 40px rgba(0,0,0,0.5)}
  .rp-menupanel a{display:block;padding:10px 12px;border-radius:8px;font-size:14px;color:#93A79C}
  .rp-menupanel a:hover{background:rgba(255,255,255,0.05);color:#F2F7F4}
  .rp-navr{display:flex;align-items:center;gap:16px;font-size:14px}.rp-navr a.sign{color:#93A79C}
  .rp-hero{position:relative;z-index:1;text-align:center;padding:76px 0 40px;overflow:hidden}
  .rp-h1{font-size:60px;line-height:1.03;font-weight:700;letter-spacing:-0.035em;margin:22px auto 0;max-width:820px}
  .rp-h1 .g{color:#33E6A2}
  .rp-hero .rp-lead{margin:22px auto 0;max-width:600px;font-size:18px}
  .rp-ctarow{display:flex;gap:12px;margin:30px 0 0;justify-content:center;flex-wrap:wrap}
  .rp-or{margin-top:16px;font-size:13.5px;color:#93A79C}.rp-or a{color:#33E6A2;font-weight:600}
  .rp-nocard{margin-top:12px;font-size:12.5px;color:#5F7168}
  .rp-stage{position:relative;z-index:1;max-width:1000px;margin:56px auto 0;padding:0 28px}
  .rp-panel.lite{background:#FFFFFF;border:1px solid rgba(255,255,255,0.10);box-shadow:0 30px 80px -20px rgba(0,0,0,0.75)}
  .rp-panel.lite .rp-ptop{background:#F9FAFB;border-bottom:1px solid #E4E7EC}
  .rp-panel.lite .rp-dot3 i{background:#E4E7EC}
  .rp-panel.lite .rp-ptop .u{color:#98A2B3}
  .rp-panel.lite .rp-mtile{background:#FFFFFF;border:1px solid #E4E7EC;border-left:3px solid #E4E7EC}
  .rp-panel.lite .rp-mtile:first-child{border-left-color:#1F6F4A}
  .rp-panel.lite .rp-mtile .mv{color:#101828}
  .rp-panel.lite .rp-mtile .mv.g{color:#1F6F4A}
  .rp-panel.lite .rp-mtile .ml{color:#667085}
  .rp-panel.lite .rp-box{background:#F9FAFB;border:1px solid #E4E7EC}
  .rp-panel.lite .rp-k{color:#667085}
  .rp-panel.lite .rp-qrow{color:#344054;border-bottom:1px solid #EFF1F4}
  /* The verdict is the point of the panel, so it is the one card that lifts. */
  .rp-panel.lite .rp-box.verdict{background:#FFFFFF;border:1px solid #CFE7DA;box-shadow:0 8px 22px -10px rgba(16,24,40,0.22)}
  .rp-panel.lite .rp-verdk{color:#14603C}
  .rp-panel.lite .rp-verdv{color:#101828}
  .rp-panel.lite .rp-bar{background:#EFF1F4}
  .rp-panel.lite .rp-bar i{background:#1F6F4A}
  .rp-panel.lite .rp-sigrow{color:#344054}
  .rp-panel.lite .rp-tick{color:#1F6F4A}
  .rp-panel{background:#0A1710;border:1px solid rgba(255,255,255,0.09);border-radius:20px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.5)}
  .rp-ptop{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
  .rp-dot3{display:flex;gap:6px}.rp-dot3 i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.14)}
  .rp-ptop .u{font-size:12px;color:#5F7168}
  .rp-dash{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;padding:18px}
  .rp-m4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;grid-column:1 / -1}
  .rp-mtile{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 14px}
  .rp-mtile .mv{font-size:22px;font-weight:700}.rp-mtile .mv.g{color:#33E6A2}.rp-mtile .ml{font-size:11px;color:#5F7168;margin-top:2px}
  .rp-box{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px}
  .rp-qrow{font-size:13px;color:#93A79C;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
  .rp-qrow.last{border-bottom:none}
  .rp-verdk{font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#33E6A2}
  .rp-verdv{font-size:20px;font-weight:700;margin-top:4px}
  .rp-bar{height:7px;border-radius:5px;background:rgba(255,255,255,0.08);margin-top:12px;overflow:hidden}
  .rp-bar i{display:block;height:100%;background:#33E6A2}
  .rp-sig{margin-top:14px;display:flex;flex-direction:column;gap:9px}
  .rp-sigrow{display:flex;align-items:center;gap:9px;font-size:13px;color:#93A79C}
  .rp-tick{width:15px;height:15px;flex:none;color:#33E6A2}
  .rp-strip{border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06)}
  .rp-stripin{padding:26px 0;text-align:center}.rp-stripin .label{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#5F7168}
  .rp-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px}
  .rp-fcard{padding:22px}
  .rp-ic{width:36px;height:36px;border-radius:10px;background:rgba(51,230,162,0.10);border:1px solid rgba(51,230,162,0.22);display:flex;align-items:center;justify-content:center;color:#33E6A2;margin-bottom:14px}
  .rp-fcard h3{font-size:16px;font-weight:700;margin:0 0 7px}.rp-fcard p{font-size:14px;line-height:1.55;color:#93A79C;margin:0 0 12px}
  .rp-stat{font-size:12.5px;color:#33E6A2;font-weight:600}
  .rp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}
  .rp-step{padding:24px}.rp-step .num{font-size:13px;font-weight:700;color:#33E6A2;letter-spacing:0.08em}
  .rp-step h3{font-size:18px;font-weight:700;margin:12px 0 8px}.rp-step p{font-size:14px;line-height:1.58;color:#93A79C;margin:0}
  .rp-cap{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-top:60px}
  .rp-cap.rev .txt{order:2}
  .rp-cap h3{font-size:26px;font-weight:700;letter-spacing:-0.02em;margin:14px 0 0}
  .rp-cap p{font-size:15px;line-height:1.62;color:#93A79C;margin:14px 0 0;max-width:440px}
  .rp-mock{padding:18px}
  .rp-mhead{display:flex;justify-content:space-between;font-size:12px;color:#5F7168;margin-bottom:14px}
  .rp-bubble{border-radius:12px;padding:11px 13px;font-size:13.5px;line-height:1.5;margin-bottom:10px;max-width:88%}
  .rp-bubble.q{background:rgba(51,230,162,0.10);border:1px solid rgba(51,230,162,0.22);margin-left:auto}
  .rp-bubble.a{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#93A79C}
  .rp-pgrow{display:flex;align-items:center;gap:12px;margin:10px 0}
  .rp-pg{font-size:12px;color:#5F7168;width:46px;flex:none}
  .rp-pgbar{flex:1;height:8px;border-radius:5px;background:rgba(255,255,255,0.06);overflow:hidden}
  .rp-pgbar i{display:block;height:100%;background:#33E6A2}
  .rp-pgt{font-size:12px;color:#93A79C;width:34px;text-align:right;flex:none}
  .rp-cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .rp-cmp .col{border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px;background:rgba(255,255,255,0.02)}
  .rp-cmp .nm{font-size:13px;font-weight:700;margin-bottom:8px}
  .rp-cmp .kv{display:flex;justify-content:space-between;font-size:12px;color:#93A79C;margin:5px 0}.rp-cmp .kv b{color:#F2F7F4}
  .rp-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px}
  .rp-pill.hot{background:rgba(51,230,162,0.14);color:#33E6A2}.rp-pill.cold{background:rgba(255,255,255,0.06);color:#5F7168}
  .rp-tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .rp-tbl{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px}
  .rp-tbl th{text-align:left;color:#5F7168;font-weight:600;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px}
  .rp-tbl td{padding:9px 6px;border-bottom:1px solid rgba(255,255,255,0.06);color:#93A79C}.rp-tbl td b{color:#F2F7F4}
  .rp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:12px}
  .rp-statb{padding:34px 24px;text-align:center}
  .rp-statb .claim{font-size:23px;font-weight:600;letter-spacing:-0.02em;color:#F2F7F4;line-height:1.25}
  .rp-statb .cap2{font-size:14px;color:#93A79C;margin-top:6px}
  .rp-plans{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}
  .rp-plan{padding:22px}.rp-plan .pn{font-size:15px;font-weight:700}
  .rp-plan .pp{font-size:28px;font-weight:700;margin:8px 0 2px}.rp-plan .pp small{font-size:12px;color:#5F7168;font-weight:500}
  .rp-plan .pl{font-size:12.5px;color:#93A79C;margin-top:8px;line-height:1.5}
  .rp-plan.hot{border-color:rgba(51,230,162,0.4)}
  .rp-faq{max-width:820px;margin:40px auto 0}
  .rp-faq details{border-top:1px solid rgba(255,255,255,0.06);padding:18px 4px}
  .rp-faq summary{list-style:none;cursor:pointer;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
  .rp-faq summary::-webkit-details-marker{display:none}
  .rp-faq summary .c{color:#33E6A2;font-size:20px;line-height:1;transition:transform .2s}
  .rp-faq details[open] summary .c{transform:rotate(45deg)}
  .rp-faq p{font-size:14.5px;line-height:1.6;color:#93A79C;margin:12px 0 0}
  .rp-ctaband{position:relative;overflow:hidden;border:1px solid rgba(51,230,162,0.25);background:#0A1712;border-radius:22px;padding:56px 32px;text-align:center}
  .rp-ctaband h2{font-size:34px;font-weight:700;letter-spacing:-0.03em;margin:0 0 12px}
  .rp-ctaband p{font-size:16px;color:#93A79C;margin:0 0 26px}
  .rp-foot{display:flex;justify-content:space-between;align-items:center;padding:30px 0;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,0.06)}
  .rp-foot .flinks{display:flex;flex-wrap:wrap;gap:12px 20px;font-size:13px}.rp-foot a{color:#93A79C}.rp-foot .tag{font-size:13px;color:#5F7168}
  @media (max-width:900px){
    .rp-hero{padding:52px 0 30px}.rp-h1{font-size:40px}.rp-h2{font-size:30px}
    .rp-links{display:none}
      .rp-menu{display:block}
    .rp-grid4,.rp-plans{grid-template-columns:repeat(2,1fr)}
    .rp-steps,.rp-dash,.rp-stats{grid-template-columns:1fr}
    .rp-cap{grid-template-columns:1fr}.rp-cap.rev .txt{order:0}
  }
  @media (max-width:560px){
    .rp-wrap{padding:0 18px}
    .rp-stage{padding:0 14px;margin-top:40px}
    .rp-hero{padding:36px 0 20px}.rp-h1{font-size:32px}.rp-hero .rp-lead{font-size:16px}
    .rp-h2{font-size:25px}.rp-sec{padding:60px 0}
    .rp-grid4,.rp-plans{grid-template-columns:1fr}
    .rp-m4{grid-template-columns:1fr 1fr}
    .rp-dash{padding:14px;gap:12px}
    .rp-navr{gap:10px}.rp-navr a.sign{display:none}.rp-brand{font-size:17px}
    /* mobile cta sizing */.rp-btn{font-size:12.5px;padding:8px 12px}.rp-brand{font-size:15px;flex-shrink:0;white-space:nowrap}.rp-ring{flex-shrink:0}.rp-navr{gap:8px;flex-shrink:0}
    .rp-full{display:none}.rp-short{display:inline}
    .rp-btn-fr{font-size:11.5px;padding:8px 11px}
    .rp-statb{padding:26px 20px}.rp-statb .claim{font-size:20px}
    .rp-ctaband{padding:40px 20px}.rp-ctaband h2{font-size:24px}
    .rp-cmp{gap:10px}
    .rp-cta-row,.rp-ctarow{flex-direction:column}
    .rp-btnout,.rp-btnlg{text-align:center}
  }
`;

const Tick = () => (<svg className="rp-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);
const vLabel = (c: Copy, v: string) => v === "ready" ? c.platform.vReady : v === "warm" ? c.platform.vWarming : c.platform.vGlance;

export default async function LandingPage() {
  const jar = await cookies();
  const locale: Locale = jar.get("locale")?.value === "fr" ? "fr" : "en";
  const c = COPY[locale];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <div className="rp-page">
      <HomeJsonLd />
      <style>{CSS}</style>
      <style>{MOCK_CSS}</style>

      <header className="rp-head">
        <div className="rp-wrap">
          <nav className="rp-nav">
            <div className="rp-brand"><span className="rp-ring" /> ReadProspects</div>
            <div className="rp-links">
              <a href="#why">{c.nav.why}</a><a href="#how">{c.nav.how}</a><a href="#platform">{c.nav.platform}</a><a href="/pricing">{c.nav.pricing}</a>
            </div>
            <details className="rp-menu">
              <summary aria-label="Menu">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
              </summary>
              <div className="rp-menupanel">
                <a href="#why">{c.nav.why}</a>
                <a href="#how">{c.nav.how}</a>
                <a href="#platform">{c.nav.platform}</a>
                <a href="#pricing">{c.nav.pricing}</a>
              </div>
            </details>
            <div className="rp-navr">
              <LanguageSwitcher current={locale} dark />
              {loggedIn
                ? <a className={"rp-btn" + (locale === "fr" ? " rp-btn-fr" : "")} href="/overview">{c.nav.openApp}</a>
                : <a className="sign" href="/login">{c.nav.signin}</a>}
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="rp-hero">
        <div className="rp-heroglow" style={{ width: 760, height: 420, top: -120, left: "50%", transform: "translateX(-50%)", background: "rgba(31,169,113,0.20)" }} />
        <div className="rp-wrap">
          <span className="rp-eyebrow">{c.hero.eyebrow}</span>
          <h1 className="rp-h1">{c.hero.t1}<br /><span className="g">{c.hero.t2}</span></h1>
          <p className="rp-lead">{c.hero.sub}</p>
          <div className="rp-ctarow">
            <a className="rp-btnout" href="#how">{c.hero.ctaOut}</a>
            <a className="rp-btnlg" href="/pricing">{c.hero.ctaLg}</a>
          </div>
          <div className="rp-nocard">{c.hero.nocard}</div>
        </div>

        <div className="rp-stage">
          <AppShot locale={locale} />
        </div>
      </section>

      {/* TRUSTED */}
      <div className="rp-strip"><div className="rp-wrap rp-stripin"><div className="label">{c.trusted}</div></div></div>

      {/* PROBLEM */}
      <section className="rp-sec" id="why">
        <div className="rp-glow" style={{ width: 520, height: 320, top: 40, right: -120, background: "rgba(31,169,113,0.10)" }} />
        <div className="rp-wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="rp-eyebrow">{c.problem.eyebrow}</span>
          <h2 className="rp-h2">{c.problem.t1} <span className="g">{c.problem.t2}</span></h2>
          <p className="rp-lead">{c.problem.lead}</p>
          <div className="rp-grid4">
            {c.problem.cards.map((card, i) => (
              <div key={i} className="rp-card rp-fcard">
                <div className="rp-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
                <h3>{card.h}</h3><p>{card.p}</p><div className="rp-stat">{card.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="rp-sec" id="how">
        <div className="rp-wrap rp-center">
          <span className="rp-eyebrow">{c.how.eyebrow}</span>
          <h2 className="rp-h2">{c.how.t1} <span className="g">{c.how.t2}</span></h2>
          <p className="rp-lead">{c.how.lead}</p>
        </div>
        <div className="rp-wrap">
          <div className="rp-steps">
            {c.how.steps.map((st, i) => (
              <div key={i} className="rp-card rp-step"><div className="num">{"0" + (i + 1)}</div><h3>{st.h}</h3><p>{st.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="rp-sec" id="platform">
        <div className="rp-glow" style={{ width: 640, height: 360, top: 60, left: -160, background: "rgba(31,169,113,0.10)" }} />
        <div className="rp-wrap rp-center" style={{ position: "relative", zIndex: 1 }}>
          <span className="rp-eyebrow">{c.platform.eyebrow}</span>
          <h2 className="rp-h2">{c.platform.t1} <span className="g">{c.platform.t2}</span></h2>
          <p className="rp-lead">{c.platform.lead}</p>
        </div>
        <div className="rp-wrap" style={{ position: "relative", zIndex: 1, marginTop: 44 }}>
          <RecipientsShot title={c.platform.readers} sub={c.platform.lead} locale={locale} />
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="rp-sec">
        <div className="rp-wrap rp-center">
          <span className="rp-eyebrow">{c.caps.eyebrow}</span>
          <h2 className="rp-h2">{c.caps.title}</h2>
          <p className="rp-lead">{c.caps.lead}</p>
        </div>
        <div className="rp-wrap">
          <div className="rp-cap">
            <div className="txt"><span className="rp-eyebrow">{c.caps.c1e}</span><h3>{c.caps.c1h}</h3><p>{c.caps.c1p}</p></div>
            <AskShot doc="Q3 proposal" view={c.caps.c1view} q1={c.caps.c1q1} a1={c.caps.c1a} q2={c.caps.c1q2} locale={locale} />
          </div>

          <div className="rp-cap rev">
            <div className="txt"><span className="rp-eyebrow">{c.caps.c2e}</span><h3>{c.caps.c2h}</h3><p>{c.caps.c2p}</p></div>
            <DwellShot title={c.caps.c2title} visits={c.caps.c2visits} locale={locale} />
          </div>

          <div className="rp-cap">
            <div className="txt"><span className="rp-eyebrow">{c.caps.c3e}</span><h3>{c.caps.c3h}</h3><p>{c.caps.c3p}</p></div>
            <VerdictShot read={c.caps.c3read} verdict={c.panel.verdict} ready={c.panel.ready} locale={locale} />
          </div>

          <div className="rp-cap rev">
            <div className="txt"><span className="rp-eyebrow">{c.caps.c4e}</span><h3>{c.caps.c4h}</h3><p>{c.caps.c4p}</p></div>
            <CompareShot visits={c.caps.c4visits} time={c.caps.c4time} q={c.caps.c4q} ready={c.caps.c4ready} glance={c.caps.c4glance} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="rp-sec">
        <div className="rp-wrap rp-center"><span className="rp-eyebrow">{c.stats.eyebrow}</span><h2 className="rp-h2">{c.stats.title}</h2></div>
        <div className="rp-wrap">
          <div className="rp-stats">
            <div className="rp-card rp-statb"><div className="claim">{c.stats.s1}</div><div className="cap2">{c.stats.s1b}</div></div>
            <div className="rp-card rp-statb"><div className="claim">{c.stats.s2}</div><div className="cap2">{c.stats.s2b}</div></div>
            <div className="rp-card rp-statb"><div className="claim">{c.stats.s3}</div><div className="cap2">{c.stats.s3b}</div></div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="rp-sec" id="pricing">
        <div className="rp-wrap rp-center">
          <span className="rp-eyebrow">{c.pricing.eyebrow}</span>
          <h2 className="rp-h2">{c.pricing.t1} <span className="g">{c.pricing.t2}</span></h2>
          <p className="rp-lead">{c.pricing.lead}</p>
        </div>
        <div className="rp-wrap">
          <div className="rp-plans">
            {c.pricing.plans.map((p, i) => (
              <div key={i} className={"rp-card rp-plan" + (p.hot ? " hot" : "")}>
                <div className="pn">{p.name}</div>
                <div className="pp">{p.price} {p.per ? <small>{p.per}</small> : null}</div>
                <div className="pl">{p.desc}</div>
              </div>
            ))}
          </div>
          <div className="rp-center" style={{ marginTop: 26 }}><a className="rp-btnout" href="/pricing">{c.pricing.seeFull}</a></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="rp-sec">
        <div className="rp-wrap rp-center"><span className="rp-eyebrow">{c.faq.eyebrow}</span><h2 className="rp-h2">{c.faq.title}</h2></div>
        <div className="rp-wrap">
          <div className="rp-faq">
            {c.faq.items.map((f, i) => (
              <details key={i} open={i === 0}><summary>{f.q}<span className="c">+</span></summary><p>{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rp-sec">
        <div className="rp-wrap">
          <div className="rp-ctaband">
            <h2>{c.cta.title}</h2><p>{c.cta.sub}</p>
            <a className="rp-btnlg" href="/pricing">{c.cta.btn}</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="rp-wrap">
          <div className="rp-foot">
            <div className="rp-brand"><span className="rp-ring" /> ReadProspects</div>
            <div className="flinks">
              <a href="/pricing">{c.footer.pricing}</a>
              <a href="/privacy">{c.footer.privacy}</a>
              <a href="/terms">{c.footer.terms}</a>
              <a href="/login">{c.footer.signin}</a>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="ReadProspects on LinkedIn" style={{ display: "inline-flex", alignItems: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 8.98h4v12.02H3V8.98zM9.5 8.98h3.83v1.64h.05c.53-.95 1.83-1.96 3.77-1.96 4.03 0 4.78 2.5 4.78 5.75v6.59h-4v-5.84c0-1.39-.03-3.18-2-3.18-2 0-2.31 1.51-2.31 3.08v5.94h-4V8.98z"/></svg></a>
            </div>
            <div className="tag">{c.footer.tag}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
