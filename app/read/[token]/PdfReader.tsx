"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import SigningPanel from "./SigningPanel";
import SignedDocumentButton from "@/app/SignedDocumentButton";

const INK = "#0F1729", CANVAS = "#F7F8F7", CARD = "#FFFFFF", GREEN = "#0B7A4B", GREEN_HOVER = "#0A6A41", BRAND = "#1FA971", GREEN_SOFT = "#E7F6EF", GREEN_TEXT = "#067647", ANSWER_INK = "#0B3D2A", NEUTRAL_BUBBLE = "#F4F5F4", SLATE = "#8A9299", BODY = "#475467", LINE = "#E3E7E4", HEAT_MID = "#3FB587", HEAT_OFF = "#DDE2DE";
const AEON = "var(--font-dm-sans), system-ui, sans-serif";
const SHADOW = "none";
const SHADOW_PANEL = "none";
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

type SigningState = {
  name: string;
  sentToEmail: string | null;
  alreadySigned: { name: string; at: string }[];
  awaiting: number;
  mySignedAt: string | null;
  myDeclinedAt: string | null;
  fields: { id: string; page: number; x: number; y: number; w: number; h: number; kind: string; dateMode: string | null }[];
  documentDeclined: boolean;
  documentCompleted: boolean;
};

type Msg = { role: "user" | "doc"; text: string };

export default function PdfReader({ title, fileUrl, token, greeting, initialThread = [], senderName = "", senderFirst = "", readerEmail = "", signing = null }: { title: string; fileUrl: string; token: string; greeting: string; initialThread?: Msg[]; senderName?: string; senderFirst?: string; readerEmail?: string; signing?: SigningState | null }) {
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
  const [forwardOpen, setForwardOpen] = useState(false);
  const [cols, setCols] = useState<{ name: string; email: string }[]>([{ name: "", email: "" }]);
  const [fwdMsg, setFwdMsg] = useState("");
  const [consent, setConsent] = useState(true);
  const [fwdBusy, setFwdBusy] = useState(false);
  const [fwdErr, setFwdErr] = useState("");
  const [fwdDone, setFwdDone] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  // Prefilled for anyone we already have an address for. Link-mode readers have
  // none, and they are exactly the readers who had no way to reply at all before.
  const [replyEmail, setReplyEmail] = useState(readerEmail);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyErr, setReplyErr] = useState("");
  const [replyDone, setReplyDone] = useState(false);
  const [signedNow, setSignedNow] = useState(false);
  const [declinedNow, setDeclinedNow] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  // What the signer types into the boxes on the page. Held here rather than
  // in the panel because the boxes are built imperatively into the pdf.js
  // page wrappers, and the ref mirror is what lets those handlers write
  // without capturing a stale copy of state.
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const fieldValuesRef = useRef<Record<string, string>>({});
  // The boxes themselves, so the signature can be drawn into the one the
  // sender placed and the inputs can be closed once the record is.
  const fieldBoxesRef = useRef<Record<string, HTMLDivElement>>({});
  const resizeRef = useRef<ResizeObserver | null>(null);
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
      const raw = await res.text();
      let json: { answer?: string; error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
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
        // disableFontFace was on to dodge mobile WebViews mangling generated
        // web-fonts, at the cost of every glyph being painted as a filled path:
        // no hinting, no browser text antialiasing, and type that reads thin at
        // any resolution. Off now, with standardFontDataUrl supplied below so
        // the fonts it needs are reachable. If a WebView ever mangles text
        // again, this single value is the revert.
        const assets = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
        const pdf = await pdfjs.getDocument({
          url: fileUrl,
          cMapUrl: `${assets}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assets}/standard_fonts/`,
          disableFontFace: false,
        }).promise;
        setPageCount(pdf.numPages); setStatus("");
        send("opened", null, { pages: pdf.numPages });
        const container = containerRef.current;
        if (!container) return;
        const wrappers: HTMLDivElement[] = [];
        const textParts: string[] = [];
        // Rasterise to the canvas as it actually sits, at the screen's density.
        //
        // Two things were wrong before. The scale was a fixed number, so it was
        // a bet on one window and one display. Then it was measured from
        // container.clientWidth, which includes padding the canvas does not get,
        // so a 774px canvas received an 887px bitmap and the browser resampled
        // it down: more pixels rendered, a softer page, and worse the wider the
        // column grew. Measuring the canvas itself gives an exact 1:1.
        //
        // Measured ONCE is still wrong, because a window resize or a devtools
        // dock changes the column and the bitmap does not follow. So this is a
        // function, and the observer below calls it again.
        type Painted = { page: Awaited<ReturnType<typeof pdf.getPage>>; canvas: HTMLCanvasElement };
        const painted: Painted[] = [];
        const paint = async (page: Painted["page"], canvas: HTMLCanvasElement) => {
          const base = page.getViewport({ scale: 1 }).width;
          const shownPx = canvas.getBoundingClientRect().width || container.clientWidth || 900;
          const dpr = Math.min(typeof window === "undefined" ? 1 : (window.devicePixelRatio || 1), 3);
          const vp = page.getViewport({ scale: Math.max(0.5, Math.min((shownPx / base) * dpr, 4)) });
          const w = Math.round(vp.width), h = Math.round(vp.height);
          // Nothing to do when the size has not moved. Redrawing anyway would
          // flash every page white on any resize that does not change the width.
          if (canvas.width === w && canvas.height === h) return;
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
        };

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);

          const canvas = document.createElement("canvas");
          canvas.style.width = "100%"; canvas.style.height = "auto"; canvas.style.display = "block";
          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.cssText = `background:#fff;margin-bottom:16px;border-radius:6px;position:relative;border:1px solid ${LINE}`;
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);
          painted.push({ page, canvas });
          await paint(page, canvas);
          const tc = await page.getTextContent();
          textParts.push(`[Page ${n}]\n` + tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
        }
        docText.current = textParts.join("\n\n").slice(0, 20000);
        if (signing && signing.fields.length && !signing.mySignedAt) {
          for (const fld of signing.fields) {
            const w = wrappers[fld.page - 1];
            if (!w) continue;
            // A signature is captured by the pad, and a date set to the day
            // they sign fills itself at composition. Everything else is the
            // signer's to complete, and the box used to carry
            // pointer-events:none with a caption inside it -- so those fields
            // could be placed, shown, and then dropped from the composed PDF
            // with no error on any surface.
            const fillable = fld.kind === "text" || (fld.kind === "date" && fld.dateMode === "chosen");
            const box = document.createElement("div");
            box.style.cssText = `position:absolute;left:${fld.x * 100}%;top:${fld.y * 100}%;width:${fld.w * 100}%;height:${fld.h * 100}%;border:1.5px dashed ${GREEN};background:${GREEN_SOFT};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:11px;color:${GREEN_TEXT};pointer-events:${fillable ? "auto" : "none"};box-sizing:border-box;text-align:center;padding:2px`;
            if (fillable) {
              const input = document.createElement("input");
              input.type = fld.kind === "date" ? "date" : "text";
              if (fld.kind === "text") input.maxLength = 200;
              input.setAttribute("data-field-id", fld.id);
              input.setAttribute("aria-label", fld.kind === "date" ? r.dateHere : r.textHere);
              input.style.cssText = `width:100%;height:100%;min-width:0;border:none;outline:none;background:transparent;text-align:center;font-family:inherit;font-size:12px;color:${INK};padding:0 4px;box-sizing:border-box`;
              input.oninput = () => {
                const next = { ...fieldValuesRef.current, [fld.id]: input.value };
                fieldValuesRef.current = next;
                setFieldValues(next);
              };
              box.appendChild(input);
            } else {
              box.textContent = fld.kind === "signature" ? r.youSignHere : fld.kind === "date" ? r.dateHere : r.textHere;
            }
            fieldBoxesRef.current[fld.id] = box;
            w.appendChild(box);
          }
        }
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          const p = Number((visible.target as HTMLElement).dataset.page);
          if (p === currentPage.current) return;
          leavePage(); currentPage.current = p; enteredAt.current = Date.now(); setActivePage(p);
        }, { threshold: [0.25, 0.5, 0.75] });
        wrappers.forEach((w) => observer.observe(w));

        // The field boxes are positioned in percentages on the WRAPPER, not the
        // canvas, and the dwell observer watches the wrappers too, so both
        // survive a re-render untouched. Only the bitmap is replaced.
        let pending: ReturnType<typeof setTimeout> | null = null;
        let lastWidth = container.clientWidth;
        const ro = new ResizeObserver(() => {
          const w = container.clientWidth;
          // A scrollbar appearing moves this by a few pixels and is not worth
          // rasterising a whole document for.
          if (Math.abs(w - lastWidth) < 4) return;
          lastWidth = w;
          if (pending) clearTimeout(pending);
          pending = setTimeout(() => {
            for (const p of painted) void paint(p.page, p.canvas);
          }, 200);
        });
        ro.observe(container);
        resizeRef.current = ro;
      } catch (err) {
        setStatus(r.couldntOpen + (err instanceof Error ? err.message : String(err)));
      }
    })();
    const onHide = () => leavePage();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") leavePage(); });
    return () => {
      window.removeEventListener("pagehide", onHide);
      resizeRef.current?.disconnect();
      resizeRef.current = null;
    };
  }, [fileUrl, token]);

  const maxDwell = Math.max(1, ...Object.values(dwellView));

  const fr = locale === "fr";
  const F = {
    btn: fr ? "Transf\u00e9rer \u00e0 un coll\u00e8gue" : "Forward to a colleague",
    btnShort: fr ? "Transf\u00e9rer" : "Forward",
    title: fr ? "Transf\u00e9rer ce document" : "Forward this document",
    sub: fr ? "Envoyez-le \u00e0 un coll\u00e8gue. Chaque personne re\u00e7oit son propre lien s\u00e9curis\u00e9." : "Send it on to a colleague. Each person gets their own secure link.",
    colleague: fr ? "Coll\u00e8gue" : "Colleague",
    name: fr ? "Nom" : "Name",
    email: fr ? "E-mail" : "Email",
    namePh: fr ? "Nom complet" : "Full name",
    emailPh: "name@company.com",
    addAnother: fr ? "Ajouter un autre coll\u00e8gue" : "Add another colleague",
    message: fr ? "Message (facultatif)" : "Message (optional)",
    messagePh: fr ? "Ajoutez une note pour eux" : "Add a note for them",
    consent: fr ? "J\u2019ai une raison l\u00e9gitime de partager ce document avec les personnes ci-dessus." : "I have a legitimate reason to share this document with the people above.",
    disclosure: fr ? "RelayDocuments enverra \u00e0 chaque personne un lien, et elle verra que vous avez partag\u00e9 le document. Elle peut se d\u00e9sinscrire \u00e0 tout moment." : "RelayDocuments will email each person a link, and they will see that you shared it. They can opt out anytime.",
    privacy: fr ? "Avis de confidentialit\u00e9" : "Privacy notice",
    cancel: fr ? "Annuler" : "Cancel",
    send: fr ? "Envoyer le document" : "Send document",
    sending: fr ? "Envoi\u2026" : "Sending\u2026",
    needOne: fr ? "Ajoutez au moins un coll\u00e8gue." : "Add at least one colleague.",
    needConsent: fr ? "Veuillez confirmer que vous avez une raison l\u00e9gitime." : "Please confirm you have a legitimate reason.",
    badEmail: fr ? "Une des adresses e-mail semble invalide." : "One of the email addresses looks invalid.",
    failed: fr ? "L\u2019envoi a \u00e9chou\u00e9. R\u00e9essayez." : "That didn\u2019t send. Please try again.",
    doneTitle: fr ? "Document transf\u00e9r\u00e9" : "Document forwarded",
    done: fr ? "Termin\u00e9" : "Done",
    sentMsg: (n: number) => fr ? `${n} coll\u00e8gue(s) recevront leur propre lien par e-mail.` : `${n} colleague${n === 1 ? "" : "s"} will get their own link by email.`,
  };
  // Named only when the page decided it was safe to name them. A forwarded
  // colleague gets "the sender", because they were never told who that is.
  const RP = {
    btn: senderFirst ? (fr ? `R\u00e9pondre \u00e0 ${senderFirst}` : `Reply to ${senderFirst}`) : (fr ? "R\u00e9pondre \u00e0 l\u2019exp\u00e9diteur" : "Reply to the sender"),
    btnShort: fr ? "R\u00e9pondre" : "Reply",
    title: senderName ? (fr ? `R\u00e9pondre \u00e0 ${senderName}` : `Reply to ${senderName}`) : (fr ? "R\u00e9pondre \u00e0 l\u2019exp\u00e9diteur" : "Reply to the sender"),
    sub: fr ? "Votre message lui parvient directement, avec ce document en r\u00e9f\u00e9rence." : "Your message goes straight to them, about this document.",
    message: fr ? "Votre message" : "Your message",
    messagePh: fr ? "\u00c9crivez votre r\u00e9ponse\u2026" : "Write your reply\u2026",
    emailLabel: senderFirst ? (fr ? `O\u00f9 ${senderFirst} doit-il r\u00e9pondre ?` : `Where should ${senderFirst} reply?`) : (fr ? "O\u00f9 doit-on vous r\u00e9pondre ?" : "Where should they reply?"),
    emailPh: "you@company.com",
    needMessage: fr ? "\u00c9crivez d\u2019abord un message." : "Write a message first.",
    needEmail: fr ? "Une adresse e-mail valide est requise." : "A valid email address is required.",
    send: fr ? "Envoyer" : "Send reply",
    sending: fr ? "Envoi\u2026" : "Sending\u2026",
    cancel: fr ? "Annuler" : "Cancel",
    failed: fr ? "L\u2019envoi a \u00e9chou\u00e9. R\u00e9essayez." : "That didn\u2019t send. Please try again.",
    doneTitle: fr ? "R\u00e9ponse envoy\u00e9e" : "Reply sent",
    doneMsg: senderFirst ? (fr ? `${senderFirst} la recevra par e-mail.` : `${senderFirst} will get it by email.`) : (fr ? "Elle sera transmise par e-mail." : "It will reach them by email."),
    done: fr ? "Termin\u00e9" : "Done",
    disclosure: fr ? "Votre message et votre adresse e-mail sont transmis \u00e0 la personne qui vous a envoy\u00e9 ce document." : "Your message and email address are shared with whoever sent you this document.",
  };
  async function submitReply() {
    setReplyErr("");
    const msg = replyText.trim();
    const em = replyEmail.trim();
    if (!msg) { setReplyErr(RP.needMessage); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setReplyErr(RP.needEmail); return; }
    setReplyBusy(true);
    try {
      const res = await fetch("/api/reply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, message: msg, email: em }) });
      const raw = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
      if (!res.ok) { setReplyErr(json.error || RP.failed); setReplyBusy(false); return; }
      setReplyDone(true); setReplyBusy(false);
    } catch { setReplyErr(RP.failed); setReplyBusy(false); }
  }
  const fwdInput = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 6, padding: "9px 11px", fontFamily: AEON, fontSize: 13, color: INK, background: "#fff", outline: "none" } as const;
  async function submitForward() {
    setFwdErr("");
    const clean = cols.map((c) => ({ name: c.name.trim(), email: c.email.trim() })).filter((c) => c.name && c.email);
    if (!clean.length) { setFwdErr(F.needOne); return; }
    if (!consent) { setFwdErr(F.needConsent); return; }
    if (clean.some((c) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))) { setFwdErr(F.badEmail); return; }
    setFwdBusy(true);
    try {
      const res = await fetch("/api/forward", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, colleagues: clean, message: fwdMsg.trim() }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFwdErr(json.error || F.failed); setFwdBusy(false); return; }
      setFwdDone(F.sentMsg(clean.length)); setFwdBusy(false);
    } catch { setFwdErr(F.failed); setFwdBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: AEON, color: INK }}>
      <style>{`
        .fx-ask{transition:background .15s}.fx-ask:hover{background:${GREEN_HOVER}}
        .rdr-fine:hover{text-decoration:underline}.fx-in:focus{border-color:${BRAND}}
        .rdr-handle{display:none}
        .rdr-grid{position:relative;z-index:1}
        .fx-fwd-glow{box-shadow:0 0 0 0 rgba(31,169,113,0.5),0 6px 18px rgba(31,169,113,0.42);animation:fwdGlow 2.4s ease-in-out infinite}
        .fx-fwd-glow:hover{background:${GREEN_HOVER} !important;animation:none;box-shadow:0 6px 22px rgba(31,169,113,0.6)}
        @keyframes fwdGlow{0%,100%{box-shadow:0 0 0 0 rgba(31,169,113,0.5),0 6px 18px rgba(31,169,113,0.42)}50%{box-shadow:0 0 0 8px rgba(31,169,113,0),0 8px 26px rgba(31,169,113,0.62)}}
        @media (prefers-reduced-motion: reduce){.fx-fwd-glow{animation:none}}
        .fwd-short{display:none}
        .rpl-short{display:none}
        .rdr-chev{display:none}
        @media ${MOBILE}{
          .rdr-grid{grid-template-columns:1fr !important;gap:0 !important;padding:10px !important;}
          .rdr-rail{display:none !important;}
          .rdr-title{display:none !important;}
          .fwd-full{display:none !important;}.fwd-short{display:inline !important;}.fx-fwd{margin-left:auto !important;}.rpl-full{display:none !important;}.rpl-short{display:inline !important;}
          .rdr-main{padding-bottom:132px !important;}
          .rdr-aside{position:fixed !important;top:auto !important;bottom:0 !important;left:0 !important;right:0 !important;height:auto !important;max-height:86vh !important;border-radius:6px 6px 0 0 !important;z-index:40 !important;border-top:1px solid ${LINE} !important;box-shadow:none !important;}
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
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 26, height: 26, borderRadius: 4, background: GREEN_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={BRAND} strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill={BRAND} /></svg>
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: INK }}>{greeting}</span>
          <h1 className="rdr-title" style={{ fontSize: 15, fontWeight: 500, margin: 0, marginLeft: "auto", color: SLATE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "38%" }}>{title}</h1>
            <button onClick={() => { setReplyOpen(true); setReplyDone(false); setReplyErr(""); }} style={{ marginLeft: 12, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: GREEN, border: `1px solid ${GREEN}`, borderRadius: 6, padding: "8px 13px", fontSize: 13, fontWeight: 500, fontFamily: AEON, cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17l-6-5 6-5" /><path d="M3 12h11a6 6 0 016 6v1" /></svg>
              <span className="rpl-full">{RP.btn}</span><span className="rpl-short">{RP.btnShort}</span>
            </button>
          <button onClick={() => { setForwardOpen(true); setFwdDone(null); setFwdErr(""); }} className="fx-fwd fx-fwd-glow" style={{ marginLeft: 12, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "8px 13px", fontSize: 13, fontWeight: 500, fontFamily: AEON, cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h13M11 6l6 6-6 6" /><path d="M17 5h3v3" /></svg>
            <span className="fwd-full">{F.btn}</span><span className="fwd-short">{F.btnShort}</span>
          </button>
        </div>
      </header>

      <div className="rdr-grid" style={{ maxWidth: 1440, margin: "0 auto", padding: 24, display: "grid", gridTemplateColumns: "14px minmax(0,1fr) 380px", gap: 18, alignItems: "start" }}>

        <div className="rdr-rail" style={{ position: "sticky", top: 92, height: "78vh", display: "flex", flexDirection: "column", gap: 6, paddingTop: 6, alignItems: "center" }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const d = dwellView[p] ?? 0;
            const w = 2 + (d / maxDwell) * 2;
            return <div key={p} title={`Page ${p}: ${(d / 1000).toFixed(1)}s`}
              style={{ width: activePage === p ? w + 2 : w, height: `${100 / Math.max(pageCount, 1)}%`, minHeight: 6, background: d > 0 ? (activePage === p ? GREEN : HEAT_MID) : HEAT_OFF, borderRadius: 2, transition: "width .3s, background .3s" }} />;
          })}
        </div>

        <main className="rdr-main">
          {status && <p style={{ fontSize: 15, color: BODY, textAlign: "center", padding: 48 }}>{status}</p>}
          <div ref={containerRef} />
          {pageCount > 0 && <p style={{ fontSize: 13, color: SLATE, textAlign: "center", padding: "16px 0" }}>{pageCount} {pageCount > 1 ? r.pageMany : r.pageOne}</p>}
        </main>

        <aside className={`rdr-aside${sheetOpen ? " is-open" : ""}`} style={{ position: "sticky", top: 92, background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, boxShadow: SHADOW_PANEL, display: "flex", flexDirection: "column", height: "78vh", overflow: "hidden" }}>
          <div className="rdr-handle" onClick={toggleSheet} />
          <div className="rdr-askhead" onClick={toggleSheet} style={{ padding: "15px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.25 }}>{r.askTitle}</span>
            <span className="rdr-chev">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </div>
          <div className="rdr-thread" style={{ flex: signOpen ? "none" : 1, maxHeight: signOpen ? 0 : undefined, paddingTop: signOpen ? 0 : undefined, paddingBottom: signOpen ? 0 : undefined, overflow: signOpen ? "hidden" : undefined, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {thread.length === 0 && <p style={{ fontSize: 14, lineHeight: 1.5, color: BODY, margin: 0 }}>{r.askEmpty}</p>}
            {thread.map((m, i) => (
              m.role === "user" ? (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%", background: NEUTRAL_BUBBLE, border: `1px solid ${LINE}`, borderRadius: "6px 6px 2px 6px", padding: "10px 12px", fontSize: 14, color: INK, lineHeight: 1.45 }}>{m.text}</div>
              ) : (
                <div key={i} style={{ maxWidth: "90%" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: GREEN_TEXT, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{r.theDocument}</div>
                  <div style={{ background: GREEN_SOFT, borderRadius: "2px 6px 6px 6px", padding: "11px 12px", fontSize: 14, color: ANSWER_INK, lineHeight: 1.5 }}>{m.text}</div>
                </div>
              )
            ))}
            {asking && <div style={{ fontSize: 13, color: SLATE }}>{r.reading}</div>}
            <div ref={threadEnd} />
          </div>
          <div className="rdr-inputrow" style={{ borderTop: `1px solid ${LINE}`, padding: 12, display: "flex", gap: 9, alignItems: "center" }}>
            <input className="fx-in" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={r.askPlaceholder}
              style={{ flex: 1, minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 6, padding: "9px 12px", fontSize: 14, fontFamily: AEON, background: "#fff", outline: "none", transition: "border-color .15s, box-shadow .15s" }} />
            <button onClick={ask} className="fx-ask" style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 14, fontWeight: 500, fontFamily: AEON, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {r.ask} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
          {signing && (
            <div style={{ borderTop: `1px solid ${LINE}`, flex: "none" }}>
              <div onClick={() => setSignOpen((o) => !o)}
                style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", background: signOpen ? GREEN_SOFT : CARD }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: (signing.mySignedAt || signedNow) ? SLATE : GREEN, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: signOpen ? GREEN_TEXT : INK }}>{r.signSection}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginLeft: "auto", color: SLATE, flexShrink: 0, transform: signOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {signOpen && (
                <div style={{ padding: 16, borderTop: `1px solid ${LINE}`, maxHeight: "58vh", overflowY: "auto" }}>
              {signing.myDeclinedAt || declinedNow ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>{r.declinedTitle}</div>
                  <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>{r.declinedBody}</div>
                </>
              ) : signing.mySignedAt || signedNow ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GREEN_TEXT, marginBottom: 4 }}>{r.signedTitle}</div>
                  <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>
                    {signing.awaiting > 0 ? r.signedWaiting : r.signedComplete}
                  </div>
                  {/* Only when the whole document is done. A signer taking away a
                      half-signed PDF is carrying something that looks like an
                      agreement and is not one. awaiting===0 is not enough: a
                      co-signer who declined is neither awaiting nor signed. */}
                  {signing.documentCompleted && (
                    <div style={{ marginTop: 14 }}>
                      <SignedDocumentButton token={token} title={title} label={r.downloadSigned} />
                    </div>
                  )}
                </>
              ) : signing.documentDeclined ? (
                <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>{r.docDeclined}</div>
              ) : (
                <SigningPanel
                  token={token}
                  state={{ name: signing.name, sentToEmail: signing.sentToEmail, alreadySigned: signing.alreadySigned, awaiting: signing.awaiting }}
                  fields={signing.fields.map((f) => ({ id: f.id, kind: f.kind, dateMode: f.dateMode }))}
                  values={fieldValues}
                  onSignature={(v) => {
                    for (const f of signing.fields) {
                      if (f.kind !== "signature") continue;
                      const b = fieldBoxesRef.current[f.id];
                      if (!b) continue;
                      b.textContent = "";
                      if (v && v.data) {
                        const img = document.createElement("img");
                        img.src = v.data;
                        img.alt = "";
                        img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;display:block";
                        b.appendChild(img);
                        b.style.background = "transparent";
                      } else {
                        b.textContent = r.youSignHere;
                        b.style.background = GREEN_SOFT;
                      }
                    }
                  }}
                  onSigned={() => {
                    // Close the boxes. The overlay is built once when the PDF
                    // loads, so without this the inputs stay live and the
                    // caption stays put on a record that is already final.
                    for (const f of signing.fields) {
                      const b = fieldBoxesRef.current[f.id];
                      if (!b) continue;
                      const input = b.querySelector("input");
                      if (input) {
                        const v = input.value;
                        b.removeChild(input);
                        b.textContent = v;
                        b.style.color = INK;
                        b.style.fontSize = "12px";
                      }
                      b.style.pointerEvents = "none";
                      b.style.borderStyle = "solid";
                    }
                    setSignedNow(true);
                  }}
                  onDeclined={() => setDeclinedNow(true)}
                />
              )}
                </div>
              )}
            </div>
          )}
          <div style={{ padding: "0 12px 10px", textAlign: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <a href="/privacy" className="rdr-fine" style={{ fontSize: 11, color: "#9AA5A0", textDecoration: "none" }}>{F.privacy}</a>
              <span style={{ color: "#D7DEDA", fontSize: 10 }}>&middot;</span>
              <button onClick={() => { document.cookie = "locale=" + (locale === "fr" ? "en" : "fr") + "; path=/; max-age=31536000; samesite=lax"; window.location.reload(); }}
                style={{ background: "none", border: "none", padding: 0, fontSize: 11, color: "#9AA5A0", cursor: "pointer", fontFamily: AEON }}>
                {locale === "fr" ? "English" : "Fran\u00e7ais"}
              </button>
            </span>
          </div>
        </aside>
      </div>
      {replyOpen && (
        <div onClick={() => setReplyOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(17,26,22,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "26px 16px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 6, boxShadow: "0 12px 32px -12px rgba(15,40,28,0.22)", fontFamily: AEON, overflow: "hidden" }}>
            {replyDone ? (
              <div style={{ padding: 28, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: GREEN_SOFT, color: GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 4px" }}>{RP.doneTitle}</h3>
                <p style={{ fontSize: 14, color: BODY, margin: "0 0 18px" }}>{RP.doneMsg}</p>
                <button onClick={() => setReplyOpen(false)} style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 14, fontWeight: 500, fontFamily: AEON, cursor: "pointer" }}>{RP.done}</button>
              </div>
            ) : (
              <>
                <div style={{ padding: "18px 20px 4px" }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: INK }}>{RP.title}</h3>
                  <p style={{ margin: "5px 0 0", fontSize: 13, color: BODY, lineHeight: 1.5 }}>{RP.sub}</p>
                </div>
                <div style={{ padding: "14px 20px 4px" }}>
                  <label style={{ display: "block", fontSize: 12, color: BODY, marginBottom: 5 }}>{RP.message}</label>
                  <textarea className="fx-in" value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} maxLength={2000} placeholder={RP.messagePh} style={{ ...fwdInput, resize: "vertical", marginBottom: 12, lineHeight: 1.55 }} />
                  <label style={{ display: "block", fontSize: 12, color: BODY, marginBottom: 5 }}>{RP.emailLabel}</label>
                  <input className="fx-in" type="email" value={replyEmail} onChange={(e) => setReplyEmail(e.target.value)} placeholder={RP.emailPh} style={fwdInput} />
                </div>
                <div style={{ padding: "12px 20px 0" }}>
                  <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.55, padding: "10px 12px", background: CANVAS, border: `1px solid ${LINE}`, borderRadius: 6 }}>{RP.disclosure} <a href="/privacy" className="rdr-fine" style={{ color: SLATE, textDecoration: "none" }}>{F.privacy}</a></div>
                </div>
                {replyErr && <p style={{ fontSize: 13, color: "#B42318", margin: "12px 20px 0" }}>{replyErr}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px 18px" }}>
                  <button onClick={() => setReplyOpen(false)} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 6, padding: "9px 14px", fontSize: 14, fontWeight: 500, color: BODY, fontFamily: AEON, cursor: "pointer" }}>{RP.cancel}</button>
                  <button onClick={submitReply} disabled={replyBusy} style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 14, fontWeight: 500, fontFamily: AEON, cursor: "pointer", opacity: replyBusy ? 0.6 : 1 }}>{replyBusy ? RP.sending : RP.send}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {forwardOpen && (
        <div onClick={() => setForwardOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(17,26,22,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "26px 16px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 6, boxShadow: "0 12px 32px -12px rgba(15,40,28,0.22)", fontFamily: AEON, overflow: "hidden" }}>
            {fwdDone ? (
              <div style={{ padding: 28, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: GREEN_SOFT, color: GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 4px" }}>{F.doneTitle}</h3>
                <p style={{ fontSize: 14, color: BODY, margin: "0 0 18px" }}>{fwdDone}</p>
                <button onClick={() => setForwardOpen(false)} style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 14, fontWeight: 500, fontFamily: AEON, cursor: "pointer" }}>{F.done}</button>
              </div>
            ) : (
              <>
                <div style={{ padding: "18px 20px 4px" }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: INK }}>{F.title}</h3>
                  <p style={{ margin: "5px 0 0", fontSize: 13, color: BODY, lineHeight: 1.5 }}>{F.sub}</p>
                </div>
                <div style={{ padding: "14px 20px 4px", maxHeight: "46vh", overflowY: "auto" }}>
                  {cols.map((c, i) => (
                    <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: "12px 12px 2px", marginBottom: 10, position: "relative", background: "#fff" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: SLATE, letterSpacing: "0.05em", marginBottom: 8 }}>{F.colleague} {i + 1}</div>
                      {i > 0 && <span onClick={() => setCols(cols.filter((_, k) => k !== i))} style={{ position: "absolute", top: 9, right: 10, fontSize: 16, color: SLATE, cursor: "pointer", lineHeight: 1 }}>&times;</span>}
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, marginBottom: 10 }}>
                          <label style={{ display: "block", fontSize: 12, color: BODY, marginBottom: 5 }}>{F.name}</label>
                          <input className="fx-in" value={c.name} onChange={(e) => setCols(cols.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder={F.namePh} style={fwdInput} />
                        </div>
                        <div style={{ flex: 1, marginBottom: 10 }}>
                          <label style={{ display: "block", fontSize: 12, color: BODY, marginBottom: 5 }}>{F.email}</label>
                          <input className="fx-in" value={c.email} onChange={(e) => setCols(cols.map((x, k) => (k === i ? { ...x, email: e.target.value } : x)))} placeholder={F.emailPh} style={fwdInput} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cols.length < 10 && (
                    <span onClick={() => setCols([...cols, { name: "", email: "" }])} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: GREEN, cursor: "pointer", padding: "6px 2px", marginBottom: 12 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> {F.addAnother}
                    </span>
                  )}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: "block", fontSize: 12, color: BODY, marginBottom: 5 }}>{F.message}</label>
                    <textarea value={fwdMsg} onChange={(e) => setFwdMsg(e.target.value)} rows={2} placeholder={F.messagePh} style={{ ...fwdInput, resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${LINE}`, padding: "14px 20px" }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: BODY, lineHeight: 1.5, cursor: "pointer" }}>
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15, accentColor: GREEN, flexShrink: 0 }} /> <span>{F.consent}</span>
                  </label>
                  <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.55, margin: "10px 0 0", padding: "10px 12px", background: CANVAS, border: `1px solid ${LINE}`, borderRadius: 6 }}>{F.disclosure} <a href="/privacy" className="rdr-fine" style={{ color: SLATE, textDecoration: "none" }}>{F.privacy}</a></div>
                </div>
                {fwdErr && <p style={{ fontSize: 13, color: "#B42318", margin: "0 20px" }}>{fwdErr}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px 18px" }}>
                  <button onClick={() => setForwardOpen(false)} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 6, padding: "9px 14px", fontSize: 14, fontWeight: 500, color: BODY, fontFamily: AEON, cursor: "pointer" }}>{F.cancel}</button>
                  <button onClick={submitForward} disabled={fwdBusy} style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 14, fontWeight: 500, fontFamily: AEON, cursor: "pointer", opacity: fwdBusy ? 0.6 : 1 }}>{fwdBusy ? F.sending : F.send}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



