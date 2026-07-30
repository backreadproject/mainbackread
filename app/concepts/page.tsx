import { T } from "@/lib/theme";
import { getLocale } from "@/lib/locale-server";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
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
//
// The French set is a real translation rather than a machine pass, but it is
// explanatory copy, not the legal pages: a loose sentence here costs clarity,
// not a legal position.
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
const SECTIONS_FR: Section[] = [
  {
    id: "signals",
    h: "Les signaux",
    body: [
      "Tout ce que ReadProspects sait d\u2019un lecteur vient de six choses qu\u2019il fait. Class\u00e9es par ce que chacune vaut vraiment :",
      { list: [
        "Une r\u00e9ponse. Il a \u00e9crit en retour. Ce n\u2019est pas un indice \u00e0 peser, c\u2019est la r\u00e9ponse.",
        "Une question. Il a interrog\u00e9 le document. Une intention exprim\u00e9e, qui vaut plus que tout ce qui suit r\u00e9uni.",
        "Un transfert. Il l\u2019a envoy\u00e9 \u00e0 un coll\u00e8gue, ce qui vous dit que la conversation s\u2019est d\u00e9plac\u00e9e \u00e0 l\u2019int\u00e9rieur de son entreprise.",
        "Une relecture. Il est revenu sur une page. Soit une friction, soit ce qu\u2019il est en train de peser.",
        "Le temps pass\u00e9. Combien de temps sur une page. Un indicateur faible, trait\u00e9 comme tel.",
        "Une ouverture. Il l\u2019a regard\u00e9. De l\u2019engagement, rien de plus.",
      ] },
      "Cet ordre est toute la th\u00e8se de ce produit. Un outil qui traite une ouverture comme une r\u00e9ponse compte, il ne lit pas.",
    ],
  },
  {
    id: "dwell",
    h: "Le temps pass\u00e9, et pourquoi nous nous en m\u00e9fions",
    body: [
      "Le temps pass\u00e9 est la dur\u00e9e pendant laquelle une page est rest\u00e9e \u00e0 l\u2019\u00e9cran. C\u2019est la chose la plus facile \u00e0 mesurer et la plus facile \u00e0 surinterpr\u00e9ter.",
      "Un lecteur qui a pass\u00e9 quatre-vingt-dix secondes sur votre page de prix l\u2019\u00e9tudiait peut-\u00eatre. Il allait peut-\u00eatre aussi chercher un caf\u00e9. Nous plafonnons le temps pass\u00e9 \u00e0 quinze minutes pour cette raison exacte, et un verdict ne repose jamais sur ce seul signal.",
      "L\u00e0 o\u00f9 il devient utile, c\u2019est en agr\u00e9g\u00e9. Un lecteur qui s\u2019attarde page quatre, c\u2019est son habitude. Dix lecteurs qui s\u2019arr\u00eatent page quatre, c\u2019est un fait sur la page quatre.",
    ],
  },
  {
    id: "companion",
    h: "Le compagnon du document",
    body: [
      "Votre lecteur peut poser une question \u00e0 votre document pendant qu\u2019il le lit, et obtenir une r\u00e9ponse tir\u00e9e du document lui-m\u00eame.",
      "C\u2019est la partie vraiment diff\u00e9rente. Un prospect qui lit votre proposition \u00e0 vingt-trois heures peut demander si l\u2019engagement annuel est n\u00e9gociable, obtenir une r\u00e9ponse claire, et continuer. Vous d\u00e9couvrez le lendemain matin ce qu\u2019il a demand\u00e9.",
      "Le compagnon r\u00e9pond \u00e0 partir de votre document et n\u2019invente pas de conditions que vous n\u2019avez pas propos\u00e9es. Quand une question sort de ce que dit le document, il le dit plut\u00f4t que de deviner.",
    ],
  },
  {
    id: "verdict",
    h: "Le verdict",
    body: [
      "Un verdict porte sur l\u2019affaire, pas sur le document. Il r\u00e9pond \u00e0 ce que cette personne semble penser et \u00e0 ce qu\u2019il faut en faire.",
      "Il est volontairement direct : un titre, un court raisonnement, et une action concr\u00e8te. Pas \u00ab relancer \u00bb. Quelque chose d\u2019assez pr\u00e9cis pour \u00eatre fait aujourd\u2019hui.",
      "Quand un lecteur a r\u00e9pondu, le verdict rapporte ce qu\u2019il a dit au lieu d\u2019inf\u00e9rer autour. Une fois que quelqu\u2019un vous dit ce qu\u2019il pense, estimer ce qu\u2019il pense est pire qu\u2019inutile.",
    ],
  },
  {
    id: "confidence",
    h: "La confiance",
    body: [
      "Chaque verdict porte une confiance haute, moyenne ou basse, et cela veut dire ce que cela dit.",
      "Une confiance basse n\u2019est pas une pr\u00e9caution de langage. Elle signifie que les signaux sont minces \u2014 une ouverture, un peu de temps, aucune question \u2014 et que toute affirmation plus ferme serait une invention. Quand vous la voyez, le r\u00e9flexe honn\u00eate est g\u00e9n\u00e9ralement d\u2019attendre.",
      "Un verdict assur\u00e9 sur des preuves minces est pire que pas de verdict du tout, parce que vous agiriez dessus.",
    ],
  },
  {
    id: "intent",
    h: "L\u2019intention, et le champ",
    body: [
      "L\u2019intention est un nombre unique qui r\u00e9sume o\u00f9 en est un lecteur. Le champ d\u2019intention de votre aper\u00e7u place chaque lecteur selon ce nombre : plus il est proche du centre, plus il semble pr\u00eat.",
      "Trois niveaux, et les noms sont la th\u00e8se :",
      { list: [
        "A jet\u00e9 un \u0153il. Il l\u2019a ouvert. C\u2019est tout ce que vous savez.",
        "S\u2019\u00e9chauffe. Des visites r\u00e9p\u00e9t\u00e9es ou du temps r\u00e9el sur les pages qui comptent.",
        "Pr\u00eat \u00e0 avancer. Des questions, un transfert, ou une lecture qui dit que le sujet est vivant.",
      ] },
      "Un lecteur qui r\u00e9pond appara\u00eet comme A r\u00e9pondu et passe au-dessus des trois, parce qu\u2019une r\u00e9ponse n\u2019est pas une estimation.",
    ],
  },
  {
    id: "neutral",
    h: "Pourquoi votre lecteur voit un autre domaine",
    body: [
      "Les documents s\u2019ouvrent sur relaydocuments.com, pas sur ReadProspects. Votre lecteur voit un document net, sans notre marque et sans compte \u00e0 cr\u00e9er.",
      "C\u2019est pour lui, pas pour dissimuler. Un prospect \u00e0 qui l\u2019on demande de s\u2019inscrire avant de lire votre proposition ne la lit tout simplement pas, et un document couvert du logo d\u2019un fournisseur se lit comme de la publicit\u00e9 plut\u00f4t que comme votre travail.",
      "Ce qui est collect\u00e9, et le fait que l\u2019exp\u00e9diteur puisse le voir, est expos\u00e9 dans l\u2019avis de confidentialit\u00e9 li\u00e9 depuis la page de lecture.",
    ],
  },
  {
    id: "forwarding",
    h: "Le transfert",
    body: [
      "Un lecteur peut transmettre votre document \u00e0 un coll\u00e8gue depuis la page de lecture. Le coll\u00e8gue re\u00e7oit alors son propre lien et sa lecture est suivie s\u00e9par\u00e9ment.",
      "Le transfert est l\u2019un des signaux les plus forts qui existent, parce que c\u2019est le moment o\u00f9 votre document commence \u00e0 \u00eatre discut\u00e9 par des gens que vous n\u2019avez jamais rencontr\u00e9s.",
    ],
  },
  {
    id: "versions",
    h: "Les versions A et B",
    body: [
      "T\u00e9l\u00e9versez deux versions ou plus du m\u00eame document et les lecteurs sont r\u00e9partis entre elles automatiquement.",
      "Vous voyez ensuite quelle version retient l\u2019attention, laquelle suscite des questions, et laquelle perd les gens \u2014 mesur\u00e9 sur de vrais lecteurs plut\u00f4t que sur des avis.",
      "En dessous d\u2019environ six lecteurs par version, l\u2019\u00e9cart est du bruit. Le panneau le dit plut\u00f4t que de d\u00e9signer un gagnant.",
    ],
  },
  {
    id: "reports",
    h: "Les rapports",
    body: [
      "Un rapport, c\u2019est l\u2019ensemble du tableau sous forme de document \u00e0 transmettre : qui m\u00e9rite votre attention cette semaine, ce que les lecteurs engag\u00e9s ont en commun, et ce que votre document fait aux gens.",
      "Ce n\u2019est pas une pile de verdicts individuels. Vingt-trois verdicts \u00e0 la suite, c\u2019est un tableur avec des adjectifs. La partie utile est la liste courte \u2014 lesquels des vingt-trois m\u00e9ritent votre mardi.",
    ],
  },
  {
    id: "limits",
    h: "Ce que rien de tout cela ne peut vous dire",
    body: [
      "Cela ne peut pas vous dire ce que quelqu\u2019un a pens\u00e9. Cela peut vous dire ce qu\u2019il a fait, et argumenter prudemment sur ce que cela implique.",
      "Cela ne voit pas les lectures qui ont lieu hors du lien. Une copie imprim\u00e9e, une capture transmise, une conversation en r\u00e9union : invisibles pour nous, et souvent d\u00e9cisives.",
      "Cela ne peut pas faire dire quelque chose \u00e0 un lecteur silencieux. La plupart des gens qui n\u2019ouvrent jamais un document ne l\u2019ont simplement jamais ouvert.",
      "L\u00e0 o\u00f9 les preuves sont minces, ReadProspects le dit. C\u2019est ce qui rend le reste digne d\u2019\u00eatre lu.",
    ],
  },
];
const COPY = {
  en: {
    h1: "What the words mean",
    lead: "ReadProspects uses a handful of terms that are specific to it. This page defines each one, and says plainly where the evidence behind it is strong and where it is not.",
    onThisPage: "ON THIS PAGE",
    pricing: "Pricing",
    stillUnclear: "Still unclear on something?",
    seePlans: "See what each plan includes",
    orWriteTo: ", or write to",
    andAnswer: "and a person will answer.",
  },
  fr: {
    h1: "Ce que signifient les mots",
    lead: "ReadProspects emploie quelques termes qui lui sont propres. Cette page d\u00e9finit chacun d\u2019eux, et dit clairement o\u00f9 les preuves sont solides et o\u00f9 elles ne le sont pas.",
    onThisPage: "SUR CETTE PAGE",
    pricing: "Tarifs",
    stillUnclear: "Un point reste flou ?",
    seePlans: "Voir ce que comprend chaque forfait",
    orWriteTo: ", ou \u00e9crivez \u00e0",
    andAnswer: "et une personne vous r\u00e9pondra.",
  },
};
export default async function ConceptsPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const sections = locale === "fr" ? SECTIONS_FR : SECTIONS;
  const link = { color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder };
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <a href="/" style={{ fontSize: 15.5, fontWeight: 600, color: T.heading, textDecoration: "none" }}>ReadProspects</a>
          <a href="/pricing" style={{ marginLeft: "auto", fontSize: 13, color: T.muted, textDecoration: "none" }}>{c.pricing}</a>
          <LanguageSwitcher current={locale} dark={false} />
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 100px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {c.h1}
        </h1>
        <p style={{ fontSize: 15, color: T.muted, margin: "10px 0 0", lineHeight: 1.6, maxWidth: 580 }}>
          {c.lead}
        </p>

        <nav aria-label={c.onThisPage} style={{ margin: "30px 0 0", paddingTop: 22, borderTop: "1px solid " + T.border }}>
          <div style={{ fontSize: 11, letterSpacing: "0.09em", color: T.faint, marginBottom: 12 }}>{c.onThisPage}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sections.map((s, i) => (
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

        {sections.map((s) => (
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
          {c.stillUnclear} <a href="/pricing" style={link}>{c.seePlans}</a>{c.orWriteTo}{" "}
          <a href="mailto:support@readprospects.com" style={link}>support@readprospects.com</a> {c.andAnswer}
        </p>
      </main>
    </div>
  );
}