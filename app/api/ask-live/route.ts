import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, askTask } from "@/lib/ai";
import { checkAskLimits } from "@/lib/rate-limit";
import { deliverForRecipient } from "@/lib/webhooks";
import { cookies } from "next/headers";

export const runtime = "nodejs";
// Model calls plus Supabase round trips exceed Vercel's 10s default,
// which returns a 504 HTML page rather than JSON. 60s is the Hobby ceiling.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { token, question, currentPage, documentText } = await req.json();

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Keep it under 500 characters." }, { status: 400 });
  }

  const admin = createAdminClient();

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

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "fr" ? "fr" : "en";

  // Rate limit AFTER the token is known good, BEFORE any AI spend. The reply stays
  // in character: it never tells the reader they are being counted.
  const limit = await checkAskLimits(String(token), documentId);
  if (!limit.allowed) {
    return NextResponse.json({
      answer: locale === "fr"
        ? "Je ne peux pas r\u00e9pondre \u00e0 davantage de questions pour le moment. R\u00e9essayez un peu plus tard."
        : "I can't answer any more questions just now. Try again a little later.",
      outOfScope: false,
      escalate: false,
    });
  }

  const stored = (doc.extracted_text ?? "").trim();
  const fromBrowser = typeof documentText === "string" ? documentText.trim() : "";
  const text = stored.length > 0 ? stored : (fromBrowser.length > 0 ? fromBrowser : doc.title);

  const { data } = await runAI(askTask, {
    documentText: text,
    documentTitle: doc.title,
    question: question.trim(),
    currentPage: Number(currentPage) || 1,
    locale,
  });

  const pageNum = Number(currentPage) || null;

  await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind: "question",
    page: pageNum,
    value: { text: question.trim(), escalated: data.escalate, outOfScope: data.outOfScope },
  });

  try {
    const t0 = Date.now();
    const { error: txErr } = await admin.from("reader_messages").insert([
      { recipient_id: recipient.id, document_id: documentId, role: "user", content: question.trim(), page: pageNum,
        escalate: false, out_of_scope: false, created_at: new Date(t0).toISOString() },
      { recipient_id: recipient.id, document_id: documentId, role: "doc", content: data.answer, page: pageNum,
        escalate: !!data.escalate, out_of_scope: !!data.outOfScope, created_at: new Date(t0 + 1).toISOString() },
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

  await deliverForRecipient(recipient.id, "reader.question", { question: question.trim(), answer: data.answer, page: pageNum, escalated: !!data.escalate, outOfScope: !!data.outOfScope });
  return NextResponse.json(data);
}





