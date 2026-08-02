"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// What this document does not answer.
//
// Deliberately NOT rendered on load. It is a reason-tier call, and a panel that
// fires on every page view would spend money to tell most people something they
// already read yesterday. It is a question the customer asks, and the answer is
// cached until the document or the reader questions change.
type Gap = { question: string; why: string; where?: string };
type GapsResult = { gaps: Gap[]; covered: string[]; basis: string };

export default function GapsPanel({ documentId }: { documentId: string }) {
  const fr = useLocale() === "fr";
  const [result, setResult] = useState<GapsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [basedOn, setBasedOn] = useState<number | null>(null);

  const C = {
    title: fr ? "Ce que ce document ne dit pas" : "What this document does not answer",
    intro: fr
      ? "\u00c0 lire avant l\u2019envoi : les questions qu\u2019un lecteur devra poser parce que le document n\u2019y r\u00e9pond pas."
      : "Read it before you send it: the questions a reader will have to ask because the document does not answer them.",
    run: fr ? "Lire le document" : "Read the document",
    busy: fr ? "Lecture..." : "Reading...",
    again: fr ? "Relire" : "Read it again",
    covered: fr ? "Ce qui est bien couvert" : "Already well covered",
    where: fr ? "O\u00f9" : "Where",
    failed: fr ? "Impossible de lire le document." : "Could not read the document.",
    fromReaders: fr ? "questions r\u00e9elles de vos lecteurs prises en compte" : "real questions from your readers were weighed",
  };

  async function run(refresh = false) {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/gaps", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, refresh }),
      });
      // Guarded like every other write here: a 504 returns HTML, and an
      // unguarded res.json() would throw and leave the button stuck on Reading.
      const raw = await res.text();
      let json: { gaps?: GapsResult; error?: string; basedOn?: number } = {};
      try { json = JSON.parse(raw); } catch { throw new Error("Server returned " + res.status + "."); }
      if (!res.ok) throw new Error(json.error ?? C.failed);
      if (!json.gaps) throw new Error(C.failed);
      setResult(json.gaps);
      setBasedOn(typeof json.basedOn === "number" ? json.basedOn : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : C.failed);
    } finally { setBusy(false); }
  }

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body };

  return (
    <div style={{ maxWidth: 1040, padding: "0 28px" }}>
      <div style={card}>
        <div style={head}>{C.title}</div>
        <div style={{ padding: 18 }}>
          {!result ? (
            <>
              <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>{C.intro}</p>
              <button onClick={() => run(false)} disabled={busy}
                style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
                  padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                {busy ? C.busy : C.run}
              </button>
            </>
          ) : (
            <>
              {result.gaps.map((g, i) => (
                <div key={i} style={{ paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0, borderTop: i ? "1px solid " + T.borderSoft : "none" }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: T.heading, lineHeight: 1.4, margin: "0 0 5px", letterSpacing: T.trackingTight }}>{g.question}</p>
                  <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: 0 }}>{g.why}</p>
                  {g.where && <p style={{ fontSize: 12.5, color: T.muted, margin: "5px 0 0" }}>{C.where}: {g.where}</p>}
                </div>
              ))}
              {result.covered.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + T.borderSoft }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 6 }}>{C.covered}</div>
                  {result.covered.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, marginBottom: 4 }}>
                      <i style={{ width: 4, height: 4, borderRadius: 2, background: T.green, marginTop: 8, flex: "none" }} />
                      <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* The basis, always. A reader who cannot tell whether this came
                  from evidence or from inference cannot judge how much to
                  trust it. */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                  {result.basis}
                  {basedOn && basedOn > 0 ? " " + basedOn + " " + C.fromReaders + "." : ""}
                </span>
                <button onClick={() => run(true)} disabled={busy}
                  style={{ height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn,
                    padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                  {busy ? C.busy : C.again}
                </button>
              </div>
            </>
          )}
          {err && <p style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5, margin: "12px 0 0" }}>{err}</p>}
        </div>
      </div>
    </div>
  );
}