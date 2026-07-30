import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { T } from "@/lib/theme";
import ReferralAuth from "./ReferralAuth";
import RefLink from "./RefLink";
import { getLocale } from "@/lib/locale-server";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Referral programme \u2014 ReadProspects" },
  robots: { index: false, follow: false },
};
// The referral console. Its own host so a referrer never needs an app account.
//
// Everything here is real: signups and tier counts come from profiles, which
// exist today. Only the money is pending a live processor, and the parts that
// depend on it say so plainly rather than showing a zero that looks like a
// balance.
const MARKETING = process.env.NEXT_PUBLIC_MARKETING_HOST || "readprospects.com";
const COPY = {
  en: {
    referrals: "Referrals", terms: "Programme terms",
    earnTitle: "Earn on every customer you send us",
    earnSub: "25% of what each referral pays, for their first three months. Anyone you refer gets 10% off their first month on a monthly plan. Sign in or create an account to begin.",
    joinTitle: "Join the referral programme", joinSub: "You are signed in. Choose your link and you are in.",
    byJoining: "By joining you accept the", programmeTerms: "programme terms",
    including: ", including the 30 day hold on commission and the conditions under which it can be reversed.",
    hello: "Hello",
    dashSub: "Your link, who has signed up, and who is paying. Earnings appear here once a referral\u2019s first payment clears.",
    signups: "Signups", paying: "Paying", activeNow: "Active now", converted: "Converted",
    byPlan: "Paying referrals by plan", revenue: "Revenue",
    available: "Available", held: "Held, clears after 30 days", paidOut: "Paid out",
    requestPayout: "Request payout", payoutsSoon: "Payouts open shortly", minimum: "Minimum",
    nothingYet: "Nothing has been calculated yet. Every signup above is already recorded against your link and earns from the first payment onward.",
    balanceSafe: "Payouts open shortly. Your balance is safe and will be here when they do.",
    onceReaches: "You can request a payout once your available balance reaches",
    howItWorks: "How it works",
    hiw1: "You earn 25% of what a referral actually pays, for their first three monthly payments, or once on an annual plan.",
    hiw2: "Anyone using your link gets 10% off their first month. Monthly plans only, and only that first payment.",
    hiw3: "Commission is held for 30 days before it can be withdrawn, and is reversed if a payment is refunded or charged back.",
    hiw4: "If a referral cancels, no further commission is earned, even if they subscribe again later.",
    signedInAs: "Signed in as", linkName: "Referral link name",
  },
  fr: {
    referrals: "Parrainage", terms: "Conditions du programme",
    earnTitle: "Gagnez sur chaque client que vous nous envoyez",
    earnSub: "25 % de ce que paie chaque filleul, pendant ses trois premiers mois. Toute personne que vous parrainez re\u00e7oit 10 % de r\u00e9duction sur son premier mois en forfait mensuel. Connectez-vous ou cr\u00e9ez un compte pour commencer.",
    joinTitle: "Rejoindre le programme de parrainage", joinSub: "Vous \u00eates connect\u00e9. Choisissez votre lien et c\u2019est fait.",
    byJoining: "En rejoignant le programme, vous acceptez les", programmeTerms: "conditions du programme",
    including: ", y compris la retenue de 30 jours sur les commissions et les cas o\u00f9 elles peuvent \u00eatre annul\u00e9es.",
    hello: "Bonjour",
    dashSub: "Votre lien, qui s\u2019est inscrit, et qui paie. Les gains apparaissent ici d\u00e8s que le premier paiement d\u2019un filleul est encaiss\u00e9.",
    signups: "Inscriptions", paying: "Payants", activeNow: "Actifs", converted: "Convertis",
    byPlan: "Filleuls payants par forfait", revenue: "Revenus",
    available: "Disponible", held: "Retenu, lib\u00e9r\u00e9 apr\u00e8s 30 jours", paidOut: "Vers\u00e9",
    requestPayout: "Demander un versement", payoutsSoon: "Les versements ouvrent bient\u00f4t", minimum: "Minimum",
    nothingYet: "Rien n\u2019a encore \u00e9t\u00e9 calcul\u00e9. Chaque inscription ci-dessus est d\u00e9j\u00e0 rattach\u00e9e \u00e0 votre lien et rapporte d\u00e8s le premier paiement.",
    balanceSafe: "Les versements ouvrent bient\u00f4t. Votre solde est en s\u00e9curit\u00e9 et vous attendra.",
    onceReaches: "Vous pourrez demander un versement lorsque votre solde disponible atteindra",
    howItWorks: "Comment \u00e7a marche",
    hiw1: "Vous gagnez 25 % de ce qu\u2019un filleul paie r\u00e9ellement, sur ses trois premiers paiements mensuels, ou une fois sur un forfait annuel.",
    hiw2: "Toute personne qui utilise votre lien re\u00e7oit 10 % de r\u00e9duction sur son premier mois. Forfaits mensuels uniquement, et uniquement ce premier paiement.",
    hiw3: "La commission est retenue 30 jours avant de pouvoir \u00eatre retir\u00e9e, et elle est annul\u00e9e si un paiement est rembours\u00e9 ou contest\u00e9.",
    hiw4: "Si un filleul r\u00e9silie, aucune commission suppl\u00e9mentaire n\u2019est gagn\u00e9e, m\u00eame s\u2019il se r\u00e9abonne plus tard.",
    signedInAs: "Connect\u00e9 en tant que", linkName: "Nom du lien de parrainage",
  },
};
type Row = { plan: string | null; subscription_active: boolean | null; created_at: string };
export default async function ReferralsPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const referrer = user
    ? (await admin.from("referrers").select("id, code, display_name, payout_currency, status").eq("id", user.id).maybeSingle()).data
    : null;

  const shell = (title: string, sub: string, body: React.ReactNode, narrow = false) => (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: T.heading }}>ReadProspects</span>
          <span style={{ fontSize: 13, color: T.muted, marginLeft: 4 }}>{c.referrals}</span>
          <a href="/referrals/terms" style={{ marginLeft: "auto", fontSize: 13, color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>{c.terms}</a>
          <LanguageSwitcher current={locale} dark={false} />
        </div>
      </header>
      <main style={{ maxWidth: narrow ? 440 : 1000, margin: "0 auto", padding: "34px 20px 100px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 26px", maxWidth: 560, lineHeight: 1.55 }}>{sub}</p>
        {body}
      </main>
    </div>
  );

  if (!user) {
    return shell(
      c.earnTitle,
      c.earnSub,
      <ReferralAuth mode="auth" />,
      true
    );
  }
  if (!referrer) {
    return shell(
      c.joinTitle,
      c.joinSub,
      <>
        <ReferralAuth mode="join" />
        <p style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, margin: "20px 0 0" }}>
          {c.byJoining}{" "}
          <a href="/referrals/terms" style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>{c.programmeTerms}</a>
          {c.including}
        </p>
      </>,
      true
    );
  }

  const r = referrer as { id: string; code: string; display_name: string | null; payout_currency: string; status: string };

  // Signups and tiers, straight from profiles. No counters to keep in sync:
  // this is derived from the truth on every load.
  const { data: referred } = await admin
    .from("profiles")
    .select("plan, subscription_active, created_at")
    .eq("referred_by", r.id);
  const rows = (referred ?? []) as Row[];

  // Balances are derived, never stored. A stored figure drifts from the ledger
  // and cannot be audited; this can always be traced to the rows behind it.
  const { data: ledger } = await admin
    .from("commissions")
    .select("amount, status, available_at, withdrawal_id")
    .eq("referrer_id", r.id);
  const rowsL = (ledger ?? []) as { amount: number; status: string; available_at: string; withdrawal_id: string | null }[];
  const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + Number(x.amount), 0);
  const available = sum(rowsL.filter((x) => x.status === "available" && !x.withdrawal_id));
  const pending = sum(rowsL.filter((x) => x.status === "pending"));
  const paid = sum(rowsL.filter((x) => x.status === "paid"));
  const MIN_PAYOUT = 100;
  const canWithdraw = available >= MIN_PAYOUT;
  const money = (n: number) => r.payout_currency + " " + n.toFixed(2);
  const paying = rows.filter((x) => x.plan && x.plan !== "free");
  const tier = (id: string) => paying.filter((x) => x.plan === id).length;

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const cell = (v: string | number, l: string, tone?: string) => (
    <div style={{ padding: "15px 18px", borderLeft: "3px solid " + (tone ?? T.border) }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
    </div>
  );

  return shell(
    c.hello + (r.display_name ? ", " + r.display_name.split(" ")[0] : ""),
    c.dashSub,
    <>
      <RefLink code={r.code} marketing={MARKETING} />

      <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginBottom: 16 }}>
        {cell(rows.length, c.signups, T.indigo)}
        {cell(paying.length, c.paying, T.green)}
        {cell(paying.filter((x) => x.subscription_active).length, c.activeNow, T.green)}
        {cell(rows.length ? Math.round((paying.length / rows.length) * 100) + "%" : "\u2014", c.converted, T.amber)}
      </div>

      <div style={card}>
        <div style={head}>{c.byPlan}</div>
        <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {([["Personal", "personal"], ["Team", "team"], ["Business", "business"]] as [string, string][]).map(([label, id], i) => (
            <div key={id} style={{ padding: "14px 18px", borderLeft: i ? "1px solid " + T.borderSoft : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{tier(id)}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={head}>{c.revenue}</div>
        <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", borderBottom: "1px solid " + T.border }}>
          <div style={{ padding: "15px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(available)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{c.available}</div>
          </div>
          <div style={{ padding: "15px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(pending)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{c.held}</div>
          </div>
          <div style={{ padding: "15px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(paid)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{c.paidOut}</div>
          </div>
        </div>
        <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Present and disabled: a referrer can see the mechanism exists and
              what it takes to use it, which is more reassuring than an
              explanation of why there is no button. */}
          <button disabled title={canWithdraw ? c.payoutsSoon : c.minimum + " " + money(MIN_PAYOUT)}
            style={{ height: 36, background: T.soft, color: T.faint, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 15px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "not-allowed" }}>
            {c.requestPayout}
          </button>
          <span style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
            {rowsL.length === 0
              ? c.nothingYet
              : canWithdraw
                ? c.balanceSafe
                : c.onceReaches + " " + money(MIN_PAYOUT) + "."}
          </span>
        </div>
      </div>

      <div style={card}>
        <div style={head}>{c.howItWorks}</div>
        <div style={{ padding: 18, fontSize: 13.5, lineHeight: 1.65, color: T.body }}>
          <p style={{ margin: "0 0 10px" }}>{c.hiw1}</p>
          <p style={{ margin: "0 0 10px" }}>{c.hiw2}</p>
          <p style={{ margin: "0 0 10px" }}>{c.hiw3}</p>
          <p style={{ margin: 0 }}>{c.hiw4}</p>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: T.muted, margin: 0 }}>
        {c.signedInAs} {user.email}. {c.linkName} <strong style={{ color: T.heading }}>{r.code}</strong>.
      </p>
    </>
  );
}