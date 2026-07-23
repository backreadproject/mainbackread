import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, page } from "@/lib/api-json";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);

  const url = new URL(req.url);
  const { limit, offset } = page(url);
  const admin = createAdminClient();

  let q = admin.from("documents")
    .select("id, title, created_at, archived_at, project_id, page_count", { count: "exact" })
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const project = url.searchParams.get("project_id");
  if (project) q = q.eq("project_id", project);
  if (url.searchParams.get("archived") === "false") q = q.is("archived_at", null);

  const { data, count } = await q;
  return ok({ data: data ?? [], total: count ?? 0, limit, offset });
}
