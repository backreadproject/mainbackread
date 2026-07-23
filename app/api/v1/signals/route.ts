import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, page } from "@/lib/api-json";

export const runtime = "nodejs";

// Read-only by design: signals are recorded by the reader, never posted in.
export async function GET(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const url = new URL(req.url);
  const { limit, offset } = page(url);
  const admin = createAdminClient();

  const { data: docs } = await admin.from("documents").select("id, title").eq("organization_id", auth.orgId);
  const docIds = (docs ?? []).map((d) => d.id);
  if (docIds.length === 0) return ok({ data: [], total: 0, limit, offset });
  const titleById = new Map((docs ?? []).map((d) => [d.id, d.title as string]));

  const { data: recs } = await admin.from("recipients").select("id, label, document_id").in("document_id", docIds);
  const recIds = (recs ?? []).map((r) => r.id);
  if (recIds.length === 0) return ok({ data: [], total: 0, limit, offset });
  const recById = new Map((recs ?? []).map((r) => [r.id, r]));

  let q = admin.from("signals")
    .select("id, recipient_id, kind, page, value, created_at", { count: "exact" })
    .in("recipient_id", recIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const kind = url.searchParams.get("kind");
  if (kind) q = q.eq("kind", kind);
  const since = url.searchParams.get("since");
  if (since) q = q.gt("created_at", since);

  const { data, count } = await q;
  const enriched = (data ?? []).map((s) => {
    const r = recById.get(s.recipient_id) as { label: string | null; document_id: string } | undefined;
    return {
      ...s,
      reader: r?.label ?? "Unnamed reader",
      document_id: r?.document_id ?? null,
      document_title: r ? titleById.get(r.document_id) ?? null : null,
    };
  });
  return ok({ data: enriched, total: count ?? 0, limit, offset });
}
