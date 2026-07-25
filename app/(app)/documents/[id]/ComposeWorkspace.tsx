"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
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
    // Same guard as the verdict call: a 504 or 500 returns HTML, so an
    // unguarded res.json() throws and leaves the button spinning forever.
    try {
      const res = await fetch("/api/compose-live", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipientId, ask: finalAsk, channel, context, verdict }),
      });
      const text = await res.text();
      let json: { output?: string; note?: string; error?: string } = {};
      try { json = JSON.parse(text); } catch { throw new Error("Server returned " + res.status + " and no error detail."); }
      if (!res.ok) throw new Error(json.error ?? c.couldntCompose);
      setOutput({ output: json.output ?? "", note: json.note ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : c.couldntCompose);
    } finally {
      setBusy(false);
    }
  }
  function copyOut() {
    if (!output) return;
    navigator.clipboard.writeText(output.output);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  const seg = (val: typeof channel, label: string) => (
    <button key={val || "none"} onClick={() => setChannel(val)} type="button"
      style={{ height: 30, background: channel === val ? T.greenSoft : T.card, color: channel === val ? T.greenText : T.body, border: "1px solid " + (channel === val ? T.greenBorder : T.border), borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: channel === val ? 600 : 400, fontFamily: T.font, cursor: "pointer" }}>{label}</button>
  );
  const label = { fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 8 };
  const area = { width: "100%", boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "10px 12px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, resize: "vertical" as const, lineHeight: 1.55 };
  return (
    <div style={{ marginTop: 24, borderTop: "1px solid " + T.border, paddingTop: 20 }}>
      <style>{`.cw-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 4 }}>{c.title}</div>
      <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 16px" }}>{c.subtitle}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {quick.map((q) => (
          <button key={q.label} type="button" onClick={() => { setAsk(q.ask); if (q.message && !channel) setChannel("email"); }}
            style={{ height: 30, background: ask === q.ask ? T.greenSoft : T.card, color: ask === q.ask ? T.greenText : T.heading, border: "1px solid " + (ask === q.ask ? T.greenBorder : T.border), borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: ask === q.ask ? 600 : 400, fontFamily: T.font, cursor: "pointer" }}>{q.label}</button>
        ))}
        {soon.map((s) => (
          <span key={s} style={{ height: 30, background: T.soft, color: T.faint, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontFamily: T.font, display: "inline-flex", alignItems: "center", gap: 7 }}>
            {s} <span style={{ fontSize: 11 }}>{c.comingSoon}</span>
          </span>
        ))}
      </div>
      <textarea className="cw-in" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={c.askPlaceholder} rows={2} style={{ ...area, marginBottom: 14 }} />
      <div style={{ marginBottom: 14 }}>
        <div style={label}>{c.channelLabel}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {seg("", c.channelNone)}
          {seg("email", c.channelEmail)}
          {seg("linkedin", c.channelLinkedin)}
          {seg("text", c.channelText)}
          {seg("whatsapp", c.channelWhatsapp)}
        </div>
      </div>
      {showContext ? (
        <div style={{ marginBottom: 14 }}>
          <div style={label}>{c.contextLabel}</div>
          <textarea className="cw-in" value={context} onChange={(e) => setContext(e.target.value)} placeholder={c.contextPlaceholder} rows={2} style={area} />
        </div>
      ) : (
        <button type="button" onClick={() => setShowContext(true)} style={{ background: "none", border: "none", color: T.greenText, fontSize: 13, fontFamily: T.font, cursor: "pointer", padding: 0, marginBottom: 14, borderBottom: "1px solid " + T.greenBorder }}>{c.contextLabel}</button>
      )}
      <div>
        <button onClick={() => run(ask)} disabled={busy} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? c.generating : c.generate}</button>
        {error && <div style={{ marginTop: 12, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 }}>{error}</div>}
      </div>
      {output && (
        <div style={{ marginTop: 18, border: "1px solid " + T.border, borderRadius: T.rCard }}>
          {output.note && <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, color: T.muted }}>{output.note}</div>}
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 14, color: T.heading, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{output.output}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={copyOut} style={{ height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: copied ? T.greenText : T.heading, cursor: "pointer" }}>{copied ? c.copied : c.copy}</button>
              <button onClick={() => run(ask)} disabled={busy} style={{ height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.body, cursor: "pointer" }}>{c.regenerate}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}