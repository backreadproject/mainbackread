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
  const { documentId } = await req.json();
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

  const admin = createAdminClient();

  // Download the raw file from storage.
  const { data: blob, error: dlErr } = await admin.storage.from("documents").download(doc.storage_path);
  if (dlErr || !blob) {
    return NextResponse.json({ error: `Could not read the file: ${dlErr?.message ?? "unknown"}` }, { status: 500 });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mime = blob.type || "";
  const name = doc.storage_path.split("/").pop() || doc.title || "";

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
  await admin
    .from("documents")
    .update({ extracted_text: result.text || null, extract_method: result.method, needs_page_ocr: result.needsPageOcr })
    .eq("id", documentId);

  return NextResponse.json({
    ok: true,
    method: result.method,
    chars: result.chars,
    needsPageOcr: result.needsPageOcr,
  });
}
