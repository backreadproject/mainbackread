import { NextResponse, type NextRequest } from "next/server";

// Detect the visitor's preferred language on first visit and remember it in a cookie.
// Cookie-based locale (no URL change). Manual switcher overwrites this cookie later.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const existing = req.cookies.get("locale")?.value;
  if (existing === "en" || existing === "fr") return res;

  const accept = req.headers.get("accept-language") || "";
  // If French appears before English (or English is absent), prefer French.
  const prefersFrench = /(^|,)\s*fr\b/i.test(accept) &&
    (accept.toLowerCase().indexOf("fr") < accept.toLowerCase().indexOf("en") || !/\ben\b/i.test(accept));

  res.cookies.set("locale", prefersFrench ? "fr" : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  // Run on everything except static assets and API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
