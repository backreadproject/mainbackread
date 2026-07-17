"use client";

import { useState, useMemo } from "react";

const INK = "#0A0E17", CANVAS = "#FBFBFA", CARD = "#FFFFFF", BLUE = "#1D4ED8", SLATE = "#475569", MUTE = "#94A3B8", LINE = "#E7EBF2", GREEN = "#059669", GREEN_BG = "#E7F7EF";
const INTER = "var(--font-geist-sans), system-ui, sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

type Row = { id: string; label: string | null; documentId: string; documentTitle: string; createdAt: string; opened: boolean; questions: number };

export default function RecipientsClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => (r.label ?? "unnamed reader").toLowerCase().includes(t) || r.documentTitle.toLowerCase().includes(t));
  }, [q, rows]);

  return (
    <div style={{ fontFamily: INTER, color: INK, minHeight: "100vh" }}>
      <style>{`.fx-row{transition:background .12s;text-decoration:none;color:inherit;display:block}.fx-row:hover{background:#F9FAFC}.fx-in:focus{border-color:${BLUE}}`}</style>

      <main style={{ maxWidth: 900, padding: "40px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 4px" }}>Recipients</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Everyone you've shared a document with.</p>
          </div>
          <input className="fx-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or document"
            style={{ width: 260, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 13px", fontSize: 14, fontFamily: INTER, background: "#fff", outline: "none" }} />
        </div>

        {rows.length === 0 ? (
          <div style={{ background: CARD, borderRadius: 14, padding: 40, textAlign: "center", boxShadow: SHADOW }}>
            <p style={{ fontSize: 15, color: SLATE, margin: 0 }}>No recipients yet. Share a document to start reading your readers.</p>
          </div>
        ) : (
          <div style={{ background: CARD, borderRadius: 14, overflow: "hidden", boxShadow: SHADOW }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.6fr", gap: 16, padding: "12px 20px", borderBottom: `1px solid ${LINE}`, fontSize: 12, fontWeight: 400, color: MUTE, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Reader</span><span>Document</span><span>Status</span><span style={{ textAlign: "right" }}>Questions</span>
            </div>
            {filtered.map((r) => (
              <a key={r.id} href={`/recipients/${r.id}`} className="fx-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.6fr", gap: 16, padding: "16px 20px", borderBottom: `1px solid ${LINE}`, alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || "Unnamed reader"}</span>
                <span style={{ fontSize: 14, color: SLATE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.documentTitle}</span>
                <span><span style={{ fontSize: 11, fontWeight: 400, padding: "3px 10px", borderRadius: 20, background: r.opened ? GREEN_BG : "#F1F5F9", color: r.opened ? GREEN : SLATE }}>{r.opened ? "Opened" : "New"}</span></span>
                <span style={{ fontSize: 14, color: r.questions > 0 ? INK : MUTE, textAlign: "right", fontWeight: r.questions > 0 ? 500 : 400 }}>{r.questions}</span>
              </a>
            ))}
            {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 14, color: SLATE }}>No matches for "{q}".</div>}
          </div>
        )}
      </main>
    </div>
  );
}
