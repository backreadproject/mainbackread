import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, askTask } from "@/lib/ai";

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

  const { data: recipient } = await admin
    .from("recipients")
    .select("id, documents ( title )")
    .eq("share_token", token)
    .single();

  const doc = recipient?.documents as unknown as { title: string } | undefined;
  if (!recipient || !doc) {
    return NextResponse.json({ error: "This link has expired." }, { status: 404 });
  }

  // Use the real extracted text if provided; fall back to title.
  const text = typeof documentText === "string" && documentText.trim().length > 0
    ? documentText
    : doc.title;

  const { data } = await runAI(askTask, {
    documentText: text,
    documentTitle: doc.title,
    question: question.trim(),
    currentPage: Number(currentPage) || 1,
  });

  await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind: "question",
    page: Number(currentPage) || null,
    value: { text: question.trim(), escalated: data.escalate, outOfScope: data.outOfScope },
  });

  return NextResponse.json(data);
}
