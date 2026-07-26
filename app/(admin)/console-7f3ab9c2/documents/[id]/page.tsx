import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import { clampDwellMs, formatDwell, DWELL_CAP_MS } from "@/lib/dwell";
import DocumentActions from "./DocumentActions";
import EraseReader from "./EraseReader";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AdminDocumentDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: doc } = await admin.from("documents").select("id, title, owner_id, organization_id, project_id, created_at, archived_at, storage_path, page_count, extract_method, needs_page_ocr, extracted_text").eq("id", id).single();
  if (!doc) return <div style={{ padding: 30, fontFamily: T.font, color: T.body }}>Document not found.</div>;
  const { data: ownerUser } = await admin.auth.admin.getUserById(doc.owner_id);
  let orgName: string | null = null;
  if (doc.organization_id) {
    const { data } = await admin.from("organizations").select("name").eq("id", doc.organization_id).single();
    orgName = (data?.name as string | null) ?? null;
  }
  let projectName: string | null = null;
  if (doc.project_id) {
    const { data } = await admin.from("projects").select("name").eq("id", doc.project_id).single();
    projectName = (data?.name as string | null) ?? null;
  }
  const { data: recsRaw } = await admin.from("recipients").select("id, label, first_name, last_name, email, share_token, created_at").eq("document_id", id).order("created_at", { ascending: false });
  const recipients = recsRaw ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigsRaw } = recIds.length ? await admin.from("signals").select("recipient_id, kind, page, value, created_at").in("recipient_id", recIds).order("created_at", { ascending: false }) : { data: [] };
  const signals = sigsRaw ?? [];
  const { data: msgsRaw } = recIds.length ? await admin.from("reader_messages").select("recipient_id, role, content, escalate, created_at").in("recipient_id", recIds).order("created_at", { ascending: true }) : { data: [] };
  const messages = msgsRaw ?? [];
  const per = new Map<string, { opens: number; questions: number; forwards: number; dwell: Record<number, number>; capped: boolean }>();
  for (const r of recipients) per.set(r.id, { opens: 0, questions: 0, forwards: 0, dwell: {}, capped: false });
  for (const s of signals) {
    const a = per.get(s.recipient_id); if (!a) continue;
    if (s.kind === "opened") a.opens++;
    else if (s.kind === "question") a.questions++;
    else if (s.kind === "forwarded") a.forwards++;
    else if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) {
      const raw = Number((s.value as { ms: unknown }).ms) || 0;
      a.dwell[s.page] = Math.max(a.dwell[s.page] ?? 0, clampDwellMs(raw));
      if (raw > DWELL_CAP_MS) a.capped = true;
    }
  }
  const msgsByRec = new Map<string, typeof messages>();
  for (const m of messages) {
    const arr = msgsByRec.get(m.recipient_id) ?? [];
    arr.push(m);
    msgsByRec.set(m.recipient_id, arr);
  }
  const totals = recipients.reduce((acc, r) => {
    const a = per.get(r.id)!;
    acc.opens += a.opens; acc.questions += a.questions; acc.forwards += a.forwards;
    return acc;
  }, { opens: 0, questions: 0, forwards: 0 });
  const escalated = messages.filter((m) => m.escalate).length;
  const nameOf = (r: { label: string | null; first_name: string | null; last_name: string | null }) =>
    (r.label as string | null) || [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Unnamed reader";
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const cells: [string, string, boolean][] = [
    [String(recipients.length), "Readers", false],
    [String(totals.opens), "Opens", false],
    [String(totals.questions), "Questions", false],
    [String(totals.forwards), "Forwards", false],
    [String(escalated), "Escalated", escalated > 0],
  ];
  const meta = (l: string, v: string, warn = false) => (
    <div>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 2 }}>{l}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading }}>
        {warn && <i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber }} />}{v}
      </div>
    </div>
  );
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "34px 28px 120px" }}>
        <a href={"/" + ADMIN_SLUG + "/documents"} style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> All documents</a>
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 10 }}>
              {doc.archived_at && <i title="Archived" style={{ width: 7, height: 7, borderRadius: 2, flex: "none", background: T.faint }} />}
              {doc.title}
            </h1>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "7px 0 0", fontFamily: mono }}>
              {ownerUser?.user?.email ?? "unknown owner"} {"\u00b7"} {orgName ? orgName : "personal"}{projectName ? " / " + projectName : ""} {"\u00b7"} added {new Date(doc.created_at).toLocaleDateString()}
              {doc.archived_at ? " \u00b7 archived" : ""}
            </p>
          </div>
          <DocumentActions documentId={doc.id} title={doc.title} archived={!!doc.archived_at} />
        </div>
        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, margin: "26px 0 14px" }}>
          {cells.map(([v, l, warn], i) => (
            <div key={l} style={{ padding: "15px 18px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>
                {warn && <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.amber }} />}{v}
              </div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={head}>Ingestion</div>
          <div className="lim-grid" style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 16 }}>
            {meta("Pages", doc.page_count ? String(doc.page_count) : "unknown")}
            {meta("Extract method", (doc.extract_method as string | null) || "none")}
            {meta("Needs OCR", doc.needs_page_ocr ? "yes" : "no", !!doc.needs_page_ocr)}
            {meta("Extracted text", doc.extracted_text ? (doc.extracted_text as string).length.toLocaleString() + " chars" : "none", !doc.extracted_text)}
            {meta("Storage", (doc.storage_path as string | null) ? "present" : "missing", !doc.storage_path)}
          </div>
        </div>
        <div style={card}>
          <div style={head}>Readers {"\u00b7"} {recipients.length}</div>
          {recipients.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>Nobody has been sent this document.</div>}
          {recipients.map((r, i) => {
            const a = per.get(r.id)!;
            const thread = msgsByRec.get(r.id) ?? [];
            const dwellPages = Object.entries(a.dwell).sort((x, y) => Number(x[0]) - Number(y[0]));
            return (
              <div key={r.id} style={{ padding: "14px 18px", borderBottom: i < recipients.length - 1 ? "1px solid " + T.borderSoft : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: a.opens > 0 ? T.green : T.faint }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameOf(r)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: T.faint, fontFamily: mono, marginTop: 2 }}>
                      {(r.email as string | null) || "no email"} {"\u00b7"} {a.opens} opens {"\u00b7"} {a.questions} questions {"\u00b7"} {a.forwards} forwards {"\u00b7"} sent {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <EraseReader recipientId={r.id} expected={(r.email as string | null) || nameOf(r)} />
                </div>
                {dwellPages.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {dwellPages.map(([page, ms]) => (
                      <span key={page} style={{ fontSize: 12.5, color: ms >= DWELL_CAP_MS ? T.faint : T.body, fontFamily: mono }}>
                        p{page} {formatDwell(ms)}
                      </span>
                    ))}
                  </div>
                )}
                {thread.length > 0 && (
                  <div style={{ marginTop: 12, border: "1px solid " + T.border, borderRadius: T.rCard }}>
                    {thread.map((m, k) => (
                      <div key={k} style={{ padding: "10px 12px", borderBottom: k < thread.length - 1 ? "1px solid " + T.borderSoft : "none" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: T.muted, marginBottom: 3 }}>
                          <i style={{ width: 6, height: 6, borderRadius: 2, background: m.role === "user" ? T.indigo : T.green }} />
                          {m.role === "user" ? "reader" : "companion"}
                          {m.escalate ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 6 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber }} />escalated</span> : null}
                          <span style={{ color: T.faint, fontFamily: mono, marginLeft: 6 }}>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: 13, color: T.heading, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <style>{`@media (max-width: 860px){ .stat-strip{ grid-template-columns: 1fr 1fr !important; } .lim-grid{ grid-template-columns: 1fr 1fr 1fr !important; } }@media (max-width: 560px){ .lim-grid{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}