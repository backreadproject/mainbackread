// Host-aware browser tab (title), meta description, and favicon.
// readprospects.com  -> ReadProspects title/description + ring-and-dot icon
// relaydocuments.com -> RelayDocuments title/description + green-arrow icon
// Icons are inline data URIs, so they work on the reader domain despite the
// host-split middleware (no separate file request to rewrite). Removes the shared
// convention icons. Handles either current layout state. Backup: app/layout.tsx.tabbak
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
const FILE="app/layout.tsx";
if(!existsSync(FILE)){ console.error("Run from project root: "+FILE+" missing."); process.exit(1); }
for(const f of ["app/icon.svg","app/favicon.ico","app/icon.png","app/apple-icon.png"]) if(existsSync(f)){ rmSync(f); console.log("removed convention icon: "+f); }

let s=readFileSync(FILE,"utf8"); const orig=s;
if(!s.includes('from "next/headers"'))
  s = s.includes('import type { Metadata } from "next";')
    ? s.replace('import type { Metadata } from "next";','import type { Metadata } from "next";\nimport { headers } from "next/headers";')
    : 'import { headers } from "next/headers";\n'+s;

const match=(str,open)=>{let d=0;for(let i=open;i<str.length;i++){if(str[i]==="{")d++;else if(str[i]==="}"){d--;if(!d)return i;}}return -1;};
let start,end;
const gm=s.indexOf("export async function generateMetadata");
const cm=s.indexOf("export const metadata");
if(gm>=0){ start=gm; const o=s.indexOf("{",s.indexOf("Promise",gm)); end=match(s,o); }
else if(cm>=0){ start=cm; const o=s.indexOf("{",s.indexOf("=",cm)); const e=match(s,o); let j=e+1; while(j<s.length&&/\s/.test(s[j]))j++; end=s[j]===";"?j:e; }
else { console.error("No metadata found in layout. Paste app/layout.tsx and I'll wire it directly. No changes made."); process.exit(1); }

const RP_ICON="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMwNzE4MTIiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzNFNkEyIiBzdHJva2Utd2lkdGg9IjUiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSI3LjUiIGZpbGw9IiMzM0U2QTIiLz48L3N2Zz4=";
const RELAY_ICON="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNS41IiBmaWxsPSIjMTU5QTU2Ii8+PHBhdGggZD0iTTUgMTJoMTRNMTMgNmw2IDYtNiA2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=";
const gen=
`export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  if (host.includes("relaydocuments")) {
    return {
      title: "RelayDocuments: Fast and Secure Document Sharing",
      description: "RelayDocuments: Fast and Secure Document Sharing",
      icons: { icon: "${RELAY_ICON}" },
    };
  }
  return {
    title: "ReadProspects: Documents Intelligence Platform",
    description: "ReadProspects: Documents Intelligence Platform",
    icons: { icon: "${RP_ICON}" },
  };
}`;

s=s.slice(0,start)+gen+s.slice(end+1);
writeFileSync(FILE+".tabbak",orig,"utf8");
writeFileSync(FILE,s,"utf8");
console.log("Wired host-aware title, description, and inline favicon. Backup: "+FILE+".tabbak");
