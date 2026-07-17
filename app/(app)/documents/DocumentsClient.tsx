"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel } from "@/lib/theme";

type Row = { id: string; title: string; createdAt: string; recipients: number; reads: number; questions: number };
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

export default function DocumentsClient({ rows, stats }: { rows: Row[]; stats: Stats }) {
  const [filter, setFilter] = useState<"all" | "opened" | "unopened">("all");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (filter === "opened") return rows.filter((r) => r.reads > 0);
    if (filter === "unopened") return rows.filter((r) => r.reads === 0);
    return rows;
  }, [rows, filter]);

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
    const { error: dbErr } = await supabase.from("documents").insert({ owner_id: user.id, title: file.name.replace(/\.pdf$/i, ""), storage_path: path });
    if (dbErr) { setError("Couldn't record it. " + dbErr.message); setUploading(false); return; }
    window.location.reload();
  }

  const seg = (key: typeof filter, label: string) => (
    <button onClick={() => setFilter(key)} style={{ background: filter === key ? T.green : "transparent", color: filter === key ? "#fff" : T.body, fontSize: 13, fontWeight: filter === key ? 600 : 500, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: T.font }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:#FCFCFD}.t-cta:hover{opacity:.92}`}</style>

      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "inline-flex", gap: 4, background: "#EDEFF2", padding: 4, borderRadius: 9, marginBottom: 22 }}>
          {seg("all", "All documents")}{seg("opened", "Opened")}{seg("unopened", "Unopened")}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>Documents</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Manage the documents you share and how they're read.</p>
          </div>
          <label className="t-cta" style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, cursor: "pointer", whiteSpace: "nowrap", opacity: uploading ? 0.7 : 1 }}>
            <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
            {uploading ? "Uploading…" : "+ Add document"}
          </label>
        </div>

        {error && <p style={{ color: "#B42318", fontSize: 14, marginBottom: 16 }}>{error}</p>}

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

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.heading }}>{filter === "all" ? "All" : filter === "opened" ? "Opened" : "Unopened"}</span>
            <span style={{ fontSize: 13, color: T.muted, marginLeft: "auto" }}>{filtered.length} document{filtered.length === 1 ? "" : "s"}</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}>
              <p style={{ fontSize: 15, color: T.body, margin: 0 }}>{rows.length === 0 ? "No documents yet. Add one to start reading your readers." : "No documents match this filter."}</p>
            </div>
          ) : (<>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.9fr 1fr 0.9fr", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
              <span>Document</span><span>Recipients</span><span>Reads</span><span>Questions</span><span>Shared</span><span>Status</span>
            </div>
            {filtered.map((r, i) => (
              <a key={r.id} href={`/documents/${r.id}`} className="t-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.9fr 1fr 0.9fr", gap: 12, padding: "15px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ fontSize: 14, color: T.body }}>{r.recipients}</span>
                <span style={{ fontSize: 14, color: T.body }}>{r.reads}</span>
                <span style={{ fontSize: 14, color: r.questions > 0 ? T.heading : T.muted, fontWeight: r.questions > 0 ? 600 : 400 }}>{r.questions}</span>
                <span style={{ fontSize: 14, color: T.body }}>{new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                <span><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: r.reads > 0 ? T.pillPosBg : T.pillNeutralBg, color: r.reads > 0 ? T.pillPosText : T.pillNeutralText }}>{r.reads > 0 ? "Active" : "Awaiting"}</span></span>
              </a>
            ))}
          </>)}
        </div>
      </main>
    </div>
  );
}
