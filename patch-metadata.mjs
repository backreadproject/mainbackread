// Makes app/layout.tsx metadata host-aware: keeps the existing (ReadProspects)
// metadata for readprospects.com, and serves neutral "Relay" metadata on
// relaydocuments.com. Captures and reuses your current metadata object, so nothing
// else in the layout changes. Backs up to app/layout.tsx.metabak. Idempotent.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const FILE = "app/layout.tsx";
if (!existsSync(FILE)) { console.error("Run from project root: " + FILE + " not found."); process.exit(1); }
let s = readFileSync(FILE, "utf8");
const orig = s;
if (s.includes("generateMetadata")) { console.log("layout metadata is already host-aware; nothing to do."); process.exit(0); }

// 1) headers import
if (!s.includes('from "next/headers"')) {
  if (s.includes('import type { Metadata } from "next";'))
    s = s.replace('import type { Metadata } from "next";', 'import type { Metadata } from "next";\nimport { headers } from "next/headers";');
  else s = 'import { headers } from "next/headers";\n' + s;
}

// 2) locate and brace-match the metadata object
const idx = s.indexOf("export const metadata");
if (idx < 0) { console.error("No `export const metadata` found. Paste app/layout.tsx and I'll patch directly. No changes made."); process.exit(1); }
const eq = s.indexOf("=", idx);
const open = s.indexOf("{", eq);
let depth = 0, end = -1;
for (let i = open; i < s.length; i++) { const ch = s[i]; if (ch === "{") depth++; else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } } }
if (end < 0) { console.error("Could not match metadata braces. No changes made."); process.exit(1); }
const obj = s.slice(open, end + 1);
let semi = end + 1; while (semi < s.length && /\s/.test(s[semi])) semi++;
const spanEnd = s[semi] === ";" ? semi + 1 : end + 1;

const replacement =
`export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  if (host.includes("relaydocuments")) {
    return {
      title: "Relay",
      description: "A secure, private link to view a document shared with you. No account needed.",
    };
  }
  return ${obj};
}`;

s = s.slice(0, idx) + replacement + s.slice(spanEnd);
writeFileSync(FILE + ".metabak", orig, "utf8");
writeFileSync(FILE, s, "utf8");
console.log("Patched " + FILE + " -> host-aware metadata. Backup: " + FILE + ".metabak");
