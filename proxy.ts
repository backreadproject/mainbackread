import { NextResponse, type NextRequest } from "next/server";

const READER_HOST = (process.env.NEXT_PUBLIC_READER_HOST || "relaydocuments.com").toLowerCase();
const APP_HOST = (process.env.NEXT_PUBLIC_APP_HOST || "app.readprospects.com").toLowerCase();
const MARKETING_HOST = (process.env.NEXT_PUBLIC_MARKETING_HOST || "readprospects.com").toLowerCase();
const REFERRAL_HOST = (process.env.NEXT_PUBLIC_REFERRAL_HOST || "referrals.readprospects.com").toLowerCase();

const APP_PREFIXES = ["/overview", "/documents", "/projects", "/activity", "/recipients", "/members", "/settings", "/account", "/billing", "/login", "/signup", "/forgot-password", "/reset-password", "/check-email", "/onboarding"];
const MARKETING_PREFIXES = ["/pricing", "/privacy", "/terms", "/concepts"];

// Hidden admin surface. Lives only on the app host; gated at the edge by Basic Auth,
// then by session + allowlist inside the layout.
const ADMIN_SLUG = "console-7f3ab9c2";
const isAdminPath = (p: string) => p === `/${ADMIN_SLUG}` || p.startsWith(`/${ADMIN_SLUG}/`);
const isAdminApiPath = (p: string) => p === "/api/admin" || p.startsWith("/api/admin/");

const hasPrefix = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(x + "/"));
const isAppPath = (p: string) => hasPrefix(p, APP_PREFIXES);
const isMarketingPath = (p: string) => hasPrefix(p, MARKETING_PREFIXES);

function isAllowedOnReaderDomain(pathname: string): boolean {
  return pathname.startsWith("/read/") || pathname === "/relay";
}
function isAllowedOnReferralDomain(pathname: string): boolean {
  return pathname === "/referrals" || pathname.startsWith("/referrals/");
}
function hostOf(req: NextRequest): string {
  const h = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return h.split(":")[0].toLowerCase();
}
function basicAuthOk(req: NextRequest): boolean {
  const u = process.env.ADMIN_BASIC_USER, pw = process.env.ADMIN_BASIC_PASS;
  if (!u || !pw) return false; // fail closed if not configured
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  try {
    const [user, pass] = atob(h.slice(6)).split(":");
    return user === u && pass === pw;
  } catch { return false; }
}
function needAuth(): NextResponse {
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin"' } });
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

const REF_COOKIE = "rp_ref";
const REF_MAX_AGE = 60 * 60 * 24 * 60;
function captureRef(req: NextRequest, res: NextResponse): NextResponse {
  const raw = req.nextUrl.searchParams.get("ref");
  if (!raw) return res;
  const code = raw.trim().toLowerCase();
  // Same shape the referrer_code_format constraint enforces, so a junk value
  // never reaches the database.
  if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(code)) return res;
  // First touch wins and is never overwritten: a subscriber must not be able to
  // reattribute themselves by clicking a second link.
  if (req.cookies.get(REF_COOKIE)?.value) return res;
  res.cookies.set(REF_COOKIE, code, { path: "/", maxAge: REF_MAX_AGE, sameSite: "lax", httpOnly: false });
  return res;
}
/** Passes the pathname to server components, which cannot otherwise see it.
 *  app/(app)/layout.tsx needs it to wall a locked account out of every page
 *  except /billing, and a layout receives no route information of its own. */
function withPath(req: NextRequest, res: NextResponse): NextResponse {
  res.headers.set("x-rp-pathname", req.nextUrl.pathname);
  return res;
}

export function proxy(req: NextRequest) {
  const host = hostOf(req);
  const { pathname } = req.nextUrl;

  // Crawler files must reach the route handler on EVERY host, before any of
  // the host branches below. The reader domain rewrites anything it does not
  // recognise to /relay and referrals rewrites to /referrals, so without this
  // relaydocuments.com/robots.txt would serve a landing page and no crawler
  // would ever be told to stay out of your customers' documents.
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  // The admin API. Basic Auth at the edge, in front of the getAdminUser()
  // check inside every action. Two layers, matching the console pages.
  if (isAdminApiPath(pathname)) {
    if (!basicAuthOk(req)) return needAuth();
    return NextResponse.next();
  }

  const onReaderDomain = host === READER_HOST || host === `www.${READER_HOST}`;
  const onAppDomain = host === APP_HOST;
  const onMarketingDomain = host === MARKETING_HOST || host === `www.${MARKETING_HOST}`;

  // 0) Admin surface. Hide on the reader domain, push to the app host from marketing,
  //    and require Basic Auth everywhere it may render.
  if (isAdminPath(pathname)) {
    if (onReaderDomain) {
      const url = req.nextUrl.clone(); url.pathname = "/relay";
      return applyLocale(req, NextResponse.rewrite(url));
    }
    if (onMarketingDomain) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${APP_HOST}`), 307);
    }
    if (!basicAuthOk(req)) return needAuth();
    return applyLocale(req, captureRef(req, NextResponse.next()));
  }

  // 0.5) Referral console. Its own host so a referrer never needs an app
  //      account. Only /referrals/* renders; everything else rewrites to the
  //      console root rather than leaking an app or marketing page.
  if (host === REFERRAL_HOST) {
    if (!isAllowedOnReferralDomain(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/referrals";
      return applyLocale(req, captureRef(req, NextResponse.rewrite(url)));
    }
    return applyLocale(req, captureRef(req, NextResponse.next()));
  }
  // 1) Reader domain: only /read/* and /relay may render.
  if (onReaderDomain) {
    if (pathname === "/privacy" || pathname === "/terms") {
      const url = req.nextUrl.clone(); url.pathname = `/relay${pathname}`;
      return applyLocale(req, NextResponse.rewrite(url));
    }
    if (!isAllowedOnReaderDomain(pathname)) {
      const url = req.nextUrl.clone(); url.pathname = "/relay";
      return applyLocale(req, NextResponse.rewrite(url));
    }
    return applyLocale(req, NextResponse.next());
  }

  if (pathname.startsWith("/read/")) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${READER_HOST}`), 308);
  }

  // 2) App subdomain.
  if (onAppDomain) {
    if (pathname === "/") {
      const url = req.nextUrl.clone(); url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    if (isMarketingPath(pathname)) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${MARKETING_HOST}`), 307);
    }
    if (pathname === "/relay") {
      const url = req.nextUrl.clone(); url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    return withPath(req, applyLocale(req, captureRef(req, NextResponse.next())));
  }

  // 3) Marketing host.
  if (onMarketingDomain) {
    if (isAppPath(pathname)) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${APP_HOST}`), 307);
    }
    if (pathname === "/relay") {
      const url = req.nextUrl.clone(); url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return applyLocale(req, NextResponse.next());
  }

  // 4) Localhost / previews / other.
  // Previews answer on *.vercel.app and match no configured host, so they land
  // here. They get the SAME treatment as the app domain -- withPath for the
  // lapsed-wall exemption, captureRef for referral attribution -- because a
  // staging environment that behaves differently from production is worse than
  // no staging at all.
  if (pathname === "/relay") {
    const url = req.nextUrl.clone(); url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return withPath(req, applyLocale(req, captureRef(req, NextResponse.next())));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api(?!/admin)).*)"],
};
