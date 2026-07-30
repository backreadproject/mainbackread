import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { getOrgContext } from "@/lib/org-context";
import { notify, notifyEmail } from "@/lib/notify";
import { NextResponse } from "next/server";

// Helper: does the caller have 'manage' on this resource?
async function callerCanManage(resourceType: string, resourceId: string): Promise<boolean> {
  const supabase = await createClient();
  if (resourceType === "document") {
    // my_document_permission returns 'manage'|'edit'|'view'|null
    const { data } = await supabase.rpc("my_document_permission", { doc: resourceId });
    return data === "manage";
  }
  if (resourceType === "project") {
    // my_project_permission returns 'manage'|'edit'|'view'|null
    const { data } = await supabase.rpc("my_project_permission", { proj: resourceId });
    return data === "manage";
  }
  return false;
}

// LIST shares on a resource
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get("resourceType") ?? "";
  const resourceId = searchParams.get("resourceId") ?? "";
  if (!resourceType || !resourceId) return NextResponse.json({ error: "Missing params." }, { status: 400 });

  const supabase = await createClient();
  const { data: grants } = await supabase
    .from("access_grants")
    .select("id, grantee_type, grantee_id, permission, created_at")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: true });

  // Resolve user grantee emails for display.
  const rows = grants ?? [];
  const userIds = rows.filter((g) => g.grantee_type === "user").map((g) => g.grantee_id);
  const emailMap: Record<string, string> = {};
  if (userIds.length) {
    const { data: mem } = await supabase.from("organization_members").select("user_id, email").in("user_id", userIds);
    for (const m of mem ?? []) if (m.email) emailMap[m.user_id] = m.email;
  }

  const shares = rows.map((g) => ({
    id: g.id,
    granteeType: g.grantee_type,
    granteeId: g.grantee_id,
    label: g.grantee_type === "role" ? `All ${g.grantee_id}s` : (emailMap[g.grantee_id] ?? "A member"),
    permission: g.permission,
  }));
  return NextResponse.json({ shares });
}

// CREATE a grant
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const gate = await requirePaidAccess(createAdminClient(), user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const ctx = await getOrgContext();
  if (!ctx.org) return NextResponse.json({ error: "Organization required." }, { status: 403 });

  const { resourceType, resourceId, granteeType, granteeId, permission } = await req.json();
  if (!["document", "project"].includes(resourceType) || !resourceId) return NextResponse.json({ error: "Bad resource." }, { status: 400 });
  if (!["user", "role"].includes(granteeType) || !granteeId) return NextResponse.json({ error: "Bad grantee." }, { status: 400 });
  if (!["view", "edit", "manage"].includes(permission)) return NextResponse.json({ error: "Bad permission." }, { status: 400 });

  if (!(await callerCanManage(resourceType, resourceId))) {
    return NextResponse.json({ error: "You need Manage permission to share this." }, { status: 403 });
  }

  const admin = createAdminClient();
  // Upsert-like: remove any existing grant to the same grantee, then insert (so re-sharing updates permission).
  await admin.from("access_grants").delete()
    .eq("resource_type", resourceType).eq("resource_id", resourceId)
    .eq("grantee_type", granteeType).eq("grantee_id", granteeId);

  const { data: grant, error } = await admin
    .from("access_grants")
    .insert({ organization_id: ctx.org.id, resource_type: resourceType, resource_id: resourceId, grantee_type: granteeType, grantee_id: granteeId, permission, created_by: user.id })
    .select("id, grantee_type, grantee_id, permission")
    .single();
  if (error || !grant) return NextResponse.json({ error: error?.message ?? "Could not share." }, { status: 400 });

  // Notify the grantee (only for direct user grants).
  if (granteeType === "user") {
    const origin = new URL(req.url).origin;
    const link = resourceType === "document" ? `${origin}/documents/${resourceId}` : `${origin}/projects/${resourceId}`;
    const { data: prof } = await admin.from("profiles").select("first_name, last_name").eq("id", user.id).single();
    const sharer = `${(prof?.first_name as string) || ""} ${(prof?.last_name as string) || ""}`.trim() || "A teammate";
    const { data: targetMember } = await admin.from("organization_members").select("email").eq("organization_id", ctx.org.id).eq("user_id", granteeId).maybeSingle();
    await notify({
      userId: granteeId,
      type: "doc_shared",
      title: `${sharer} shared a ${resourceType} with you`,
      body: `You now have ${permission} access.`,
      params: { sharer, resource: resourceType, permission },
      link: resourceType === "document" ? `/documents/${resourceId}` : `/projects/${resourceId}`,
      email: targetMember?.email ? { to: targetMember.email, subject: `${sharer} shared a ${resourceType} with you on ReadProspects`, html: notifyEmail(`${sharer} shared a ${resourceType} with you`, `You now have ${permission} access. Open ReadProspects to view it.`, link, "Open in ReadProspects") } : null,
    });
  }

  return NextResponse.json({ ok: true, grant });
}

// REVOKE a grant
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const gate = await requirePaidAccess(createAdminClient(), user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const { grantId, resourceType, resourceId } = await req.json();
  if (!grantId) return NextResponse.json({ error: "Missing grant id." }, { status: 400 });

  if (!(await callerCanManage(resourceType, resourceId))) {
    return NextResponse.json({ error: "You need Manage permission to change sharing." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("access_grants").delete().eq("id", grantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

