import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
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
    ["Accounts", accounts], ["Organizations", orgs], ["Documents", documents],
    ["Recipients", recipients], ["Opens", opens], ["Questions", questions],
    ["Forwards", forwards], ["Verdicts run", verdicts], ["Sends", sends],
  ];
  const mono = "'DM Mono', ui-monospace, monospace";
  const dotFor = (kind: string) => (kind === "question" ? T.indigo : kind === "forwarded" ? T.amber : kind === "opened" ? T.green : T.faint);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Overview</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Everything across ReadProspects, at a glance.</p>
        {/* One bordered block with hairline dividers, rather than nine floating
            cards. Three columns so the rows line up and the numbers compare. */}
        <div className="adm-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginTop: 26 }}>
          {cards.map(([k, v], i) => (
            <div key={k} style={{ padding: "15px 18px", borderLeft: i % 3 === 0 ? "none" : "1px solid " + T.border, borderTop: i < 3 ? "none" : "1px solid " + T.border }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString()}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{k}</div>
            </div>
          ))}
        </div>
        <section style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard }}>
            <h2 style={{ fontSize: 12.5, fontWeight: 600, color: T.body, margin: 0 }}>Recent signals</h2>
            <Link href={"/" + ADMIN_SLUG + "/accounts"} style={{ fontSize: 12.5, color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Manage accounts</Link>
          </div>
          {(!recent || recent.length === 0) && <div style={{ padding: 40, color: T.muted, fontSize: 13.5, textAlign: "center" }}>No signals yet.</div>}
          {(recent ?? []).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < (recent ?? []).length - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13.5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0, color: T.heading }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: dotFor(s.kind) }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label.get(s.recipient_id) || "Reader"}</span>
                <span style={{ color: T.muted, flex: "none" }}>{s.kind}</span>
              </span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: mono, flex: "none", whiteSpace: "nowrap" }}>{new Date(s.created_at).toLocaleString()}</span>
            </div>
          ))}
        </section>
      </main>
      <style>{`@media (max-width: 820px){ .adm-stats{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}