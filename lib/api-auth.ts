import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/plans";

export type ApiScope = "read" | "write";
export type ApiAuth = { ok: true; orgId: string; keyId: string; scopes: string[] };
export type ApiFail = { ok: false; error: string; status: number };

export const API_RATE_PER_HOUR = 1000;

export function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Returns the raw key ONCE. Only the hash is stored. */
export function newApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = "rp_" + crypto.randomBytes(24).toString("hex");
  return { raw, prefix: raw.slice(0, 14), hash: hashKey(raw) };
}

function hourWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).toISOString();
}

/** Bearer-token auth for the public API. Verifies the key, the plan, the scope,
 *  and an hourly ceiling. Org-scoped: a key can only ever see its own org. */
export async function authenticateApi(req: Request, need: ApiScope): Promise<ApiAuth | ApiFail> {
  const header = req.headers.get("authorization") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw) return { ok: false, error: "Missing API key. Send it as: Authorization: Bearer rp_...", status: 401 };

  const admin = createAdminClient();
  const { data: key } = await admin
    .from("api_keys")
    .select("id, organization_id, scopes, revoked_at")
    .eq("key_hash", hashKey(raw))
    .single();

  if (!key || key.revoked_at) return { ok: false, error: "Invalid or revoked API key.", status: 401 };

  const { data: org } = await admin.from("organizations").select("plan").eq("id", key.organization_id).single();
  if (!hasFeature((org as { plan?: string } | null)?.plan, "zapier")) {
    return { ok: false, error: "The API is not included in this plan.", status: 402 };
  }

  const scopes = (key.scopes as string[]) ?? ["read"];
  if (need === "write" && !scopes.includes("write")) {
    return { ok: false, error: "This key is read-only.", status: 403 };
  }

  const { data: count, error: rlErr } = await admin.rpc("bump_rate_limit", {
    p_bucket: `api:key:${key.id}`, p_window: hourWindow(),
  });
  if (!rlErr && Number(count) > API_RATE_PER_HOUR) {
    return { ok: false, error: "Rate limit exceeded. 1000 requests per hour.", status: 429 };
  }

  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);

  return { ok: true, orgId: key.organization_id as string, keyId: key.id as string, scopes };
}

export function apiError(f: ApiFail): Response {
  return new Response(JSON.stringify({ error: f.error }), {
    status: f.status, headers: { "content-type": "application/json" },
  });
}
