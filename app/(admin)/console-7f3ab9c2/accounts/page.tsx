import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import Link from "next/link";

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
    return { id: u.id, email: u.email ?? "—", created: u.created_at, name: name || "—", type: p?.account_type ?? "personal", plan: p?.plan ?? "free" };
  }).sort((a, b) => (a.created < b.created ? 1 : -1));

  const grid = { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr" } as const;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Accounts</h1>
      <p style={{ color: "#93A79C", fontSize: 13, marginBottom: 16 }}>{rows.length} shown (first 200).</p>
      <div style={{ border: "1px solid #1E2A24", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ ...grid, padding: "10px 14px", fontSize: 12, color: "#93A79C", background: "#111A16" }}>
          <span>Email</span><span>Name</span><span>Type</span><span>Plan</span>
        </div>
        {rows.map((r) => (
          <Link key={r.id} href={`/${ADMIN_SLUG}/accounts/${r.id}`} style={{ ...grid, padding: "11px 14px", fontSize: 13, borderTop: "1px solid #1E2A24", color: "#E7EDEA", textDecoration: "none" }}>
            <span>{r.email}</span><span>{r.name}</span><span>{r.type}</span><span>{r.plan}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
