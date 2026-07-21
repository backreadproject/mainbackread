import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("admin_audit").select("actor_email, action, target_user_id, detail, created_at").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Audit log</h1>
      <div style={{ border: "1px solid #1E2A24", borderRadius: 10 }}>
        {rows.length === 0 && <div style={{ padding: 14, color: "#93A79C", fontSize: 13 }}>No admin actions recorded yet.</div>}
        {rows.map((r, i) => (
          <div key={i} style={{ padding: "10px 14px", borderTop: i ? "1px solid #1E2A24" : "none", fontSize: 13 }}>
            <div><span style={{ color: "#33E6A2" }}>{r.action}</span> by {r.actor_email || "—"}</div>
            <div style={{ color: "#93A79C", fontSize: 12 }}>{r.target_user_id ? `user ${r.target_user_id}` : ""}{r.detail ? " · " + JSON.stringify(r.detail) : ""} · {new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
