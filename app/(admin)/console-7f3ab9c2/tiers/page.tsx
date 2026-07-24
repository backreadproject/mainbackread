import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel, statCard } from "@/lib/theme";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { trialInfo } from "@/lib/trial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Prof = { id: string; first_name: string | null; last_name: string | null; account_type: string | null; active_org_id: string | null; plan: string | null; trial_started_at: string | null };

export default async function TiersPage() {
  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = list?.users ?? [];
  const ids = users.map((u) => u.id);
  const { data: profs } = ids.length ? await admin.from("profiles").select("id, first_name, last_name, account_type, active_org_id, plan, trial_started_at").in("id", ids) : { data: [] };
  const pmap = new Map(((profs ?? []) as Prof[]).map((p) => [p.id, p]));
  const { data: orgs } = await admin.from("organizations").select("id, name, plan, subscription_active");
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  const rows = users.map((u) => {
    const p = pmap.get(u.id);
    const isOrg = p?.account_type === "company" || p?.account_type === "organization";
    const org = p?.active_org_id ? orgById.get(p.active_org_id) : null;
    const planId = (isOrg ? ((org?.plan as string | null) ?? "company_1") : (p?.plan ?? "free")) as PlanId;
    const subscribed = !!org?.subscription_active;
    const t = trialInfo(p?.trial_started_at ?? null);
    let access: "active" | "trial" | "locked" = "active";
    if (isOrg && !subscribed) {
      if (t.started) access = t.active ? "trial" : "locked";
    }
    return { id: u.id, email: u.email ?? "unknown", name: [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() || "\u2014",
      planId, isOrg, orgName: (org?.name as string | null) ?? null, access, daysLeft: t.daysLeft, subscribed };
  });

  const byPlan = new Map<PlanId, typeof rows>();
  for (const r of rows) { const a = byPlan.get(r.planId) ?? []; a.push(r); byPlan.set(r.planId, a); }
  const expiring = rows.filter((r) => r.access === "trial" && r.daysLeft <= 2).sort((a, b) => a.daysLeft - b.daysLeft);
  const locked = rows.filter((r) => r.access === "locked");

  const box = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18, marginBottom: 16 } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const cap = (v: number | null) => (v === null ? "unlimited" : String(v));

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1100, padding: "26px 30px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Tiers</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Plan distribution, limits, and who needs attention.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
          {PLAN_ORDER.map((id) => (
            <div key={id} style={statCard}>
              <div style={{ ...microLabel, marginBottom: 6 }}>{PLANS[id].name}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, fontVariantNumeric: "tabular-nums" }}>{(byPlan.get(id) ?? []).length}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>accounts</div>
            </div>
          ))}
        </div>

        {(expiring.length > 0 || locked.length > 0) && (
          <div style={box}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Needs attention</h2>
            {expiring.map((r, i) => (
              <a key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 14, textDecoration: "none" }}>
                <span style={{ color: T.heading, fontWeight: 600 }}>{r.email}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: "var(--rp-amber-soft)", color: "var(--rp-amber-text)" }}>trial ends in {r.daysLeft}d</span>
              </a>
            ))}
            {locked.map((r, i) => (
              <a key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: (i || expiring.length) ? `1px solid ${T.border}` : "none", fontSize: 14, textDecoration: "none" }}>
                <span style={{ color: T.heading, fontWeight: 600 }}>{r.email}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: "var(--rp-danger-soft)", color: "var(--rp-danger-text)" }}>trial lapsed \u2014 locked</span>
              </a>
            ))}
          </div>
        )}

        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const members = byPlan.get(id) ?? [];
          const feats = Object.entries(plan.features).filter(([, on]) => on).map(([k]) => k);
          return (
            <div key={id} style={box}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.heading, margin: 0 }}>{plan.name}</h2>
                  <p style={{ fontSize: 13, color: T.muted, margin: "3px 0 0" }}>{plan.tagline}</p>
                </div>
                <span style={{ fontSize: 12, color: T.muted, fontFamily: mono }}>{members.length} account{members.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginBottom: 12 }}>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Docs / mo</div><div style={{ fontSize: 14, color: T.heading }}>{cap(plan.limits.documentsPerMonth)}</div></div>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Verdicts / doc</div><div style={{ fontSize: 14, color: T.heading }}>{cap(plan.limits.verdictsPerDocumentPerMonth)}</div></div>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Recipients / doc</div><div style={{ fontSize: 14, color: T.heading }}>{cap(plan.limits.recipientsPerDocument)}</div></div>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Sends / mo</div><div style={{ fontSize: 14, color: T.heading }}>{cap(plan.limits.sendsPerMonth)}</div></div>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Seats</div><div style={{ fontSize: 14, color: T.heading }}>{cap(plan.limits.seats)}</div></div>
                <div><div style={{ ...microLabel, marginBottom: 3 }}>Features on</div><div style={{ fontSize: 14, color: T.heading }}>{feats.length} of {Object.keys(plan.features).length}</div></div>
              </div>
              {members.length > 0 && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                  {members.slice(0, 12).map((r) => (
                    <a key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, textDecoration: "none" }}>
                      <span style={{ color: T.heading }}>{r.email}{r.orgName ? <span style={{ color: T.muted }}> {"\u00b7"} {r.orgName}</span> : null}</span>
                      <span style={{ color: r.access === "locked" ? "var(--rp-danger-text)" : r.access === "trial" ? "var(--rp-amber-text)" : T.muted, fontFamily: mono, fontSize: 12 }}>
                        {r.access === "trial" ? `trial ${r.daysLeft}d` : r.access}
                      </span>
                    </a>
                  ))}
                  {members.length > 12 && <p style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>and {members.length - 12} more</p>}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

