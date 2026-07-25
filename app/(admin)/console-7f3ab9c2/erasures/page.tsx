import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Every erasure we have performed, both paths. erase_reader and
// erase_forward_mentions are the same legal act under different routes, so a
// compliance file that covered one and not the other would be worse than none.
export const ERASURE_ACTIONS = ["erase_reader", "erase_forward_mentions"];
/** A quotable reference derived from the audit row's own id, so it resolves back
 *  to exactly one record and cannot drift from the evidence. */
export function erasureRef(id: string): string {
  return "RP-ERA-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
export default async function ErasuresPage() {
  await requireAdminPage();
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_audit")
    .select("id, action, actor_email, detail, created_at")
    .in("action", ERASURE_ACTIONS)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  const mono = "'DM Mono', ui-monospace, monospace";
  const grid = "1.1fr 1.6fr 1fr 1.2fr";
  const subjectOf = (d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    return (o.email as string) || (o.name as string) || "unknown";
  };
  const removedOf = (d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const rows = Number(o.recipientRowsRemoved ?? (o.recipientId ? 1 : 0));
    const sigs = Number(o.signalsRemoved ?? 0);
    const msgs = Number(o.messagesRemoved ?? 0);
    return rows + " reader record" + (rows === 1 ? "" : "s") + " \u00b7 " + sigs + " signals \u00b7 " + msgs + " messages";
  };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Erasures</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Every data subject erasure performed, newest first. Open one to produce a report you can send or file.</p>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Reference</span><span>Subject</span><span>Route</span><span>When</span>
          </div>
          {rows.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No erasures recorded yet.</div>}
          {rows.map((r, i) => (
            <a key={r.id as string} href={"/" + ADMIN_SLUG + "/erasures/" + r.id} className="t-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", textDecoration: "none" }}>
              <span style={{ fontSize: 13, color: T.heading, fontFamily: mono, borderBottom: "1px solid " + T.border, paddingBottom: 1, justifySelf: "start" }}>{erasureRef(r.id as string)}</span>
              <span style={{ fontSize: 13.5, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subjectOf(r.detail)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: T.body, whiteSpace: "nowrap" }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.green }} />
                {r.action === "erase_reader" ? "single reader" : "by email"}
              </span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: mono, whiteSpace: "nowrap" }}>{new Date(r.created_at as string).toLocaleString()}</span>
            </a>
          ))}
        </div>
        {rows.length > 0 && <p style={{ fontSize: 12.5, color: T.faint, margin: "12px 2px 0" }}>{rows[0] ? removedOf(rows[0].detail) + " in the most recent." : ""}</p>}
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
    </div>
  );
}