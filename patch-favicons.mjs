// Host-aware favicon + description. readprospects.com -> ReadProspects icon + its
// existing title/description; relaydocuments.com -> Relay icon + Relay description.
// Works whether app/layout.tsx still has `export const metadata` or the earlier
// generateMetadata. Removes the shared convention icons so they can't override.
// Backs up app/layout.tsx.favbak. Idempotent-ish (safe to re-run).
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
const FILE = "app/layout.tsx";
if (!existsSync(FILE)) { console.error("Run from project root: " + FILE + " missing."); process.exit(1); }

// remove shared convention icons (they'd override host-aware icons)
for (const f of ["app/icon.svg","app/favicon.ico","app/icon.png","app/apple-icon.png"]) {
  if (existsSync(f)) { rmSync(f); console.log("removed convention icon: " + f); }
}

let s = readFileSync(FILE, "utf8"); const orig = s;
if (!s.includes('from "next/headers"'))
  s = s.includes('import type { Metadata } from "next";')
    ? s.replace('import type { Metadata } from "next";', 'import type { Metadata } from "next";\nimport { headers } from "next/headers";')
    : 'import { headers } from "next/headers";\n' + s;

// brace-match a block starting at `open` (index of "{")
const match = (str, open) => { let d=0; for (let i=open;i<str.length;i++){ if(str[i]==="{")d++; else if(str[i]==="}"){d--; if(!d)return i;} } return -1; };

const RELAY_DESC = "A secure, private link to view a document shared with you. No account needed.";
let start, blockEnd, block;
const gm = s.indexOf("export async function generateMetadata");
const cm = s.indexOf("export const metadata");
if (gm >= 0) { start = gm; const o = s.indexOf("{", s.indexOf("Promise", gm)); blockEnd = match(s, o); }
else if (cm >= 0) { start = cm; const o = s.indexOf("{", s.indexOf("=", cm)); const e = match(s, o); let j=e+1; while(j<s.length && /\s/.test(s[j])) j++; blockEnd = s[j]===";"? j : e; }
else { console.error("No metadata found in layout. Paste app/layout.tsx and I'll wire it directly."); process.exit(1); }
block = s.slice(start, blockEnd + 1);

// recover the ReadProspects title/description (the ones that aren't the Relay values)
const titles = [...block.matchAll(/title:\s*"((?:[^"\\]|\\.)*)"/g)].map(m=>m[1]).filter(t=>t!=="Relay");
const descs  = [...block.matchAll(/description:\s*"((?:[^"\\]|\\.)*)"/g)].map(m=>m[1]).filter(t=>t!==RELAY_DESC);
const rpTitle = titles[0] ?? "ReadProspects";
const rpDesc  = descs[0] ?? "See what your readers do with the documents you send.";

const gen =
`export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  if (host.includes("relaydocuments")) {
    return {
      title: "Relay",
      description: "${RELAY_DESC}",
      icons: { icon: [{ url: "/relay-icon.svg", type: "image/svg+xml" }], shortcut: "/relay-icon.ico" },
    };
  }
  return {
    title: "${rpTitle}",
    description: "${rpDesc}",
    icons: { icon: [{ url: "/rp-icon.svg", type: "image/svg+xml" }], shortcut: "/rp-icon.ico" },
  };
}`;

s = s.slice(0, start) + gen + s.slice(blockEnd + 1);
writeFileSync(FILE + ".favbak", orig, "utf8");
writeFileSync(FILE, s, "utf8");
console.log(`Wired host-aware icons + descriptions. RP title kept: "${rpTitle}". Backup: ${FILE}.favbak`);
