"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

const INK = "#0F1729", CANVAS = "#F4F6F3", CARD = "#FFFFFF", GREEN = "#0B7A4B", GREEN_HOVER = "#0A6A41", BRAND = "#1FA971", GREEN_SOFT = "#E7F6EF", GREEN_TEXT = "#067647", ANSWER_INK = "#0B3D2A", NEUTRAL_BUBBLE = "#F1F3F0", SLATE = "#8A9299", BODY = "#475467", LINE = "#EEF0EC", HEAT_MID = "#3FB587", HEAT_OFF = "#DBE0DC";
const AEON = "var(--font-dm-sans), system-ui, sans-serif";
const SHADOW = "0 1px 2px rgba(9,30,22,0.05), 0 8px 20px rgba(9,30,22,0.05)";
const SHADOW_PANEL = "0 1px 2px rgba(9,30,22,0.04), 0 12px 34px rgba(9,30,22,0.06)";
const MOBILE = "(max-width: 820px)";

// pdf.js v6 assumes a very recent browser and calls several 2024/2025 JS methods that older
// mobile browsers do not have yet, which crashes the reader ("X is not a function"). This
// installs compatible fallbacks only where the native method is missing. It must stay fully
// self-contained (no references outside itself): its source is stringified and also run
// inside the PDF worker, which is a separate JS scope.
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

type Msg = { role: "user" | "doc"; text: string };

export default function PdfReader({ title, fileUrl, token, greeting, initialThread = [] }: { title: string; fileUrl: string; token: string; greeting: string; initialThread?: Msg[] }) {
  const locale = useLocale();
  const r = getDict(locale).readerPage;
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(r.opening);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const renderedRef = useRef(false);
  const docText = useRef<string>("");

  const currentPage = useRef<number | null>(null);
  const enteredAt = useRef<number>(0);
  const dwellMs = useRef<Record<number, number>>({});
  const [dwellView, setDwellView] = useState<Record<number, number>>({});

  const [thread, setThread] = useState<Msg[]>(initialThread);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);

  const onMobile = () => typeof window !== "undefined" && window.matchMedia(MOBILE).matches;
  function toggleSheet() { if (onMobile()) setSheetOpen((o) => !o); }

  function send(kind: string, page: number | null, value: unknown) {
    const body = JSON.stringify({ token, kind, page, value });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/signal", new Blob([body], { type: "application/json" }));
    else fetch("/api/signal", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  }
  function leavePage() {
    const p = currentPage.current;
    if (p !== null && enteredAt.current) {
      const delta = Date.now() - enteredAt.current;
      dwellMs.current[p] = (dwellMs.current[p] ?? 0) + delta;
      setDwellView({ ...dwellMs.current });
      send("page_dwell", p, { ms: dwellMs.current[p] });
    }
  }
  async function ask() {
    const q = draft.trim();
    if (!q || asking) return;
    setDraft(""); setAsking(true);
    if (onMobile()) setSheetOpen(true);
    setThread((t) => [...t, { role: "user", text: q }]);
    try {
      const res = await fetch("/api/ask-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, question: q, currentPage: currentPage.current ?? 1, documentText: docText.current }) });
      const json = await res.json();
      setThread((t) => [...t, { role: "doc", text: json.answer ?? json.error ?? r.noAnswer }]);
    } catch { setThread((t) => [...t, { role: "doc", text: r.couldntReach }]); }
    setAsking(false);
  }

  useEffect(() => { threadEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [thread, asking]);

  useEffect(() => {
    if (!fileUrl || renderedRef.current) return;
    renderedRef.current = true;
    (async () => {
      try {
        // Install fallbacks on the main thread BEFORE pdf.js loads.
        installModernPolyfills();
        const pdfjs = await import("pdfjs-dist");
        const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        // toHex/getOrInsertComputed etc. also run inside the worker, so wrap the real worker
        // with the same fallbacks. Giving pdf.js a worker SOURCE keeps its readiness
        // handshake and its main-thread fallback intact.
        try {
          const workerBody =
            "(" + installModernPolyfills.toString() + ")();\n" +
            "await import(" + JSON.stringify(cdnWorker) + ");";
          pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
            new Blob([workerBody], { type: "text/javascript" })
          );
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        }
        // Some mobile browsers/WebViews mangle text when pdf.js renders through generated
        // web-fonts. disableFontFace makes pdf.js paint the glyph outlines directly, which
        // renders correctly everywhere (verified against this exact pdf.js version).
        const assets = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
        const pdf = await pdfjs.getDocument({
          url: fileUrl,
          cMapUrl: `${assets}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assets}/standard_fonts/`,
          disableFontFace: true,
        }).promise;
        setPageCount(pdf.numPages); setStatus("");
        send("opened", null, { pages: pdf.numPages });
        const container = containerRef.current;
        if (!container) return;
        const wrappers: HTMLDivElement[] = [];
        const textParts: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = "100%"; canvas.style.height = "auto"; canvas.style.display = "block";
          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.cssText = `background:#fff;margin-bottom:18px;border-radius:12px;overflow:hidden;box-shadow:${SHADOW}`;
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const tc = await page.getTextContent();
          textParts.push(`[Page ${n}]\n` + tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
        }
        docText.current = textParts.join("\n\n").slice(0, 20000);
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          const p = Number((visible.target as HTMLElement).dataset.page);
          if (p === currentPage.current) return;
          leavePage(); currentPage.current = p; enteredAt.current = Date.now(); setActivePage(p);
        }, { threshold: [0.25, 0.5, 0.75] });
        wrappers.forEach((w) => observer.observe(w));
      } catch (err) {
        setStatus(r.couldntOpen + (err instanceof Error ? err.message : String(err)));
      }
    })();
    const onHide = () => leavePage();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") leavePage(); });
    return () => window.removeEventListener("pagehide", onHide);
  }, [fileUrl, token]);

  const maxDwell = Math.max(1, ...Object.values(dwellView));

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: AEON, color: INK }}>
      <style>{`
        .fx-ask{transition:background .15s}.fx-ask:hover{background:${GREEN_HOVER}}
        .fx-in:focus{border-color:${BRAND};box-shadow:0 0 0 3px rgba(31,169,113,0.14)}
        .rdr-handle{display:none}
        .rdr-chev{display:none}
        @media ${MOBILE}{
          .rdr-grid{grid-template-columns:1fr !important;gap:0 !important;padding:10px !important;}
          .rdr-rail{display:none !important;}
          .rdr-title{display:none !important;}
          .rdr-main{padding-bottom:132px !important;}
          .rdr-aside{position:fixed !important;top:auto !important;bottom:0 !important;left:0 !important;right:0 !important;height:auto !important;max-height:86vh !important;border-radius:18px 18px 0 0 !important;z-index:40 !important;box-shadow:0 -6px 28px rgba(9,30,22,0.14) !important;}
          .rdr-handle{display:block;width:40px;height:4px;border-radius:4px;background:#D7DED8;margin:8px auto 0;}
          .rdr-askhead{cursor:pointer;}
          .rdr-chev{display:block;margin-left:auto;transition:transform .2s;color:${SLATE};flex-shrink:0;}
          .rdr-aside.is-open .rdr-chev{transform:rotate(180deg);}
          .rdr-thread{flex:none !important;max-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;overflow:hidden !important;transition:max-height .25s ease,padding .25s ease;}
          .rdr-aside.is-open .rdr-thread{max-height:56vh !important;padding-top:16px !important;padding-bottom:16px !important;overflow-y:auto !important;}
          .rdr-inputrow{padding-bottom:max(12px, env(safe-area-inset-bottom)) !important;}
        }
      `}</style>

      <header style={{ background: CARD, borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: 9, background: GREEN_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={BRAND} strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill={BRAND} /></svg>
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: INK }}>{greeting}</span>
          <h1 className="rdr-title" style={{ fontSize: 15, fontWeight: 500, margin: 0, marginLeft: "auto", color: SLATE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50%" }}>{title}</h1>
        </div>
      </header>

      <div className="rdr-grid" style={{ maxWidth: 1180, margin: "0 auto", padding: 24, display: "grid", gridTemplateColumns: "14px minmax(0,1.5fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>

        <div className="rdr-rail" style={{ position: "sticky", top: 92, height: "78vh", display: "flex", flexDirection: "column", gap: 6, paddingTop: 6, alignItems: "center" }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const d = dwellView[p] ?? 0;
            const w = 2 + (d / maxDwell) * 2;
            return <div key={p} title={`Page ${p}: ${(d / 1000).toFixed(1)}s`}
              style={{ width: activePage === p ? w + 2 : w, height: `${100 / Math.max(pageCount, 1)}%`, minHeight: 6, background: d > 0 ? (activePage === p ? GREEN : HEAT_MID) : HEAT_OFF, borderRadius: 20, transition: "width .3s, background .3s" }} />;
          })}
        </div>

        <main className="rdr-main">
          {status && <p style={{ fontSize: 15, color: BODY, textAlign: "center", padding: 48 }}>{status}</p>}
          <div ref={containerRef} />
          {pageCount > 0 && <p style={{ fontSize: 13, color: SLATE, textAlign: "center", padding: "16px 0" }}>{pageCount} {pageCount > 1 ? r.pageMany : r.pageOne}</p>}
        </main>

        <aside className={`rdr-aside${sheetOpen ? " is-open" : ""}`} style={{ position: "sticky", top: 92, background: CARD, borderRadius: 14, boxShadow: SHADOW_PANEL, display: "flex", flexDirection: "column", height: "78vh", overflow: "hidden" }}>
          <div className="rdr-handle" onClick={toggleSheet} />
          <div className="rdr-askhead" onClick={toggleSheet} style={{ padding: "15px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 20, background: BRAND, boxShadow: "0 0 0 3px rgba(31,169,113,0.16)", flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.25 }}>{r.askTitle}</span>
            <span className="rdr-chev">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </div>
          <div className="rdr-thread" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {thread.length === 0 && <p style={{ fontSize: 14, lineHeight: 1.5, color: BODY, margin: 0 }}>{r.askEmpty}</p>}
            {thread.map((m, i) => (
              m.role === "user" ? (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%", background: NEUTRAL_BUBBLE, borderRadius: "14px 14px 4px 14px", padding: "10px 13px", fontSize: 13.5, color: INK, lineHeight: 1.45 }}>{m.text}</div>
              ) : (
                <div key={i} style={{ maxWidth: "90%" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: GREEN_TEXT, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{r.theDocument}</div>
                  <div style={{ background: GREEN_SOFT, borderRadius: "4px 14px 14px 14px", padding: "11px 13px", fontSize: 13.5, color: ANSWER_INK, lineHeight: 1.5 }}>{m.text}</div>
                </div>
              )
            ))}
            {asking && <div style={{ fontSize: 13, color: SLATE }}>{r.reading}</div>}
            <div ref={threadEnd} />
          </div>
          <div className="rdr-inputrow" style={{ borderTop: `1px solid ${LINE}`, padding: 12, display: "flex", gap: 9, alignItems: "center" }}>
            <input className="fx-in" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={r.askPlaceholder}
              style={{ flex: 1, minWidth: 0, border: `1px solid #E3E7E3`, borderRadius: 22, padding: "10px 15px", fontSize: 13.5, fontFamily: AEON, background: "#FAFBFA", outline: "none", transition: "border-color .15s, box-shadow .15s" }} />
            <button onClick={ask} className="fx-ask" style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, fontFamily: AEON, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {r.ask} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
