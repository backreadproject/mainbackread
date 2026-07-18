"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel } from "@/lib/theme";

type Row = { id: string; title: string; createdAt: string; archived: boolean; recipients: number; reads: number; questions: number; projectId: string | null; projectName: string | null };
type Project = { id: string; name: string };
type Stats = { documents: number; shared: number; totalReads: number; pendingReads: number; questions: number; escalated: number; activeReaders: number };

const ICONS = {
  doc: "M5 3h8l4 4v14H5z M13 3v4h4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z",
  msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  users: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6",
};

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
      </div>
      <div style={{ ...microLabel, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.heading, marginBottom: 4, letterSpacing: T.trackingTight }}>{value}</div>
      <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>
    </div>
  );
}

export default function DocumentsClient({ rows: initialRows, stats, isOrg = false, orgId = null, projects = [] }: { rows: Row[]; stats: Stats; isOrg?: boolean; orgId?: string | null; projects?: Project[] }) {
  const [rows, setRows] = useState(initialRows);
  const [uploadProject, setUploadProject] = useState<string>("");
  const [view, setView] = useState<"active" | "archived">("active");
  const [filter, setFilter] = useState<"all" | "opened" | "unopened">("all");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const inView = useMemo(() => rows.filter((r) => (view === "archived" ? r.archived : !r.archived)), [rows, view]);
  const filtered = useMemo(() => {
    if (view === "archived") return inView;
    if (filter === "opened") return inView.filter((r) => r.reads > 0);
    if (filter === "unopened") return inView.filter((r) => r.reads === 0);
    return inView;
  }, [inView, filter, view]);

  const archivedCount = rows.filter((r) => r.archived).length;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== "application/pdf") { setError("Choose a PDF to upload."); return; }
    setUploading(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Sign in again."); setUploading(false); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError("Upload failed. " + upErr.message); setUploading(false); return; }
    const insertRow: Record<string, unknown> = { owner_id: user.id, title: file.name.replace(/\.pdf$/i, ""), storage_path: path };
    if (isOrg && orgId) { insertRow.organization_id = orgId; if (uploadProject) insertRow.project_id = uploadProject; }
    const { error: dbErr } = await supabase.from("documents").insert(insertRow);
    if (dbErr) { setError("Couldn't record it. " + dbErr.message); setUploading(false); return; }
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

  const seg = (key: typeof filter, label: string) => (
    <button key={key} onClick={() => setFilter(key)} style={{ background: filter === key ? T.green : "transparent", color: filter === key ? "#fff" : T.body, fontSize: 13, fontWeight: filter === key ? 600 : 500, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: T.font }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }} onClick={() => menuOpen && setMenuOpen(null)}>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:#FCFCFD}.t-cta:hover{opacity:.92}.t-menu-item:hover{background:#F8F9FA}`}</style>

      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "inline-flex", gap: 4, background: "#EDEFF2", padding: 4, borderRadius: 9, marginBottom: 22 }}>
          <button onClick={() => setView("active")} style={{ background: view === "active" ? "#fff" : "transparent", color: view === "active" ? T.heading : T.body, fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: T.font, boxShadow: view === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>Active</button>
          <button onClick={() => setView("archived")} style={{ background: view === "archived" ? "#fff" : "transparent", color: view === "archived" ? T.heading : T.body, fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: T.font, boxShadow: view === "archived" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>Documents</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Manage the documents you share and how they're read.</p>
          </div>
          {view === "active" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {isOrg && projects.length > 0 && (
                <select value={uploadProject} onChange={(e) => setUploadProject(e.target.value)} title="Upload into project" style={{ border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "10px 12px", fontSize: 14, fontFamily: T.font, background: "#fff", color: T.body }}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <label className="t-cta" style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, cursor: "pointer", whiteSpace: "nowrap", opacity: uploading ? 0.7 : 1 }}>
                <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
                {uploading ? "Uploading…" : "+ Add document"}
              </label>
            </div>
          )}
        </div>

        {error && <p style={{ color: "#B42318", fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {view === "active" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
              <StatCard icon={ICONS.doc} label="Documents" value={stats.documents} sub={`${stats.shared} shared`} />
              <StatCard icon={ICONS.eye} label="Total reads" value={stats.totalReads} sub={`${stats.pendingReads} pending`} />
              <StatCard icon={ICONS.msg} label="Questions" value={stats.questions} sub={`${stats.escalated} escalated`} />
              <StatCard icon={ICONS.users} label="Active readers" value={stats.activeReaders} sub={`${stats.activeReaders} recipients`} />
            </div>
            <div style={{ background: T.greenSoft, border: "1px solid #C7EBD8", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" /></svg>
              <span style={{ fontSize: 13, color: T.greenText }}>Verdicts sharpen as readers spend more time with each document.</span>
            </div>
          </>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "visible" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            {view === "active" ? (
              <div style={{ display: "inline-flex", gap: 4 }}>{[["all", "All"], ["opened", "Opened"], ["unopened", "Unopened"]].map(([k, l]) => seg(k as typeof filter, l))}</div>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: T.heading }}>Archived documents</span>
            )}
            <span style={{ fontSize: 13, color: T.muted, marginLeft: "auto" }}>{filtered.length} document{filtered.length === 1 ? "" : "s"}</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}>
              <p style={{ fontSize: 15, color: T.body, margin: 0 }}>{view === "archived" ? "No archived documents." : rows.filter((r) => !r.archived).length === 0 ? "No documents yet. Add one to start reading your readers." : "No documents match this filter."}</p>
            </div>
          ) : (<>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.9fr 0.7fr 0.8fr 1fr 0.9fr 0.8fr 40px", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
              <span>Document</span><span>Recipients</span><span>Reads</span><span>Questions</span><span>Project</span><span>Shared</span><span>Status</span><span></span>
            </div>
            {filtered.map((r, i) => (
              <div key={r.id} className="t-row" style={{ display: "grid", gridTemplateColumns: "1.8fr 0.9fr 0.7fr 0.8fr 1fr 0.9fr 0.8fr 40px", gap: 12, padding: "15px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center", position: "relative" }}>
                <a href={`/documents/${r.id}`} style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}>{r.title}</a>
                <span style={{ fontSize: 14, color: T.body }}>{r.recipients}</span>
                <span style={{ fontSize: 14, color: T.body }}>{r.reads}</span>
                <span style={{ fontSize: 14, color: r.questions > 0 ? T.heading : T.muted, fontWeight: r.questions > 0 ? 600 : 400 }}>{r.questions}</span>
                <span style={{ fontSize: 13, color: r.projectName ? T.greenText : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.projectName ?? "—"}</span>
                <span style={{ fontSize: 14, color: T.body }}>{new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                <span><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: r.archived ? T.pillNeutralBg : r.reads > 0 ? T.pillPosBg : T.pillNeutralBg, color: r.archived ? T.body : r.reads > 0 ? T.pillPosText : T.body }}>{r.archived ? "Archived" : r.reads > 0 ? "Active" : "Awaiting"}</span></span>
                <div style={{ position: "relative", justifySelf: "end" }}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === r.id ? null : r.id); }} aria-label="Actions" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, borderRadius: 6, lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                  </button>
                  {menuOpen === r.id && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 32, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 30px rgba(15,23,41,0.12)", width: 160, zIndex: 20, overflow: "hidden", padding: 4 }}>
                      {r.archived ? (
                        <button className="t-menu-item" onClick={() => setArchived(r.id, false)} disabled={busy} style={menuItem}>Restore</button>
                      ) : (
                        <button className="t-menu-item" onClick={() => setArchived(r.id, true)} disabled={busy} style={menuItem}>Archive</button>
                      )}
                      {isOrg && projects.length > 0 && (
                        <div style={{ borderTop: `1px solid ${T.border}`, margin: "4px 0", paddingTop: 4 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px" }}>Move to project</div>
                          {r.projectId && <button className="t-menu-item" onClick={() => moveToProject(r.id, null)} style={menuItem}>Remove from project</button>}
                          {projects.filter((p) => p.id !== r.projectId).map((p) => (
                            <button key={p.id} className="t-menu-item" onClick={() => moveToProject(r.id, p.id)} style={menuItem}>{p.name}</button>
                          ))}
                        </div>
                      )}
                      <button className="t-menu-item" onClick={() => { setMenuOpen(null); setConfirmDelete(r); }} style={{ ...menuItem, color: "#B42318", borderTop: `1px solid ${T.border}`, marginTop: 4 }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>)}
        </div>
      </main>

      {confirmDelete && (
        <div onClick={() => !busy && setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 400, maxWidth: "100%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: "0 0 8px", letterSpacing: T.trackingTight }}>Delete this document?</h3>
            <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 20px" }}>Deleting "{confirmDelete.title}" removes it, its share links, and every signal on it. This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} disabled={busy} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => doDelete(confirmDelete)} disabled={busy} style={{ background: "#D92D20", color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItem = { display: "block", width: "100%", textAlign: "left" as const, background: "none", border: "none", padding: "9px 12px", fontSize: 14, fontFamily: T.font, color: T.heading, cursor: "pointer", borderRadius: 7 };
