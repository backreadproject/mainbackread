import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;
async function n(admin: Admin, table: string, col: string, kind?: string): Promise<number> {
  const base = admin.from(table).select(col, { count: "exact", head: true });
  const { count } = kind ? await base.eq("kind", kind) : await base;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const [accounts, orgs, documents, recipients, opens, questions, forwards, verdicts, sends] = await Promise.all([
    n(admin, "profiles", "id"), n(admin, "organizations", "id"), n(admin, "documents", "id"), n(admin, "recipients", "id"),
    n(admin, "signals", "recipient_id", "opened"), n(admin, "signals", "recipient_id", "question"),
    n(admin, "signals", "recipient_id", "forwarded"), n(admin, "usage_events", "id", "verdict"), n(admin, "usage_events", "id", "send"),
  ]);

  const { data: recent } = await admin.from("signals").select("recipient_id, kind, created_at").order("created_at", { ascending: false }).limit(12);
  const rIds = [...new Set((recent ?? []).map((r) => r.recipient_id))];
  const { data: recs } = rIds.length ? await admin.from("recipients").select("id, label").in("id", rIds) : { data: [] };
  const label = new Map((recs ?? []).map((r) => [r.id, (r.label as string | null) ?? null]));

  const cards: [string, number][] = [
    ["Accounts", accounts], ["Organizations", orgs], ["Documents", documents], ["Recipients", recipients],
    ["Opens", opens], ["Questions", questions], ["Forwards", forwards], ["Verdicts run", verdicts], ["Sends", sends],
  ];

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Overview</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {cards.map(([k, v]) => (
          <div key={k} style={{ border: "1px solid #1E2A24", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#93A79C" }}>{k}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 15, margin: "22px 0 10px" }}>Recent signals</h2>
      <div style={{ border: "1px solid #1E2A24", borderRadius: 10 }}>
        {(recent ?? []).map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderTop: i ? "1px solid #1E2A24" : "none", fontSize: 13 }}>
            <span>{label.get(s.recipient_id) || "Reader"} — <span style={{ color: "#33E6A2" }}>{s.kind}</span></span>
            <span style={{ color: "#93A79C" }}>{new Date(s.created_at).toLocaleString()}</span>
          </div>
        ))}
        {(!recent || recent.length === 0) && <div style={{ padding: 14, color: "#93A79C", fontSize: 13 }}>No signals yet.</div>}
      </div>
      <p style={{ marginTop: 16, fontSize: 13 }}><Link href={`/${ADMIN_SLUG}/accounts`} style={{ color: "#33E6A2" }}>Manage accounts &rarr;</Link></p>
    </div>
  );
}
