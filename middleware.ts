import { NextResponse, type NextRequest } from "next/server";

// The reader-delivery domain. Reader links live here and nothing else does, so a
// recipient who trims the URL never lands on the marketing/app surface and never
// learns their reading is analysed. Configurable via env; falls back to the host.
const READER_HOST = (process.env.NEXT_PUBLIC_READER_HOST || "relaydocuments.com").toLowerCase();

// The ONLY paths allowed to render on the reader domain. Everything else there is
// rewritten to the neutral relay landing page.
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
  res.cookies.set("locale", prefersFrench ? "fr" : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export function middleware(req: NextRequest) {
  const host = hostOf(req);
  const { pathname } = req.nextUrl;
  const onReaderDomain = host === READER_HOST || host === `www.${READER_HOST}`;

  if (onReaderDomain) {
    // Reader domain: only /read/* and the neutral /relay page may render.
    // Anything else -- the root, /login, /documents, a guessed path -- is REWRITTEN
    // (URL bar unchanged) to the neutral page. No marketing surface, no hint that a
    // larger app exists. Trimming a /read/ link back to the root lands here.
    if (!isAllowedOnReaderDomain(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/relay";
      return applyLocale(req, NextResponse.rewrite(url));
    }
    return applyLocale(req, NextResponse.next());
  }

  // App/marketing domain (readprospects.com): if a /read/ link is hit here -- an old
  // link, or a pasted one -- redirect it to the reader domain so reader traffic is
  // always private. The neutral /relay page is not meant to be reached here.
  if (pathname.startsWith("/read/")) {
    const readerUrl = new URL(pathname + req.nextUrl.search, `https://${READER_HOST}`);
    return NextResponse.redirect(readerUrl, 308);
  }
  if (pathname === "/relay") {
    // /relay only belongs on the reader domain; on the app domain send to home.
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Normal app/marketing behaviour, plus locale.
  return applyLocale(req, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
