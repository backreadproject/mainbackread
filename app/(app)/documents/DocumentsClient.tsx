"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A1D21", PAPER = "#F7F6F3", SURFACE = "#FFFFFF", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const AEON = "'Aeonik', Arial, sans-serif";

type Doc = { id: string; title: string; page_count: number; created_at: string };

export default function DocumentsClient({ documents }: { documents: Doc[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Choose a PDF to upload."); return; }
    setUploading(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Your session expired. Sign in again."); setUploading(false); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError("Upload failed. " + upErr.message); setUploading(false); return; }
    const title = file.name.replace(/\.pdf$/i, "");
    const { error: dbErr } = await supabase.from("documents").insert({ owner_id: user.id, title, storage_path: path });
    if (dbErr) { setError("Saved the file but couldn't record it. " + dbErr.message); setUploading(false); return; }
    window.location.reload();
  }

  const mono = { fontFamily: AEON, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GRAPHITE };

  return (
    <div style={{ fontFamily: AEON, color: INK }}>
      <style>{`.br-doc{transition:border-color .15s,background .15s;text-decoration:none;color:inherit;display:block}.br-doc:hover{border-color:${GRAPHITE};background:#fff}
        .br-up{transition:border-color .15s,background .15s}.br-up:hover{border-color:${INK};background:#fff}`}</style>

      <header style={{ borderBottom: `1px solid ${RULE}`, padding: "22px 40px" }}>
        <h1 style={{ fontFamily: AEON, fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", margin: 0 }}>Documents</h1>
      </header>

      <main style={{ maxWidth: 780, padding: "32px 40px" }}>
        <label className="br-up" style={{ display: "block", border: `1.5px dashed ${RULE}`, borderRadius: 4, padding: 40, textAlign: "center", marginBottom: 32, cursor: uploading ? "default" : "pointer" }}>
          <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
          <div style={{ ...mono, marginBottom: 4 }}>{uploading ? "Uploading" : "PDF"}</div>
          <p style={{ fontFamily: AEON, fontSize: 17, fontWeight: 500, color: INK, margin: 0 }}>{uploading ? "One moment…" : "Add a document"}</p>
        </label>

        {error && <p style={{ color: MARK, fontSize: 14, marginBottom: 20 }}>{error}</p>}

        {documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 16, color: GRAPHITE }}>Nothing sent yet. Your first upload starts the record.</p>
          </div>
        ) : (
          documents.map((d, i) => (
            <a key={d.id} href={`/documents/${d.id}`} className="br-doc" style={{ background: SURFACE, border: `1px solid ${RULE}`, borderRadius: 4, padding: "18px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
                  <span style={{ ...mono, fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: AEON, fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: GRAPHITE }}>{new Date(d.created_at).toLocaleDateString()}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAPHITE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </div>
              </div>
            </a>
          ))
        )}
      </main>
    </div>
  );
}
