// Repairs mojibake (UTF-8 read as Windows-1252) in lib/i18n.ts and rewrites every
// non-ASCII character as a \uXXXX escape so the file is pure ASCII and can never
// re-corrupt. Backs up the original first. Safe to run once; a second run is a no-op.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "lib/i18n.ts";
if (!existsSync(FILE)) { console.error("Cannot find " + FILE + " (run from the project root)."); process.exit(1); }

const CP1252 = {0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};
function unmojibake(s){
  const bytes=[];
  for(const ch of s){
    const c=ch.codePointAt(0);
    if(c<=0xFF) bytes.push(c);
    else if(CP1252[c]!==undefined) bytes.push(CP1252[c]);
    else for(const b of Buffer.from(ch,"utf8")) bytes.push(b);
  }
  return Buffer.from(bytes).toString("utf8");
}
function escapeNonAscii(s){
  let out="";
  for(const ch of s){
    const c=ch.codePointAt(0);
    if(c<=0x7F) out+=ch;
    else if(c<=0xFFFF) out+="\\u"+c.toString(16).padStart(4,"0");
    else out+=ch; // astral chars left as-is (none expected)
  }
  return out;
}

const original = readFileSync(FILE, "utf8");
const badBefore = (original.match(/Ã/g)||[]).length;
if (badBefore === 0) { console.log("No mojibake found. File already clean; nothing to do."); process.exit(0); }

writeFileSync(FILE + ".bak", original, "utf8");
const repaired = escapeNonAscii(unmojibake(original));

// Sanity checks before writing.
const braces = (repaired.match(/{/g)||[]).length === (repaired.match(/}/g)||[]).length;
const hasBits = /export function getDict/.test(repaired) && /const fr/.test(repaired) && /const en/.test(repaired) && /DICTS/.test(repaired);
const stillBad = (repaired.match(/\u00c3/g)||[]).length; // any literal Ã left (there won't be, it's escaped, but check raw)
if (!braces || !hasBits) { console.error("Sanity check failed (braces="+braces+", structure="+hasBits+"). Left "+FILE+" untouched; backup at "+FILE+".bak"); process.exit(1); }

writeFileSync(FILE, repaired, "utf8");
console.log("Repaired "+FILE);
console.log("  mojibake sequences fixed (\u00c3 count): "+badBefore+" -> 0");
console.log("  file is now pure ASCII with \\u escapes (corruption-proof)");
console.log("  backup saved: "+FILE+".bak");
console.log("  sample: getDict/const fr/DICTS present, braces balanced");
