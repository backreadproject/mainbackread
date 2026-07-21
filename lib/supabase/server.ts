import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
// Used in server components and route handlers. Reads the logged-in sender from
// their session cookie, so RLS policies apply as that specific user. On the
// readprospects.com family of hosts the auth cookie is scoped to the parent
// domain so the marketing site and the app subdomain share one session.
export async function createClient() {
  const cookieStore = await cookies();
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  const shared = host.endsWith("readprospects.com");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(shared ? { cookieOptions: { domain: ".readprospects.com", path: "/", sameSite: "lax", secure: true } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
