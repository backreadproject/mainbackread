import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, askTask } from "@/lib/ai";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { token, question, currentPage, documentText } = await req.json();

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Keep it under 500 characters." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pull the document's stored extracted text alongside its title (and the document id,
  // for the transcript store below).
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, document_id, documents ( title, extracted_text )")
    .eq("share_token", token)
    .single();

  const doc = recipient?.documents as unknown as { title: string; extracted_text: string | null } | undefined;
  if (!recipient || !doc) {
    return NextResponse.json({ error: "This link has expired." }, { status: 404 });
  }
  const documentId = (recipient as unknown as { document_id: string | null }).document_id ?? null;

  // Prefer server-side extracted text. Fall back to what the browser sent
  // (older docs / gap before extraction finished), then to the title.
  const stored = (doc.extracted_text ?? "").trim();
  const fromBrowser = typeof documentText === "string" ? documentText.trim() : "";
  const text = stored.length > 0 ? stored : (fromBrowser.length > 0 ? fromBrowser : doc.title);

  // Reader's language from the locale cookie (set by the app's language switcher).
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "fr" ? "fr" : "en";

  const { data } = await runAI(askTask, {
    documentText: text,
    documentTitle: doc.title,
    question: question.trim(),
    currentPage: Number(currentPage) || 1,
    locale,
  });

  const pageNum = Number(currentPage) || null;

  // Sender-facing intelligence (unchanged): the question shows in the account holder's
  // dashboard as a signal, with the escalate/out-of-scope flags.
  await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind: "question",
    page: pageNum,
    value: { text: question.trim(), escalated: data.escalate, outOfScope: data.outOfScope },
  });

  // Full transcript (question AND answer) for product improvement and reader persistence.
  // reader_messages is service-role only (RLS with no policies), so account holders can
  // never read it. IMPORTANT: the Supabase client returns query failures in `error` rather
  // than throwing, so we must inspect `error` directly (a try/catch alone would miss a
  // missing table, RLS block, or schema mismatch and fail silently).
  try {
    const t0 = Date.now();
    const { error: txErr } = await admin.from("reader_messages").insert([
      {
        recipient_id: recipient.id,
        document_id: documentId,
        role: "user",
        content: question.trim(),
        page: pageNum,
        // Set explicitly: in a multi-row insert Supabase/PostgREST fills a key that is
        // missing from one row with NULL (not the column default), and `escalate` /
        // `out_of_scope` are NOT NULL. Both rows must carry the same keys.
        escalate: false,
        out_of_scope: false,
        created_at: new Date(t0).toISOString(),
      },
      {
        recipient_id: recipient.id,
        document_id: documentId,
        role: "doc",
        content: data.answer,
        page: pageNum,
        escalate: !!data.escalate,
        out_of_scope: !!data.outOfScope,
        created_at: new Date(t0 + 1).toISOString(),
      },
    ]);
    if (txErr) {
      console.error("[ask-live] transcript write failed:", JSON.stringify({
        message: txErr.message,
        details: (txErr as { details?: string }).details ?? null,
        hint: (txErr as { hint?: string }).hint ?? null,
        code: (txErr as { code?: string }).code ?? null,
      }));
    }
  } catch (err) {
    console.error("[ask-live] transcript write threw:", err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json(data);
}
