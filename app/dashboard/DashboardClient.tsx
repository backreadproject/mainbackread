"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A1D21", PAPER = "#F7F6F3", SURFACE = "#FFFFFF", READER = "#2F4A3F", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const VOICE = "'Newsreader', Georgia, serif", SANS = "'Inter Tight', system-ui, sans-serif", MONO = "'IBM Plex Mono', monospace";

type Doc = { id: string; title: string; page_count: number; created_at: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };

export default function DashboardClient({ email, documents }: { email: string; documents: Doc[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verdictBusy, setVerdictBusy] = useState("");

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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

  async function createLink(documentId: string) {
    setBusyId(documentId); setError("");
    const supabase = createClient();
    const { data, error: insErr } = await supabase.from("recipients").insert({ document_id: documentId, label: "Shared link" }).select("share_token").single();
    if (insErr || !data) { setError("Couldn't create a link. " + (insErr?.message ?? "")); setBusyId(""); return; }
    setLinks((p) => ({ ...p, [documentId]: `${window.location.origin}/read/${data.share_token}` }));
    setBusyId("");
  }

  async function readTheReader(documentId: string) {
    setVerdictBusy(documentId); setError("");
    const supabase = createClient();
    const { data: rec } = await supabase.from("recipients").select("id").eq("document_id", documentId).order("created_at", { ascending: false }).limit(1).single();
    if (!rec) { setError("Create a share link and get someone to read it first."); setVerdictBusy(""); return; }
    const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: rec.id }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Couldn't read the reader."); setVerdictBusy(""); return; }
    setVerdicts((p) => ({ ...p, [documentId]: json.verdict }));
    setVerdictBusy("");
  }

  const mono = { fontFamily: MONO, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GRAPHITE };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: SANS, color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,400&family=Inter+Tight:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .br-doc{transition:border-color .15s}.br-doc:hover{border-color:${RULE}}
        .br-btn{transition:opacity .15s,transform .1s;cursor:pointer}.br-btn:hover{opacity:.82}.br-btn:active{transform:translateY(1px)}
        .br-up{transition:border-color .15s,background .15s}.br-up:hover{border-color:${INK};background:#fff}`}</style>

      <header style={{ borderBottom: `1px solid ${RULE}`, background: PAPER, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: VOICE, fontSize: 22, letterSpacing: "-0.01em" }}>BackRead</span>
            <span style={{ ...mono, fontSize: 10 }}>Instrument</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: GRAPHITE }}>{email}</span>
            <button onClick={signOut} className="br-btn" style={{ background: "none", border: `1px solid ${RULE}`, borderRadius: 2, padding: "6px 12px", fontSize: 13, fontFamily: SANS }}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontFamily: VOICE, fontWeight: 400, fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Your documents</h1>
        <p style={{ fontSize: 15, color: GRAPHITE, margin: "0 0 32px", maxWidth: 460, lineHeight: 1.5 }}>
          Upload a document, share a tracked link, and watch how it's read.
        </p>

        <label className="br-up" style={{ display: "block", background: "transparent", border: `1.5px dashed ${RULE}`, borderRadius: 4, padding: 44, textAlign: "center", marginBottom: 36, cursor: uploading ? "default" : "pointer" }}>
          <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
          <div style={{ ...mono, marginBottom: 4 }}>{uploading ? "Uploading" : "PDF"}</div>
          <p style={{ fontFamily: VOICE, fontSize: 18, color: INK, margin: 0 }}>{uploading ? "One moment…" : "Add a document"}</p>
        </label>

        {error && <p style={{ color: MARK, fontSize: 14, marginBottom: 20 }}>{error}</p>}

        {documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontFamily: VOICE, fontStyle: "italic", fontSize: 18, color: GRAPHITE }}>Nothing sent yet. The first upload starts the record.</p>
          </div>
        ) : (
          documents.map((d, i) => (
            <div key={d.id} className="br-doc" style={{ background: SURFACE, border: `1px solid ${RULE}`, borderRadius: 4, padding: "18px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
                  <span style={{ ...mono, fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: VOICE, fontSize: 19, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => readTheReader(d.id)} disabled={verdictBusy === d.id} className="br-btn"
                    style={{ background: "transparent", color: MARK, border: `1px solid ${MARK}`, borderRadius: 2, padding: "6px 12px", fontSize: 13, fontFamily: SANS, fontWeight: 500 }}>
                    {verdictBusy === d.id ? "Reading…" : "Read the reader"}
                  </button>
                  <button onClick={() => createLink(d.id)} disabled={busyId === d.id} className="br-btn"
                    style={{ background: INK, color: PAPER, border: "none", borderRadius: 2, padding: "6px 12px", fontSize: 13, fontFamily: SANS }}>
                    {busyId === d.id ? "…" : "Share link"}
                  </button>
                </div>
              </div>

              {links[d.id] && (
                <div style={{ marginTop: 14, padding: "10px 12px", background: PAPER, border: `1px solid ${RULE}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <code style={{ fontFamily: MONO, fontSize: 12, wordBreak: "break-all", color: INK }}>{links[d.id]}</code>
                  <button onClick={() => navigator.clipboard.writeText(links[d.id])} className="br-btn" style={{ background: "#fff", border: `1px solid ${RULE}`, borderRadius: 2, padding: "5px 10px", fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap" }}>Copy</button>
                </div>
              )}

              {verdicts[d.id] && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${RULE}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={mono}>Verdict</span>
                    <span style={{ ...mono, color: verdicts[d.id].confidence === "high" ? READER : GRAPHITE }}>
                      {verdicts[d.id].confidence} confidence
                    </span>
                  </div>
                  <p style={{ fontFamily: VOICE, fontWeight: 400, fontSize: 22, lineHeight: 1.25, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{verdicts[d.id].headline}</p>
                  <p style={{ fontSize: 14, color: "#3A3D42", lineHeight: 1.6, margin: "0 0 14px" }}>{verdicts[d.id].reasoning}</p>
                  <div style={{ borderLeft: `2px solid ${MARK}`, paddingLeft: 14 }}>
                    <div style={{ ...mono, marginBottom: 3 }}>Do this next</div>
                    <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{verdicts[d.id].nextAction}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
