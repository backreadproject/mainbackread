import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { nextVariantLabel } from "@/lib/variants";

export const runtime = "nodejs";

async function guard(documentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", status: 401 as const };

  // RLS-scoped: a row here means the caller legitimately has this document.
  const { data: doc } = await supabase.from("documents").select("id, title, storage_path").eq("id", documentId).single();
  if (!doc) return { error: "Document not found.", status: 404 as const };

  const admin = createAdminClient();
  const plan = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(plan.plan.id, "abVersions")) {
    return { error: `A/B document versions are not included in the ${plan.plan.name} plan.`, status: 402 as const };
  }
  return { user, doc, admin };
}

export async function POST(req: NextRequest) {
  const { documentId, action, variantId, storagePath, note, label, active } = await req.json();
  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });

  const g = await guard(documentId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  if (action === "create") {
    const { data: existing } = await g.admin.from("document_variants").select("label").eq("document_id", documentId);
    const labels = (existing ?? []).map((v) => String(v.label));
    if (labels.length >= 8) return NextResponse.json({ error: "That is enough variants for one document." }, { status: 400 });

    const chosen = (typeof label === "string" && label.trim()) ? label.trim().toUpperCase().slice(0, 2) : nextVariantLabel(labels);
    if (labels.map((l) => l.toUpperCase()).includes(chosen)) {
      return NextResponse.json({ error: `Variant ${chosen} already exists.` }, { status: 400 });
    }

    const { data, error } = await g.admin.from("document_variants").insert({
      document_id: documentId,
      label: chosen,
      note: typeof note === "string" ? note.trim().slice(0, 500) || null : null,
      storage_path: typeof storagePath === "string" && storagePath.trim() ? storagePath.trim() : null,
    }).select("id, label, note, storage_path, active, created_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, variant: data });
  }

  // Everything below needs a variant that belongs to this document.
  const { data: v } = await g.admin.from("document_variants").select("id, document_id, storage_path, label").eq("id", variantId).single();
  if (!v || v.document_id !== documentId) return NextResponse.json({ error: "Variant not found." }, { status: 404 });

  if (action === "update") {
    const patch: Record<string, unknown> = {};
    if (typeof note === "string") patch.note = note.trim().slice(0, 500) || null;
    if (typeof active === "boolean") patch.active = active;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    const { error } = await g.admin.from("document_variants").update(patch).eq("id", variantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    // recipients.variant_id is ON DELETE SET NULL, so readers fall back to the
    // base document and keep every signal they have already produced.
    if (v.storage_path) {
      try { await g.admin.storage.from("documents").remove([v.storage_path as string]); } catch { /* ignore */ }
    }
    const { error } = await g.admin.from("document_variants").delete().eq("id", variantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
