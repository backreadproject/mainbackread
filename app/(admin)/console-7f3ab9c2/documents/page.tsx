import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel, statCard } from "@/lib/theme";

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

  const grid = "2.2fr 1.6fr 1.2fr 0.7fr 0.7fr 0.7fr 0.7fr 0.9fr";
  const mono = "'DM Mono', ui-monospace, monospace";
  const cards: [string, string | number][] = [
    ["Documents", documents.length], ["Recipients", totals.recipients], ["Opens", totals.opens],
    ["Questions", totals.questions], ["Forwards", totals.forwards], ["Needs OCR", totals.ocr],
  ];

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1180, padding: "26px 30px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={pageHeading}>Documents</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Every document across every account.</p>
        </div>

        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 20 }}>
          {cards.map(([k, v]) => (
            <div key={k} style={statCard}>
              <div style={{ ...microLabel, marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>Document</span><span>Owner</span><span>Org / Project</span><span>Rec</span><span>Opens</span><span>Q</span><span>Fwd</span><span>Status</span>
          </div>
          {documents.length === 0 && <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No documents yet.</div>}
          {documents.map((d, i) => {
            const a = agg.get(d.id) ?? { opens: 0, questions: 0, forwards: 0 };
            const org = d.organization_id ? (orgName.get(d.organization_id) ?? "Org") : null;
            const proj = d.project_id ? (projName.get(d.project_id) ?? "Project") : null;
            const live = a.opens > 0;
            return (
              <a key={d.id} href={`/${ADMIN_SLUG}/documents/${d.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "14px 18px", borderTop: i ? `1px solid ${T.border}` : "none", alignItems: "center", textDecoration: "none" }}>
                <span className="data-cell dc-title" data-label="Document" style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title}
                  {d.needs_page_ocr && <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: T.rPill, background: "var(--rp-amber-soft)", color: "var(--rp-amber-text)" }}>OCR</span>}
                </span>
                <span className="data-cell" data-label="Owner" style={{ fontSize: 13, color: T.body, fontFamily: mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emailById.get(d.owner_id) || "unknown"}</span>
                <span className="data-cell" data-label="Org / Project" style={{ fontSize: 13, color: org || proj ? T.greenText : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[org, proj].filter(Boolean).join(" / ") || "personal"}</span>
                <span className="data-cell" data-label="Recipients" style={{ fontSize: 14, color: T.body }}>{recByDoc.get(d.id) ?? 0}</span>
                <span className="data-cell" data-label="Opens" style={{ fontSize: 14, color: T.body }}>{a.opens}</span>
                <span className="data-cell" data-label="Questions" style={{ fontSize: 14, color: a.questions ? T.heading : T.muted, fontWeight: a.questions ? 600 : 400 }}>{a.questions}</span>
                <span className="data-cell" data-label="Forwards" style={{ fontSize: 14, color: a.forwards ? T.greenText : T.muted, fontWeight: a.forwards ? 600 : 400 }}>{a.forwards}</span>
                <span className="data-cell" data-label="Status">
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: d.archived_at ? T.pillNeutralBg : live ? T.pillPosBg : T.pillNeutralBg, color: d.archived_at ? T.body : live ? T.pillPosText : T.body }}>
                    {d.archived_at ? "Archived" : live ? "Active" : "Awaiting"}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-soft)}`}</style>
    </div>
  );
}

