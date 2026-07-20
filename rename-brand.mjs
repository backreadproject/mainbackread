// Renames the display brand "BackRead" -> "ReadProspects" across the app and lib
// source (.ts/.tsx). Only the exact-case word "BackRead" is touched, so lowercase
// paths/domains (backread, readprospects.com), folder names, and the git repo are
// untouched. Backs up each changed file to <file>.brandbak. Prints a summary.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "lib"];
const EXT = [".ts", ".tsx"];
const FROM = "BackRead", TO = "ReadProspects";

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".git")) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.some((x) => p.endsWith(x))) out.push(p);
  }
  return out;
}

let files = [];
for (const r of ROOTS) files = files.concat(walk(r));

let changed = 0, hits = 0;
for (const f of files) {
  const s = readFileSync(f, "utf8");
  const n = (s.match(new RegExp(FROM, "g")) || []).length;
  if (!n) continue;
  writeFileSync(f + ".brandbak", s, "utf8");
  writeFileSync(f, s.split(FROM).join(TO), "utf8");
  changed++; hits += n;
  console.log(`  ${f}  (${n})`);
}
console.log(`\nRenamed "${FROM}" -> "${TO}" in ${changed} file(s), ${hits} occurrence(s).`);
if (changed === 0) console.log("Nothing to change (already renamed?).");
