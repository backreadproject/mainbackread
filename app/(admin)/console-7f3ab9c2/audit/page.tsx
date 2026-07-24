import { createAdminClient } from "@/lib/supabase/admin";
import { T, pageHeading } from "@/lib/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("admin_audit").select("actor_email, action, target_user_id, detail, created_at").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  const mono = "'DM Mono', ui-monospace, monospace";
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Audit log</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Every admin action, most recent first.</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          {rows.length === 0 && <div style={{ padding: 22, color: T.muted, fontSize: 13, textAlign: "center" }}>No admin actions recorded yet.</div>}
          {rows.map((r, i) => (
            <div key={i} style={{ padding: "13px 18px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 14, color: T.heading }}><span style={{ color: T.green, fontWeight: 600 }}>{r.action}</span> by {r.actor_email || "\u2014"}</div>
              <div style={{ color: T.muted, fontSize: 12, fontFamily: mono, marginTop: 3 }}>{r.target_user_id ? `user ${r.target_user_id}` : ""}{r.detail ? " \u00b7 " + JSON.stringify(r.detail) : ""} {"\u00b7"} {new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

