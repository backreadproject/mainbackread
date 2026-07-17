"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0B1220", CANVAS = "#F4F6FA", CARD = "#FFFFFF", BLUE = "#2D6BFF", BLUE_SOFT = "#EAF0FF", SLATE = "#64748B", MUTE = "#94A3B8", LINE = "#E7EBF2", GREEN = "#059669", GREEN_BG = "#E7F7EF", RED = "#DC2626";
const AEON = "'Moderat', 'Inter', sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

type Doc = { id: string; title: string; created_at: string };
type Rec = { id: string; label: string | null; share_token: string; created_at: string };
type Sig = { recipient_id: string; kind: string; page: number | null; value: unknown; created_at: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };

export default function DocumentDetailClient({ doc, recipients, signals }: { doc: Doc; recipients: Rec[]; signals: Sig[] }) {
  const [recs, setRecs] = useState(recipients);
  const [selected, setSelected] = useState<string | null>(recipients[0]?.id ?? null);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verdictBusy, setVerdictBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const map: Record<string, { opens: number; dwell: Record<number, number>; questions: { text: string; escalated?: boolean }[] }> = {};
    for (const r of recs) map[r.id] = { opens: 0, dwell: {}, questions: [] };
    for (const s of signals) {
      const m = map[s.recipient_id];
      if (!m) continue;
      if (s.kind === "opened") m.opens++;
      if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) m.dwell[s.page] = Number((s.value as { ms: number }).ms) || 0;
      if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) m.questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated });
    }
    return map;
  }, [signals, recs]);

  async function readTheReader(recipientId: string) {
    setVerdictBusy(recipientId); setError("");
    const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Couldn't read the reader."); setVerdictBusy(""); return; }
    setVerdicts((p) => ({ ...p, [recipientId]: json.verdict })); setVerdictBusy("");
  }
  async function saveName(recipientId: string) {
    const supabase = createClient();
    const label = nameDraft.trim() || null;
    await supabase.from("recipients").update({ label }).eq("id", recipientId);
    setRecs((prev) => prev.map((r) => (r.id === recipientId ? { ...r, label } : r))); setEditing(null);
  }
  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/read/${token}`);
    setCopied(token); setTimeout(() => setCopied(""), 1500);
  }

  const sel = recs.find((r) => r.id === selected);
  const selSum = selected ? summary[selected] : null;
  const maxDwell = selSum ? Math.max(1, ...Object.values(selSum.dwell)) : 1;
  const label = { fontSize: 13, fontWeight: 400, color: SLATE };

  return (
    <div style={{ fontFamily: AEON, color: INK, minHeight: "100vh" }}>
      <style>{`.fx-b{transition:box-shadow .15s,transform .1s;cursor:pointer}.fx-b:hover{opacity:.9}.fx-b:active{transform:translateY(1px)}
        .fx-rec{transition:background .12s;cursor:pointer}.fx-rec:hover{background:#F4F6FA}.fx-in:focus{border-color:${BLUE}}`}</style>

      <div style={{ padding: "28px 40px 0" }}>
        <a href="/documents" style={{ fontSize: 13, color: SLATE, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          Documents
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 4px" }}>{doc.title}</h1>
        <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>{recs.length} recipient{recs.length === 1 ? "" : "s"}</p>
      </div>

      {error && <p style={{ color: RED, fontSize: 14, padding: "12px 40px 0" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 20, padding: "24px 40px 40px", alignItems: "start" }}>

        <div style={{ background: CARD, borderRadius: 14, padding: 16, boxShadow: SHADOW }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
            <span style={label}>Recipients</span>
            <ShareButton documentId={doc.id} onCreated={(r) => { setRecs((p) => [r, ...p]); setSelected(r.id); }} />
          </div>
          {recs.length === 0 ? (
            <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.5, padding: "8px 4px" }}>No links yet. Create one to start.</p>
          ) : (
            recs.map((r) => {
              const s = summary[r.id]; const active = r.id === selected; const opened = s && s.opens > 0;
              return (
                <div key={r.id} className="fx-rec" onClick={() => setSelected(r.id)}
                  style={{ padding: "12px 12px", borderRadius: 10, marginBottom: 4, background: active ? BLUE_SOFT : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: active ? BLUE : INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || "Unnamed reader"}</span>
                    <span style={{ fontSize: 11, fontWeight: 400, padding: "3px 9px", borderRadius: 20, background: opened ? GREEN_BG : "#F1F5F9", color: opened ? GREEN : SLATE, flexShrink: 0 }}>{opened ? "Opened" : "New"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          {!sel ? (
            <div style={{ background: CARD, borderRadius: 14, padding: 32, boxShadow: SHADOW }}>
              <p style={{ fontSize: 15, color: SLATE, margin: 0 }}>Select a recipient to see how they read.</p>
            </div>
          ) : (
            <div style={{ background: CARD, borderRadius: 14, padding: 28, boxShadow: SHADOW }}>
              <div style={{ marginBottom: 24 }}>
                {editing === sel.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input className="fx-in" autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName(sel.id)} placeholder="e.g. Sarah at Meridian"
                      style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 12px", fontSize: 17, fontFamily: AEON, fontWeight: 400, background: "#fff", outline: "none" }} />
                    <button onClick={() => saveName(sel.id)} className="fx-b" style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 400, fontFamily: AEON }}>Save</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>{sel.label || "Unnamed reader"}</h2>
                    <button onClick={() => { setEditing(sel.id); setNameDraft(sel.label || ""); }} className="fx-b" style={{ fontSize: 13, color: BLUE, fontWeight: 400, background: "none", border: "none", cursor: "pointer", fontFamily: AEON }}>Rename</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: CANVAS, borderRadius: 10, maxWidth: 520 }}>
                  <span style={{ fontSize: 12, color: SLATE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/read/{sel.share_token}</span>
                  <button onClick={() => copyLink(sel.share_token)} className="fx-b" style={{ fontSize: 12, fontWeight: 400, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", marginLeft: "auto", fontFamily: AEON, color: INK }}>{copied === sel.share_token ? "Copied" : "Copy"}</button>
                </div>
              </div>

              {selSum && selSum.opens > 0 ? (
                <>
                  <div style={{ ...label, marginBottom: 12 }}>How they read</div>
                  <div style={{ marginBottom: 26 }}>
                    {Object.keys(selSum.dwell).length === 0 ? (
                      <p style={{ fontSize: 14, color: SLATE }}>Opened, but no page dwell recorded yet.</p>
                    ) : (
                      Object.entries(selSum.dwell).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, ms]) => (
                        <div key={page} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                          <span style={{ fontSize: 12, color: SLATE, width: 48, fontWeight: 400 }}>Page {page}</span>
                          <div style={{ flex: 1, height: 8, background: CANVAS, borderRadius: 20, overflow: "hidden", maxWidth: 340 }}>
                            <div style={{ width: `${(Number(ms) / maxDwell) * 100}%`, height: "100%", background: BLUE, borderRadius: 20 }} />
                          </div>
                          <span style={{ fontSize: 13, color: SLATE }}>{(Number(ms) / 1000).toFixed(1)}s</span>
                        </div>
                      ))
                    )}
                  </div>

                  {selSum.questions.length > 0 && (
                    <>
                      <div style={{ ...label, marginBottom: 12 }}>What they asked</div>
                      <div style={{ marginBottom: 26 }}>
                        {selSum.questions.map((q, i) => (
                          <div key={i} style={{ background: CANVAS, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                            <p style={{ fontSize: 15, margin: 0 }}>{q.text}</p>
                            {q.escalated && <span style={{ fontSize: 11, fontWeight: 400, color: RED, marginTop: 4, display: "inline-block" }}>Escalated — commercial question</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ ...label, marginBottom: 12 }}>Verdict</div>
                  {verdicts[sel.id] ? (
                    <div style={{ background: CANVAS, borderRadius: 12, padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 400, color: SLATE }}>Reading</span>
                        <span style={{ fontSize: 11, fontWeight: 400, padding: "3px 10px", borderRadius: 20, background: verdicts[sel.id].confidence === "high" ? GREEN_BG : "#F1F5F9", color: verdicts[sel.id].confidence === "high" ? GREEN : SLATE }}>{verdicts[sel.id].confidence} confidence</span>
                      </div>
                      <p style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{verdicts[sel.id].headline}</p>
                      <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "0 0 14px" }}>{verdicts[sel.id].reasoning}</p>
                      <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 400, color: BLUE, marginBottom: 3 }}>Do this next</div>
                        <p style={{ fontSize: 15, fontWeight: 400, margin: 0 }}>{verdicts[sel.id].nextAction}</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => readTheReader(sel.id)} disabled={verdictBusy === sel.id} className="fx-b"
                      style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 400, fontFamily: AEON, boxShadow: "0 4px 12px rgba(45,107,255,0.25)" }}>
                      {verdictBusy === sel.id ? "Reading…" : "Read the reader"}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 15, color: SLATE, margin: 0 }}>This reader hasn't opened the document yet. Their read appears here once they do.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareButton({ documentId, onCreated }: { documentId: string; onCreated: (r: Rec) => void }) {
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.from("recipients").insert({ document_id: documentId, label: null }).select("id, label, share_token, created_at").single();
    if (data) onCreated(data as Rec);
    setBusy(false);
  }
  return (
    <button onClick={create} disabled={busy} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 400, fontFamily: AEON, cursor: "pointer" }}>
      {busy ? "…" : "+ New link"}
    </button>
  );
}
