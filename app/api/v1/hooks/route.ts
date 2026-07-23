import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, bad } from "@/lib/api-json";
import { isSafeWebhookUrl, WEBHOOK_EVENTS } from "@/lib/webhooks";

export const runtime = "nodejs";

// Zapier REST Hooks: subscribe on Zap turn-on, unsubscribe on turn-off.
export async function GET(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const admin = createAdminClient();
  const { data } = await admin.from("api_subscriptions")
    .select("id, target_url, event, created_at")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });
  return ok({ data: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const body = await req.json().catch(() => ({}));

  const target = typeof body.target_url === "string" ? body.target_url.trim() : "";
  const event = typeof body.event === "string" ? body.event.trim() : "";
  if (!target || !event) return bad("target_url and event are required.");
  if (!(WEBHOOK_EVENTS as string[]).includes(event)) {
    return bad(`Unknown event. Use one of: ${WEBHOOK_EVENTS.join(", ")}`);
  }
  const safe = isSafeWebhookUrl(target);
  if (!safe.ok) return bad(safe.error ?? "Invalid target_url.");

  const admin = createAdminClient();
  const { data, error } = await admin.from("api_subscriptions")
    .insert({ organization_id: auth.orgId, api_key_id: auth.keyId, target_url: target, event })
    .select("id, target_url, event, created_at").single();
  if (error) return bad(error.message, 500);
  return ok(data, 201);
}

export async function DELETE(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  let target = url.searchParams.get("target_url") || "";
  if (!id && !target) {
    const body = await req.json().catch(() => ({}));
    target = typeof body.target_url === "string" ? body.target_url : "";
  }
  if (!id && !target) return bad("Provide id or target_url.");

  const admin = createAdminClient();
  let q = admin.from("api_subscriptions").delete().eq("organization_id", auth.orgId);
  q = id ? q.eq("id", id) : q.eq("target_url", target);
  const { error } = await q;
  if (error) return bad(error.message, 500);
  return ok({ ok: true });
}
