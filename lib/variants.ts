import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export type ReaderSource = {
  documentId: string;
  title: string;
  storagePath: string | null;
  extractedText: string | null;
  variantId: string | null;
  variantLabel: string | null;
};

/** Resolves what a given reader should actually see. A recipient may be pinned to a
 *  variant; a variant may carry its own file, or share the base document's file
 *  (storage_path null = shared base). Falls back to the document for everyone else,
 *  which is why existing recipients keep working untouched. */
export async function sourceForRecipient(admin: Admin, recipientId: string): Promise<ReaderSource | null> {
  const { data: rec } = await admin
    .from("recipients")
    .select("id, variant_id, document_id, documents ( id, title, storage_path, extracted_text )")
    .eq("id", recipientId)
    .single();
  const doc = rec?.documents as unknown as { id: string; title: string; storage_path: string | null; extracted_text: string | null } | undefined;
  if (!rec || !doc) return null;

  const base: ReaderSource = {
    documentId: doc.id,
    title: doc.title,
    storagePath: doc.storage_path,
    extractedText: doc.extracted_text,
    variantId: null,
    variantLabel: null,
  };

  const variantId = (rec as { variant_id?: string | null }).variant_id ?? null;
  if (!variantId) return base;

  const { data: variant } = await admin
    .from("document_variants")
    .select("id, label, storage_path, extracted_text")
    .eq("id", variantId)
    .single();
  if (!variant) return base;

  const v = variant as { id: string; label: string; storage_path: string | null; extracted_text: string | null };
  return {
    documentId: doc.id,
    title: doc.title,
    storagePath: v.storage_path ?? doc.storage_path,
    extractedText: (v.storage_path ? v.extracted_text : null) ?? doc.extracted_text,
    variantId: v.id,
    variantLabel: v.label,
  };
}

/** Auto-balance: returns the active variant with the fewest recipients so far.
 *  Null when the document has no variants, which keeps the default flow untouched. */
export async function pickVariantForDocument(admin: Admin, documentId: string): Promise<string | null> {
  const { data: variants } = await admin
    .from("document_variants")
    .select("id, label")
    .eq("document_id", documentId)
    .eq("active", true)
    .order("label", { ascending: true });
  const list = variants ?? [];
  if (list.length === 0) return null;

  const { data: recs } = await admin
    .from("recipients")
    .select("variant_id")
    .eq("document_id", documentId)
    .not("variant_id", "is", null);

  const counts = new Map<string, number>(list.map((v) => [v.id as string, 0]));
  for (const r of recs ?? []) {
    const id = (r as { variant_id: string | null }).variant_id;
    if (id && counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  let bestId = list[0].id as string;
  let bestCount = counts.get(bestId) ?? 0;
  for (const v of list) {
    const c = counts.get(v.id as string) ?? 0;
    if (c < bestCount) { bestId = v.id as string; bestCount = c; }
  }
  return bestId;
}

/** Next free label for a new variant: A, B, C, D... */
export function nextVariantLabel(existing: string[]): string {
  const used = new Set(existing.map((s) => s.trim().toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const l = String.fromCharCode(65 + i);
    if (!used.has(l)) return l;
  }
  return "Z";
}
