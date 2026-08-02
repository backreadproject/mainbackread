"use client";

// Rendering a scanned PDF's pages to images, in the browser.
//
// This work belongs here and not on the server: turning a PDF page into an
// image needs a canvas, and pdf.js has no canvas in a serverless function --
// the constraint that broke text extraction entirely until it was found. The
// reader already renders every page successfully, so the browser is the proven
// place. The server then does what only it can: call the vision model.
//
// The pdf.js setup below is copied DELIBERATELY from PdfReader rather than
// invented: the CDN worker, the Blob wrapper, and the polyfills are all things
// that were arrived at by fixing real mobile-browser failures. Reproducing them
// is safer than writing a second, untested way to load the same library.

/** Matches the server cap. Rendering more would only be discarded. */
export const OCR_PAGE_CAP = 12;

// DUPLICATED from PdfReader, and it has to be.
//
// This function's source is stringified and re-executed inside the PDF worker,
// which is a separate JS scope. If it were imported from a shared module the
// bundler could rewrite it to reference module-scope helpers that do not exist
// in the worker, and it would fail there while looking correct here. The
// original carries the same warning. If one copy changes, change both.
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

/**
 * Render the first pages of a PDF to JPEG data URLs.
 *
 * Scale 1.6 is a compromise: high enough that small print survives, low enough
 * that a page stays a few hundred kilobytes. Quality 0.75 for the same reason --
 * vision models read compressed text fine, and payload size is the constraint.
 */
export async function renderPdfPages(
  file: File | Blob,
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  installModernPolyfills();
  const pdfjs = await import("pdfjs-dist");
  const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
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

  const assets = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({
    data: bytes,
    cMapUrl: `${assets}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${assets}/standard_fonts/`,
    disableFontFace: true,
  }).promise;

  const total = Math.min(pdf.numPages, OCR_PAGE_CAP);
  const out: string[] = [];
  for (let n = 1; n <= total; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    out.push(canvas.toDataURL("image/jpeg", 0.75));
    // Released deliberately: twelve full-page canvases held at once is a lot of
    // memory on a phone.
    canvas.width = 0; canvas.height = 0;
    onProgress?.(n, total);
  }
  return out;
}

/** Render and send for OCR. Returns what the server stored, or throws. */
export async function ocrScannedPdf(
  documentId: string,
  file: File | Blob,
  onProgress?: (done: number, total: number) => void
): Promise<{ chars: number; pagesRead: number; truncated: number }> {
  const pages = await renderPdfPages(file, onProgress);
  if (!pages.length) throw new Error("Could not render any pages from this file.");
  const res = await fetch("/api/ocr-pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ documentId, pages }),
  });
  const raw = await res.text();
  let json: { ok?: boolean; chars?: number; pagesRead?: number; truncated?: number; error?: string } = {};
  try { json = JSON.parse(raw); } catch { throw new Error("Server returned " + res.status + "."); }
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not read the pages.");
  return { chars: json.chars ?? 0, pagesRead: json.pagesRead ?? 0, truncated: json.truncated ?? 0 };
}