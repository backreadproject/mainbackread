import { createBrowserClient } from "@supabase/ssr";
// Used in the browser (sender dashboard, login). Uses the public anon key, which is
// safe to expose — Row Level Security is what actually protects data. On the
// readprospects.com family of hosts the auth cookie is scoped to the parent domain
// so a session set on app.readprospects.com is visible to readprospects.com.
export function createClient() {
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const shared = host.endsWith("readprospects.com");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    shared ? { cookieOptions: { domain: ".readprospects.com", path: "/", sameSite: "lax", secure: true } } : undefined
  );
}
