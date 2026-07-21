import { NextResponse, type NextRequest } from "next/server";

// --- Hosts -------------------------------------------------------------------
// Reader-delivery domain: reader links live here and nothing else does, so a
// recipient who trims the URL never lands on the marketing/app surface.
const READER_HOST = (process.env.NEXT_PUBLIC_READER_HOST || "relaydocuments.com").toLowerCase();
// App subdomain: the logged-in product lives here.
const APP_HOST = (process.env.NEXT_PUBLIC_APP_HOST || "app.readprospects.com").toLowerCase();
// Marketing apex: the public landing, pricing, privacy, terms.
const MARKETING_HOST = (process.env.NEXT_PUBLIC_MARKETING_HOST || "readprospects.com").toLowerCase();

// Paths that belong to the app (redirected from the marketing host to the app host).
const APP_PREFIXES = ["/overview", "/documents", "/projects", "/activity", "/recipients", "/members", "/settings", "/account", "/login", "/signup", "/forgot-password", "/reset-password", "/check-email", "/onboarding"];
// Public marketing paths (kept on the marketing host; redirected off the app host).
const MARKETING_PREFIXES = ["/pricing", "/privacy", "/terms"];

const hasPrefix = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(x + "/"));
const isAppPath = (p: string) => hasPrefix(p, APP_PREFIXES);
const isMarketingPath = (p: string) => hasPrefix(p, MARKETING_PREFIXES);

// Only these render on the reader domain; everything else there -> neutral /relay.
function isAllowedOnReaderDomain(pathname: string): boolean {
  return pathname.startsWith("/read/") || pathname === "/relay";
}
function hostOf(req: NextRequest): string {
  const h = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return h.split(":")[0].toLowerCase();
}
function applyLocale(req: NextRequest, res: NextResponse): NextResponse {
  const existing = req.cookies.get("locale")?.value;
  if (existing === "en" || existing === "fr") return res;
  const accept = req.headers.get("accept-language") || "";
  const prefersFrench = /(^|,)\s*fr\b/i.test(accept) &&
    (accept.toLowerCase().indexOf("fr") < accept.toLowerCase().indexOf("en") || !/\ben\b/i.test(accept));
  res.cookies.set("locale", prefersFrench ? "fr" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export function middleware(req: NextRequest) {
  const host = hostOf(req);
  const { pathname } = req.nextUrl;

  const onReaderDomain = host === READER_HOST || host === `www.${READER_HOST}`;
  const onAppDomain = host === APP_HOST;
  const onMarketingDomain = host === MARKETING_HOST || host === `www.${MARKETING_HOST}`;

  // 1) Reader domain: only /read/* and /relay may render; everything else there is
  //    rewritten (URL bar unchanged) to the neutral relay page.
  if (onReaderDomain) {
    // Relay-branded legal pages: served at /privacy and /terms (URL bar unchanged),
    // rendered from the neutral /relay/* pages. Marketing pages on readprospects.com
    // are untouched.
    if (pathname === "/privacy" || pathname === "/terms") {
      const url = req.nextUrl.clone();
      url.pathname = `/relay${pathname}`;
      return applyLocale(req, NextResponse.rewrite(url));
    }
    if (!isAllowedOnReaderDomain(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/relay";
      return applyLocale(req, NextResponse.rewrite(url));
    }
    return applyLocale(req, NextResponse.next());
  }

  // Reader links pasted on any non-reader host always go to the reader domain.
  if (pathname.startsWith("/read/")) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${READER_HOST}`), 308);
  }

  // 2) App subdomain (app.readprospects.com): serve the app; keep marketing pages on
  //    the marketing host; send the root to the dashboard.
  if (onAppDomain) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    if (isMarketingPath(pathname)) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${MARKETING_HOST}`), 307);
    }
    if (pathname === "/relay") {
      const url = req.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    return applyLocale(req, NextResponse.next());
  }

  // 3) Marketing host (readprospects.com): serve marketing; send app routes to the
  //    app subdomain.
  if (onMarketingDomain) {
    if (isAppPath(pathname)) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${APP_HOST}`), 307);
    }
    if (pathname === "/relay") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return applyLocale(req, NextResponse.next());
  }

  // 4) Localhost, *.vercel.app previews, or any other host: keep the app and marketing
  //    baked together (single origin) so local dev and previews keep working.
  if (pathname === "/relay") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return applyLocale(req, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
