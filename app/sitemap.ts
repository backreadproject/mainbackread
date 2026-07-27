import type { MetadataRoute } from "next";
// Marketing pages only. The app, the reader and the referral console are all
// disallowed in robots.txt, so listing them here would contradict that.
//
// changeFrequency and priority are hints Google has said it largely ignores;
// they are included because other crawlers still read them and they cost
// nothing. lastModified is the field that actually gets used.
const BASE = "https://readprospects.com";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: BASE + "/pricing", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // The concepts page is the one with a real chance of ranking on merit:
    // "what is document intent" is a question with almost no good answer online.
    { url: BASE + "/concepts", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: BASE + "/privacy", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: BASE + "/terms", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}