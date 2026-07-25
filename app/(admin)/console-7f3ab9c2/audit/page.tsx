import { createAdminClient } from "@/lib/supabase/admin";
import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AuditPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("admin_audit").select("actor_email, action, target_user_id, detail, created_at").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  const mono = "'DM Mono', ui-monospace, monospace";
  // Deletions are the entries that matter when something has gone wrong, so they
  // get the danger dot rather than being one more grey line in a list.
  const dotFor = (action: string) => (/delete|erase|remove|ban|suspend/i.test(action) ? T.danger : /create|add|restore/i.test(action) ? T.green : T.faint);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Audit log</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Every admin action, most recent first. Last 200 entries.</p>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr auto", gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Action</span><span>Target</span><span>When</span>
          </div>
          {rows.length === 0 && <div style={{ padding: 40, color: T.muted, fontSize: 13.5, textAlign: "center" }}>No admin actions recorded yet.</div>}
          {rows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr auto", gap: 12, padding: "12px 18px", borderBottom: i < rows.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "baseline" }}>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: dotFor(r.action), position: "relative", top: -1 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.action}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.actor_email || "\u2014"}</span>
                </span>
              </span>
              <span style={{ minWidth: 0, fontSize: 12.5, color: T.muted, fontFamily: mono, overflowWrap: "anywhere" }}>
                {r.target_user_id ? r.target_user_id : "\u2014"}
                {r.detail ? <span style={{ display: "block", color: T.faint, marginTop: 2 }}>{JSON.stringify(r.detail)}</span> : null}
              </span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: mono, whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}