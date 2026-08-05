"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import type { Workspace } from "@/lib/workspace";

const CHOICES: { id: Workspace; name: string; detail: string; note: string }[] = [
  {
    id: "classic",
    name: "Classic workspace",
    detail:
      "The shell the app has always had. A sidebar, a page heading, and one column of content at a comfortable measure.",
    note: "Every surface has been used in this shell for months.",
  },
  {
    id: "elegant",
    name: "Elegant workspace",
    detail:
      "Denser chrome over the same pages. Tighter rows, smaller headings, tabular figures, and a header strip carrying the numbers that matter on each surface.",
    note: "The index pane arrives one route at a time. Until a route has one, it renders full width in the same denser style.",
  },
];

export default function AppearanceForm({ current }: { current: Workspace }) {
  const [choice, setChoice] = useState<Workspace>(current);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspace: choice }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || "Could not save that."); return; }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ padding: "4px 18px" }}>
        {CHOICES.map((c, i) => {
          const on = choice === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setChoice(c.id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 11,
                padding: "15px 0",
                borderTop: i === 0 ? "none" : "1px solid " + T.borderSoft,
                cursor: "pointer",
              }}
            >
              <i style={{
                width: 15, height: 15, borderRadius: "50%", flex: "none", marginTop: 2,
                border: "1px solid " + (on ? T.green : T.border),
                background: T.card, position: "relative", display: "inline-block",
              }}>
                {on && <i style={{ position: "absolute", inset: 3, background: T.green, borderRadius: "50%", display: "block" }} />}
              </i>
              <div>
                <div style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>
                  {c.name}
                  {c.id === current && (
                    <span style={{ marginLeft: 9, fontSize: 11, color: T.muted, fontWeight: 400 }}>current default</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, lineHeight: 1.6, maxWidth: 620 }}>{c.detail}</div>
                <div style={{ fontSize: 12, color: T.faint, marginTop: 5, lineHeight: 1.55, maxWidth: 620 }}>{c.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p style={{ fontSize: 13, color: T.dangerText, margin: "0 18px 12px" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderTop: "1px solid " + T.border }}>
        <span style={{ fontSize: 12, color: T.faint, flex: 1, lineHeight: 1.55 }}>
          Reversible, and it does not move anyone who has already chosen for themselves.
        </span>
        <button
          onClick={() => void save()}
          disabled={busy || choice === current}
          style={{
            height: 34, padding: "0 14px",
            background: T.green, border: "1px solid " + T.green, color: T.onAccent,
            borderRadius: T.rBtn, fontSize: 13.5, fontWeight: 500, fontFamily: T.font,
            cursor: busy || choice === current ? "default" : "pointer",
            opacity: busy || choice === current ? 0.5 : 1,
          }}
        >
          {busy ? "Working\u2026" : saved ? "Saved" : "Set as default"}
        </button>
      </div>
    </>
  );
}
