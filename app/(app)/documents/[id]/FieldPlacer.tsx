"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Placing the fields.
//
// The sender opens the document, picks a signer, and clicks where that person
// signs. Coordinates are stored as FRACTIONS of the page rather than pixels:
// the reader renders at whatever width the device gives it, so a pixel offset
// would drift on every screen while a fraction resolves correctly on all of
// them.
//
// pdf.js is set up exactly as PdfReader does it -- CDN worker wrapped in a Blob
// that installs the polyfills first. That arrangement was arrived at by fixing
// real mobile failures, and reproducing it is safer than inventing a second way
// to load the same library.
export type Field = {
  id?: string;
  recipientId: string;
  page: number;
  x: number; y: number; w: number; h: number;
  kind: "signature" | "date" | "text";
  /** Only meaningful on a date field. "signed" fills itself when the
   *  signature is appended; "chosen" lets the signer pick one. */
  dateMode?: "signed" | "chosen";
  label?: string | null;
};
export type SignerLite = { id: string; name: string };

const KINDS = ["signature", "date", "text"] as const;

function installModernPolyfills() {
  const u8 = Uint8Array.prototype as unknown as Record<string, unknown>;
  const U8 = Uint8Array as unknown as Record<string, unknown>;
  if (typeof u8.toHex !== "function") {
    u8.toHex = function (this: Uint8Array) {
      let out = "";
      for (let i = 0; i < this.length; i++) out += (this[i] >>> 4).toString(16) + (this[i] & 15).toString(16);
      return out;
    };
  }
  if (typeof U8.fromHex !== "function") {
    U8.fromHex = function (hex: string) {
      const c = String(hex); const n = c.length >>> 1; const a = new Uint8Array(n);
      for (let i = 0; i < n; i++) a[i] = parseInt(c.substr(i * 2, 2), 16);
      return a;
    };
  }
  if (typeof u8.toBase64 !== "function") {
    u8.toBase64 = function (this: Uint8Array) {
      let s = ""; for (let i = 0; i < this.length; i++) s += String.fromCharCode(this[i]);
      return btoa(s);
    };
  }
  if (typeof U8.fromBase64 !== "function") {
    U8.fromBase64 = function (b64: string) {
      const bin = atob(String(b64)); const a = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      return a;
    };
  }
  const addUpsert = (proto: Record<string, unknown>) => {
    if (typeof proto.getOrInsert !== "function") {
      proto.getOrInsert = function (this: Map<unknown, unknown>, key: unknown, value: unknown) {
        if (this.has(key)) return this.get(key);
        this.set(key, value); return value;
      };
    }
    if (typeof proto.getOrInsertComputed !== "function") {
      proto.getOrInsertComputed = function (this: Map<unknown, unknown>, key: unknown, cb: (k: unknown) => unknown) {
        if (this.has(key)) return this.get(key);
        const v = cb(key); this.set(key, v); return v;
      };
    }
  };
  addUpsert(Map.prototype as unknown as Record<string, unknown>);
  addUpsert(WeakMap.prototype as unknown as Record<string, unknown>);
  const Pr = Promise as unknown as Record<string, unknown>;
  if (typeof Pr.try !== "function") {
    Pr.try = function (fn: (...a: unknown[]) => unknown, ...args: unknown[]) {
      return new Promise((resolve) => resolve(fn(...args)));
    };
  }
  const sp = Set.prototype as unknown as Record<string, unknown>;
  if (typeof sp.intersection !== "function") {
    sp.intersection = function (this: Set<unknown>, other: { has: (v: unknown) => boolean }) {
      const r = new Set<unknown>(); for (const v of this) if (other.has(v)) r.add(v); return r;
    };
  }
  if (typeof sp.union !== "function") {
    sp.union = function (this: Set<unknown>, other: Iterable<unknown>) {
      const r = new Set<unknown>(this); for (const v of other) r.add(v); return r;
    };
  }
  if (typeof sp.difference !== "function") {
    sp.difference = function (this: Set<unknown>, other: { has: (v: unknown) => boolean }) {
      const r = new Set<unknown>(); for (const v of this) if (!other.has(v)) r.add(v); return r;
    };
  }
}

// One colour per signer, so a glance shows whether anyone has been forgotten.
const TONES = ["#1F6F4A", "#3538CD", "#B54708", "#B42318", "#6941C6", "#0E7090"];

export default function FieldPlacer({
  documentId, fileUrl, signers, initial, onClose, onSaved,
}: {
  documentId: string;
  fileUrl: string;
  signers: SignerLite[];
  initial: Field[];
  onClose: () => void;
  onSaved: (fields: Field[]) => void;
}) {
  const fr = useLocale() === "fr";
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState<Field[]>(initial);
  const [who, setWho] = useState(signers[0]?.id ?? "");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("signature");
  const [dateMode, setDateMode] = useState<"signed" | "chosen">("signed");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const renderedRef = useRef(false);

  const C = {
    title: fr ? "O\u00f9 signe-t-on ?" : "Where do they sign?",
    placingFor: fr ? "Placer pour" : "Placing for",
    clickPage: fr ? "Cliquez sur la page \u00e0 l\u2019endroit voulu" : "Click the page where they sign",
    signature: fr ? "Signature" : "Signature",
    date: fr ? "Date" : "Date",
    text: fr ? "Texte" : "Text",
    hint: fr ? "La date se remplit seule. Le texte est \u00e0 eux." : "Date fills itself. Text is theirs to complete.",
    dateAuto: fr ? "Date de signature" : "Date they sign",
    dateChosen: fr ? "Le signataire choisit" : "Signer picks a date",
    dateAutoWhy: fr ? "Se remplit toute seule." : "Fills itself.",
    dateChosenWhy: fr ? "Le signataire ouvre un calendrier." : "The signer opens a calendar.",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Enregistrement..." : "Saving...",
    cancel: fr ? "Annuler" : "Cancel",
    opening: fr ? "Ouverture du document..." : "Opening the document...",
    none: fr ? "Aucun champ plac\u00e9 pour l\u2019instant." : "Nothing placed yet.",
    remove: fr ? "Retirer" : "Remove",
    failed: fr ? "Impossible d\u2019enregistrer." : "Could not save that.",
    signsHere: fr ? "signe ici" : "signs here",
  };

  const toneOf = useCallback((id: string) => TONES[Math.max(0, signers.findIndex((s) => s.id === id)) % TONES.length], [signers]);
  const nameOf = useCallback((id: string) => signers.find((s) => s.id === id)?.name ?? "", [signers]);

  useEffect(() => {
    if (!fileUrl || renderedRef.current) return;
    renderedRef.current = true;
    (async () => {
      try {
        installModernPolyfills();
        const pdfjs = await import("pdfjs-dist");
        const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        try {
          const workerBody =
            "(" + installModernPolyfills.toString() + ")();\n" +
            "await import(" + JSON.stringify(cdnWorker) + ");";
          pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([workerBody], { type: "text/javascript" }));
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        }
        const assets = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
        const pdf = await pdfjs.getDocument({
          url: fileUrl, cMapUrl: `${assets}/cmaps/`, cMapPacked: true,
          standardFontDataUrl: `${assets}/standard_fonts/`, disableFontFace: true,
        }).promise;
        const container = containerRef.current;
        if (!container) return;
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = "100%"; canvas.style.height = "auto"; canvas.style.display = "block";
          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.cssText = `background:#fff;margin-bottom:14px;border-radius:4px;position:relative;border:1px solid ${T.border};cursor:crosshair`;
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
        setReady(true);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not open the document.");
      }
    })();
  }, [fileUrl]);

  // A click lands a field centred on the point, so the cursor marks the middle
  // of the box rather than its corner -- which is how people expect to place
  // something they can see.
  function onPageClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest("[data-page]") as HTMLElement | null;
    if (!target || !who) return;
    const rect = target.getBoundingClientRect();
    const w = kind === "signature" ? 0.24 : kind === "date" ? 0.15 : 0.2;
    const h = kind === "signature" ? 0.07 : 0.04;
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width - w / 2, 0), 1 - w);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height - h / 2, 0), 1 - h);
    setFields((p) => [...p, { recipientId: who, page: Number(target.dataset.page), x, y, w, h, kind, ...(kind === "date" ? { dateMode } : {}) }]);
  }

  async function save() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/signature-fields", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, fields }),
      });
      const raw = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
      if (!res.ok) throw new Error(json.error ?? C.failed);
      onSaved(fields);
    } catch (e) {
      setErr(e instanceof Error ? e.message : C.failed);
    } finally { setBusy(false); }
  }

  const chip = (active: boolean, tone?: string) => ({
    height: 28, padding: "0 11px", fontSize: 12, fontWeight: 500, fontFamily: T.font,
    color: active ? T.onAccent : T.heading,
    background: active ? (tone ?? T.green) : T.card,
    border: "1px solid " + (active ? (tone ?? T.green) : T.border),
    borderRadius: 4, cursor: "pointer",
  }) as const;

  return (
    <div style={{ position: "fixed", inset: 0, background: T.scrim, zIndex: 100, display: "flex", flexDirection: "column", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.card, border: "1px solid " + T.borderStrong, borderRadius: T.rCard,
          boxShadow: "0 16px 48px -12px rgba(15,40,28,0.35)", width: 820, maxWidth: "100%", margin: "0 auto",
          display: "flex", flexDirection: "column", maxHeight: "100%", fontFamily: T.font, overflow: "hidden" }}>

        <div style={{ padding: "12px 18px", borderBottom: "1px solid " + T.border, background: T.soft, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: T.body }}>{C.placingFor}</span>
          {signers.map((s) => (
            <button key={s.id} onClick={() => setWho(s.id)} style={chip(who === s.id, toneOf(s.id))}>{s.name}</button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: T.muted }}>{C.clickPage}</span>
        </div>

        <div style={{ padding: "10px 18px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {KINDS.map((k) => (
            <button key={k} onClick={() => setKind(k)} style={chip(kind === k)}>
              {k === "signature" ? C.signature : k === "date" ? C.date : C.text}
            </button>
          ))}
          {kind === "date" ? (
            <span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
              <button onClick={() => setDateMode("signed")} style={chip(dateMode === "signed")} title={C.dateAutoWhy}>{C.dateAuto}</button>
              <button onClick={() => setDateMode("chosen")} style={chip(dateMode === "chosen")} title={C.dateChosenWhy}>{C.dateChosen}</button>
            </span>
          ) : (
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.faint }}>{C.hint}</span>
          )}
        </div>

        <div ref={containerRef} onClick={onPageClick}
          style={{ flex: 1, overflowY: "auto", padding: 18, background: T.soft, position: "relative" }}>
          {!ready && <p style={{ fontSize: 13.5, color: T.muted, textAlign: "center", padding: 40 }}>{C.opening}</p>}
        </div>

        {/* Rendered outside the scroll container so the overlay tracks the page
            wrappers by index rather than being appended into them by hand. */}
        <Overlay fields={fields} containerRef={containerRef} toneOf={toneOf} nameOf={nameOf}
          onRemove={(i) => setFields((p) => p.filter((_, k) => k !== i))}
          onMove={(i, x, y) => setFields((p) => p.map((f, k) => (k === i ? { ...f, x, y } : f)))}
          signsHere={C.signsHere} ready={ready} />
        <div style={{ padding: "12px 18px", borderTop: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: T.muted }}>
            {fields.length === 0 ? C.none : fields.length + ""}
          </span>
          {err && <span style={{ fontSize: 13, color: T.dangerText }}>{err}</span>}
          <button onClick={onClose} disabled={busy}
            style={{ marginLeft: "auto", height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{C.cancel}</button>
          <button onClick={save} disabled={busy}
            style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 14px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? C.saving : C.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// The placed fields, drawn into the page wrappers after they exist.
function Overlay({
  fields, containerRef, toneOf, nameOf, onRemove, onMove, signsHere, ready,
}: {
  fields: Field[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  toneOf: (id: string) => string;
  nameOf: (id: string) => string;
  onRemove: (i: number) => void;
  onMove: (i: number, x: number, y: number) => void;
  signsHere: string;
  ready: boolean;
}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return;
    // Clear and redraw: the field list is small and this avoids tracking which
    // node belongs to which entry across edits.
    container.querySelectorAll("[data-field]").forEach((n) => n.remove());
    fields.forEach((f, i) => {
      const page = container.querySelector(`[data-page="${f.page}"]`) as HTMLElement | null;
      if (!page) return;
      const tone = toneOf(f.recipientId);
      const box = document.createElement("div");
      box.dataset.field = String(i);
      box.style.cssText = `position:absolute;left:${f.x * 100}%;top:${f.y * 100}%;width:${f.w * 100}%;height:${f.h * 100}%;border:1.5px dashed ${tone};background:${tone}14;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10.5px;color:${tone};cursor:pointer;text-align:center;padding:2px;box-sizing:border-box`;
      box.textContent = f.kind === "signature" ? `${nameOf(f.recipientId)} ${signsHere}` : f.kind === "date" ? (f.dateMode === "chosen" ? "Date (picked)" : "Date") : "Text";
      box.style.cursor = "grab";

      // Drag. Offsets are captured against the box, not the page, so the
      // field moves with the pointer rather than jumping its centre to it.
      box.onmousedown = (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const pageRect = page.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const dx = ev.clientX - boxRect.left;
        const dy = ev.clientY - boxRect.top;
        box.style.cursor = "grabbing";
        const move = (m: MouseEvent) => {
          const nx = Math.min(Math.max((m.clientX - dx - pageRect.left) / pageRect.width, 0), 1 - f.w);
          const ny = Math.min(Math.max((m.clientY - dy - pageRect.top) / pageRect.height, 0), 1 - f.h);
          box.style.left = nx * 100 + "%";
          box.style.top = ny * 100 + "%";
        };
        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
          box.style.cursor = "grab";
          // Commit on release rather than on every frame: state updates
          // during a drag would redraw the box under the pointer.
          onMove(i, parseFloat(box.style.left) / 100, parseFloat(box.style.top) / 100);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      };

      const x = document.createElement("button");
      x.textContent = "\u00d7";
      x.setAttribute("aria-label", "Remove");
      x.style.cssText = `position:absolute;top:-9px;right:-9px;width:18px;height:18px;border-radius:9px;border:1px solid ${tone};background:#fff;color:${tone};font-size:12px;line-height:1;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center`;
      x.onclick = (ev) => { ev.stopPropagation(); onRemove(i); };
      box.appendChild(x);
      page.appendChild(box);
    });
  }, [fields, containerRef, toneOf, nameOf, onRemove, onMove, signsHere, ready]);
  return null;
}