"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import VariantUpload from "./VariantUpload";
import UploadModal, { type Signer } from "./UploadModal";
type Row = { id: string; title: string; createdAt: string; archived: boolean; recipients: number; reads: number; questions: number; projectId: string | null; projectName: string | null };
type Project = { id: string; name: string };
type Stats = { documents: number; shared: number; totalReads: number; pendingReads: number; questions: number; escalated: number; activeReaders: number };
type Tone = "green" | "amber" | "indigo" | "neutral";
const COLS = "1.8fr 0.9fr 0.7fr 0.8fr 1fr 0.9fr 0.9fr 40px";
export default function DocumentsClient({ selfName, selfEmail, rows: initialRows, stats, isOrg = false, orgId = null, projects = [], abEnabled = false }: { selfName: string; selfEmail: string; rows: Row[]; stats: Stats; isOrg?: boolean; orgId?: string | null; projects?: Project[]; abEnabled?: boolean }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const dp = getDict(locale).documentsPage;
  const [rows, setRows] = useState(initialRows);
  const [uploadProject, setUploadProject] = useState<string>("");
  const [view, setView] = useState<"active" | "archived">("active");
  const [filter, setFilter] = useState<"all" | "opened" | "unopened">("all");
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState<{ name: string; size: number; step: string } | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const inView = useMemo(() => rows.filter((r) => (view === "archived" ? r.archived : !r.archived)), [rows, view]);
  const filtered = useMemo(() => {
    let out = inView;
    if (view === "active") {
      if (filter === "opened") out = out.filter((r) => r.reads > 0);
      if (filter === "unopened") out = out.filter((r) => r.reads === 0);
    }
    const needle = q.trim().toLowerCase();
    if (needle) out = out.filter((r) => r.title.toLowerCase().includes(needle));
    return out;
  }, [inView, filter, view, q]);
  const archivedCount = rows.filter((r) => r.archived).length;
  // The modal has already checked the type and explained any refusal, so
  // this only has to do the work.
  async function onFile(file: File, signing: { enabled: boolean; signers: Signer[] }) {
    setUploading(true); setError("");
    setProgress({ name: file.name, size: file.size, step: dp.uploading });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError(dp.sessionExpired); setUploading(false); setProgress(null); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = user.id + "/" + Date.now() + "-" + safeName;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError(dp.uploadFailed + upErr.message); setUploading(false); setProgress(null); return; }
    const cleanTitle = file.name.replace(/\.(pdf|docx|jpe?g|png|webp|gif)$/i, "");
    const insertRow: Record<string, unknown> = { owner_id: user.id, title: cleanTitle, storage_path: path, signing_enabled: signing.enabled };
    if (isOrg && orgId) { insertRow.organization_id = orgId; if (uploadProject) insertRow.project_id = uploadProject; }
    const { data: inserted, error: dbErr } = await supabase.from("documents").insert(insertRow).select("id").single();
    if (dbErr || !inserted) {
      // The file is already in storage. Remove it so a failed insert does not orphan it.
      try { await supabase.storage.from("documents").remove([path]); } catch { /* best effort */ }
      setError(dp.couldntRecord + (dbErr?.message ?? "")); setUploading(false); setProgress(null); return;
    }
    try {
    if (signing.enabled && signing.signers.length) {
      setProgress({ name: file.name, size: file.size, step: dp.addingSigners });
      for (const s of signing.signers) {
        const parts = s.name.trim().split(/\s+/);
        try {
          await fetch("/api/share-prospect", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({
              documentId: inserted.id,
              mode: "link",
              firstName: parts[0] || s.name,
              lastName: parts.slice(1).join(" ") || "",
              email: s.email,
              isSigner: true,
            }),
          });
        } catch { /* one signer failing must not lose the document */ }
      }
    }
      setProgress({ name: file.name, size: file.size, step: dp.readingPages });
      const res = await fetch("/api/extract-document", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: inserted.id }) });
      const ext = await res.json().catch(() => ({}));
      // A scanned PDF has no text layer, so the server can extract nothing.
      // The pages have to be rendered to images and read by vision -- and
      // rendering needs a canvas, which exists here in the browser and not
      // in a serverless function. We still hold the file, so this is the
      // one moment it costs nothing extra to do.
      // A scanned PDF is now read server-side, inside extract-document, by
      // sending the whole file to the model. Nothing to do here.
    } catch { /* extraction is best-effort */ }
    window.location.reload();
  }
  async function setArchived(id: string, archived: boolean) {
    setMenuOpen(null); setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("documents").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
    if (error) { setError(error.message); setBusy(false); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, archived } : r)));
    setBusy(false);
  }
  async function doDelete(row: Row) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("documents").delete().eq("id", row.id);
    if (error) { setError(error.message); setBusy(false); setConfirmDelete(null); return; }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setBusy(false); setConfirmDelete(null);
  }
  async function moveToProject(id: string, projectId: string | null) {
    setMenuOpen(null);
    const supabase = createClient();
    const { error } = await supabase.from("documents").update({ project_id: projectId }).eq("id", id);
    if (error) { setError(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, projectId, projectName: projectId ? (projects.find((p) => p.id === projectId)?.name ?? null) : null } : r)));
  }
  const toneRule: Record<Tone, string> = { green: T.green, amber: T.amber, indigo: T.indigo, neutral: T.border };
  const sel = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 10px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.body };
  const cells: [number, string, Tone][] = [
    [stats.totalReads, dp.statTotalReads + " \u00b7 " + stats.pendingReads + " " + dp.statPending, "green"],
    [stats.questions, dp.statQuestions + " \u00b7 " + stats.escalated + " " + dp.statEscalated, "amber"],
    [stats.activeReaders, dp.statActiveReaders, "indigo"],
    [stats.documents, dp.statDocuments + " \u00b7 " + stats.shared + " " + dp.statShared, "neutral"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }} onClick={() => menuOpen && setMenuOpen(null)}>
      <style>{`
        .t-row{transition:background .12s}
        .t-row:hover{background:var(--rp-hover)}
        .t-menu-item:hover{background:var(--rp-hover)}
        .dc-in:focus{outline:none;border-color:var(--rp-green)}
        @media (max-width: 700px){
          .dc-bar-l, .dc-bar-r { width: 100%; flex-wrap: wrap; }
          .dc-bar-l select, .dc-bar-r select { flex: 1 1 140px; min-width: 0 !important; }
          .dc-bar-r input { flex: 1 1 100%; width: auto !important; }
        }
      `}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{dp.title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{dp.subtitle} {dp.verdictHint}</p>
        <div className="dc-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "26px 0 16px", flexWrap: "wrap" }}>
          <div className="dc-bar-l" style={{ display: "flex", gap: 9 }}>
            <select value={view} onChange={(e) => setView(e.target.value as "active" | "archived")} style={{ ...sel, minWidth: 150 }}>
              <option value="active">{dp.active}</option>
              <option value="archived">{dp.archived}{archivedCount > 0 ? " (" + archivedCount + ")" : ""}</option>
            </select>
            {view === "active" && (
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ ...sel, minWidth: 150 }}>
                <option value="all">{dp.filterAll}</option>
                <option value="opened">{dp.filterOpened}</option>
                <option value="unopened">{dp.filterUnopened}</option>
              </select>
            )}
            {isOrg && projects.length > 0 && view === "active" && (
              <select value={uploadProject} onChange={(e) => setUploadProject(e.target.value)} title={dp.uploadIntoProject} style={{ ...sel, minWidth: 150 }}>
                <option value="">{dp.noProject}</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div className="dc-bar-r" style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <input className="dc-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={fr ? "Rechercher un document" : "Search a document"} style={{ ...sel, width: 240 }} />
            {view === "active" && abEnabled && <VariantUpload isOrg={isOrg} orgId={orgId} projects={projects} />}
            {view === "active" && (
              <button onClick={() => setAdding(true)} style={{ height: 34, boxSizing: "border-box", display: "inline-flex", alignItems: "center", background: T.green, color: T.onAccent, fontSize: 13.5, fontWeight: 500, padding: "0 13px", borderRadius: T.rBtn, cursor: "pointer", border: "none", whiteSpace: "nowrap", opacity: uploading ? 0.7 : 1 }}>
                {dp.addDocument}
              </button>
            )}
          </div>
        </div>
        {error && <p style={{ color: T.dangerText, fontSize: 14, marginBottom: 16 }}>{error}</p>}
        {view === "active" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card }} className="stat-strip">
            {cells.map(([v, l, tone], i) => (
              <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + toneRule[tone] }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        )}        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 18, boxShadow: T.shadow }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>{dp.colDocument}</span><span>{dp.colRecipients}</span><span>{dp.colReads}</span><span>{dp.colQuestions}</span><span>{dp.colProject}</span><span>{dp.colShared}</span><span>{dp.colStatus}</span><span></span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{view === "archived" ? dp.emptyArchived : rows.filter((r) => !r.archived).length === 0 ? dp.emptyNone : dp.emptyFilter}</p>
            </div>
          ) : filtered.map((r, i) => (
            <div key={r.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center", position: "relative" }}>
              <a href={"/documents/" + r.id} className="data-cell dc-title" style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none", borderBottom: "1px solid " + T.border, paddingBottom: 1, justifySelf: "start", maxWidth: "100%" }}>{r.title}</a>
              <span className="data-cell" data-label={dp.colRecipients} style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{r.recipients}</span>
              <span className="data-cell" data-label={dp.colReads} style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{r.reads}</span>
              <span className="data-cell" data-label={dp.colQuestions} style={{ fontSize: 13.5, color: r.questions > 0 ? T.heading : T.faint, fontWeight: r.questions > 0 ? 500 : 400, fontVariantNumeric: "tabular-nums" }}>{r.questions}</span>
              <span className="data-cell sm-hide" data-label={dp.colProject} style={{ minWidth: 0 }}>{r.projectName ? <span style={{ display: "inline-block", maxWidth: "100%", border: "1px solid " + T.border, borderRadius: 4, background: T.soft, padding: "2px 7px", fontSize: 11.5, color: T.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.projectName}</span> : <span style={{ fontSize: 13, color: T.faint }}>{"\u2014"}</span>}</span>
              <span className="data-cell sm-hide" data-label={dp.colAdded} style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString(fr ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="data-cell sm-nolabel" data-label={dp.colStatus}>
                <span title={r.archived ? "Archived. Hidden from your active list; readers with the link can still open it." : r.recipients === 0 ? "Not shared yet. Nobody has been sent this document." : r.reads > 0 ? "Active. At least one recipient has opened it." : "Awaiting. Sent, but nobody has opened it yet."} style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", border: "1px solid " + T.border, borderRadius: 4, background: T.soft, padding: "2px 7px", fontSize: 11.5, color: T.body, cursor: "help" }}>
                  <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: r.archived ? T.faint : r.recipients === 0 ? T.faint : r.reads > 0 ? T.green : T.amber }} />
                  {r.archived ? dp.statusArchived : r.recipients === 0 ? (fr ? "Non partag\u00e9" : "Not shared") : r.reads > 0 ? dp.statusActive : dp.statusAwaiting}
                </span>
              </span>
              <div style={{ position: "relative", justifySelf: "end" }}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === r.id ? null : r.id); }} aria-label={dp.actions} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.faint, borderRadius: 4, lineHeight: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                </button>
                {menuOpen === r.id && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, width: 172, zIndex: 20, overflow: "hidden", padding: 4 }}>
                    {r.archived ? (
                      <button className="t-menu-item" onClick={() => setArchived(r.id, false)} disabled={busy} style={menuItem}>{dp.restore}</button>
                    ) : (
                      <button className="t-menu-item" onClick={() => setArchived(r.id, true)} disabled={busy} style={menuItem}>{dp.archive}</button>
                    )}
                    {isOrg && projects.length > 0 && (
                      <div style={{ borderTop: "1px solid " + T.borderSoft, margin: "4px 0", paddingTop: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.faint, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px" }}>{dp.moveToProject}</div>
                        {r.projectId && <button className="t-menu-item" onClick={() => moveToProject(r.id, null)} style={menuItem}>{dp.removeFromProject}</button>}
                        {projects.filter((p) => p.id !== r.projectId).map((p) => (
                          <button key={p.id} className="t-menu-item" onClick={() => moveToProject(r.id, p.id)} style={menuItem}>{p.name}</button>
                        ))}
                      </div>
                    )}
                    <button className="t-menu-item" onClick={() => { setMenuOpen(null); setConfirmDelete(r); }} style={{ ...menuItem, color: T.dangerText, borderTop: "1px solid " + T.borderSoft, marginTop: 4 }}>{dp.del}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
              {filtered.length} {filtered.length === 1 ? dp.documentCountOne : dp.documentCountMany}
            </div>
          )}
        </div>
      </main>
        {adding && (
          <UploadModal
            onClose={() => { setAdding(false); setProgress(null); }}
            onPick={(file, signing) => { onFile(file, signing); }}
            selfName={selfName}
            selfEmail={selfEmail}
            busy={uploading}
            progress={progress}
          />
        )}
      {confirmDelete && (
        <div onClick={() => !busy && setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, padding: 26, width: 400, maxWidth: "100%" }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, margin: "0 0 8px", letterSpacing: T.trackingTight }}>{dp.deleteTitle}</h3>
            <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 20px" }}>{dp.deleteBodyA}{confirmDelete.title}{dp.deleteBodyB}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} disabled={busy} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{dp.cancel}</button>
              <button onClick={() => doDelete(confirmDelete)} disabled={busy} style={{ background: T.danger, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? dp.deleting : dp.del}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const menuItem = { display: "block", width: "100%", textAlign: "left" as const, background: "none", border: "none", padding: "8px 12px", fontSize: 13.5, fontFamily: T.font, color: T.heading, cursor: "pointer", borderRadius: 4 };