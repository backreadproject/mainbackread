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
async function extractPdfText(bytes: Uint8Array): Promise<{ text: string; pages: number }> {
  // Legacy build is the serverless-friendly entry point.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Disable the worker in Node -- run on the main thread.
  const loadingTask = pdfjs.getDocument({ data: bytes, useWorkerFetch: false, useSystemFonts: true });
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
      // Scanned/image-only PDF: no usable text layer. Phase 2 will render + OCR.
      // The page count is still real and worth keeping.
      return { text: "", method: "empty", needsPageOcr: true, chars: 0, pages };
    }
    return { text, method: "pdf-text", needsPageOcr: false, chars: text.length, pages };
  }
  // Unknown type: nothing we can do in Phase 1.
  return { text: "", method: "empty", needsPageOcr: false, chars: 0, pages: null };
}
