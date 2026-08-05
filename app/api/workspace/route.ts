import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWorkspace, WORKSPACE_COOKIE, WORKSPACE_COOKIE_MAX_AGE } from "@/lib/workspace";

export const runtime = "nodejs";

/**
 * Switching workspace.
 *
 * GET is the escape hatch and it is deliberately dumb: no session read, no
 * database, no shell. Point a browser at
 *
 *   /api/workspace?ws=classic
 *
 * and it sets the cookie and sends you home. That has to keep working when the
 * Elegant shell is throwing, which is exactly the moment somebody needs it, so
 * it depends on nothing that could be broken.
 *
 * POST is the considered version, used by the in-app switcher: it also stores
 * the choice on the profile so it survives clearing cookies and follows the
 * person to another browser.
 */

function setCookie(res: NextResponse, ws: "classic" | "elegant") {
  res.cookies.set(WORKSPACE_COOKIE, ws, {
    path: "/",
    maxAge: WORKSPACE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function GET(req: NextRequest) {
  const ws = req.nextUrl.searchParams.get("ws");
  const to = req.nextUrl.searchParams.get("to");

  if (!isWorkspace(ws)) {
    return NextResponse.json(
      { error: "Use ?ws=classic or ?ws=elegant." },
      { status: 400 },
    );
  }

  // Only a path on this host, never an absolute URL. An open redirect here
  // would be a phishing primitive attached to a link people are told to trust.
  const safe = typeof to === "string" && to.startsWith("/") && !to.startsWith("//") ? to : "/overview";
  const res = NextResponse.redirect(new URL(safe, req.nextUrl.origin));
  setCookie(res, ws);
  return res;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ws = body.workspace;
  if (!isWorkspace(ws)) {
    return NextResponse.json({ error: "Unknown workspace." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, workspace: ws });
  setCookie(res, ws);

  // Stored as well as cookied, so the choice is not lost with the cookie jar.
  // Failing to store is not failing to switch: the cookie is already set.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      await admin.from("profiles").update({ workspace: ws }).eq("id", user.id);
    }
  } catch (e) {
    console.warn("[workspace] switched but could not store:", e instanceof Error ? e.message : String(e));
  }

  return res;
}
