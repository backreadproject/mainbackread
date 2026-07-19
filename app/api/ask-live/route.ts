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

  // Pull the document's stored extracted text alongside its title.
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, documents ( title, extracted_text )")
    .eq("share_token", token)
    .single();

  const doc = recipient?.documents as unknown as { title: string; extracted_text: string | null } | undefined;
  if (!recipient || !doc) {
    return NextResponse.json({ error: "This link has expired." }, { status: 404 });
  }

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

  await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind: "question",
    page: Number(currentPage) || null,
    value: { text: question.trim(), escalated: data.escalate, outOfScope: data.outOfScope },
  });

  return NextResponse.json(data);
}
