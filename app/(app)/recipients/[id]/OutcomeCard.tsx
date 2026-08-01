"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Two surfaces for one piece of information.
//
// The MARKER is for someone who came here to record a result deliberately. It
// is quiet, and it is always available.
//
// The PROMPT appears only when a reader who was genuinely engaged has gone
// silent, and it asks using what actually happened -- "read it three times and
// asked about the annual commitment, then went quiet" -- because a form that
// says "update this record" gets dismissed once and ignored forever, while an
// observation gets answered.
//
// The prompt is what makes the data exist. The marker is what makes it feel
// like a product rather than a nag.
export type OutcomeValue = "won" | "lost" | "no_decision" | null;

export default function OutcomeCard({
  recipientId, outcome: initial, outcomeAt, quietDays, evidence, snoozed,
}: {
  recipientId: string;
  outcome: OutcomeValue;
  outcomeAt: string | null;
  /** Days since the newest signal. Null when they have never done anything. */
  quietDays: number | null;
  /** What they actually did, in plain words. Empty when there is nothing worth saying. */
  evidence: string;
  snoozed: boolean;
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [outcome, setOutcome] = useState<OutcomeValue>(initial);
  const [at, setAt] = useState<string | null>(outcomeAt);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(snoozed);

  const C = {
    label: fr ? "R\u00e9sultat" : "Outcome",
    none: fr ? "Non renseign\u00e9" : "Not recorded",
    won: fr ? "Gagn\u00e9" : "Won",
    lost: fr ? "Perdu" : "Lost",
    noDecision: fr ? "Sans suite" : "No decision",
    change: fr ? "Modifier" : "Change",
    quietFor: fr ? "Silence depuis" : "Quiet for",
    days: fr ? "jours" : "days",
    wonIt: fr ? "Gagn\u00e9" : "Won it",
    lostIt: fr ? "Perdu" : "Lost it",
    stillOpen: fr ? "Toujours ouvert" : "Still open",
    notNow: fr ? "Pas maintenant" : "Not now",
    failed: fr ? "Impossible d\u2019enregistrer." : "Could not save that.",
    askedTail: fr ? "Cela a-t-il abouti ?" : "Did it go anywhere?",
  };
  const LABEL: Record<string, string> = { won: C.won, lost: C.lost, no_decision: C.noDecision };
  const TONE: Record<string, string> = { won: T.green, lost: T.faint, no_decision: T.amber };

  async function save(next: OutcomeValue, snooze = false) {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/outcome", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipientId, outcome: next, snooze }),
      });
      const raw = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
      if (!res.ok) throw new Error(json.error ?? C.failed);
      if (snooze) { setDismissed(true); }
      else { setOutcome(next); setAt(next ? new Date().toISOString() : null); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : C.failed);
    } finally { setBusy(false); }
  }

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 };
  const btn = { height: 30, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, cursor: "pointer" } as const;
  const mono = "ui-monospace, monospace";

  // The prompt earns its place only when there is something real to say: the
  // reader did something, then stopped, and nobody has recorded what happened.
  const showPrompt = !outcome && !dismissed && quietDays !== null && quietDays >= 7 && evidence !== "";

  if (showPrompt) {
    return (
      <div style={card}>
        <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 500, color: T.body, display: "flex", alignItems: "center", gap: 8 }}>
          <i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber, flex: "none" }} />
          {C.quietFor} {quietDays} {C.days}
        </div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 14, color: T.body, lineHeight: 1.55, margin: "0 0 14px" }}>
            {evidence} {C.askedTail}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => save("won")} disabled={busy}
              style={{ height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, fontFamily: T.font, color: T.onAccent, background: T.green, border: "none", borderRadius: T.rBtn, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{C.wonIt}</button>
            <button onClick={() => save("lost")} disabled={busy} style={{ ...btn, height: 32, padding: "0 14px", fontSize: 13 }}>{C.lostIt}</button>
            <button onClick={() => save("no_decision")} disabled={busy} style={{ ...btn, height: 32, padding: "0 14px", fontSize: 13 }}>{C.stillOpen}</button>
            <button onClick={() => save(null, true)} disabled={busy}
              style={{ height: 32, padding: "0 10px", fontSize: 13, fontFamily: T.font, color: T.muted, background: "transparent", border: "none", cursor: "pointer" }}>{C.notNow}</button>
          </div>
          {err && <p style={{ fontSize: 13, color: T.dangerText, margin: "12px 0 0" }}>{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: T.muted }}>{C.label}</span>
      {outcome ? (<>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: T.heading }}>
          <i style={{ width: 6, height: 6, borderRadius: 2, background: TONE[outcome], flex: "none" }} />
          {LABEL[outcome]}
        </span>
        {at && <span style={{ fontSize: 12.5, color: T.faint, fontFamily: mono }}>{new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
        <button onClick={() => save(null)} disabled={busy}
          style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font, color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder }}>{C.change}</button>
      </>) : (<>
        <span style={{ fontSize: 13, color: T.faint }}>{C.none}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => save("won")} disabled={busy} style={btn}>{C.won}</button>
          <button onClick={() => save("lost")} disabled={busy} style={btn}>{C.lost}</button>
          <button onClick={() => save("no_decision")} disabled={busy} style={btn}>{C.noDecision}</button>
        </div>
      </>)}
      {err && <p style={{ fontSize: 13, color: T.dangerText, margin: "6px 0 0", width: "100%" }}>{err}</p>}
    </div>
  );
}