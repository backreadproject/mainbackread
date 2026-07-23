import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, bad } from "@/lib/api-json";

export const runtime = "nodejs";

async function owned(orgId: string, id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("recipients")
    .select("id, document_id, label, first_name, last_name, email, delivery, created_at, documents ( organization_id )")
    .eq("id", id).single();
  const doc = data?.documents as unknown as { organization_id: string | null } | undefined;
  if (!data || !doc || doc.organization_id !== orgId) return null;
  return data;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  const rec = await owned(auth.orgId, id);
  if (!rec) return bad("Recipient not found.", 404);

  const admin = createAdminClient();
  const { data: sigs } = await admin.from("signals").select("kind, page, value, created_at").eq("recipient_id", id).order("created_at", { ascending: false }).limit(200);
  const rows = sigs ?? [];
  const summary = {
    opens: rows.filter((s) => s.kind === "opened").length,
    questions: rows.filter((s) => s.kind === "question").length,
    forwards: rows.filter((s) => s.kind === "forwarded").length,
  };
  return ok({ ...rec, documents: undefined, summary, signals: rows });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  if (!(await owned(auth.orgId, id))) return bad("Recipient not found.", 404);

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const f of ["label", "first_name", "last_name", "email"]) {
    if (typeof body[f] === "string") patch[f] = body[f].trim() || null;
  }
  if (Object.keys(patch).length === 0) return bad("Nothing to update.");

  const admin = createAdminClient();
  const { error } = await admin.from("recipients").update(patch).eq("id", id);
  if (error) return bad(error.message, 500);
  return ok({ ok: true, id });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const { id } = await ctx.params;
  if (!(await owned(auth.orgId, id))) return bad("Recipient not found.", 404);

  const admin = createAdminClient();
  const { error } = await admin.from("recipients").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return ok({ ok: true, deleted: id });
}
