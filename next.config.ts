import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist must NOT be bundled.
  //
  // Turbopack rewrote the library's internal worker import to a chunk path it
  // never emitted, so every PDF extraction died with "Setting up fake worker
  // failed". Setting GlobalWorkerOptions.workerSrc does not help, because the
  // broken import is baked into the bundled copy before our code runs.
  serverExternalPackages: ["pdfjs-dist"],

  // AND the worker file has to be shipped.
  //
  // Vercel traces which files a function uses and packages only those. Nothing
  // statically imports pdf.worker.mjs -- pdf.js loads it by path at runtime --
  // so the tracer dropped it and the unbundled library then could not find its
  // own worker. This tells Vercel to include it regardless.
  outputFileTracingIncludes: {
    "/api/extract-document": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;