import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel, statCard } from "@/lib/theme";
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
  const totals = {
    orgs: orgs.length,
    members: (mems ?? []).length,
    projects: (projs ?? []).length,
    docs: (docs ?? []).length,
    subscribed: orgs.filter((o) => o.subscription_active).length,
  };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1100, padding: "26px 30px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Organizations</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Every workspace, its team, and what sits inside it.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
          {([["Organizations", totals.orgs], ["Subscribed", totals.subscribed], ["Members", totals.members], ["Projects", totals.projects], ["Org documents", totals.docs]] as [string, number][]).map(([k, v]) => (
            <div key={k} style={statCard}>
              <div style={{ ...microLabel, marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>Organization</span><span>Plan</span><span>Seats</span><span>Projects</span><span>Docs</span><span>Invites</span>
          </div>
          {orgs.length === 0 && <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No organizations yet.</div>}
          {orgs.map((o, i) => {
            const plan = getPlan(o.plan);
            const seats = memCount.get(o.id) ?? 0;
            const seatLimit = plan.limits.seats;
            const overSeats = seatLimit !== null && seats > seatLimit;
            return (
              <a key={o.id} href={`/${ADMIN_SLUG}/orgs/${o.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "14px 18px", borderTop: i ? `1px solid ${T.border}` : "none", alignItems: "center", textDecoration: "none" }}>
                <span className="data-cell dc-title" data-label="Organization" style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.name || "Unnamed"}{o.domain ? <span style={{ color: T.muted, fontWeight: 400, fontSize: 12 }}> {"\u00b7"} {o.domain}</span> : null}
                </span>
                <span className="data-cell" data-label="Plan">
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: o.subscription_active ? T.pillPosBg : T.pillNeutralBg, color: o.subscription_active ? T.pillPosText : T.body }}>
                    {plan.name}{o.subscription_active ? "" : " \u00b7 unpaid"}
                  </span>
                </span>
                <span className="data-cell" data-label="Seats" style={{ fontSize: 14, color: overSeats ? "#B42318" : T.body, fontWeight: overSeats ? 600 : 400 }}>{seats}{seatLimit !== null ? ` / ${seatLimit}` : ""}</span>
                <span className="data-cell" data-label="Projects" style={{ fontSize: 14, color: T.body }}>{projCount.get(o.id) ?? 0}</span>
                <span className="data-cell" data-label="Docs" style={{ fontSize: 14, color: T.body }}>{docCount.get(o.id) ?? 0}</span>
                <span className="data-cell" data-label="Invites" style={{ fontSize: 13, color: (pendingInv.get(o.id) ?? 0) ? "#B54708" : T.muted, fontFamily: mono }}>{pendingInv.get(o.id) ?? 0}</span>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:#FCFCFD}`}</style>
    </div>
  );
}
