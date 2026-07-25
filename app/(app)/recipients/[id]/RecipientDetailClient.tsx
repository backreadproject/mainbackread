"use client";
import { useState, useMemo } from "react";
import { T } from "@/lib/theme";
import { clampDwellMs, formatDwell, DWELL_CAP_MS } from "@/lib/dwell";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Sig = { kind: string; page: number | null; value: unknown; created_at: string };
type Rec = { id: string; label: string | null; shareToken: string; documentId: string; documentTitle: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };
export default function RecipientDetailClient({ recipient, signals }: { recipient: Rec; signals: Sig[] }) {
  const locale = useLocale();
  const rd = getDict(locale).recipientDetailPage;
  const [verdict, setVerdict] = useState<Verdict | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const summary = useMemo(() => { const dwell: Record<number, number> = {}; const questions: { text: string; escalated?: boolean }[] = []; let opens = 0; for (const s of signals) { if (s.kind === "opened") opens++; if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) dwell[s.page] = clampDwellMs((s.value as { ms: unknown }).ms); if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated }); } return { dwell, questions, opens }; }, [signals]);
  const maxDwell = Math.max(1, ...Object.values(summary.dwell));
    // Same guard as the document detail page: a 504 returns HTML, so an
  // unguarded res.json() throws and leaves the button stuck on "Reading...".
  async function readTheReader() {
    setBusy(true); setError("");
    try {
      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 90000);
      const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: recipient.id }), signal: ctrl.signal });
      clearTimeout(kill);
      const text = await res.text();
      let json: { verdict?: Verdict; error?: string } = {};
      try { json = JSON.parse(text); } catch { throw new Error("Server returned " + res.status + ". The request may have timed out."); }
      if (!res.ok) throw new Error(json.error ?? rd.couldntRead);
      if (!json.verdict) throw new Error(rd.couldntRead);
      setVerdict(json.verdict);
    } catch (e) {
      setError(e instanceof Error ? (e.name === "AbortError" ? "Timed out after 90 seconds." : e.message) : rd.couldntRead);
    } finally {
      setBusy(false);
    }
  }
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 16 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <a href="/recipients" style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> {rd.back}</a>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{recipient.label || rd.unnamedReader}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{rd.onDoc} <a href={"/documents/" + recipient.documentId} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>{recipient.documentTitle}</a></p>
        {error && <p style={{ color: T.dangerText, fontSize: 14, margin: "16px 0 0" }}>{error}</p>}
        <div style={{ marginTop: 26 }}>
          {summary.opens === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{rd.notOpenedYet}</p></div>
          ) : (<>
            <div style={card}>
              <div style={head}>{rd.howTheyRead}</div>
              <div style={{ padding: 18 }}>
                {Object.keys(summary.dwell).length === 0 ? <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{rd.openedNoDwell}</p> : Object.entries(summary.dwell).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, ms]) => (
                  <div key={page} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                    <span style={{ fontSize: 12.5, color: T.muted, width: 58, flex: "none" }}>{rd.page} {page}</span>
                    <div style={{ flex: 1, height: 6, background: T.soft, border: "1px solid " + T.border, borderRadius: 2, overflow: "hidden", maxWidth: 360 }}><div style={{ width: ((Number(ms) / maxDwell) * 100) + "%", height: "100%", background: T.green }} /></div>
                    <span title={Number(ms) >= DWELL_CAP_MS ? "Capped. A tab left open, not attention." : undefined} style={{ fontSize: 13, color: Number(ms) >= DWELL_CAP_MS ? T.faint : T.body, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDwell(Number(ms))}</span>
                  </div>
                ))}
              </div>
            </div>
            {summary.questions.length > 0 && (
              <div style={card}>
                <div style={head}>{rd.whatTheyAsked} &middot; {summary.questions.length}</div>
                <div>
                  {summary.questions.map((q, i) => (
                    <div key={i} style={{ padding: "13px 18px", borderBottom: i < summary.questions.length - 1 ? "1px solid " + T.borderSoft : "none" }}>
                      <p style={{ fontSize: 13.5, color: T.heading, margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                      {q.escalated && <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading, marginTop: 6 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber }} />{rd.escalated}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={card}>
              <div style={head}>{rd.verdict}</div>
              <div style={{ padding: 18 }}>
                {verdict ? (<>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading, marginBottom: 10 }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, background: verdict.confidence === "high" ? T.green : T.faint }} />
                    {verdict.confidence}{rd.confidenceSuffix}
                  </span>
                  <p style={{ fontSize: 19, fontWeight: 600, color: T.heading, lineHeight: 1.3, letterSpacing: T.trackingTight, margin: "0 0 10px" }}>{verdict.headline}</p>
                  <p style={{ fontSize: 14, color: T.body, lineHeight: 1.55, margin: "0 0 14px" }}>{verdict.reasoning}</p>
                  <div style={{ background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.greenText, marginBottom: 3 }}>{rd.doThisNext}</div>
                    <p style={{ fontSize: 14, color: T.heading, margin: 0, lineHeight: 1.5 }}>{verdict.nextAction}</p>
                  </div>
                </>) : <button onClick={readTheReader} disabled={busy} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? rd.readingBusy : rd.readTheReader}</button>}
              </div>
            </div>
          </>)}
        </div>
      </main>
    </div>
  );
}