"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/theme";
import type { Locale } from "@/lib/i18n";
import { stepsFor, type Branch, type Field, type Objective } from "@/lib/buyer-questions";

/**
 * The discovery form, as approved.
 *
 * Controlled from the parent, which owns the answers and the save. Two steps:
 * the business, then the evidence. The weighted questions are marked, because
 * the failure mode on those is a one line answer and nothing in the output
 * recovers from it.
 */

type Answers = Record<string, string>;

/** Multi-selects store a joined string so the answer map stays flat and the
 *  saved shape is identical to every other field. */
export const MULTI_SEP = " | ";

function MultiSelect({
  field,
  value,
  onChange,
  fr,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  fr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const picked = value ? value.split(MULTI_SEP).filter(Boolean) : [];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  function toggle(o: string) {
    const next = picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o];
    onChange(next.join(MULTI_SEP));
  }

  return (
    <div style={{ position: "relative" }} ref={box}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        style={{
          width: "100%", minHeight: 34, border: "1px solid " + T.border, borderRadius: T.rBtn,
          background: T.card, padding: "5px 30px 5px 8px", cursor: "pointer", textAlign: "left",
          position: "relative", fontFamily: T.font,
        }}
      >
        <span style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          {picked.length === 0 ? (
            <span style={{ color: T.faint, fontSize: 13.5, padding: "3px 0" }}>{field.placeholder ?? ""}</span>
          ) : (
            picked.map((p) => (
              <span key={p} style={{ border: "1px solid " + T.border, borderRadius: 4, padding: "3px 7px", fontSize: 12, background: T.soft, color: T.body }}>
                {p}
              </span>
            ))
          )}
        </span>
        <span style={{ position: "absolute", right: 12, top: 15, width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid " + T.faint }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", zIndex: 30, top: "calc(100% + 4px)", left: 0, right: 0,
          background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn,
          maxHeight: 240, overflowY: "auto", padding: 5,
        }}>
          {(field.groups ?? []).map((g) => (
            <div key={g.label || "one"}>
              {g.label && (
                <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: T.faint, padding: "9px 8px 4px" }}>
                  {g.label}
                </div>
              )}
              {g.options.map((o) => (
                <label key={o} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", fontSize: 13, cursor: "pointer", borderRadius: 4, color: T.body }}>
                  <input
                    type="checkbox"
                    checked={picked.includes(o)}
                    onChange={() => toggle(o)}
                    style={{ width: 14, height: 14, margin: 0, accentColor: T.green }}
                  />
                  {o}
                </label>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 4px 2px", borderTop: "1px solid " + T.border, marginTop: 6 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ border: "1px solid " + T.border, borderRadius: 4, background: T.card, padding: "4px 10px", fontSize: 12.5, cursor: "pointer", color: T.body }}>
              {fr ? "Termin\u00e9" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscoveryForm({
  objective,
  branch,
  locale,
  step,
  setStep,
  answers,
  setAnswers,
  savedAt,
  busy,
  onFlush,
  onGenerate,
  onDiscard,
}: {
  objective: Objective;
  branch: Branch;
  locale: Locale;
  step: number;
  setStep: (n: number) => void;
  answers: Answers;
  setAnswers: (fn: (a: Answers) => Answers) => void;
  savedAt: number | null;
  busy: boolean;
  onFlush: () => Promise<void>;
  onGenerate: () => void;
  onDiscard: () => void;
}) {
  const fr = locale === "fr";
  const steps = stepsFor(objective, branch, locale);
  const cur = steps[Math.min(step, steps.length - 1)];
  const last = step >= steps.length - 1;

  const c = {
    carries: fr ? "Cette r\u00e9ponse pr\u00e8se lourd" : "This one carries weight",
    back: fr ? "Retour" : "Back",
    cont: fr ? "Continuer" : "Continue",
    build: fr ? "Continuer" : "Continue",
    discard: fr ? "Supprimer ce brouillon" : "Discard this draft",
    saved: fr ? "Enregistr\u00e9" : "Saved",
    saving: fr ? "Un instant\u2026" : "Working\u2026",
    notReady: fr
      ? "R\u00e9pondez \u00e0 au moins trois questions. Un profil construit sur moins est une devinette d\u00e9guis\u00e9e en format."
      : "Answer at least three questions. A profile built on less is guesswork wearing a format.",
    saveHint: fr ? "Les r\u00e9ponses sont enregistr\u00e9es au fur et \u00e0 mesure." : "Answers save as you go.",
  };

  const answered = Object.values(answers).filter((v) => v.trim()).length;
  const ready = answered >= 3;

  const inp: React.CSSProperties = {
    width: "100%", height: 34, border: "1px solid " + T.border, borderRadius: T.rBtn,
    padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.body,
  };
  const area: React.CSSProperties = { ...inp, height: 78, padding: "9px 11px", lineHeight: 1.55, resize: "vertical" };
  const btn: React.CSSProperties = {
    height: 34, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px",
    fontSize: 13, fontFamily: T.font, background: T.card, color: T.body, cursor: "pointer",
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500 };

  function set(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>
        {cur.title}
      </h2>
      <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 700 }}>{cur.intro}</p>

      <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card }}>
        <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
          {cur.id === "business" ? (fr ? "L\u2019entreprise" : "The business") : (fr ? "Preuves" : "Evidence")}
        </div>

        <div style={{ padding: "0 16px" }}>
          {cur.fields.map((f, i) => (
            <div key={f.id} style={{
              display: "grid", gridTemplateColumns: "210px minmax(0,1fr)", gap: 16,
              padding: "15px 0", alignItems: "start",
              borderBottom: i < cur.fields.length - 1 ? "1px solid " + T.border : "none",
            }}>
              <div style={{ paddingTop: 7 }}>
                <span style={{ fontSize: 13, color: T.heading, fontWeight: 500 }}>{f.label}</span>
                {f.weight && (
                  <span style={{ marginLeft: 7, border: "1px solid " + T.border, borderRadius: 4, padding: "1px 5px", fontSize: 10.5, color: T.amber, background: "#FFFBF5", whiteSpace: "nowrap" }}>
                    {c.carries}
                  </span>
                )}
                {f.hint && (
                  <span style={{ display: "block", fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{f.hint}</span>
                )}
              </div>

              <div>
                {f.kind === "text" && (
                  <input value={answers[f.id] ?? ""} placeholder={f.placeholder} autoComplete="off"
                    onChange={(e) => set(f.id, e.target.value)} style={inp} />
                )}
                {f.kind === "long" && (
                  <textarea value={answers[f.id] ?? ""} placeholder={f.placeholder}
                    onChange={(e) => set(f.id, e.target.value)} style={area} />
                )}
                {f.kind === "select" && (
                  <select value={answers[f.id] ?? ""} onChange={(e) => set(f.id, e.target.value)} style={{ ...inp, width: 340 }}>
                    <option value="">{fr ? "Choisir\u2026" : "Choose\u2026"}</option>
                    {(f.groups ?? []).map((g) =>
                      g.label ? (
                        <optgroup key={g.label} label={g.label}>
                          {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ) : (
                        g.options.map((o) => <option key={o} value={o}>{o}</option>)
                      ),
                    )}
                  </select>
                )}
                {f.kind === "multi" && (
                  <div style={{ maxWidth: 520 }}>
                    <MultiSelect field={f} value={answers[f.id] ?? ""} onChange={(v) => set(f.id, v)} fr={fr} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button type="button" style={btn} disabled={busy} onClick={onDiscard}>{c.discard}</button>
        <span style={{ fontSize: 12, color: T.faint }}>
          {savedAt ? c.saved : c.saveHint}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {step > 0 && (
            <button type="button" style={btn} disabled={busy} onClick={() => { void onFlush(); setStep(step - 1); }}>
              {c.back}
            </button>
          )}
          {!last ? (
            <button type="button" style={primary} disabled={busy} onClick={() => { void onFlush(); setStep(step + 1); }}>
              {c.cont}
            </button>
          ) : (
            <button type="button" style={{ ...primary, opacity: ready && !busy ? 1 : 0.5, cursor: ready && !busy ? "pointer" : "not-allowed" }}
              disabled={!ready || busy} onClick={onGenerate}>
              {busy ? c.saving : c.build}
            </button>
          )}
        </span>
      </div>

      {!ready && last && (
        <p style={{ fontSize: 12.5, color: T.amber, marginTop: 10, lineHeight: 1.55 }}>{c.notReady}</p>
      )}
    </>
  );
}
