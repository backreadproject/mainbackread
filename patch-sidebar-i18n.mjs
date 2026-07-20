// Adds a `sidebar` dictionary (EN + FR) to lib/i18n.ts so the app navigation
// translates. French accents are written as \uXXXX escapes (corruption-proof).
// Idempotent: refuses to run twice. Uses the same proven anchors as prior patches.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const FILE = "lib/i18n.ts";
if (!existsSync(FILE)) { console.error("Run from the project root: " + FILE + " not found."); process.exit(1); }
let s = readFileSync(FILE, "utf8");

if (s.includes("sidebar: {")) { console.log("sidebar dictionary already present; nothing to do."); process.exit(0); }

const EN =
`  sidebar: {
    overview: "Overview",
    documents: "Documents",
    projects: "Projects",
    activity: "Activity",
    recipients: "Recipients",
    members: "Members",
    settings: "Settings",
    account: "Account",
    main: "Main",
    configure: "Configure",
    organization: "Organization",
    personal: "Personal",
    viewSite: "View site",
    signOut: "Sign out",
    backToSite: "Back to site",
  },
`;
const FR =
`  sidebar: {
    overview: "Vue d'ensemble",
    documents: "Documents",
    projects: "Projets",
    activity: "Activit\\u00e9",
    recipients: "Destinataires",
    members: "Membres",
    settings: "Param\\u00e8tres",
    account: "Compte",
    main: "Principal",
    configure: "Configuration",
    organization: "Organisation",
    personal: "Personnel",
    viewSite: "Voir le site",
    signOut: "Se d\\u00e9connecter",
    backToSite: "Retour au site",
  },
`;

const enAnchor = "\n};\n\nconst fr: Dict = {";
const frAnchor = "\n};\n\nconst DICTS";
if (!s.includes(enAnchor) || !s.includes(frAnchor)) { console.error("Structure anchors not found; left file untouched."); process.exit(1); }

writeFileSync(FILE + ".bak2", s, "utf8");
s = s.replace(enAnchor, "\n" + EN + "};\n\nconst fr: Dict = {");
s = s.replace(frAnchor, "\n" + FR + "};\n\nconst DICTS");

const braces = (s.match(/{/g)||[]).length === (s.match(/}/g)||[]).length;
const two = (s.match(/sidebar: {/g)||[]).length === 2;
if (!braces || !two) { console.error("Post-check failed (braces="+braces+", sidebarCount="+two+"). Backup at "+FILE+".bak2"); process.exit(1); }
writeFileSync(FILE, s, "utf8");
console.log("Added sidebar dictionary (EN + FR). Backup: " + FILE + ".bak2");
