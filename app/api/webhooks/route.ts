import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { isSafeWebhookUrl, newWebhookSecret, sendTestDelivery, redeliver, WEBHOOK_EVENTS } from "@/lib/webhooks";

export const runtime = "nodejs";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", status: 401 as const };
  const ctx = await getOrgContext();
  if (!ctx.org) return { error: "Webhooks are an organization feature.", status: 403 as const };
  if (!(ctx.role === "owner" || ctx.role === "admin")) return { error: "Only an owner or admin can manage webhooks.", status: 403 as const };
  const admin = createAdminClient();
  const plan = await resolvePlanForUser(admin, user.id);
  // The layout walls a browser; it does not stop a direct call.
  if (isLocked(plan)) {
    const msg = plan.everPaid
      ? "Your subscription has ended. Restart it to continue."
      : "Your free trial has ended. Choose a plan to continue.";
    return { error: msg, status: 402 as const };
  }
  if (!hasFeature(plan.plan.id, "webhookAlerts")) {
    return { error: `Webhook alerts are not included in the ${plan.plan.name} plan.`, status: 402 as const };
  }
  return { user, orgId: ctx.org.id, admin };
}

export async function GET(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const webhookId = new URL(req.url).searchParams.get("webhookId") ?? "";
  if (!webhookId) return NextResponse.json({ error: "webhookId is required." }, { status: 400 });

  const { data: hook } = await g.admin.from("webhooks").select("id, organization_id").eq("id", webhookId).single();
  if (!hook || hook.organization_id !== g.orgId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data } = await g.admin
    .from("webhook_deliveries")
    .select("id, event, ok, status_code, error, created_at, payload")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(20);

  // payload can hold a reader's question or reply text, so it is reduced to a
  // replayable flag rather than returned to the browser.
  const rows = (data ?? []).map((d) => ({
    id: d.id, event: d.event, ok: d.ok, status_code: d.status_code,
    error: d.error, created_at: d.created_at, replayable: d.payload != null,
  }));
  return NextResponse.json({ deliveries: rows });
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const { action, url, webhookId, events, deliveryId } = await req.json();

  if (action === "create") {
    const safe = isSafeWebhookUrl(String(url ?? ""));
    if (!safe.ok) return NextResponse.json({ error: safe.error }, { status: 400 });
    const chosen = Array.isArray(events) && events.length ? events.filter((e: string) => (WEBHOOK_EVENTS as string[]).includes(e)) : WEBHOOK_EVENTS;
    const secret = newWebhookSecret();
    const { data, error } = await g.admin.from("webhooks")
      .insert({ organization_id: g.orgId, url: String(url).trim(), secret, events: chosen, created_by: g.user.id })
      .select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id, secret });
  }

  const { data: hook } = await g.admin.from("webhooks").select("id, organization_id, active").eq("id", webhookId).single();
  if (!hook || hook.organization_id !== g.orgId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (action === "delete") {
    const { error } = await g.admin.from("webhooks").delete().eq("id", webhookId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "toggle") {
    const { error } = await g.admin.from("webhooks").update({ active: !hook.active }).eq("id", webhookId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "redeliver") {
    const res = await redeliver(String(deliveryId));
    return NextResponse.json(
      res.ok ? { ok: true, status: res.status }
             : { error: res.error || `Endpoint returned ${res.status}.` },
      { status: res.ok ? 200 : 400 });
  }
  if (action === "test") {
    const res = await sendTestDelivery(String(webhookId));
    return NextResponse.json(res.ok ? { ok: true, status: res.status } : { error: res.error || `Endpoint returned ${res.status}.` }, { status: res.ok ? 200 : 400 });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
