import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist must NOT be bundled.
  //
  // Turbopack rewrites the library's internal worker import to a chunk path
  // (.next/server/chunks/pdf.worker.mjs) that it never actually emits, so every
  // PDF extraction died with "Setting up fake worker failed: Cannot find
  // module". Setting GlobalWorkerOptions.workerSrc does not help, because the
  // broken import is baked into the bundled copy of pdf.mjs before our code
  // runs.
  //
  // Listing it here leaves it as a plain node_modules require at runtime, so
  // the package resolves its own worker the way it was designed to. This also
  // quiets the @napi-rs/canvas warning, since the unbundled package handles its
  // own optional dependencies.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;