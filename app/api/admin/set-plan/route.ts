import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser, writeAudit } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const me = await getAdminUser();
  if (!me) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { targetUserId, scope, plan, subscriptionActive } = await req.json();
  if (!targetUserId || !plan) return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const admin = createAdminClient();

  if (scope === "org") {
    const { data: prof } = await admin.from("profiles").select("active_org_id").eq("id", targetUserId).single();
    const orgId = (prof as { active_org_id?: string | null } | null)?.active_org_id;
    if (!orgId) return NextResponse.json({ error: "That account has no organization." }, { status: 400 });
    const { error } = await admin.from("organizations").update({ plan, subscription_active: !!subscriptionActive }).eq("id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ actorId: me.id, actorEmail: me.email, action: "set_org_plan", targetUserId, targetOrgId: orgId, detail: { plan, subscriptionActive: !!subscriptionActive } });
  } else {
    const { error } = await admin.from("profiles").update({ plan }).eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ actorId: me.id, actorEmail: me.email, action: "set_personal_plan", targetUserId, detail: { plan } });
  }

  return NextResponse.json({ ok: true });
}
