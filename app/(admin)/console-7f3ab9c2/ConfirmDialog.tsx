"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
export default function ConfirmDialog({
  triggerLabel, title, body, expected, confirmLabel, onConfirm, danger = true,
}: {
  triggerLabel: string;
  title: string;
  body: string;
  expected: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const matches = typed.trim() === expected.trim();
  async function go() {
    if (!matches || busy) return;
    setBusy(true); setErr("");
    // onConfirm is a caller-supplied action. If it throws rather than returning
    // {ok:false}, an unguarded await leaves this dialog stuck on "Working..."
    // in front of a destructive operation, with no way out but a reload.
    try {
      const res = await onConfirm();
      if (res.ok) { setOpen(false); setTyped(""); }
      else setErr(res.error || "Failed.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }
  const accent = danger ? T.danger : T.green;
  const accentText = danger ? T.dangerText : T.greenText;
  const accentBorder = danger ? T.dangerBorder : T.greenBorder;
  const ghost = { height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ height: 34, background: "transparent", color: accentText, border: "1px solid " + accentBorder, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>
        {triggerLabel}
      </button>
      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + (danger ? T.dangerBorder : T.border), borderRadius: T.rCard, boxShadow: T.overlayShadow, width: 440, maxWidth: "100%", fontFamily: T.font, overflow: "hidden" }}>
            <div style={{ padding: "10px 18px", background: danger ? T.dangerSoft : T.soft, borderBottom: "1px solid " + (danger ? T.dangerBorder : T.border), fontSize: 12.5, fontWeight: 600, color: danger ? T.dangerText : T.body }}>{title}</div>
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: "0 0 14px" }}>{body}</p>
              <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 6px" }}>
                Type <span style={{ color: T.heading, fontFamily: "ui-monospace, monospace" }}>{expected}</span> to confirm.
              </p>
              <input
                className="cd-in" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus
                style={{ width: "100%", height: 34, boxSizing: "border-box", background: T.card, color: T.heading, border: "1px solid " + (matches ? accent : T.border), borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, marginBottom: 14 }}
              />
              <style>{`.cd-in:focus{outline:none}`}</style>
              {err && <div style={{ background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "10px 12px", fontSize: 13, color: T.dangerText, margin: "0 0 12px", lineHeight: 1.5 }}>{err}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setOpen(false)} disabled={busy} style={ghost}>Cancel</button>
                <button onClick={go} disabled={!matches || busy}
                  style={{ height: 34, background: matches ? accent : T.soft, color: matches ? T.onAccent : T.faint, border: matches ? "none" : "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: !matches || busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Working..." : confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}