import type { MetadataRoute } from "next";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
// One app serves four hosts, so robots.txt has to differ by host.
//
// The one that matters: reader links are unauthenticated public URLs. If a
// crawler ever finds one -- from a browser extension, a toolbar, a link pasted
// somewhere public -- a customer's proposal enters the search index. That is a
// confidentiality breach with our name on it, so relaydocuments.com disallows
// everything, and the reader page carries a noindex tag as well. robots.txt is
// a request; the meta tag is an instruction, and we want both.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";

  // Reader domain: nothing here is ours to publish.
  if (host.includes("relaydocuments")) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // The app and the referral console are signed-in surfaces with nothing to
  // rank for, and the console path should not appear in any index.
  if (host.startsWith("app.") || host.startsWith("referrals.")) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // Marketing.
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      // Nothing sensitive, but no reason to spend crawl budget on them.
      disallow: ["/api/", "/read/", "/relay", "/login", "/reset-password", "/forgot-password", "/check-email", "/invite/"],
    }],
    sitemap: "https://readprospects.com/sitemap.xml",
    host: "https://readprospects.com",
  };
}