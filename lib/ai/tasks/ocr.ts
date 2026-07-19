import { z } from "zod";
import type { Task, CompletionImage } from "../types";
export interface OcrInput {
  /** Page/section images to transcribe, in reading order. */
  images: CompletionImage[];
  /** For logging/prompt context only. */
  documentTitle: string;
}
export const OcrOutput = z.object({
  /** The faithful plain-text transcription of everything in the images. */
  text: z.string(),
});
export type OcrOutput = z.infer<typeof OcrOutput>;
export const ocrTask: Task<OcrInput, OcrOutput> = {
  id: "ocr",
  tier: "reason",
  // Documents can be dense. Give room for a full transcription.
  maxTokens: 8000,
  schema: OcrOutput,
  // Nothing stable to cache per call here -- each document's images are unique.
  cacheable: () => "",
  system: () =>
    [
      "You are a faithful document transcriber. You are given images of the pages of a document.",
      "",
      "Transcribe ALL text you can see, exactly as written, in natural reading order.",
      "",
      "RULES:",
      "1. Transcribe faithfully. Do NOT summarise, paraphrase, translate, correct, or add anything.",
      "2. Preserve structure in plain text: keep headings, bullet lists, numbered lists, and tables readable. Render a table as rows of cells separated by ' | '.",
      "3. Mark each page with a line '[Page N]' before its content, numbering from 1 in the order the images are given.",
      "4. If a page is blank or you truly cannot read it, write '[Page N] (no readable text)'.",
      "5. Do not describe images, logos, or layout. Only transcribe text.",
      "",
      'Respond with ONLY a JSON object, no markdown fences, no preamble: {"text":"...the full transcription..."}',
      "The value of \"text\" must be the complete transcription with \\n for line breaks.",
    ].join("\n"),
  user: (i) => `Transcribe this document titled "${i.documentTitle}". Return the JSON object described.`,
  fixture: (i) => ({
    text: `[fixture OCR] Transcription of "${i.documentTitle}" would appear here. Swap AI_PROVIDER to "anthropic" for real OCR.`,
  }),
};
