import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { runAI, ocrTask } from "@/lib/ai";

export const runtime = "nodejs";
// Vision calls, one per page, sequential. 60s is the Hobby ceiling and the
// page cap below is set so a document cannot exceed it.
export const maxDuration = 60;

// A cap, because vision OCR is real money per page and an unbounded scan would
// spend it without anyone deciding to. Documents beyond this are read as far as
// the cap and say so, which is better than refusing them outright: the first
// pages of a proposal are usually the ones that matter.
const MAX_PAGES = 12;

// OCR for scanned PDFs.
//
// The pages arrive already rendered, from the BROWSER. That is deliberate:
// turning a PDF page into an image needs a canvas, and pdf.js has no canvas in
// a serverless function -- the same constraint that broke text extraction for
// weeks. The reader already renders every page to a canvas successfully, so
// the browser is where this work belongs, and the server does what only it can
// do: call the model and store the result.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  const pages = Array.isArray(body.pages) ? body.pages : [];
  if (!documentId) return NextResponse.json({ error: "Which document?" }, { status: 400 });
  if (!pages.length) return NextResponse.json({ error: "No pages to read." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // RLS proves ownership: read through the session client.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, needs_page_ocr")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  const capped = pages.slice(0, MAX_PAGES);
  const parts: string[] = [];
  let failed = 0;

  for (let n = 0; n < capped.length; n++) {
    const raw = String(capped[n] ?? "");
    // Accept a data URL or bare base64, and reject anything that is neither
    // rather than sending nonsense to the model.
    const data = raw.startsWith("data:") ? raw.split(",")[1] ?? "" : raw;
    if (data.length < 100) {
      console.error("[ocr-pages] page", n + 1, "arrived with only", data.length, "chars of image data");
      failed++; continue;
    }
    try {
      const { data: out } = await runAI(ocrTask, {
        images: [{ mediaType: "image/jpeg", data }],
        documentTitle: `${doc.title} (page ${n + 1})`,
      }, { documentId });
      const text = (out.text ?? "").trim();
      console.log("[ocr-pages] page", n + 1, "image", data.length, "chars ->", text.length, "chars of text");
      if (text) parts.push(`[Page ${n + 1}]\n${text}`);
    } catch (e) {
      console.error("[ocr-pages] page", n + 1, "failed:", e instanceof Error ? e.message : e);
      // One unreadable page should not lose the rest of the document.
      failed++;
    }
  }

  const text = parts.join("\n\n").trim();
  if (!text) {
    console.error("[ocr-pages] nothing readable from", capped.length, "pages,", failed, "failed");
    return NextResponse.json({ ok: false, error: "Nothing readable was found on these pages.", failed }, { status: 200 });
  }

  const { error } = await admin
    .from("documents")
    .update({
      extracted_text: text,
      extract_method: "page-ocr",
      // Cleared: the document has been read, and leaving the flag set would
      // make the browser offer to read it again on every visit.
      needs_page_ocr: false,
    })
    .eq("id", documentId);
  if (error) return NextResponse.json({ error: "Read the pages but could not store the text." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    chars: text.length,
    pagesRead: parts.length,
    failed,
    truncated: pages.length > MAX_PAGES ? pages.length - MAX_PAGES : 0,
  });
}