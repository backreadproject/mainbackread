import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Which workspace a person sees.
 *
 * CLASSIC is the shell the app has always had. ELEGANT is the dense two pane
 * workspace. They are not two applications: every page renders the same
 * components, reading the same T tokens, which already resolve through CSS
 * variables rather than baked hexes. A workspace is a variable layer and a
 * shell, which is the only reason having two of them is affordable.
 *
 * RESOLUTION ORDER, most specific first:
 *
 *   1. the rp-ws cookie      an explicit choice, including the escape hatch
 *   2. profiles.workspace    one account trying it before anybody else
 *   3. app_settings.workspace  the default for everyone
 *   4. classic               if any of the above is missing or unreadable
 *
 * The cookie wins deliberately. If Elegant breaks a page, /api/workspace sets
 * the cookie and redirects, and that route lives outside the app shell, so it
 * still works when the shell itself is throwing. Getting out never depends on
 * reaching a settings screen inside the thing that is broken.
 */

export type Workspace = "classic" | "elegant";

export const WORKSPACE_COOKIE = "rp-ws";

/** A year. A choice this deliberate should not quietly expire. */
export const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isWorkspace(v: unknown): v is Workspace {
  return v === "classic" || v === "elegant";
}

/** Never throws. An unreadable preference must not be able to break a layout. */
export function readWorkspace(v: unknown): Workspace | null {
  return isWorkspace(v) ? v : null;
}

type Db = SupabaseClient;

export async function resolveWorkspace(admin: Db, userId: string | null): Promise<Workspace> {
  // 1. the explicit choice, and the way out
  try {
    const jar = await cookies();
    const fromCookie = readWorkspace(jar.get(WORKSPACE_COOKIE)?.value);
    if (fromCookie) return fromCookie;
  } catch {
    // Reading cookies can throw in some rendering contexts. Carry on rather
    // than fail: the fallbacks below are all safe.
  }

  // 2. this account only
  if (userId) {
    try {
      const { data } = await admin.from("profiles").select("workspace").eq("id", userId).maybeSingle();
      const mine = readWorkspace((data as { workspace?: unknown } | null)?.workspace);
      if (mine) return mine;
    } catch { /* fall through */ }
  }

  // 3. the default for everyone
  try {
    const { data } = await admin.from("app_settings").select("workspace").limit(1).maybeSingle();
    const global = readWorkspace((data as { workspace?: unknown } | null)?.workspace);
    if (global) return global;
  } catch { /* fall through */ }

  // 4. the shell that has always worked
  return "classic";
}

/** The class the shell wrapper carries. Scoping the Elegant layer to a wrapper
 *  rather than to <html> means the server renders it in the markup, so there is
 *  no flash and no pre-paint script to get wrong. */
export function workspaceClass(ws: Workspace): string {
  return ws === "elegant" ? "ws-elegant" : "ws-classic";
}
