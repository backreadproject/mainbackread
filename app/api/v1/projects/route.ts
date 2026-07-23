import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, bad, page } from "@/lib/api-json";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const { limit, offset } = page(new URL(req.url));
  const admin = createAdminClient();
  const { data, count } = await admin.from("projects")
    .select("id, name, created_at", { count: "exact" })
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return ok({ data: data ?? [], total: count ?? 0, limit, offset });
}

export async function POST(req: Request) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return bad("A project name is required.");

  const admin = createAdminClient();
  const { data, error } = await admin.from("projects")
    .insert({ organization_id: auth.orgId, name })
    .select("id, name, created_at").single();
  if (error) return bad(error.message, 500);
  return ok(data, 201);
}
