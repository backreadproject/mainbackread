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
    const res = await onConfirm();
    setBusy(false);
    if (res.ok) { setOpen(false); setTyped(""); }
    else setErr(res.error || "Failed.");
  }

  const btn = {
    background: danger ? "#D92D20" : T.green, color: "#fff", border: "none",
    borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600,
    fontFamily: T.font, cursor: "pointer",
  } as const;

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...btn, background: "transparent", color: danger ? "#B42318" : T.green, border: `1px solid ${danger ? "#FDA29B" : T.border}` }}>
        {triggerLabel}
      </button>
      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 440, maxWidth: "100%", fontFamily: T.font }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: "0 0 8px", letterSpacing: T.trackingTight }}>{title}</h3>
            <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 14px" }}>{body}</p>
            <p style={{ fontSize: 13, color: T.body, margin: "0 0 6px" }}>
              Type <strong style={{ color: T.heading }}>{expected}</strong> to confirm.
            </p>
            <input
              value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus
              style={{ width: "100%", boxSizing: "border-box", background: "#fff", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 11px", fontSize: 14, fontFamily: T.font, marginBottom: 14 }}
            />
            {err && <p style={{ color: "#B42318", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} disabled={busy} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>Cancel</button>
              <button onClick={go} disabled={!matches || busy} style={{ ...btn, opacity: !matches || busy ? 0.5 : 1, cursor: !matches || busy ? "not-allowed" : "pointer" }}>
                {busy ? "Working..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
