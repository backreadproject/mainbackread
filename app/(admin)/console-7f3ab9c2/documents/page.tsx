import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AdminDocuments() {
  const admin = createAdminClient();
  const { data: docs } = await admin
    .from("documents")
    .select("id, title, owner_id, organization_id, project_id, created_at, archived_at, page_count, extract_method, needs_page_ocr")
    .order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);
  const { data: recs } = docIds.length ? await admin.from("recipients").select("id, document_id").in("document_id", docIds) : { data: [] };
  const recipients = recs ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigs } = recIds.length ? await admin.from("signals").select("recipient_id, kind").in("recipient_id", recIds) : { data: [] };
  const signals = sigs ?? [];
  const { data: verd } = await admin.from("usage_events").select("document_id").eq("kind", "verdict");
  const verdicts = verd ?? [];
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailById = new Map((list?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const { data: orgs } = await admin.from("organizations").select("id, name");
  const orgName = new Map((orgs ?? []).map((o) => [o.id, o.name as string | null]));
  const { data: projs } = await admin.from("projects").select("id, name");
  const projName = new Map((projs ?? []).map((p) => [p.id, p.name as string | null]));
  const recToDoc = new Map(recipients.map((r) => [r.id, r.document_id]));
  const recByDoc = new Map<string, number>();
  for (const r of recipients) recByDoc.set(r.document_id, (recByDoc.get(r.document_id) ?? 0) + 1);
  const agg = new Map<string, { opens: number; questions: number; forwards: number }>();
  for (const s of signals) {
    const d = recToDoc.get(s.recipient_id); if (!d) continue;
    const a = agg.get(d) ?? { opens: 0, questions: 0, forwards: 0 };
    if (s.kind === "opened") a.opens++;
    else if (s.kind === "question") a.questions++;
    else if (s.kind === "forwarded") a.forwards++;
    agg.set(d, a);
  }
  const vByDoc = new Map<string, number>();
  for (const v of verdicts) { if (v.document_id) vByDoc.set(v.document_id, (vByDoc.get(v.document_id) ?? 0) + 1); }
  const totals = documents.reduce((acc, d) => {
    const a = agg.get(d.id) ?? { opens: 0, questions: 0, forwards: 0 };
    acc.opens += a.opens; acc.questions += a.questions; acc.forwards += a.forwards;
    acc.recipients += recByDoc.get(d.id) ?? 0;
    if (d.needs_page_ocr) acc.ocr++;
    return acc;
  }, { opens: 0, questions: 0, forwards: 0, recipients: 0, ocr: 0 });
  const grid = "2fr 1.5fr 1.1fr 0.9fr 0.7fr 0.9fr 0.8fr 1fr";
  const mono = "'DM Mono', ui-monospace, monospace";
  const cells: [number, string][] = [
    [documents.length, "Documents"], [totals.recipients, "Recipients"], [totals.opens, "Opens"],
    [totals.questions, "Questions"], [totals.forwards, "Forwards"], [totals.ocr, "Needs OCR"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1180, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Documents</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Every document across every account.</p>
        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginTop: 26 }}>
          {cells.map(([v, l], i) => (
            <div key={l} style={{ padding: "15px 18px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 18 }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>Document</span><span>Owner</span><span>Org / Project</span><span>Readers</span><span>Opens</span><span>Questions</span><span>Forwards</span><span>Status</span>
          </div>
          {documents.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No documents yet.</div>}
          {documents.map((d, i) => {
            const a = agg.get(d.id) ?? { opens: 0, questions: 0, forwards: 0 };
            const org = d.organization_id ? (orgName.get(d.organization_id) ?? "Org") : null;
            const proj = d.project_id ? (projName.get(d.project_id) ?? "Project") : null;
            const live = a.opens > 0;
            const statusDot = d.archived_at ? T.faint : live ? T.green : T.amber;
            const statusText = d.archived_at ? "Archived" : live ? "Active" : "Awaiting";
            return (
              <a key={d.id} href={"/" + ADMIN_SLUG + "/documents/" + d.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "13px 18px", borderBottom: i < documents.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", textDecoration: "none" }}>
                <span className="data-cell dc-title" data-label="Document" style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid " + T.border, paddingBottom: 1 }}>{d.title}</span>
                  {d.needs_page_ocr && <span title="Needs OCR" style={{ flex: "none", fontSize: 11, color: T.muted, display: "inline-flex", alignItems: "center", gap: 5 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber }} />OCR</span>}
                </span>
                <span className="data-cell sm-hide" data-label="Owner" style={{ fontSize: 12.5, color: T.muted, fontFamily: mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emailById.get(d.owner_id) || "unknown"}</span>
                <span className="data-cell sm-hide" data-label="Org / Project" style={{ fontSize: 13, color: org || proj ? T.body : T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[org, proj].filter(Boolean).join(" / ") || "personal"}</span>
                <span className="data-cell" data-label="Recipients" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{recByDoc.get(d.id) ?? 0}</span>
                <span className="data-cell" data-label="Opens" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{a.opens}</span>
                <span className="data-cell" data-label="Questions" style={{ fontSize: 13.5, color: a.questions ? T.heading : T.faint, fontVariantNumeric: "tabular-nums" }}>{a.questions}</span>
                <span className="data-cell sm-hide" data-label="Forwards" style={{ fontSize: 13.5, color: a.forwards ? T.heading : T.faint, fontVariantNumeric: "tabular-nums" }}>{a.forwards}</span>
                <span className="data-cell" data-label="Status">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, whiteSpace: "nowrap" }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: statusDot }} />{statusText}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}@media (max-width: 1000px){ .stat-strip{ grid-template-columns: 1fr 1fr 1fr !important; } }`}</style>
    </div>
  );
}