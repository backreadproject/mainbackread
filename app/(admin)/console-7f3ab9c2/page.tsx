import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, microLabel, pageHeading, statCard } from "@/lib/theme";
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
  const mono = "'DM Mono', ui-monospace, monospace";

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "26px 32px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Overview</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Everything across ReadProspects, at a glance.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
          {cards.map(([k, v]) => (
            <div key={k} style={statCard}>
              <div style={{ ...microLabel, marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.heading, margin: 0 }}>Recent signals</h2>
            <Link href={`/${ADMIN_SLUG}/accounts`} style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none" }}>Manage accounts &rarr;</Link>
          </div>
          <div style={{ padding: "6px 8px" }}>
            {(recent ?? []).map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 14 }}>
                <span style={{ color: T.heading }}>{label.get(s.recipient_id) || "Reader"}<span style={{ color: T.muted }}> {"\u00b7"} </span><span style={{ color: T.green, fontWeight: 600 }}>{s.kind}</span></span>
                <span style={{ fontSize: 11, color: T.muted, fontFamily: mono }}>{new Date(s.created_at).toLocaleString()}</span>
              </div>
            ))}
            {(!recent || recent.length === 0) && <div style={{ padding: 22, color: T.muted, fontSize: 13, textAlign: "center" }}>No signals yet.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

