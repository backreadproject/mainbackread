// Localizes the server-built activity feed verbs in app/(app)/activity/page.tsx.
// Reuses the `activity` dictionary added earlier. Aborts safely (no changes) if the
// file doesn't match, in which case paste it and it can be patched directly.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const FILE = "app/(app)/activity/page.tsx";
if (!existsSync(FILE)) { console.error("Run from the project root: " + FILE + " not found."); process.exit(1); }
let s = readFileSync(FILE, "utf8");
const original = s;
if (s.includes("getDict(locale).activity")) { console.log("Activity page already localized; nothing to do."); process.exit(0); }

const impAnchor = 'import { createClient } from "@/lib/supabase/server";';
if (!s.includes(impAnchor)) { console.error("Import anchor not found; file differs. Paste it to patch directly. No changes made."); process.exit(1); }
if (!s.includes('from "@/lib/locale-server"')) {
  s = s.replace(impAnchor, impAnchor + '\nimport { getLocale } from "@/lib/locale-server";\nimport { getDict } from "@/lib/i18n";');
}
const fnAnchor = 'export default async function ActivityPage() {';
if (!s.includes(fnAnchor)) { console.error("Function anchor not found; file differs. Paste it to patch directly. No changes made."); process.exit(1); }
s = s.replace(fnAnchor, fnAnchor + '\n  const locale = await getLocale();\n  const actDict = getDict(locale).activity;');

const repl = (from, to) => { if (s.includes(from)) s = s.split(from).join(to); };
repl('${who} opened ${doc}', '${who} ${actDict.opened} ${doc}');
repl('${who} asked: "', '${who} ${actDict.asked} "');
repl('"An unnamed reader"', 'actDict.unnamedReader');
repl('"a document"', 'actDict.aDocument');

const openedDone = s.includes('${who} ${actDict.opened} ${doc}');
const askedDone = s.includes('${who} ${actDict.asked} "');
if (!openedDone || !askedDone) { console.error("Verb strings not found (opened=" + openedDone + ", asked=" + askedDone + "); file differs. Paste it to patch directly. No changes made."); process.exit(1); }
const braces = (s.match(/{/g)||[]).length === (s.match(/}/g)||[]).length;
if (!braces) { console.error("Brace check failed; no changes made."); process.exit(1); }

writeFileSync(FILE + ".bak", original, "utf8");
writeFileSync(FILE, s, "utf8");
console.log("Localized activity feed verbs. Backup: " + FILE + ".bak");
