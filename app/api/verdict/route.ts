import { NextRequest, NextResponse } from "next/server";
import { runAI, verdictTask } from "@/lib/ai";

export const runtime = "nodejs";

/**
 * POST /api/verdict
 * Sender-only. This reads behavioural data about a named third party, so it
 * must sit behind auth and an ownership check — never behind a share token.
 */
export async function POST(req: NextRequest) {
  const { documentId, recipientId } = await req.json();

  // TODO(auth): const user = await requireUser(req);
  // TODO(authz): assert this user owns documentId. Without this you have an
  // IDOR that leaks one customer's reader behaviour to another. Do it before launch.

  const signals = await loadSignals(documentId, recipientId);
  if (!signals) return NextResponse.json({ error: "No reads yet." }, { status: 404 });

  try {
    const { data, cost } = await runAI(verdictTask, signals, { documentId });
    return NextResponse.json({ verdict: data, costUsd: cost.usd });
  } catch (err) {
    console.error("[verdict]", err);
    return NextResponse.json({ error: "Couldn't generate a verdict. Try again." }, { status: 502 });
  }
}

async function loadSignals(_documentId: string, _recipientId: string) {
  // TODO(persistence): read from the signals table.
  return {
    documentText: "[stub]",
    documentTitle: "Meridian — Series A",
    readerName: "Sarah Lindqvist",
    readerOrg: "Meridian Capital",
    pages: [{ page: 7, title: "Pricing", seconds: 94, visits: 3 }],
    backtracks: ["returned from page 8 to page 7"],
    questionsAsked: ["Is the annual commit negotiable?"],
    forwardedTo: ["finance@meridian.vc"],
    openCount: 3,
  };
}
