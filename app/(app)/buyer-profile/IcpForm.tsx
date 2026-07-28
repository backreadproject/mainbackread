"use client";
import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/theme";
import { questionsFor, SELLS_ID, type IcpBranchId } from "@/lib/icp-questions";
import { icpCopy } from "@/lib/icp-copy";
import type { Locale } from "@/lib/i18n";

export default function IcpForm({
  branch, locale, step, setStep, answers, setAnswers, count, setCount,
  savedAt, busy, onFlush, onGenerate, onDiscard,
}: {
  branch: IcpBranchId;
  locale: Locale;
  step: number;
  setStep: (n: number) => void;
  answers: Record<string, string>;
  setAnswers: (fn: (a: Record<string, string>) => Record<string, string>) => void;
  count: number | null;
  setCount: (n: number | null) => void;
  savedAt: number | null;
  busy: boolean;
  onFlush: () => Promise<void>;
  onGenerate: () => void;
  onDiscard: () => void;
}) {
  const c = icpCopy(locale);
  const qs = questionsFor(branch, locale);
  const q = qs[Math.min(step, qs.length - 1)];
  const last = step >= qs.length - 1;
  const filled = qs.filter((x) => (answers[x.id] ?? "").trim()).length;
  const ready = filled >= 3 && (answers[SELLS_ID] ?? "").trim().length > 0;

  const [ago, setAgo] = useState("");
  useEffect(() => {
    if (!savedAt) { setAgo(""); return; }
    const tick = () => {
      const s = Math.round((Date.now() - savedAt) / 1000);
      setAgo(s < 5 ? c.saved : s < 60 ? c.savedSecs(s) : c.savedMins(Math.round(s / 60)));
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => clearInterval(iv);
  }, [savedAt, c]);

  const ta = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => { ta.current?.focus(); }, [step]);

  function go(n: number) {
    void onFlush();
    setStep(Math.max(0, Math.min(qs.length - 1, n)));
  }

  const btn = {
    font: "inherit", fontSize: 13, fontWeight: 500, padding: "7px 14px",
    borderRadius: T.rBtn, border: "1px solid " + T.border, background: T.card,
    color: T.heading, cursor: "pointer",
  } as const;
  const primary = { ...btn, border: "none", background: T.green, color: T.onAccent } as const;

  return (
    <div style={{ marginTop: 26, borderTop: "1px solid " + T.border, display: "grid", gridTemplateColumns: "232px minmax(0,1fr)" }}>
      <div style={{ borderRight: "1px solid " + T.border, padding: "18px 20px 18px 0" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.faint, marginBottom: 12 }}>
          {c.questions}
        </div>
        {qs.map((x, n) => {
          const now = n === step;
          const done = (answers[x.id] ?? "").trim().length > 0;
          return (
            <button key={x.id} onClick={() => go(n)}
              style={{
                display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 8, width: "100%",
                textAlign: "left", font: "inherit", fontSize: 13, padding: "6px 0", cursor: "pointer",
                background: "transparent", border: "none",
                color: now ? T.heading : T.muted, fontWeight: now ? 500 : 400,
              }}>
              <span style={{ color: done ? T.greenText : now ? T.heading : T.faint, fontVariantNumeric: "tabular-nums" }}>{n + 1}</span>
              <span>{x.label}</span>
            </button>
          );
        })}
        <button onClick={onDiscard} disabled={busy}
          style={{ marginTop: 16, font: "inherit", fontSize: 12.5, color: T.muted, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
          {c.discard}
        </button>
      </div>

      <div style={{ padding: "18px 0 18px 28px" }}>
        {q.weight && (
          <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.greenText, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, background: T.green, display: "inline-block" }} />
            {c.carriesWeight}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, maxWidth: "34em" }}>
          {q.q}
        </div>
        <div style={{ color: T.muted, fontSize: 13.5, marginTop: 7, maxWidth: "40em", lineHeight: 1.55 }}>{q.why}</div>

        <textarea
          ref={ta}
          value={answers[q.id] ?? ""}
          onChange={(e) => { const v = e.target.value; setAnswers((a) => ({ ...a, [q.id]: v })); }}
          onBlur={() => { void onFlush(); }}
          maxLength={4000}
          style={{
            width: "100%", maxWidth: 640, marginTop: 16, minHeight: 132, resize: "vertical",
            font: "inherit", fontSize: 14, lineHeight: 1.55, color: T.body, background: T.card,
            border: "1px solid " + T.border, borderRadius: T.rInput, padding: "11px 12px",
          }}
        />

        {branch === "operating" && q.id === SELLS_ID && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label htmlFor="icp-count" style={{ fontSize: 13, color: T.muted }}>{c.howManyCustomers}</label>
            <input id="icp-count" type="number" min={0} inputMode="numeric"
              value={count ?? ""}
              onChange={(e) => setCount(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
              onBlur={() => { void onFlush(); }}
              style={{ width: 90, font: "inherit", fontSize: 14, color: T.body, background: T.card, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "6px 9px" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 18, maxWidth: 640, flexWrap: "wrap" }}>
          <button onClick={() => go(step - 1)} disabled={step === 0} style={{ ...btn, opacity: step === 0 ? 0.45 : 1, cursor: step === 0 ? "default" : "pointer" }}>
            {c.back}
          </button>
          {!last && <button onClick={() => go(step + 1)} style={primary}>{c.cont}</button>}
          {last && (
            <button onClick={onGenerate} disabled={busy || !ready}
              style={{ ...primary, opacity: busy || !ready ? 0.55 : 1, cursor: busy || !ready ? "default" : "pointer" }}>
              {busy ? c.building : c.build}
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: T.muted }}>
            {busy && last ? c.takesAMinute : ago}
          </span>
        </div>

        {last && !ready && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: T.muted, maxWidth: 640, lineHeight: 1.55 }}>
            {c.notReady}
          </div>
        )}
      </div>
    </div>
  );
}