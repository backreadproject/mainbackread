import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText } from "@/lib/extract";

export const runtime = "nodejs";
// OCR + PDF parsing can take a while on a big file. Give it room.
export const maxDuration = 60;

/**
 * Extract a document's text and store it on documents.extracted_text.
 * Called right after upload. Auth: the caller must own/see the document
 * (RLS-checked via the session client), then we do the heavy work with admin.
 */
export async function POST(req: NextRequest) {
  const { documentId, variantId } = await req.json();
  if (!documentId) return NextResponse.json({ error: "Missing document." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // RLS-scoped read: if this returns a row, the caller legitimately has access.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, storage_path")
    .eq("id", documentId)
    .single();
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Hard gate: the reader renders PDFs and images only. Reject Office documents here
  // as well as in the UI, since the client check is advisory and can be bypassed.
  if (/\.(docx?|pptx?)$/i.test(doc.storage_path as string)) {
    return NextResponse.json({ error: "Word and PowerPoint files are not supported. Export as PDF and upload again." }, { status: 415 });
  }

  const admin = createAdminClient();

  // A/B: when a variantId is given, extract THAT file and store the text on the
  // variant row. A variant with no file of its own shares the base document text.
  let targetPath = doc.storage_path as string;
  if (typeof variantId === "string" && variantId.trim()) {
    const { data: v } = await admin.from("document_variants").select("id, document_id, storage_path").eq("id", variantId.trim()).single();
    if (!v || v.document_id !== documentId) return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    if (!v.storage_path) return NextResponse.json({ ok: true, method: "shared-base", chars: 0, needsPageOcr: false });
    targetPath = v.storage_path as string;
  }

  // Download the raw file from storage.
  const { data: blob, error: dlErr } = await admin.storage.from("documents").download(targetPath);
  if (dlErr || !blob) {
    return NextResponse.json({ error: `Could not read the file: ${dlErr?.message ?? "unknown"}` }, { status: 500 });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mime = blob.type || "";
  const name = targetPath.split("/").pop() || doc.title || "";

  let result;
  try {
    result = await extractText(bytes, mime, name);
  } catch (err) {
    // Extraction failing must not corrupt the document. Leave text empty; the
    // reader falls back to browser extraction. Log for visibility.
    console.error("[extract] failed", documentId, err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "Extraction failed.", needsPageOcr: false });
  }

  // Store whatever we got. Empty text is valid (scanned PDF awaiting Phase 2).
  const targetTable = (typeof variantId === "string" && variantId.trim()) ? "document_variants" : "documents";
  const targetId = (typeof variantId === "string" && variantId.trim()) ? variantId.trim() : documentId;
  await admin
    .from(targetTable)
    .update({ extracted_text: result.text || null, extract_method: result.method, needs_page_ocr: result.needsPageOcr, ...(result.pages != null ? { page_count: result.pages } : {}) })
    .eq("id", targetId);

  return NextResponse.json({
    ok: true,
    method: result.method,
    chars: result.chars,
    needsPageOcr: result.needsPageOcr,
  });
}



