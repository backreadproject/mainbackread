import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { newApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", status: 401 as const };
  const ctx = await getOrgContext();
  if (!ctx.org) return { error: "The API is an organization feature.", status: 403 as const };
  if (!(ctx.role === "owner" || ctx.role === "admin")) return { error: "Only an owner or admin can manage API keys.", status: 403 as const };
  const admin = createAdminClient();
  const plan = await resolvePlanForUser(admin, user.id);
  // The layout walls a browser; it does not stop a direct call.
  if (isLocked(plan)) {
    const msg = plan.everPaid
      ? "Your subscription has ended. Restart it to continue."
      : "Your free trial has ended. Choose a plan to continue.";
    return { error: msg, status: 402 as const };
  }
  if (!hasFeature(plan.plan.id, "zapier")) return { error: `The API is not included in the ${plan.plan.name} plan.`, status: 402 as const };
  return { user, orgId: ctx.org.id, admin };
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const { action, keyId, name, scopes } = await req.json();

  if (action === "create") {
    const k = newApiKey();
    const chosen = Array.isArray(scopes) && scopes.includes("write") ? ["read", "write"] : ["read"];
    const { data, error } = await g.admin.from("api_keys").insert({
      organization_id: g.orgId, name: (typeof name === "string" && name.trim()) || "API key",
      key_prefix: k.prefix, key_hash: k.hash, scopes: chosen, created_by: g.user.id,
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id, key: k.raw });
  }

  const { data: key } = await g.admin.from("api_keys").select("id, organization_id").eq("id", keyId).single();
  if (!key || key.organization_id !== g.orgId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (action === "revoke") {
    const { error } = await g.admin.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    const { error } = await g.admin.from("api_keys").delete().eq("id", keyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
