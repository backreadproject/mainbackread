import fs from "fs";
import path from "path";

// Turns the certificate artwork into a TypeScript module.
//
// Inlined rather than read from disk at render time: Vercel's file tracer only
// bundles what something statically references, and a runtime path.join is not
// a static reference. That is exactly how pdf.worker.mjs went missing from the
// extraction bundle while every local build stayed green.
//
// Re-run this after replacing anything in assets/certificate.
const SRC = "assets/certificate";
const OUT = "lib/pdf/certificate-assets.ts";

const b64 = (f) => {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) throw new Error("MISSING " + p);
  const bytes = fs.readFileSync(p);
  console.log("  " + f + "  " + Math.round(bytes.length / 1024) + " KB");
  return "data:image/png;base64," + bytes.toString("base64");
};

const border = b64("border.png");
const seal = b64("seal.png");

const body =
`// GENERATED FILE, do not edit by hand.
// Produced by scripts/build-certificate-assets.mjs from assets/certificate/*.png
// Re-run that script after changing the artwork.

export const CERT_BORDER = "${border}";

export const CERT_SEAL = "${seal}";
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body.replace(/\n/g, "\r\n"), "utf8");
console.log("wrote " + OUT + "  " + Math.round(fs.statSync(OUT).size / 1024) + " KB");