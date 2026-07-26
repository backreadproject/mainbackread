import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, bad } from "@/lib/api-json";

export const runtime = "nodejs";

async function owned(orgId: string, id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("documents")
    .select("id, title, created_at, archived_at, project_id, page_count, storage_path, organization_id")
    .eq("id", id).single();
  if (!data || data.organization_id !== orgId) return null;
  return data;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  const doc = await owned(auth.orgId, id);
  if (!doc) return bad("Document not found.", 404);

  const admin = createAdminClient();
  const { data: recs } = await admin.from("recipients").select("id, label, email, created_at").eq("document_id", id);
  return ok({ ...doc, storage_path: undefined, recipients: recs ?? [] });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  const doc = await owned(auth.orgId, id);
  if (!doc) return bad("Document not found.", 404);

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if ("project_id" in body) patch.project_id = body.project_id ?? null;
  if (typeof body.archived === "boolean") patch.archived_at = body.archived ? new Date().toISOString() : null;
  if (Object.keys(patch).length === 0) return bad("Nothing to update.");

  const admin = createAdminClient();
  const { error } = await admin.from("documents").update(patch).eq("id", id);
  if (error) return bad(error.message, 500);
  return ok({ ok: true, id });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  const doc = await owned(auth.orgId, id);
  if (!doc) return bad("Document not found.", 404);

  const admin = createAdminClient();
  if (doc.storage_path) { try { await admin.storage.from("documents").remove([doc.storage_path as string]); } catch { /* ignore */ } }
  const { error } = await admin.from("documents").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return ok({ ok: true, deleted: id });
}
