"use client";
import type { AccessState } from "@/lib/plan-context";
import { useState } from "react";
import { T } from "@/lib/theme";
import { PLANS, PLAN_ORDER, priceFor, formatPrice, annualSaving, type PlanId } from "@/lib/plans";
import { postJson, errMsg } from "@/lib/fetch-json";
type Use = { used: number; limit: number | null };
export default function BillingClient({
  currentPlan, scope, access, trialDaysLeft, discounted, configured, usage,
}: {
  currentPlan: PlanId; scope: "personal" | "org"; access: AccessState;
  trialDaysLeft: number; discounted: boolean; configured: boolean;
  usage: { documents: Use; sends: Use; seats: Use | null };
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState("");
  const plan = PLANS[currentPlan];

  async function choose(id: PlanId) {
    setBusy(id); setMsg("");
    try {
      const j = await postJson<{ url: string }>("/api/billing/checkout", { planId: id, interval });
      window.location.href = j.url;
    } catch (e) {
      setMsg(errMsg(e, "Could not start checkout."));
      setBusy(null);
    }
  }

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;

  const bar = (label: string, u: Use) => {
    if (u.limit === null) {
      return (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", fontSize: 13 }}>
          <span style={{ color: T.muted }}>{label}</span>
          <span style={{ color: T.body }}>{u.used} used <span style={{ color: T.faint }}>&middot; unlimited</span></span>
        </div>
      );
    }
    const pct = Math.min(100, Math.round((u.used / Math.max(u.limit, 1)) * 100));
    const full = u.used >= u.limit;
    return (
      <div key={label} style={{ padding: "9px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: T.muted }}>{label}</span>
          <span style={{ color: full ? T.dangerText : T.body, fontVariantNumeric: "tabular-nums" }}>{u.used} of {u.limit}</span>
        </div>
        <div style={{ height: 6, background: T.soft, border: "1px solid " + T.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: full ? T.danger : T.green }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Plan and billing</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 26px" }}>What you are on, what you are using, and what else is available.</p>

        {access === "locked" && (
          <div style={{ ...card, borderColor: T.dangerBorder, background: T.dangerSoft }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.dangerText, marginBottom: 4 }}>Your trial has ended</div>
              <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: 0 }}>
                Everything you have created is safe and still here. Choose a plan below to start sharing again.
              </p>
            </div>
          </div>
        )}
        {access === "trial" && (
          <div style={{ ...card, borderColor: T.amberBorder, background: T.amberSoft }}>
            <div style={{ padding: 18, fontSize: 13.5, color: T.body }}>
              <strong style={{ color: T.amberText }}>{trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left</strong> on your trial.
            </div>
          </div>
        )}

        <div style={card}>
          <div style={head}>Your plan</div>
          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 21, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight }}>{plan.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, background: access === "locked" ? T.danger : access === "pending" ? T.amber : access === "trial" ? T.amber : T.green }} />
                {access === "locked" ? "Ended" : access === "pending" ? "Waiting" : access === "trial" ? "Trial" : "Active"}
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 14px" }}>{plan.tagline}</p>
            <div style={{ borderTop: "1px solid " + T.borderSoft, paddingTop: 4 }}>
              {bar("Documents this month", usage.documents)}
              {bar("Email sends this month", usage.sends)}
              {usage.seats && bar("Seats", usage.seats)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ display: "inline-flex", border: "1px solid " + T.border, borderRadius: T.rBtn, overflow: "hidden" }}>
            {(["monthly", "annual"] as const).map((k) => (
              <button key={k} onClick={() => setInterval(k)}
                style={{ padding: "7px 14px", fontSize: 13, fontFamily: T.font, cursor: "pointer", border: "none",
                  background: interval === k ? T.green : "transparent", color: interval === k ? T.onAccent : T.body,
                  fontWeight: interval === k ? 500 : 400 }}>
                {k === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
          {discounted && (
            <span style={{ fontSize: 12.5, color: T.greenText, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <i style={{ width: 6, height: 6, borderRadius: 2, background: T.green }} />
              5% referral discount applied to every price below
            </span>
          )}
        </div>

        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const list = priceFor(id, interval, false);
            const pay = priceFor(id, interval, discounted);
            const isCurrent = id === currentPlan;
            const orgOnly = id === "company_1" || id === "company_2";
            return (
              <div key={id} style={{ background: T.card, border: "1px solid " + (isCurrent ? T.greenBorder : T.border), borderRadius: T.rCard, padding: 16, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{p.name}</div>
                <div style={{ margin: "8px 0 2px", display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 23, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em" }}>{formatPrice(pay)}</span>
                  {pay !== list && <span style={{ fontSize: 13, color: T.faint, textDecoration: "line-through" }}>{formatPrice(list)}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: T.muted }}>
                  {list === 0 ? "free forever" : interval === "monthly" ? "per month" : "per year"}
                  {list > 0 && interval === "annual" && annualSaving(id) > 0 ? " \u00b7 saves " + annualSaving(id) + "%" : ""}
                </div>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: "10px 0 14px", flex: 1 }}>{p.tagline}</p>
                {isCurrent ? (
                  <span style={{ fontSize: 12.5, color: T.greenText, fontWeight: 500 }}>Your plan</span>
                ) : list === 0 ? (
                  <span style={{ fontSize: 12.5, color: T.faint }}>&mdash;</span>
                ) : (
                  <button onClick={() => choose(id)} disabled={busy !== null}
                    title={orgOnly && scope !== "org" ? "Create an organization first" : undefined}
                    style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
                      fontSize: 13, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                    {busy === id ? "Opening..." : "Choose " + p.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {msg && (
          <div style={{ ...card, borderColor: T.amberBorder, background: T.amberSoft }}>
            <p style={{ padding: 16, fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: 0 }}>{msg}</p>
          </div>
        )}
        {!configured && !msg && (
          <p style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, margin: 0 }}>
            Card payment is being finished now. Choosing a plan will tell you the moment it opens.
          </p>
        )}
      </main>
    </div>
  );
}