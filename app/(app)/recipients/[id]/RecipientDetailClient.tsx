"use client";
import { useState, useMemo } from "react";
import { T } from "@/lib/theme";
import { clampDwellMs, formatDwell, DWELL_CAP_MS } from "@/lib/dwell";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Sig = { kind: string; page: number | null; value: unknown; created_at: string };
type Rec = { id: string; label: string | null; shareToken: string; documentId: string; documentTitle: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };
type Reply = { text: string; email: string; at: string };
export default function RecipientDetailClient({ recipient, signals }: { recipient: Rec; signals: Sig[] }) {
  const locale = useLocale();
  const rd = getDict(locale).recipientDetailPage;
  const fr = locale === "fr";
  const [verdict, setVerdict] = useState<Verdict | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [handled, setHandled] = useState(signals.some((s) => s.kind === "reply_handled"));
  const [handleBusy, setHandleBusy] = useState(false);
  const summary = useMemo(() => {
    const dwell: Record<number, number> = {};
    const questions: { text: string; escalated?: boolean }[] = [];
    const replies: Reply[] = [];
    let opens = 0;
    for (const s of signals) {
      if (s.kind === "opened") opens++;
      if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) dwell[s.page] = clampDwellMs((s.value as { ms: unknown }).ms);
      if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated });
      if (s.kind === "replied" && s.value && typeof s.value === "object" && "text" in s.value) {
        const v = s.value as { text: string; email?: string; at?: string };
        replies.push({ text: String(v.text), email: String(v.email ?? ""), at: String(v.at ?? s.created_at) });
      }
    }
    return { dwell, questions, replies, opens };
  }, [signals]);
  const maxDwell = Math.max(1, ...Object.values(summary.dwell));
  const RP = {
    title: fr ? "Ils ont r\u00e9pondu" : "They replied",
    sub: fr ? "Leurs mots, pas une inf\u00e9rence." : "Their words, not an inference.",
    replyTo: fr ? "R\u00e9pondre" : "Reply to them",
    markHandled: fr ? "Marquer comme trait\u00e9" : "Mark as handled",
    isHandled: fr ? "Trait\u00e9" : "Handled",
    undo: fr ? "Annuler" : "Undo",
    handledNote: fr ? "Retir\u00e9 du haut de votre file." : "Cleared from the top of your queue.",
    note: fr
      ? "Une r\u00e9ponse rend toute lecture d\u2019intention superflue. Lisez ce qu\u2019ils ont \u00e9crit avant tout le reste."
      : "A reply makes any reading of intent redundant. Take what they wrote over anything inferred below.",
  };
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
  async function setHandledState(next: boolean) {
    setHandleBusy(true); setError("");
    try {
      const res = await fetch("/api/reply-handled", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: recipient.id, handled: next }) });
      const raw = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
      if (!res.ok) throw new Error(json.error ?? "Could not save that.");
      setHandled(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setHandleBusy(false);
    }
  }
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 16 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
  const mono = "'DM Mono', ui-monospace, monospace";
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <a href="/recipients" style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> {rd.back}</a>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2, display: "inline-flex", alignItems: "center", gap: 10 }}>
          {summary.replies.length > 0 && <i title={RP.title} style={{ width: 7, height: 7, borderRadius: 2, flex: "none", background: T.green }} />}
          {recipient.label || rd.unnamedReader}
        </h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{rd.onDoc} <a href={"/documents/" + recipient.documentId} style={{ color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder }}>{recipient.documentTitle}</a></p>
        {error && <p style={{ color: T.dangerText, fontSize: 14, margin: "16px 0 0" }}>{error}</p>}
        <div style={{ marginTop: 26 }}>
          {/* Above everything. A reply is the only thing here that is not an
              inference, so it should not sit below charts that estimate what a
              reply already answers. */}
          {summary.replies.length > 0 && (
            <div style={{ ...card, borderColor: T.greenBorder }}>
              <div style={{ ...head, background: T.greenSoft, borderBottomColor: T.greenBorder, color: T.greenText, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{RP.title}</span>
                <span style={{ fontWeight: 400 }}>{summary.replies.length > 1 ? summary.replies.length : ""}</span>
              </div>
              <div style={{ padding: 18 }}>
                <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 14px", lineHeight: 1.55 }}>{RP.note}</p>
                {summary.replies.map((rep, i) => (
                  <div key={i} style={{ paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0, borderTop: i ? "1px solid " + T.borderSoft : "none" }}>
                    <p style={{ fontSize: 15, color: T.heading, lineHeight: 1.65, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{rep.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {rep.email && (
                        <a href={"mailto:" + rep.email + "?subject=" + encodeURIComponent("Re: " + recipient.documentTitle)}
                          style={{ height: 30, display: "inline-flex", alignItems: "center", background: T.green, color: T.onAccent, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, textDecoration: "none" }}>
                          {RP.replyTo}
                        </a>
                      )}
                      {rep.email && <span style={{ fontSize: 12.5, color: T.muted, fontFamily: mono }}>{rep.email}</span>}
                      <span style={{ fontSize: 12, color: T.faint, fontFamily: mono }}>{new Date(rep.at).toLocaleString()}</span>
                      {i === summary.replies.length - 1 && (
                        handled ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.muted, marginLeft: "auto" }}>
                            <i style={{ width: 6, height: 6, borderRadius: 2, background: T.faint }} />
                            {RP.isHandled}
                            <button onClick={() => setHandledState(false)} disabled={handleBusy} style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font, color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder }}>{RP.undo}</button>
                          </span>
                        ) : (
                          <button onClick={() => setHandledState(true)} disabled={handleBusy} title={RP.handledNote} style={{ marginLeft: "auto", height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer", opacity: handleBusy ? 0.6 : 1 }}>{RP.markHandled}</button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {summary.opens === 0 && summary.replies.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{rd.notOpenedYet}</p></div>
          ) : (<>
            {summary.opens > 0 && (
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
            )}
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