import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { billingConfigured } from "@/lib/billing";
import { PLANS, PLAN_ORDER, formatPrice, type PlanId } from "@/lib/plans";
import { T } from "@/lib/theme";
import PayoutActions from "./PayoutActions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The finance surface. Revenue by plan, who is paying, and the referral payout
// queue with its holds.
//
// Revenue here is DERIVED from who is on what plan, not summed from a payments
// table, because there is no payments table: Flutterwave holds the truth about
// what was actually collected. This is the run rate the plans imply, which is
// the right number for "what are we earning" and the wrong one for accounting.
type Prof = { id: string; plan: string | null; subscription_active: boolean | null; referred_by: string | null };
type Org = { id: string; name: string; plan: string | null; subscription_active: boolean | null };
type Comm = { id: string; referrer_id: string; amount: number; status: string; available_at: string; withdrawal_id: string | null; currency: string };
type Wd = { id: string; referrer_id: string; amount: number; currency: string; status: string; requested_at: string };
export default async function ConsoleBilling() {
  await requireAdminPage("billing.manage");
  const admin = createAdminClient();

  const [{ data: profs }, { data: orgs }, { data: comms }, { data: wds }, { data: refs }] = await Promise.all([
    admin.from("profiles").select("id, plan, subscription_active, referred_by"),
    admin.from("organizations").select("id, name, plan, subscription_active"),
    admin.from("commissions").select("id, referrer_id, amount, status, available_at, withdrawal_id, currency"),
    admin.from("withdrawals").select("id, referrer_id, amount, currency, status, requested_at").order("requested_at", { ascending: false }),
    admin.from("referrers").select("id, code, contact_email, payout_currency"),
  ]);
  const profiles = (profs ?? []) as Prof[];
  const organizations = (orgs ?? []) as Org[];
  const ledger = (comms ?? []) as Comm[];
  const withdrawals = (wds ?? []) as Wd[];
  const referrers = new Map(((refs ?? []) as { id: string; code: string; contact_email: string | null }[]).map((r) => [r.id, r]));

  // Personal plans sit on profiles; org plans on organizations. Counting both
  // from one table would double count an owner who also has a profile row.
  const personalOn = (id: PlanId) => profiles.filter((p) => p.plan === id && id !== "team" && id !== "business").length;
  const orgOn = (id: PlanId) => organizations.filter((o) => o.plan === id).length;
  const countOn = (id: PlanId) => (id === "team" || id === "business" ? orgOn(id) : personalOn(id));
  const activeOn = (id: PlanId) =>
    id === "team" || id === "business"
      ? organizations.filter((o) => o.plan === id && o.subscription_active).length
      : profiles.filter((p) => p.plan === id && p.subscription_active).length;

  const mrr = PLAN_ORDER.reduce((sum, id) => sum + activeOn(id) * PLANS[id].price.monthly, 0);
  const referred = profiles.filter((p) => p.referred_by).length;
  const referredPaying = profiles.filter((p) => p.referred_by && p.plan && p.plan !== "free").length;

  const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + Number(x.amount), 0);
  const pending = sum(ledger.filter((c) => c.status === "pending"));
  const available = sum(ledger.filter((c) => c.status === "available" && !c.withdrawal_id));
  const paidOut = sum(ledger.filter((c) => c.status === "paid"));
  const clawed = sum(ledger.filter((c) => c.status === "clawed_back"));
  const queue = withdrawals.filter((w) => w.status === "requested" || w.status === "approved" || w.status === "processing");

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const money = (n: number) => "$" + n.toFixed(2);
  const cell = (v: string, l: string, tone?: string) => (
    <div style={{ padding: "15px 18px", borderLeft: "3px solid " + (tone ?? T.border) }}>
      <div style={{ fontSize: 23, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1040 }}>
      <div className="page-header" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, display: "flex" }}>Billing</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Revenue, subscriptions and the referral payout queue.</p>
      </div>

      {!billingConfigured() && (
        <div style={{ ...card, borderColor: T.amberBorder, background: T.amberSoft }}>
          <div style={{ padding: 16, fontSize: 13.5, color: T.body, lineHeight: 1.55 }}>
            <strong style={{ color: T.amberText }}>No payment processor is configured.</strong> Plans below are whatever
            has been set by hand from the console. Nothing here has been collected.
          </div>
        </div>
      )}

      <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginBottom: 16 }}>
        {cell(formatPrice(mrr), "Monthly run rate", T.green)}
        {cell(String(PLAN_ORDER.reduce((n, id) => n + activeOn(id), 0)), "Active subscriptions", T.green)}
        {cell(String(referredPaying) + " / " + referred, "Referred, paying", T.indigo)}
        {cell(money(available + pending), "Owed to referrers", T.amber)}
      </div>

      <div style={card}>
        <div style={head}>By plan</div>
        <div className="data-row" style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr .7fr 1fr", gap: 12, padding: "9px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 11, fontWeight: 600, color: T.body }}>
          <span>Plan</span><span>On it</span><span>Active</span><span>Monthly</span>
        </div>
        {PLAN_ORDER.map((id) => (
          <div key={id} className="data-row" style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr .7fr 1fr", gap: 12, padding: "11px 18px", borderBottom: "1px solid " + T.borderSoft, fontSize: 13, alignItems: "center" }}>
            <span style={{ color: T.heading }}>{PLANS[id].name}</span>
            <span>{countOn(id)}</span>
            <span>{activeOn(id)}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrice(activeOn(id) * PLANS[id].price.monthly)}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={head}>Referral liability</div>
        <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{money(pending)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Held, in the 30 day window</div>
          </div>
          <div style={{ padding: "14px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{money(available)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Cleared, withdrawable</div>
          </div>
          <div style={{ padding: "14px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{money(paidOut)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Paid out</div>
          </div>
          <div style={{ padding: "14px 18px", borderLeft: "1px solid " + T.borderSoft }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{money(clawed)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Clawed back</div>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={head}>Payout requests</div>
        {queue.length === 0 ? (
          <p style={{ padding: 18, fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.55 }}>
            Nothing waiting. Requests appear here once a referrer has cleared the minimum and asked to be paid.
          </p>
        ) : queue.map((w) => {
          const r = referrers.get(w.referrer_id);
          return (
            <div key={w.id} className="data-row" style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr .9fr auto", gap: 12, padding: "12px 18px", borderBottom: "1px solid " + T.borderSoft, alignItems: "center", fontSize: 13 }}>
              <span style={{ color: T.heading, overflowWrap: "anywhere" }}>{r?.contact_email ?? w.referrer_id.slice(0, 8)}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{w.currency} {Number(w.amount).toFixed(2)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, background: w.status === "requested" ? T.amber : T.green, flex: "none" }} />
                {w.status}
              </span>
              <PayoutActions withdrawalId={w.id} status={w.status} />
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: T.faint, lineHeight: 1.6, margin: 0 }}>
        Run rate is derived from who is on which plan, not from money received. Flutterwave holds the record of what
        was actually collected, so treat this as the rate the subscriptions imply rather than as accounts.
        {" "}<a href={"/" + ADMIN_SLUG + "/tiers"} style={{ color: T.muted }}>Set a plan by hand</a>.
      </p>
    </div>
  );
}