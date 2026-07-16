import { createBrowserClient } from "@supabase/ssr";

// Used in the browser (sender dashboard, login). Uses the public anon key,
// which is safe to expose — Row Level Security is what actually protects data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
