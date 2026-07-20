import { readFileSync, writeFileSync, existsSync } from "node:fs";
const FILE = "lib/i18n.ts";
if (!existsSync(FILE)) { console.error("Run from project root: " + FILE + " not found."); process.exit(1); }
let s = readFileSync(FILE, "utf8");
if (/\n  activity: \{/.test(s)) { console.log("activity dictionary already present; nothing to do."); process.exit(0); }
const EN =
`  activity: {
    opened: "opened",
    asked: "asked:",
    unnamedReader: "An unnamed reader",
    aDocument: "a document",
  },
`;
const FR =
`  activity: {
    opened: "a ouvert",
    asked: "a demand\\u00e9 :",
    unnamedReader: "Un lecteur anonyme",
    aDocument: "un document",
  },
`;
const enAnchor = "\n};\n\nconst fr: Dict = {";
const frAnchor = "\n};\n\nconst DICTS";
if (!s.includes(enAnchor) || !s.includes(frAnchor)) { console.error("Anchors not found; file untouched."); process.exit(1); }
writeFileSync(FILE + ".bak3", s, "utf8");
s = s.replace(enAnchor, "\n" + EN + "};\n\nconst fr: Dict = {");
s = s.replace(frAnchor, "\n" + FR + "};\n\nconst DICTS");
const braces = (s.match(/{/g)||[]).length === (s.match(/}/g)||[]).length;
const two = (s.match(/\n  activity: \{/g)||[]).length === 2;
if (!braces || !two) { console.error("Post-check failed (braces="+braces+", activityCount two="+two+"). Backup at "+FILE+".bak3"); process.exit(1); }
writeFileSync(FILE, s, "utf8");
console.log("Added activity dictionary (EN + FR). Backup: " + FILE + ".bak3");
