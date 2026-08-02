import { runAI, ocrTask } from "@/lib/ai";
export type ExtractResult = {
  text: string;
  method: "docx" | "pdf-text" | "image-ocr" | "empty";
  /** True when a PDF had no usable text layer -- a scanned PDF awaiting Phase 2 OCR. */
  needsPageOcr: boolean;
  chars: number;
  /** Real page count where the format has one. Null for .docx, which has no fixed
   *  pagination, and for unknown types. Never guessed. */
  pages: number | null;
};
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
/** Map a file to a normalized kind from mime type first, then extension fallback. */
function kindOf(mime: string, name: string): "docx" | "pdf" | "image" | "unknown" {
  const n = name.toLowerCase();
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || n.endsWith(".docx")) return "docx";
  if (mime === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (IMAGE_TYPES.includes(mime) || /\.(jpe?g|png|webp|gif)$/.test(n)) return "image";
  return "unknown";
}
/** Word .docx -> plain text via mammoth (pure JS, serverless-safe). */
async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = Buffer.from(bytes);
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return (value ?? "").trim();
}
/** Text-based PDF -> text layer via pdfjs-dist. No canvas, no rendering.
 *  Returns the page count too: it is the only place we reliably know it. */
/**
 * pdf.js reaches for browser globals during initialisation, BEFORE any of our
 * code runs, and Node has none of them -- which is why every PDF upload has
 * failed with "DOMMatrix is not defined" while every .docx succeeded.
 *
 * We do not render anything. getTextContent() never touches a canvas. But the
 * library constructs its rendering machinery on load regardless, so the
 * globals must EXIST. They do not have to work: these are inert stubs, and if
 * anything ever genuinely tries to draw with them the result would be blank,
 * which is the correct outcome for a text extractor.
 *
 * The @napi-rs/canvas warning in the logs is the same thing from the other
 * side: pdf.js looking for a real canvas backend and not finding one. That
 * warning is harmless and installing the package would add a large native
 * dependency to do work we do not want done.
 */
function stubBrowserGlobals() {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") {
    g.DOMMatrix = class {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: number[]) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      inverse() { return this; }
    };
  }
  if (typeof g.Path2D === "undefined") {
    g.Path2D = class {
      addPath() {} closePath() {} moveTo() {} lineTo() {}
      bezierCurveTo() {} quadraticCurveTo() {} arc() {} arcTo() {}
      ellipse() {} rect() {}
    };
  }
  if (typeof g.ImageData === "undefined") {
    g.ImageData = class {
      data: Uint8ClampedArray; width: number; height: number;
      constructor(w: number, h: number) {
        this.width = w; this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    };
  }
}

async function extractPdfText(bytes: Uint8Array): Promise<{ text: string; pages: number }> {
  // Legacy build is the serverless-friendly entry point.
  stubBrowserGlobals();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Point pdf.js at the worker that ships inside the package. Without this it
  // falls back to a "fake worker" which tries to load a chunk the bundler
  // never emitted, and every PDF fails with "Cannot find module pdf.worker.mjs".
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    pdfjs.GlobalWorkerOptions.workerSrc = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  } catch {
    // Leave it unset rather than throwing: pdf.js may still manage without,
    // and a failed extraction is recoverable while a crashed route is not.
  }
  // The worker is resolved above, so this runs with a real one rather than
  // the fake-worker fallback that could not find its chunk.
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    useSystemFonts: false,
  });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const tc = await page.getTextContent();
    const pageText = tc.items.map((it: unknown) => (it && typeof it === "object" && "str" in it ? String((it as { str: string }).str) : "")).join(" ").trim();
    parts.push(`[Page ${n}]\n${pageText}`);
  }
  return { text: parts.join("\n\n").trim(), pages: pdf.numPages };
}
/** Image -> text via Claude vision OCR task. The image IS the input; no rendering. */
async function extractImage(bytes: Uint8Array, mime: string, title: string): Promise<string> {
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = mime && IMAGE_TYPES.includes(mime) ? mime : "image/png";
  const { data } = await runAI(ocrTask, {
    images: [{ mediaType, data: base64 }],
    documentTitle: title,
  }, { documentId: title });
  return (data.text ?? "").trim();
}
/** Heuristic: a PDF text layer under this many chars is treated as "scanned". */
const SCANNED_PDF_THRESHOLD = 24;
export async function extractText(
  bytes: Uint8Array,
  mime: string,
  name: string
): Promise<ExtractResult> {
  const kind = kindOf(mime, name);
  if (kind === "docx") {
    const text = await extractDocx(bytes);
    return { text, method: "docx", needsPageOcr: false, chars: text.length, pages: null };
  }
  if (kind === "image") {
    const text = await extractImage(bytes, mime, name);
    return { text, method: "image-ocr", needsPageOcr: false, chars: text.length, pages: 1 };
  }
  if (kind === "pdf") {
    const { text, pages } = await extractPdfText(bytes);
    // Strip the [Page N] markers when measuring real content length.
    const contentLen = text.replace(/\[Page \d+\]/g, "").replace(/\s+/g, "").length;
    if (contentLen < SCANNED_PDF_THRESHOLD) {
      // A scanned PDF: no text layer. Send the WHOLE FILE to the model, which
      // reads the pages itself. This replaces a browser-rendering pipeline
      // that worked perfectly at rendering and never produced a usable result.
      try {
        const { data } = await runAI(ocrTask, {
          pdfData: Buffer.from(bytes).toString("base64"),
          documentTitle: name,
        }, { documentId: name });
        const ocr = (data.text ?? "").trim();
        const real = ocr.replace(/\[Page \d+\]/g, "").replace(/\(no readable text\)/g, "").replace(/\s+/g, "").length;
        if (real >= SCANNED_PDF_THRESHOLD) {
          return { text: ocr, method: "image-ocr", needsPageOcr: false, chars: ocr.length, pages };
        }
      } catch (err) {
        console.error("[extract] pdf ocr failed:", err instanceof Error ? err.message : err);
      }
      // Genuinely unreadable, or the model failed. Honest empty.
      return { text: "", method: "empty", needsPageOcr: true, chars: 0, pages };
    }
    return { text, method: "pdf-text", needsPageOcr: false, chars: text.length, pages };
  }
  // Unknown type: nothing we can do in Phase 1.
  return { text: "", method: "empty", needsPageOcr: false, chars: 0, pages: null };
}
