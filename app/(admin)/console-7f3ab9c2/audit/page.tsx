import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PER_PAGE = 50;
function qs(over: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(over)) {
    if (v && v.trim()) parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v.trim()));
  }
  return parts.length ? "?" + parts.join("&") : "";
}
export default async function AuditPage({ searchParams }: {
  searchParams: Promise<{ q?: string; action?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const action = (sp.action ?? "").trim();
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const admin = createAdminClient();
  // The action list is built from what has actually happened, so it can never
  // drift from the codebase the way a hardcoded list would.
  const { data: kinds } = await admin.from("admin_audit").select("action").limit(2000);
  const actions = [...new Set((kinds ?? []).map((k) => k.action as string))].sort();
  // Filtering and counting happen in the database. The old page loaded 200 rows
  // and stopped; anything older was simply unreachable.
  let query = admin
    .from("admin_audit")
    .select("id, actor_email, action, target_user_id, detail, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (action) query = query.eq("action", action);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59.999Z");
  if (q) {
    // detail is jsonb, so it is cast to text to search inside it. That is how an
    // email or a document title buried in the payload becomes findable.
    query = query.or(
      "actor_email.ilike.%" + q + "%,action.ilike.%" + q + "%,detail->>email.ilike.%" + q + "%,detail->>title.ilike.%" + q + "%,detail->>name.ilike.%" + q + "%"
    );
  }
  const start = (page - 1) * PER_PAGE;
  const { data, count } = await query.range(start, start + PER_PAGE - 1);
  const rows = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtering = !!(q || action || from || to);
  const mono = "'DM Mono', ui-monospace, monospace";
  const grid = "1.6fr 1.4fr auto";
  const field = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading };
  // Deletions are what matter when something has gone wrong, so they get the
  // danger dot rather than being one more grey line in a list.
  const dotFor = (a: string) => (/delete|erase|remove|ban|suspend/i.test(a) ? T.danger : /create|add|restore/i.test(a) ? T.green : T.faint);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Audit log</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Every admin action, most recent first. Search an email, a document title, or an action.</p>
        <form style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", margin: "26px 0 16px" }}>
          <input name="q" defaultValue={q} placeholder="Email, title, or action" style={{ ...field, width: 230 }} />
          <select name="action" defaultValue={action} style={{ ...field, minWidth: 170 }}>
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <label style={{ fontSize: 12.5, color: T.muted, display: "inline-flex", alignItems: "center", gap: 7 }}>
            From <input type="date" name="from" defaultValue={from} style={{ ...field, width: 150 }} />
          </label>
          <label style={{ fontSize: 12.5, color: T.muted, display: "inline-flex", alignItems: "center", gap: 7 }}>
            To <input type="date" name="to" defaultValue={to} style={{ ...field, width: 150 }} />
          </label>
          <button type="submit" style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>Filter</button>
          {filtering && <a href={"/" + ADMIN_SLUG + "/audit"} style={{ height: 34, display: "inline-flex", alignItems: "center", padding: "0 13px", border: "1px solid " + T.border, borderRadius: T.rBtn, fontSize: 13.5, color: T.body, textDecoration: "none" }}>Clear</a>}
        </form>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Action</span><span>Target</span><span>When</span>
          </div>
          {rows.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>
              {filtering ? "Nothing matches those filters." : "No admin actions recorded yet."}
            </div>
          )}
          {rows.map((r, i) => (
            <div key={r.id as string} style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "12px 18px", borderBottom: i < rows.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "baseline" }}>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: dotFor(r.action as string), position: "relative", top: -1 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.action as string}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(r.actor_email as string) || "\u2014"}</span>
                </span>
              </span>
              <span style={{ minWidth: 0, fontSize: 12.5, color: T.muted, fontFamily: mono, overflowWrap: "anywhere" }}>
                {(r.target_user_id as string) || "\u2014"}
                {r.detail ? <span style={{ display: "block", color: T.faint, marginTop: 2 }}>{JSON.stringify(r.detail)}</span> : null}
              </span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: mono, whiteSpace: "nowrap" }}>{new Date(r.created_at as string).toLocaleString()}</span>
            </div>
          ))}
          {total > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
              <span>{total.toLocaleString()} {total === 1 ? "entry" : "entries"}{filtering ? " matching" : ""}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {page > 1
                  ? <a href={qs({ q, action, from, to, page: String(page - 1) })} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Previous</a>
                  : <span style={{ color: T.faint }}>Previous</span>}
                <span>Page {page} of {pages}</span>
                {page < pages
                  ? <a href={qs({ q, action, from, to, page: String(page + 1) })} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Next</a>
                  : <span style={{ color: T.faint }}>Next</span>}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}