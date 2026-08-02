"use client";
import { useState, useRef, useEffect } from "react";

// Capturing a signature.
//
// Three ways, because signing is a moment where convenience matters more than
// consistency: someone on a phone draws, someone at a desk types, someone with
// a scanned signature uploads it.
//
// All three produce a PNG data URL, so everything downstream -- storage, the
// stamped PDF, the certificate -- handles one shape. Typed is rendered to a
// canvas rather than kept as text for exactly that reason.
const FONTS = [
  { id: "serif", label: "Georgia, serif" },
  { id: "script", label: "'Brush Script MT', 'Segoe Script', cursive" },
  { id: "sans", label: "system-ui, sans-serif" },
];

export type Captured = { kind: "typed" | "drawn" | "uploaded"; data: string };

export function typedToPng(name: string, font: string): string {
  const canvas = document.createElement("canvas");
  // Generous and fixed: the stamp is scaled to its field at render time, so a
  // large canvas costs nothing and a small one would look soft when enlarged.
  canvas.width = 900; canvas.height = 260;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101828";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 130;
  ctx.font = `italic ${size}px ${font}`;
  // Shrink to fit rather than clipping: a long name must still be readable.
  while (ctx.measureText(name).width > canvas.width - 60 && size > 28) {
    size -= 6;
    ctx.font = `italic ${size}px ${font}`;
  }
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

export default function SignaturePad({
  name, value, onChange, labels,
}: {
  name: string;
  value: Captured | null;
  onChange: (c: Captured | null) => void;
  labels: { type: string; draw: string; upload: string; clear: string; drawHint: string; uploadHint: string };
}) {
  const [tab, setTab] = useState<"typed" | "drawn" | "uploaded">("typed");
  const [font, setFont] = useState(FONTS[0].label);
  const [typed, setTyped] = useState(name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typed regenerates whenever the name or face changes, so what is on screen
  // is always what would be stamped.
  useEffect(() => {
    if (tab !== "typed") return;
    const trimmed = typed.trim();
    onChange(trimmed ? { kind: "typed", data: typedToPng(trimmed, font) } : null);
  }, [tab, typed, font]);

  useEffect(() => {
    if (tab !== "drawn") return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Backing store larger than the display box, so a drawn line is not
    // pixellated when the same image is stamped at print scale.
    c.width = 900; c.height = 260;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101828";
  }, [tab]);

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: ((p.clientX - r.left) / r.width) * c.width, y: ((p.clientY - r.top) / r.height) * c.height };
  }
  function start(e: React.MouseEvent | React.TouchEvent) {
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    // Without this a touch drag scrolls the page instead of drawing.
    if ("touches" in e) e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current; if (!c) return;
    onChange({ kind: "drawn", data: c.toDataURL("image/png") });
  }
  function clearDrawn() {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    onChange(null);
  }

  function takeImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ kind: "uploaded", data: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const tabStyle = (active: boolean) => ({
    height: 30, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: "inherit",
    color: active ? "#fff" : "#101828", background: active ? "#1F6F4A" : "#fff",
    border: "1px solid " + (active ? "#1F6F4A" : "#E4E7EC"), borderRadius: 4, cursor: "pointer",
  }) as const;

  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setTab("typed")} style={tabStyle(tab === "typed")}>{labels.type}</button>
        <button type="button" onClick={() => { setTab("drawn"); onChange(null); }} style={tabStyle(tab === "drawn")}>{labels.draw}</button>
        <button type="button" onClick={() => { setTab("uploaded"); onChange(null); }} style={tabStyle(tab === "uploaded")}>{labels.upload}</button>
      </div>

      {tab === "typed" && (
        <div style={{ border: "1px solid #E4E7EC", borderRadius: 6, padding: 16, background: "#F9FAFB" }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E4E7EC", borderRadius: 6, padding: "8px 10px", fontSize: 13.5, marginBottom: 12, background: "#fff" }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {FONTS.map((f) => (
              <button key={f.id} type="button" onClick={() => setFont(f.label)}
                style={{ ...tabStyle(font === f.label), fontFamily: f.label, fontStyle: "italic", fontSize: 15 }}>
                {typed.trim().slice(0, 12) || "Abc"}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: font, fontStyle: "italic", fontSize: 30, color: "#101828", minHeight: 44, display: "flex", alignItems: "center" }}>
            {typed.trim()}
          </div>
        </div>
      )}

      {tab === "drawn" && (
        <div>
          <canvas ref={canvasRef}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            style={{ width: "100%", height: 150, border: "1px solid #E4E7EC", borderRadius: 6, background: "#F9FAFB", touchAction: "none", display: "block", cursor: "crosshair" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#98A2B3" }}>{labels.drawHint}</span>
            <button type="button" onClick={clearDrawn}
              style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontSize: 12.5, color: "#1F6F4A", cursor: "pointer", borderBottom: "1px solid #A6D5BE" }}>{labels.clear}</button>
          </div>
        </div>
      )}

      {tab === "uploaded" && (
        <div>
          {value?.kind === "uploaded" ? (
            <div style={{ border: "1px solid #E4E7EC", borderRadius: 6, padding: 16, background: "#F9FAFB", textAlign: "center" }}>
              <img src={value.data} alt="" style={{ maxWidth: "100%", maxHeight: 120 }} />
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()}
              style={{ width: "100%", border: "1.5px dashed #C8CFD8", borderRadius: 6, padding: "28px 16px", background: "#F9FAFB", cursor: "pointer", fontSize: 13, color: "#344054", fontFamily: "inherit" }}>
              {labels.uploadHint}
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg"
            onChange={(e) => { takeImage(e.target.files?.[0]); e.target.value = ""; }}
            style={{ display: "none" }} />
          {value?.kind === "uploaded" && (
            <button type="button" onClick={() => onChange(null)}
              style={{ marginTop: 8, background: "none", border: "none", padding: 0, fontSize: 12.5, color: "#1F6F4A", cursor: "pointer", borderBottom: "1px solid #A6D5BE" }}>{labels.clear}</button>
          )}
        </div>
      )}
    </>
  );
}