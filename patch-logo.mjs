// Adopts the homepage logo mark (mint #33E6A2 ring + dot, with a soft glow) wherever
// the brand ring-and-dot SVG is rendered (e.g. MarketingNav, Sidebar). Surgical: it only
// rewrites the logo circles and adds the glow, so it never touches buttons or layout.
// Backs up each changed file to <file>.logobak. Idempotent.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
const MINT = "#33E6A2";
const GLOW = "drop-shadow(0 0 3px rgba(51,230,162,0.55))";
function walk(d,out=[]){ let e; try{e=readdirSync(d);}catch{return out;}
  for(const f of e){ if(f==="node_modules"||f===".next"||f.startsWith(".git"))continue;
    const p=join(d,f); const st=statSync(p);
    if(st.isDirectory())walk(p,out); else if(p.endsWith(".tsx"))out.push(p);} return out; }
let files=[]; for(const r of ["app","lib"]) files=files.concat(walk(r));
let changed=0, marks=0;
for(const f of files){
  let s=readFileSync(f,"utf8"); const orig=s; let hit=false;
  // ring
  if(s.includes('r="9" stroke="currentColor" strokeWidth="2.2"')){
    s=s.split('r="9" stroke="currentColor" strokeWidth="2.2"').join(`r="9" stroke="${MINT}" strokeWidth="2.4"`); hit=true; marks++; }
  // dot
  if(s.includes('r="3.5" fill="currentColor"')){
    s=s.split('r="3.5" fill="currentColor"').join(`r="3.5" fill="${MINT}"`); hit=true; }
  // glow (handle spaced and unspaced style objects)
  s=s.split('verticalAlign: "-0.1em" }}').join(`verticalAlign: "-0.1em", filter: "${GLOW}" }}`);
  s=s.split('verticalAlign:"-0.1em"}}').join(`verticalAlign:"-0.1em",filter:"${GLOW}"}}`);
  if(s!==orig){ writeFileSync(f+".logobak",orig,"utf8"); writeFileSync(f,s,"utf8"); changed++; console.log("  "+f); }
}
console.log(`\nUpdated ${changed} file(s); ${marks} logo mark(s) recoloured to mint + glow.`);
if(changed===0) console.log("No brand ring-and-dot mark found (already updated, or the mark differs).");
