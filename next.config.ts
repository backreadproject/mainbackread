import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist must NOT be bundled.
  //
  // Turbopack rewrote the library's internal worker import to a chunk it never
  // emitted, so every PDF extraction died with "Setting up fake worker failed:
  // Cannot find module". Leaving the package external means it resolves its own
  // worker from node_modules the way it was designed to.
  serverExternalPackages: ["pdfjs-dist"],

  // AND the worker file has to be shipped. Vercel packages only files its
  // tracer sees used, and nothing statically imports pdf.worker.mjs -- pdf.js
  // loads it by path at runtime -- so it was dropped from the function.
  outputFileTracingIncludes: {
    "/api/extract-document": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;

// KNOWN BUILD WARNING, deliberate and harmless:
//
//   Package pdfjs-dist can't be external
//   The request pdfjs-dist/legacy/build/pdf.worker.mjs matches
//   serverExternalPackages. The package seems invalid. require() resolves to a
//   EcmaScript module, which would result in an error in Node.js.
//
// Turbopack is warning that the worker is ESM and could not be require()d. But
// pdf.js loads it with a dynamic import at runtime, never require, so the
// failure it predicts does not happen -- PDF extraction and scanned-PDF OCR
// both work in production. Removing outputFileTracingIncludes does NOT silence
// it (tested), because the warning comes from serverExternalPackages itself,
// and that entry is the one thing that made extraction work at all.