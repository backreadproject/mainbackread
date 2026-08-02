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
// Two faces, not five. Someone signing has realistically two pens: a fine one
// and a heavy one. More options turn the moment into a font picker, and a font
// picker on a contract invites decoration.
//
// Both ship with us under the SIL Open Font Licence, so every signer sees the
// same face. The old list leaned on 'Brush Script MT', which exists on Windows
// and almost nowhere else, so most signers were silently getting a fallback.
// Sixteen faces, ordered by how much they read as a signature rather than as
// lettering.
//
// The first five are monoline or brush: fast, with the stroke thinning where a
// real pen lifts. Six to fourteen are formal copperplate, beautiful and drawn
// rather than written, which is a different claim on a contract. The last two
// are unconnected handwriting, kept for contrast.
//
// All of them ship with us rather than being borrowed from the signer's
// machine: SIL Open Font Licence throughout, except Yellowtail which is Apache
// 2.0. Both permit commercial use, embedding and self-hosting. The old list
// leaned on 'Brush Script MT', which exists on Windows and almost nowhere else,
// so most signers were silently getting whatever cursive their OS had.
//
// The fallback is bare `cursive` on purpose. A system-specific fallback would
// reintroduce the exact problem: the same choice rendering differently per
// person, invisibly.
const FONTS = [
  { id: "ms-madi",      family: "Ms Madi",              stack: '"Ms Madi", cursive' },
  { id: "alex-brush",   family: "Alex Brush",           stack: '"Alex Brush", cursive' },
  { id: "sacramento",   family: "Sacramento",           stack: '"Sacramento", cursive' },
  { id: "allison",      family: "Allison",              stack: '"Allison", cursive' },
  { id: "style-script", family: "Style Script",         stack: '"Style Script", cursive' },
  { id: "birthstone",   family: "Birthstone",           stack: '"Birthstone", cursive' },
  { id: "yellowtail",   family: "Yellowtail",           stack: '"Yellowtail", cursive' },
  { id: "great-vibes",  family: "Great Vibes",          stack: '"Great Vibes", cursive' },
  { id: "pinyon",       family: "Pinyon Script",        stack: '"Pinyon Script", cursive' },
  { id: "italianno",    family: "Italianno",            stack: '"Italianno", cursive' },
  { id: "qwigley",      family: "Qwigley",              stack: '"Qwigley", cursive' },
  { id: "delafield",    family: "Mrs Saint Delafield",  stack: '"Mrs Saint Delafield", cursive' },
  { id: "muellerhoff",  family: "Herr Von Muellerhoff", stack: '"Herr Von Muellerhoff", cursive' },
  { id: "doulaise",     family: "Monsieur La Doulaise", stack: '"Monsieur La Doulaise", cursive' },
  { id: "meddon",       family: "Meddon",               stack: '"Meddon", cursive' },
  { id: "zeyada",       family: "Zeyada",               stack: '"Zeyada", cursive' },
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
  // Left and alphabetic, not centre and middle, because the ink box is measured
  // explicitly below. A script face overhangs its advance width, so centring on
  // measureText().width clips the tail of a capital and sits the name too high.
  // No synthetic italic either: it skews a connected script after the fact and
  // breaks the joins where one letter runs into the next.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const PAD_X = 60, PAD_Y = 40;
  const ink = (size: number) => {
    ctx.font = size + "px " + font;
    const m = ctx.measureText(name);
    const left = m.actualBoundingBoxLeft ?? 0;
    const right = m.actualBoundingBoxRight ?? m.width;
    const asc = m.actualBoundingBoxAscent ?? size * 0.8;
    const desc = m.actualBoundingBoxDescent ?? size * 0.2;
    return { w: left + right, h: asc + desc, left, asc };
  };

  // Shrink to fit rather than clipping, on both axes: a long name must stay
  // readable, and a tall swash must not lose its head.
  let size = 150;
  let box = ink(size);
  while ((box.w > canvas.width - PAD_X || box.h > canvas.height - PAD_Y) && size > 24) {
    size -= 4;
    box = ink(size);
  }
  ctx.fillText(name, (canvas.width - box.w) / 2 + box.left, (canvas.height - box.h) / 2 + box.asc);
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
  const [font, setFont] = useState(FONTS[0].stack);
  const [typed, setTyped] = useState(name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typed regenerates whenever the name or face changes, so what is on screen
  // is always what would be stamped.
  //
  // The await is not optional. Canvas does not pull a webfont the way rendered
  // text does, so on a cold load the preview resolves in Ms Madi while the PNG
  // underneath it rasterises in the fallback. Both look fine on their own. They
  // are not the same signature, and it only happens to the first signer of a
  // session, which is the one person who cannot tell you.
  useEffect(() => {
    if (tab !== "typed") return;
    const trimmed = typed.trim();
    if (!trimmed) { onChange(null); return; }
    let cancelled = false;
    (async () => {
      const face = FONTS.find((f) => f.stack === font);
      try {
        if (face) await document.fonts.load('150px "' + face.family + '"', trimmed);
      } catch { /* stamp in whatever did resolve rather than blocking the signer */ }
      if (!cancelled) onChange({ kind: "typed", data: typedToPng(trimmed, font) });
    })();
    return () => { cancelled = true; };
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
          <div style={{ maxHeight: 232, overflowY: "auto", marginBottom: 12, paddingRight: 4 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FONTS.map((f) => (
                <button key={f.id} type="button" title={f.family} onClick={() => setFont(f.stack)}
                  style={{ ...tabStyle(font === f.stack), height: 44, padding: "0 14px", fontFamily: f.stack, fontSize: 21, lineHeight: 1 }}>
                  {typed.trim().slice(0, 14) || "Abc"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: font, fontSize: 40, lineHeight: 1.3, color: "#101828", minHeight: 64, display: "flex", alignItems: "center", overflow: "hidden" }}>
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