import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApi, apiError } from "@/lib/api-auth";
import { ok, bad, page } from "@/lib/api-json";
import { getPlan } from "@/lib/plans";
import { checkRecipientLimit } from "@/lib/plan-context";
import { readerLink } from "@/lib/reader-origin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApi(req, "read");
  if (!auth.ok) return apiError(auth);
  const url = new URL(req.url);
  const { limit, offset } = page(url);
  const admin = createAdminClient();

  const { data: docs } = await admin.from("documents").select("id").eq("organization_id", auth.orgId);
  const ids = (docs ?? []).map((d) => d.id);
  if (ids.length === 0) return ok({ data: [], total: 0, limit, offset });

  let q = admin.from("recipients")
    .select("id, document_id, label, first_name, last_name, email, delivery, created_at", { count: "exact" })
    .in("document_id", ids)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const docFilter = url.searchParams.get("document_id");
  if (docFilter) q = q.eq("document_id", docFilter);

  const { data, count } = await q;
  return ok({ data: data ?? [], total: count ?? 0, limit, offset });
}

export async function POST(req: Request) {
  const auth = await authenticateApi(req, "write");
  if (!auth.ok) return apiError(auth);
  const body = await req.json().catch(() => ({}));

  const documentId = typeof body.document_id === "string" ? body.document_id : "";
  if (!documentId) return bad("document_id is required.");

  const admin = createAdminClient();
  const { data: doc } = await admin.from("documents").select("id, organization_id").eq("id", documentId).single();
  if (!doc || doc.organization_id !== auth.orgId) return bad("Document not found.", 404);

  const { data: org } = await admin.from("organizations").select("plan").eq("id", auth.orgId).single();
  const plan = getPlan((org as { plan?: string } | null)?.plan);
  const gate = await checkRecipientLimit(admin, plan, documentId);
  if (!gate.allowed) {
    return bad(`The ${plan.name} plan allows ${gate.limit} recipient(s) per document.`, 402);
  }

  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;
  const first = typeof body.first_name === "string" ? body.first_name.trim() : null;
  const last = typeof body.last_name === "string" ? body.last_name.trim() : null;
  const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim() : null;
  if (!label && !first && !email) return bad("Provide at least a label, first_name or email.");

  const shareToken = crypto.randomBytes(16).toString("hex");
  const { data, error } = await admin.from("recipients")
    .insert({
      document_id: documentId, share_token: shareToken,
      label: label ?? ([first, last].filter(Boolean).join(" ").trim() || null),
      first_name: first, last_name: last, email, delivery: "link",
    })
    .select("id, document_id, label, first_name, last_name, email, created_at").single();
  if (error) return bad(error.message, 500);

  return ok({ ...data, share_url: readerLink(shareToken) }, 201);
}


