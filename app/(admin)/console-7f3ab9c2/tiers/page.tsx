import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
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
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const cap = (v: number | null) => (v === null ? "unlimited" : String(v));
  const accessDot = (a: string) => (a === "locked" ? T.danger : a === "trial" ? T.amber : T.green);
  const limit = (l: string, v: string) => (
    <div>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 2 }}>{l}</div>
      <div style={{ fontSize: 13.5, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1100, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Tiers</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Plan distribution, limits, and who needs attention.</p>
        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(" + PLAN_ORDER.length + ", 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, margin: "26px 0 18px" }}>
          {PLAN_ORDER.map((id, i) => (
            <div key={id} style={{ padding: "15px 18px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{(byPlan.get(id) ?? []).length}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{PLANS[id].name}</div>
            </div>
          ))}
        </div>
        {(expiring.length > 0 || locked.length > 0) && (
          <div style={{ ...card, borderColor: T.amberBorder }}>
            <div style={{ ...head, background: T.amberSoft, borderBottomColor: T.amberBorder }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.amberText }}>Needs attention</span>
              <span style={{ fontSize: 12.5, color: T.amberText }}>{expiring.length + locked.length}</span>
            </div>
            {[...expiring, ...locked].map((r, i) => (
              <a key={r.id} href={"/" + ADMIN_SLUG + "/accounts/" + r.id} className="t-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: i < expiring.length + locked.length - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13.5, textDecoration: "none", alignItems: "center" }}>
                <span style={{ color: T.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: T.heading, flex: "none", whiteSpace: "nowrap" }}>
                  <i style={{ width: 6, height: 6, borderRadius: 2, background: accessDot(r.access) }} />
                  {r.access === "locked" ? "trial lapsed, locked" : "trial ends in " + r.daysLeft + "d"}
                </span>
              </a>
            ))}
          </div>
        )}
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const members = byPlan.get(id) ?? [];
          const feats = Object.entries(plan.features).filter(([, on]) => on).map(([k]) => k);
          return (
            <div key={id} style={card}>
              <div style={head}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: T.body }}>{plan.name}</span>
                  <span style={{ fontSize: 12.5, color: T.muted }}> {"\u00b7"} {plan.tagline}</span>
                </span>
                <span style={{ fontSize: 12.5, color: T.muted, fontFamily: mono, flex: "none" }}>{members.length}</span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginBottom: members.length ? 16 : 0 }}>
                  {limit("Docs / mo", cap(plan.limits.documentsPerMonth))}
                  {limit("Verdicts / doc", cap(plan.limits.verdictsPerDocumentPerMonth))}
                  {limit("Recipients / doc", cap(plan.limits.recipientsPerDocument))}
                  {limit("Sends / mo", cap(plan.limits.sendsPerMonth))}
                  {limit("Seats", cap(plan.limits.seats))}
                  {limit("Features on", feats.length + " of " + Object.keys(plan.features).length)}
                </div>
                {members.length > 0 && (
                  <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
                    {members.slice(0, 12).map((r, i) => (
                      <a key={r.id} href={"/" + ADMIN_SLUG + "/accounts/" + r.id} className="t-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: i < Math.min(members.length, 12) - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13, textDecoration: "none", alignItems: "center" }}>
                        <span style={{ color: T.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.email}{r.orgName ? <span style={{ color: T.faint }}> {"\u00b7"} {r.orgName}</span> : null}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: T.muted, fontFamily: mono, fontSize: 12, flex: "none", whiteSpace: "nowrap" }}>
                          <i style={{ width: 6, height: 6, borderRadius: 2, background: accessDot(r.access) }} />
                          {r.access === "trial" ? "trial " + r.daysLeft + "d" : r.access}
                        </span>
                      </a>
                    ))}
                    {members.length > 12 && <div style={{ padding: "10px 12px", borderTop: "1px solid " + T.borderSoft, fontSize: 12.5, color: T.faint }}>and {members.length - 12} more</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}@media (max-width: 900px){ .stat-strip{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}