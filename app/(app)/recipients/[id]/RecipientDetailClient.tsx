"use client";
import { useState, useMemo } from "react";
import { T, microLabel } from "@/lib/theme";
type Sig = { kind: string; page: number | null; value: unknown; created_at: string };
type Rec = { id: string; label: string | null; shareToken: string; documentId: string; documentTitle: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };
export default function RecipientDetailClient({ recipient, signals }: { recipient: Rec; signals: Sig[] }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const summary = useMemo(() => { const dwell: Record<number, number> = {}; const questions: { text: string; escalated?: boolean }[] = []; let opens = 0; for (const s of signals) { if (s.kind === "opened") opens++; if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) dwell[s.page] = Number((s.value as { ms: number }).ms) || 0; if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated }); } return { dwell, questions, opens }; }, [signals]);
  const maxDwell = Math.max(1, ...Object.values(summary.dwell));
  async function readTheReader() { setBusy(true); setError(""); const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: recipient.id }) }); const json = await res.json(); if (!res.ok) { setError(json.error ?? "Couldn't read the reader."); setBusy(false); return; } setVerdict(json.verdict); setBusy(false); }
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22, marginBottom: 16 };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-b{cursor:pointer}`}</style>
      <div style={{ padding: "26px 30px 0" }}>
        <a href="/recipients" style={{ fontSize: 13, color: T.body, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12 }}><span style={{ color: T.muted }}>‹</span> Recipients</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{recipient.label || "Unnamed reader"}</h1>
        <p style={{ fontSize: 14, color: T.body, margin: 0 }}>on <a href={`/documents/${recipient.documentId}`} style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>{recipient.documentTitle}</a></p>
      </div>
      {error && <p style={{ color: "#B42318", fontSize: 14, padding: "12px 30px 0" }}>{error}</p>}
      <main style={{ maxWidth: 760, padding: "22px 30px 40px" }}>
        {summary.opens === 0 ? (
          <div style={card}><p style={{ fontSize: 15, color: T.body, margin: 0 }}>This reader hasn't opened the document yet. Their read will appear here once they do.</p></div>
        ) : (<>
          <div style={card}>
            <div style={{ ...microLabel, marginBottom: 14 }}>How they read</div>
            {Object.keys(summary.dwell).length === 0 ? <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Opened, no page dwell yet.</p> : Object.entries(summary.dwell).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, ms]) => (
              <div key={page} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                <span style={{ fontSize: 12, color: T.body, width: 52, fontWeight: 500 }}>Page {page}</span>
                <div style={{ flex: 1, height: 8, background: T.canvas, borderRadius: 20, overflow: "hidden", maxWidth: 360 }}><div style={{ width: `${(Number(ms) / maxDwell) * 100}%`, height: "100%", background: T.green, borderRadius: 20 }} /></div>
                <span style={{ fontSize: 13, color: T.body }}>{(Number(ms) / 1000).toFixed(1)}s</span>
              </div>
            ))}
          </div>
          {summary.questions.length > 0 && (
            <div style={card}>
              <div style={{ ...microLabel, marginBottom: 14 }}>What they asked · {summary.questions.length}</div>
              {summary.questions.map((q, i) => (<div key={i} style={{ background: T.canvas, borderRadius: T.rInput, padding: "12px 14px", marginBottom: 8 }}><p style={{ fontSize: 15, color: T.heading, margin: 0 }}>{q.text}</p>{q.escalated && <span style={{ fontSize: 11, fontWeight: 600, color: "#B42318", marginTop: 4, display: "inline-block" }}>Escalated — commercial question</span>}</div>))}
            </div>
          )}
          <div style={card}>
            <div style={{ ...microLabel, marginBottom: 14 }}>Verdict</div>
            {verdict ? (
              <div style={{ background: T.canvas, borderRadius: T.rCard, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: T.body }}>Reading</span><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: verdict.confidence === "high" ? T.pillPosBg : T.pillNeutralBg, color: verdict.confidence === "high" ? T.pillPosText : T.pillNeutralText }}>{verdict.confidence} confidence</span></div>
                <p style={{ fontSize: 20, fontWeight: 700, color: T.heading, lineHeight: 1.3, letterSpacing: T.trackingTight, margin: "0 0 10px" }}>{verdict.headline}</p>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 14px" }}>{verdict.reasoning}</p>
                <div style={{ background: "#fff", borderRadius: T.rInput, padding: "12px 14px" }}><div style={{ fontSize: 12, fontWeight: 600, color: T.green, marginBottom: 3 }}>Do this next</div><p style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0 }}>{verdict.nextAction}</p></div>
              </div>
            ) : <button onClick={readTheReader} disabled={busy} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "11px 20px", fontSize: 14, fontWeight: 600, fontFamily: T.font }}>{busy ? "Reading…" : "Read the reader"}</button>}
          </div>
        </>)}
      </main>
    </div>
  );
}
