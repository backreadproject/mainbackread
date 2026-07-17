"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0A0E17", CANVAS = "#FBFBFA", CARD = "#FFFFFF", BLUE = "#1D4ED8", BLUE_SOFT = "#EAF0FF", SLATE = "#475569", MUTE = "#94A3B8", LINE = "#E7EBF2", GREEN_BG = "#E7F7EF", GREEN = "#059669", RED = "#DC2626";
const AEON = "var(--font-geist-sans), system-ui, sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

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

  return (
    <div style={{ fontFamily: AEON, color: INK, minHeight: "100vh" }}>
      <style>{`.fx-card{transition:box-shadow .15s,transform .1s;text-decoration:none;color:inherit;display:block}.fx-card:hover{box-shadow:0 2px 6px rgba(11,18,32,0.06),0 12px 32px rgba(11,18,32,0.08);transform:translateY(-1px)}
        .fx-cta{transition:box-shadow .15s,transform .1s;cursor:pointer}.fx-cta:hover{box-shadow:0 6px 18px rgba(45,107,255,0.32)}.fx-cta:active{transform:translateY(1px)}
        .fx-up{transition:border-color .15s,background .15s}.fx-up:hover{border-color:${BLUE};background:#fff}`}</style>

      <main style={{ maxWidth: 680, padding: "28px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 4px" }}>Documents</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Share a tracked link and watch how it's read.</p>
          </div>
          <label className="fx-cta" style={{ background: BLUE, color: "#fff", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 400, cursor: uploading ? "default" : "pointer", boxShadow: "0 4px 12px rgba(45,107,255,0.25)", whiteSpace: "nowrap" }}>
            <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
            {uploading ? "Uploading…" : "+ Add document"}
          </label>
        </div>

        {error && <p style={{ color: RED, fontSize: 14, marginBottom: 18 }}>{error}</p>}

        {documents.length === 0 ? (
          <label className="fx-up" style={{ display: "block", background: CARD, border: `2px dashed ${LINE}`, borderRadius: 14, padding: 48, textAlign: "center", cursor: "pointer", boxShadow: SHADOW }}>
            <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
            <div style={{ width: 48, height: 48, borderRadius: 13, background: BLUE_SOFT, color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14 M5 12h14" /></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 400, margin: "0 0 4px" }}>Add your first document</p>
            <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Upload a PDF to start reading your readers.</p>
          </label>
        ) : (
          documents.map((d) => (
            <a key={d.id} href={`/documents/${d.id}`} className="fx-card" style={{ background: CARD, borderRadius: 14, padding: "18px 20px", marginBottom: 14, boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h8l4 4v14H5z M13 3v4h4" /></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                    <div style={{ fontSize: 13, color: MUTE, marginTop: 2 }}>Shared {new Date(d.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </a>
          ))
        )}
      </main>
    </div>
  );
}
