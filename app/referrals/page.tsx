import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { T } from "@/lib/theme";
import ReferralAuth from "./ReferralAuth";
import RefLink from "./RefLink";
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
type Row = { plan: string | null; subscription_active: boolean | null; created_at: string };
export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const referrer = user
    ? (await admin.from("referrers").select("id, code, display_name, payout_currency, status").eq("id", user.id).maybeSingle()).data
    : null;

  const shell = (title: string, sub: string, body: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <header style={{ borderBottom: "1px solid " + T.border, background: T.card }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 17, height: 17, border: "2.2px solid " + T.green, borderRadius: "50%", position: "relative", flex: "none" }}>
            <span style={{ position: "absolute", inset: 4, background: T.green, borderRadius: "50%" }} />
          </span>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: T.heading }}>ReadProspects</span>
          <span style={{ fontSize: 13, color: T.muted, marginLeft: 4 }}>Referrals</span>
        </div>
      </header>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "34px 20px 100px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 26px", maxWidth: 560, lineHeight: 1.55 }}>{sub}</p>
        {body}
      </main>
    </div>
  );

  if (!user) {
    return shell(
      "Earn on every customer you send us",
      "25% of what each referral pays, for their first three months. Anyone you refer gets 5% off any paid plan. Sign in or create an account to begin.",
      <ReferralAuth mode="auth" />
    );
  }
  if (!referrer) {
    return shell(
      "Join the referral programme",
      "You are signed in. Choose your link and you are in.",
      <ReferralAuth mode="join" />
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
  const MIN_PAYOUT = 50;
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
    "Hello" + (r.display_name ? ", " + r.display_name.split(" ")[0] : ""),
    "Your link, who has signed up, and who is paying. Earnings appear here once a referral's first payment clears.",
    <>
      <RefLink code={r.code} marketing={MARKETING} />

      <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginBottom: 16 }}>
        {cell(rows.length, "Signups", T.indigo)}
        {cell(paying.length, "Paying", T.green)}
        {cell(paying.filter((x) => x.subscription_active).length, "Active now", T.green)}
        {cell(rows.length ? Math.round((paying.length / rows.length) * 100) + "%" : "\u2014", "Converted", T.amber)}
      </div>

      <div style={card}>
        <div style={head}>Paying referrals by plan</div>
        <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {([["Personal", "personal"], ["Team", "company_1"], ["Business", "company_2"]] as [string, string][]).map(([label, id], i) => (
            <div key={id} style={{ padding: "14px 18px", borderLeft: i ? "1px solid " + T.borderSoft : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{tier(id)}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={head}>Revenue</div>
        <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", borderBottom: "1px solid " + T.border }}>
          <div style={{ padding: "15px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(available)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>Available</div>
          </div>
          <div style={{ padding: "15px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(pending)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>Held, clears after 30 days</div>
          </div>
          <div style={{ padding: "15px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{money(paid)}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>Paid out</div>
          </div>
        </div>
        <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Present and disabled: a referrer can see the mechanism exists and
              what it takes to use it, which is more reassuring than an
              explanation of why there is no button. */}
          <button disabled title={canWithdraw ? "Payouts open shortly" : "Minimum " + money(MIN_PAYOUT)}
            style={{ height: 36, background: T.soft, color: T.faint, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 15px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "not-allowed" }}>
            Request payout
          </button>
          <span style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
            {rowsL.length === 0
              ? "Paid plans are not taking payment yet, so nothing has been calculated for anyone. Every signup above is already recorded against your link and earns from the first payment onward."
              : canWithdraw
                ? "Payouts open shortly. Your balance is safe and will be here when they do."
                : "You can request a payout once your available balance reaches " + money(MIN_PAYOUT) + "."}
          </span>
        </div>
      </div>

      <div style={card}>
        <div style={head}>How it works</div>
        <div style={{ padding: 18, fontSize: 13.5, lineHeight: 1.65, color: T.body }}>
          <p style={{ margin: "0 0 10px" }}>You earn 25% of what a referral actually pays, for their first three monthly payments, or once on an annual plan.</p>
          <p style={{ margin: "0 0 10px" }}>Anyone using your link gets 5% off any paid plan, for as long as they stay subscribed.</p>
          <p style={{ margin: "0 0 10px" }}>Commission is held for 30 days before it can be withdrawn, and is reversed if a payment is refunded or charged back.</p>
          <p style={{ margin: 0 }}>If a referral cancels, no further commission is earned, even if they subscribe again later.</p>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: T.muted, margin: 0 }}>
        Signed in as {user.email}. Referral link name <strong style={{ color: T.heading }}>{r.code}</strong>.
      </p>
    </>
  );
}