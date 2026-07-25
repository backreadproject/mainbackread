import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import { getPlan } from "@/lib/plans";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function OrgsPage() {
  const admin = createAdminClient();
  const { data: orgsRaw } = await admin.from("organizations").select("id, name, domain, plan, subscription_active, created_at, created_by").order("created_at", { ascending: false });
  const orgs = orgsRaw ?? [];
  const orgIds = orgs.map((o) => o.id);
  const { data: mems } = orgIds.length ? await admin.from("organization_members").select("id, organization_id").in("organization_id", orgIds) : { data: [] };
  const { data: projs } = orgIds.length ? await admin.from("projects").select("id, organization_id").in("organization_id", orgIds) : { data: [] };
  const { data: docs } = orgIds.length ? await admin.from("documents").select("id, organization_id").in("organization_id", orgIds) : { data: [] };
  const { data: invs } = orgIds.length ? await admin.from("invitations").select("id, organization_id, status").in("organization_id", orgIds) : { data: [] };
  const count = (rows: { organization_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.organization_id, (m.get(r.organization_id) ?? 0) + 1);
    return m;
  };
  const memCount = count(mems), projCount = count(projs), docCount = count(docs);
  const pendingInv = count((invs ?? []).filter((i) => i.status === "pending") as { organization_id: string }[]);
  const grid = "1.8fr 1.2fr 1fr 0.8fr 0.7fr 0.7fr";
  const mono = "'DM Mono', ui-monospace, monospace";
  const cells: [number, string][] = [
    [orgs.length, "Organizations"],
    [orgs.filter((o) => o.subscription_active).length, "Subscribed"],
    [(mems ?? []).length, "Members"],
    [(projs ?? []).length, "Projects"],
    [(docs ?? []).length, "Org documents"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1100, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Organizations</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Every workspace, its team, and what sits inside it.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginTop: 26 }} className="stat-strip">
          {cells.map(([v, l], i) => (
            <div key={l} style={{ padding: "15px 18px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 18 }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Organization</span><span>Plan</span><span>Seats</span><span>Projects</span><span>Docs</span><span>Invites</span>
          </div>
          {orgs.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No organizations yet.</div>}
          {orgs.map((o, i) => {
            const plan = getPlan(o.plan);
            const seats = memCount.get(o.id) ?? 0;
            const seatLimit = plan.limits.seats;
            const overSeats = seatLimit !== null && seats > seatLimit;
            const pend = pendingInv.get(o.id) ?? 0;
            return (
              <a key={o.id} href={"/" + ADMIN_SLUG + "/orgs/" + o.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "13px 18px", borderBottom: i < orgs.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", textDecoration: "none" }}>
                <span className="data-cell dc-title" data-label="Organization" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, borderBottom: "1px solid " + T.border, paddingBottom: 1 }}>{o.name || "Unnamed"}</span>
                  {o.domain ? <span style={{ color: T.faint, fontSize: 12.5 }}> {"\u00b7"} {o.domain}</span> : null}
                </span>
                <span className="data-cell" data-label="Plan">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, whiteSpace: "nowrap" }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: o.subscription_active ? T.green : T.faint }} />
                    {plan.name}{o.subscription_active ? "" : " \u00b7 unpaid"}
                  </span>
                </span>
                <span className="data-cell" data-label="Seats" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {overSeats && <i title="Over the seat limit" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.danger }} />}
                  {seats}{seatLimit !== null ? " / " + seatLimit : ""}
                </span>
                <span className="data-cell" data-label="Projects" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{projCount.get(o.id) ?? 0}</span>
                <span className="data-cell" data-label="Docs" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{docCount.get(o.id) ?? 0}</span>
                <span className="data-cell" data-label="Invites" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: pend ? T.heading : T.faint, fontFamily: mono }}>
                  {pend > 0 && <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.amber }} />}
                  {pend}
                </span>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}@media (max-width: 900px){ .stat-strip{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}