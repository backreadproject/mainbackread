import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel } from "@/lib/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Prof = { id: string; first_name: string | null; last_name: string | null; account_type: string | null; active_org_id: string | null; plan: string | null };

export default async function AccountsPage() {
  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = list?.users ?? [];
  const ids = users.map((u) => u.id);
  const { data: profs } = ids.length ? await admin.from("profiles").select("id, first_name, last_name, account_type, active_org_id, plan").in("id", ids) : { data: [] };
  const pmap = new Map(((profs ?? []) as Prof[]).map((p) => [p.id, p]));

  const rows = users.map((u) => {
    const p = pmap.get(u.id);
    const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
    return { id: u.id, email: u.email ?? "\u2014", created: u.created_at, name: name || "\u2014", type: p?.account_type ?? "personal", plan: p?.plan ?? "free" };
  }).sort((a, b) => (a.created < b.created ? 1 : -1));

  const grid = "2fr 1.5fr 1fr 1fr";
  const pill = (text: string, pos: boolean) => (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: pos ? T.pillPosBg : T.pillNeutralBg, color: pos ? T.pillPosText : T.body }}>{text}</span>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Accounts</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>{rows.length} shown (first 200).</p>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>Email</span><span>Name</span><span>Type</span><span>Plan</span>
          </div>
          {rows.map((r, i) => (
            <a key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "15px 18px", borderTop: i ? `1px solid ${T.border}` : "none", alignItems: "center", textDecoration: "none" }}>
              <span className="data-cell dc-title" data-label="Email" style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
              <span className="data-cell" data-label="Name" style={{ fontSize: 14, color: T.body }}>{r.name}</span>
              <span className="data-cell" data-label="Type">{pill(r.type, r.type !== "personal")}</span>
              <span className="data-cell" data-label="Plan">{pill(r.plan, r.plan !== "free")}</span>
            </a>
          ))}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:#FCFCFD}`}</style>
    </div>
  );
}
