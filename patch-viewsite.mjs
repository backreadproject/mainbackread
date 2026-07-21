// Points the sidebar "View site" / "Voir le site" button at the marketing site
// (readprospects.com) instead of "/", which the app subdomain would loop back to
// /overview. Same link for both languages. Backup: Sidebar.tsx.bak. Idempotent.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const FILE = "app/(app)/Sidebar.tsx";
if (!existsSync(FILE)) { console.error("Run from project root: " + FILE + " not found."); process.exit(1); }
let s = readFileSync(FILE, "utf8");
const from = '<a href="/" target="_blank" rel="noopener noreferrer" className="t-out"';
const to = '<a href="https://readprospects.com" target="_blank" rel="noopener noreferrer" className="t-out"';
if (s.includes(to)) { console.log("View site already points to readprospects.com; nothing to do."); process.exit(0); }
if (!s.includes(from)) { console.error("View site link not found in the expected form. Paste app/(app)/Sidebar.tsx and I'll patch it directly. No changes made."); process.exit(1); }
writeFileSync(FILE + ".bak", s, "utf8");
writeFileSync(FILE, s.replace(from, to), "utf8");
console.log('View site now links to https://readprospects.com (EN and FR). Backup: ' + FILE + '.bak');
