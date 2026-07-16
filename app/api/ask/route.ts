import { NextRequest, NextResponse } from "next/server";
import { runAI, askTask } from "@/lib/ai";

export const runtime = "nodejs";

/**
 * POST /api/ask
 * Called from the reader view. The reader is an untrusted third party — a
 * prospect, an investor, a competitor. They never see the key, they never
 * choose the model, and they never supply the document. Everything but the
 * question comes from the server.
 */
export async function POST(req: NextRequest) {
  const { shareToken, question, currentPage } = await req.json();

  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Keep it under 500 characters." }, { status: 400 });
  }

  // TODO(persistence): resolve the share token to a document + recipient.
  // Until the DB lands, this is the seam. The AI core does not care.
  const doc = await resolveShare(shareToken);
  if (!doc) return NextResponse.json({ error: "This link has expired." }, { status: 404 });

  try {
    const { data, cost } = await runAI(
      askTask,
      {
        documentText: doc.text,
        documentTitle: doc.title,
        question: question.trim(),
        currentPage: Number(currentPage) || 1,
      },
      { documentId: doc.id }
    );

    // TODO(signals): persist the question. This IS the product — a question is
    // stated intent, and it outranks every heatmap you will ever draw.
    await recordSignal({ documentId: doc.id, kind: "question", value: question, page: currentPage });

    return NextResponse.json({ ...data, _costUsd: process.env.NODE_ENV === "development" ? cost.usd : undefined });
  } catch (err) {
    console.error("[ask]", err);
    // The reader is a prospect. Never show them a stack trace.
    return NextResponse.json({ error: "The document couldn't answer that. Try again." }, { status: 502 });
  }
}

async function resolveShare(token: string) {
  if (!token) return null;
  return {
    id: "doc_demo",
    title: "Meridian — Series A",
    text: "[stub] Replace with the stored document text once ingestion lands.",
  };
}

async function recordSignal(_s: Record<string, unknown>) {
  /* stub until the DB lands */
}
