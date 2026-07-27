import fs from "node:fs";
import path from "node:path";
const R = process.cwd();
let miss = 0;
function sub(rel, label, from, to) {
  const f = path.join(R, rel);
  let t = fs.readFileSync(f, "utf8");
  if (!t.includes(from)) { console.log("  MISS  " + label); miss++; return; }
  fs.writeFileSync(f, t.replace(from, to), "utf8");
  console.log("  ok    " + label);
}

// Next.js merges metadata SHALLOWLY. A page that declares openGraph replaces the
// parent's openGraph object outright rather than merging into it, so the image
// set on the root layout was being discarded by every page that declared its
// own. Each one has to name the image itself.
sub("app/page.tsx", "home og image",
'    url: "https://readprospects.com",\n    siteName: "ReadProspects",\n    type: "website",',
'    url: "https://readprospects.com",\n    siteName: "ReadProspects",\n    type: "website",\n    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ReadProspects" }],');

sub("app/pricing/page.tsx", "pricing og image",
'openGraph: { title: "ReadProspects pricing", description: "Plans from a single sender to a whole team.", url: "https://readprospects.com/pricing", type: "website" },',
'openGraph: { title: "ReadProspects pricing", description: "Plans from a single sender to a whole team.", url: "https://readprospects.com/pricing", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "ReadProspects" }] },');

console.log("");
console.log("misses: " + miss);