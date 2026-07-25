import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import ErasureTool from "./ErasureTool";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Both erasure routes. They are the same legal act, so a compliance file that
// covered one and not the other would be worse than none.
export const ERASURE_ACTIONS = ["erase_reader", "erase_forward_mentions"];
/** A quotable reference derived from the audit row's own id, so it resolves back
 *  to exactly one record and cannot drift from the evidence. */
export function erasureRef(id: string): string {
  return "RP-ERA-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
const PER_PAGE = 25;
function qs(over: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(over)) {
    if (v && v.trim()) parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v.trim()));
  }
  return parts.length ? "?" + parts.join("&") : "";
}
export default async function ErasuresPage({ searchParams }: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const admin = createAdminClient();
  // No limit. Erasure records are rare and they are the evidence that a request
  // was carried out, so none of them should ever fall off the end of a page.
  const { data } = await admin
    .from("admin_audit")
    .select("id, action, actor_email, detail, created_at")
    .in("action", ERASURE_ACTIONS)
    .order("created_at", { ascending: false });
  const all = data ?? [];
  const subjectOf = (d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    return ((o.email as string) || (o.name as string) || "unknown").toString();
  };
  // Matched in memory because the reference is a prefix of the row's uuid, which
  // is awkward to filter on in the database, and the set is small enough that it
  // does not matter.
  const needle = q.toLowerCase().replace(/^rp-era-/, "");
  const inRange = (iso: string) => {
    if (from && iso < from) return false;
    if (to && iso > to + "T23:59:59.999Z") return false;
    return true;
  };
  const filtered = all.filter((r) => {
    if (!inRange(r.created_at as string)) return false;
    if (!needle) return true;
    const id = (r.id as string).replace(/-/g, "").toLowerCase();
    return (
      id.startsWith(needle) ||
      subjectOf(r.detail).toLowerCase().includes(needle) ||
      ((r.actor_email as string) ?? "").toLowerCase().includes(needle)
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const filtering = !!(q || from || to);
  const mono = "'DM Mono', ui-monospace, monospace";
  const grid = "1.1fr 1.6fr 1fr 1.2fr";
  const field = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading };
  const removedOf = (d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const rec = Number(o.recipientRowsRemoved ?? (o.recipientId ? 1 : 0));
    const sig = Number(o.signalsRemoved ?? 0);
    return rec + " " + (rec === 1 ? "record" : "records") + " \u00b7 " + sig + " signals";
  };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Erasures</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Erase someone on request, and retrieve a certificate for anyone already erased.</p>
        <ErasureTool />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "26px 0 0" }}>Certificates</h2>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "5px 0 0" }}>Every erasure performed. Search a reference, an email, or a date range.</p>
        <form style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", margin: "16px 0 14px" }}>
          <input name="q" defaultValue={q} placeholder="Reference or email" style={{ ...field, width: 240 }} />
          <label style={{ fontSize: 12.5, color: T.muted, display: "inline-flex", alignItems: "center", gap: 7 }}>
            From <input type="date" name="from" defaultValue={from} style={{ ...field, width: 150 }} />
          </label>
          <label style={{ fontSize: 12.5, color: T.muted, display: "inline-flex", alignItems: "center", gap: 7 }}>
            To <input type="date" name="to" defaultValue={to} style={{ ...field, width: 150 }} />
          </label>
          <button type="submit" style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>Filter</button>
          {filtering && <a href={"/" + ADMIN_SLUG + "/erasures"} style={{ height: 34, display: "inline-flex", alignItems: "center", padding: "0 13px", border: "1px solid " + T.border, borderRadius: T.rBtn, fontSize: 13.5, color: T.body, textDecoration: "none" }}>Clear</a>}
        </form>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Reference</span><span>Subject</span><span>Removed</span><span>When</span>
          </div>
          {rows.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>
              {filtering ? "Nothing matches those filters." : "No erasures recorded yet."}
            </div>
          )}
          {rows.map((r, i) => (
            <a key={r.id as string} href={"/" + ADMIN_SLUG + "/erasures/" + r.id} className="t-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", textDecoration: "none" }}>
              <span style={{ fontSize: 13, color: T.heading, fontFamily: mono, borderBottom: "1px solid " + T.border, paddingBottom: 1, justifySelf: "start" }}>{erasureRef(r.id as string)}</span>
              <span style={{ fontSize: 13.5, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subjectOf(r.detail)}</span>
              <span style={{ fontSize: 13, color: T.body, whiteSpace: "nowrap" }}>{removedOf(r.detail)}</span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: mono, whiteSpace: "nowrap" }}>{new Date(r.created_at as string).toLocaleString()}</span>
            </a>
          ))}
          {filtered.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
              <span>{filtered.length} {filtered.length === 1 ? "erasure" : "erasures"}{filtering ? " matching" : ""}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {safePage > 1
                  ? <a href={qs({ q, from, to, page: String(safePage - 1) })} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Previous</a>
                  : <span style={{ color: T.faint }}>Previous</span>}
                <span>Page {safePage} of {pages}</span>
                {safePage < pages
                  ? <a href={qs({ q, from, to, page: String(safePage + 1) })} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>Next</a>
                  : <span style={{ color: T.faint }}>Next</span>}
              </span>
            </div>
          )}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
    </div>
  );
}