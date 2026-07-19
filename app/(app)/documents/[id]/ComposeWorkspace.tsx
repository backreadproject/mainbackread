"use client";
import { useState } from "react";
import { T, microLabel } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string };

export default function ComposeWorkspace({ recipientId, verdict }: { recipientId: string; verdict?: Verdict }) {
  const locale = useLocale();
  const c = getDict(locale).compose;
  const [ask, setAsk] = useState("");
  const [channel, setChannel] = useState<"" | "email" | "linkedin" | "text" | "whatsapp">("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<{ output: string; note: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const quick = [
    { label: c.quickFollowUp, ask: c.quickFollowUp, message: true },
    { label: c.quickTalkingPoints, ask: c.quickTalkingPoints, message: false },
    { label: c.quickSummary, ask: c.quickSummary, message: false },
  ];
  const soon = [c.quickRevise, c.quickSpreadsheet];

  async function run(askText: string) {
    const finalAsk = askText.trim();
    if (!finalAsk) { setError(c.needAsk); return; }
    setBusy(true); setError(""); setOutput(null);
    try {
      const res = await fetch("/api/compose-live", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipientId, ask: finalAsk, channel, context, verdict }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? c.couldntCompose); setBusy(false); return; }
      setOutput({ output: json.output, note: json.note });
    } catch { setError(c.couldntCompose); }
    setBusy(false);
  }

  function copyOut() {
    if (!output) return;
    navigator.clipboard.writeText(output.output);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const chanBtn = (val: typeof channel, label: string) => (
    <button key={val || "none"} onClick={() => setChannel(val)} type="button"
      style={{ background: channel === val ? T.green : "#fff", color: channel === val ? "#fff" : T.body, border: `1px solid ${channel === val ? T.green : T.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>{label}</button>
  );

  return (
    <div style={{ marginTop: 24, borderTop: `1px solid ${T.border}`, paddingTop: 22 }}>
      <style>{`.cw-b{cursor:pointer;transition:opacity .12s}.cw-b:hover{opacity:.9}.cw-in:focus{border-color:${T.green};outline:none}`}</style>
      <div style={{ ...microLabel, marginBottom: 6 }}>{c.title}</div>
      <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 16px" }}>{c.subtitle}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {quick.map((q) => (
          <button key={q.label} type="button" onClick={() => { setAsk(q.ask); if (q.message && !channel) setChannel("email"); }}
            className="cw-b" style={{ background: ask === q.ask ? T.greenSoft : "#fff", color: ask === q.ask ? T.greenText : T.heading, border: `1px solid ${ask === q.ask ? T.green : T.border}`, borderRadius: T.rBtn, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: T.font }}>{q.label}</button>
        ))}
        {soon.map((s) => (
          <span key={s} style={{ background: T.canvas, color: T.muted, border: `1px dashed ${T.border}`, borderRadius: T.rBtn, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: T.font, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {s} <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: T.muted }}>{c.comingSoon}</span>
          </span>
        ))}
      </div>

      <textarea className="cw-in" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={c.askPlaceholder} rows={2}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 13px", fontSize: 14, fontFamily: T.font, background: "#fff", resize: "vertical", marginBottom: 14, lineHeight: 1.5 }} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.heading, marginBottom: 8 }}>{c.channelLabel}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {chanBtn("", c.channelNone)}
          {chanBtn("email", c.channelEmail)}
          {chanBtn("linkedin", c.channelLinkedin)}
          {chanBtn("text", c.channelText)}
          {chanBtn("whatsapp", c.channelWhatsapp)}
        </div>
      </div>

      {showContext ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.heading, marginBottom: 8 }}>{c.contextLabel}</div>
          <textarea className="cw-in" value={context} onChange={(e) => setContext(e.target.value)} placeholder={c.contextPlaceholder} rows={2}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 13px", fontSize: 14, fontFamily: T.font, background: "#fff", resize: "vertical", lineHeight: 1.5 }} />
        </div>
      ) : (
        <button type="button" onClick={() => setShowContext(true)} className="cw-b" style={{ background: "none", border: "none", color: T.green, fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: "pointer", padding: "0 0 14px" }}>+ {c.contextLabel}</button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => run(ask)} disabled={busy} className="cw-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "11px 22px", fontSize: 14, fontWeight: 600, fontFamily: T.font }}>{busy ? c.generating : c.generate}</button>
        {error && <span style={{ fontSize: 13, color: "#B42318" }}>{error}</span>}
      </div>

      {output && (
        <div style={{ marginTop: 18, background: T.canvas, borderRadius: T.rCard, padding: 18 }}>
          {output.note && <div style={{ fontSize: 12, color: T.greenText, fontWeight: 600, marginBottom: 10 }}>{output.note}</div>}
          <div style={{ fontSize: 14, color: T.heading, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#fff", borderRadius: T.rInput, padding: "14px 16px", border: `1px solid ${T.border}` }}>{output.output}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={copyOut} className="cw-b" style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "8px 16px", fontSize: 13, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{copied ? c.copied : c.copy}</button>
            <button onClick={() => run(ask)} disabled={busy} className="cw-b" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "8px 16px", fontSize: 13, fontWeight: 600, fontFamily: T.font, color: T.body, cursor: "pointer" }}>{c.regenerate}</button>
          </div>
        </div>
      )}
    </div>
  );
}
