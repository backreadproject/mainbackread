import { createClient as createRawClient } from "@supabase/supabase-js";

// Admin client — uses the service_role key, bypasses RLS. Server-only.
// Used for reader-side operations (resolving a share token, recording signals)
// where there is no logged-in user but we still need controlled DB access.
// NEVER import this into anything that runs in the browser.
export function createAdminClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
