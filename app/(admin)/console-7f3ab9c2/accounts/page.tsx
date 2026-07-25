import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
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
  const sel = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading };
  const state = (label: string, dot: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, whiteSpace: "nowrap" }}>
      <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: dot }} />{label}
    </span>
  );
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1120, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Accounts</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{rows.length} {term ? "matching" : "total"}. First 200 loaded.</p>
        <form style={{ display: "flex", gap: 9, justifyContent: "flex-end", margin: "26px 0 16px" }}>
          <input name="q" defaultValue={q ?? ""} placeholder="Search email, name, org" style={{ ...sel, width: 260 }} />
          <button type="submit" style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>Search</button>
        </form>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Email</span><span>Name</span><span>Type</span><span>Plan</span><span>Docs</span><span>Last seen</span>
          </div>
          {rows.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No accounts match.</div>}
          {rows.map((r, i) => (
            <a key={r.id} href={"/" + ADMIN_SLUG + "/accounts/" + r.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", textDecoration: "none" }}>
              <span className="data-cell dc-title" data-label="Email" style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {r.banned && <i title="Suspended" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.danger }} />}
                <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid " + T.border, paddingBottom: 1 }}>{r.email}</span>
              </span>
              <span className="data-cell" data-label="Name" style={{ fontSize: 13.5, color: T.body, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}{r.orgName ? <span style={{ color: T.faint }}> {"\u00b7"} {r.orgName}</span> : null}
              </span>
              <span className="data-cell" data-label="Type">{state(r.type, r.type === "organization" ? T.green : T.faint)}</span>
              <span className="data-cell" data-label="Plan">{state(r.plan, r.plan !== "free" ? T.green : T.faint)}</span>
              <span className="data-cell" data-label="Docs" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{r.docs}</span>
              <span className="data-cell" data-label="Last seen" style={{ fontSize: 12, color: T.faint, fontFamily: mono, whiteSpace: "nowrap" }}>{r.lastSignIn ? new Date(r.lastSignIn).toLocaleDateString() : "never"}</span>
            </a>
          ))}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
    </div>
  );
}