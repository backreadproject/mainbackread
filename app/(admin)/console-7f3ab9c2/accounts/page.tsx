import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel } from "@/lib/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Prof = { id: string; first_name: string | null; last_name: string | null; account_type: string | null; active_org_id: string | null; plan: string | null };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim().toLowerCase();
  const admin = createAdminClient();

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = list?.users ?? [];
  const ids = users.map((u) => u.id);
  const { data: profs } = ids.length ? await admin.from("profiles").select("id, first_name, last_name, account_type, active_org_id, plan").in("id", ids) : { data: [] };
  const pmap = new Map(((profs ?? []) as Prof[]).map((p) => [p.id, p]));
  const { data: orgs } = await admin.from("organizations").select("id, name, plan, subscription_active");
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
  const { data: docs } = await admin.from("documents").select("id, owner_id");
  const docCount = new Map<string, number>();
  for (const d of docs ?? []) docCount.set(d.owner_id, (docCount.get(d.owner_id) ?? 0) + 1);

  let rows = users.map((u) => {
    const p = pmap.get(u.id);
    const org = p?.active_org_id ? orgById.get(p.active_org_id) : null;
    const isOrg = p?.account_type === "company" || p?.account_type === "organization";
    const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
    const banned = !!(u as unknown as { banned_until?: string | null }).banned_until;
    return {
      id: u.id, email: u.email ?? "unknown", name: name || "\u2014",
      type: isOrg ? "organization" : "personal",
      plan: isOrg ? ((org?.plan as string | null) ?? "company_1") : (p?.plan ?? "free"),
      orgName: (org?.name as string | null) ?? null,
      docs: docCount.get(u.id) ?? 0,
      created: u.created_at, lastSignIn: u.last_sign_in_at ?? null, banned,
    };
  });
  if (term) rows = rows.filter((r) => r.email.toLowerCase().includes(term) || r.name.toLowerCase().includes(term) || (r.orgName ?? "").toLowerCase().includes(term));
  rows.sort((a, b) => (a.created < b.created ? 1 : -1));

  const grid = "2fr 1.4fr 1fr 1fr 0.6fr 1fr";
  const mono = "'DM Mono', ui-monospace, monospace";
  const pill = (text: string, tone: "pos" | "neutral" | "warn") => (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill,
      background: tone === "pos" ? T.pillPosBg : tone === "warn" ? "var(--rp-danger-soft)" : T.pillNeutralBg,
      color: tone === "pos" ? T.pillPosText : tone === "warn" ? "var(--rp-danger-text)" : T.body }}>{text}</span>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1120, padding: "26px 30px 60px" }}>
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={pageHeading}>Accounts</h1>
            <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>{rows.length} {term ? "matching" : "total"} (first 200 loaded).</p>
          </div>
          <form style={{ display: "flex", gap: 8 }}>
            <input name="q" defaultValue={q ?? ""} placeholder="Search email, name, org"
              style={{ background: "var(--rp-card)", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, width: 260 }} />
            <button type="submit" style={{ background: T.green, color: "var(--rp-on-accent)", border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Search</button>
          </form>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>Email</span><span>Name</span><span>Type</span><span>Plan</span><span>Docs</span><span>Last seen</span>
          </div>
          {rows.length === 0 && <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No accounts match.</div>}
          {rows.map((r, i) => (
            <a key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "14px 18px", borderTop: i ? `1px solid ${T.border}` : "none", alignItems: "center", textDecoration: "none" }}>
              <span className="data-cell dc-title" data-label="Email" style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.email}{r.banned && <span style={{ marginLeft: 7 }}>{pill("suspended", "warn")}</span>}
              </span>
              <span className="data-cell" data-label="Name" style={{ fontSize: 14, color: T.body }}>{r.name}{r.orgName ? <span style={{ color: T.muted, fontSize: 12 }}> {"\u00b7"} {r.orgName}</span> : null}</span>
              <span className="data-cell" data-label="Type">{pill(r.type, r.type === "organization" ? "pos" : "neutral")}</span>
              <span className="data-cell" data-label="Plan">{pill(r.plan, r.plan !== "free" ? "pos" : "neutral")}</span>
              <span className="data-cell" data-label="Docs" style={{ fontSize: 14, color: T.body }}>{r.docs}</span>
              <span className="data-cell" data-label="Last seen" style={{ fontSize: 12, color: T.muted, fontFamily: mono }}>{r.lastSignIn ? new Date(r.lastSignIn).toLocaleDateString() : "never"}</span>
            </a>
          ))}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-soft)}`}</style>
    </div>
  );
}
