import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, verdictTask } from "@/lib/ai";

export const runtime = "nodejs";

// Sender-only. Reads a recipient's real signals and produces a verdict.
export async function POST(req: NextRequest) {
  const { recipientId } = await req.json();

  // Auth: must be logged in AND own the document behind this recipient.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // RLS on `recipients` ensures this only returns a row the sender owns.
  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, documents ( title, owner_id )")
    .eq("id", recipientId)
    .single();

  const doc = recipient?.documents as unknown as { title: string; owner_id: string } | undefined;
  if (!recipient || !doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Pull the raw signals (admin client - signals have no sender-facing RLS read path yet).
  const admin = createAdminClient();
  const { data: signals } = await admin
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: true });

  const rows = signals ?? [];

  // Shape the raw signals into the verdict task's expected input.
  const dwellByPage: Record<number, { seconds: number; visits: number }> = {};
  const questions: string[] = [];
  let openCount = 0;

  for (const s of rows) {
    if (s.kind === "opened") openCount++;
    if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) {
      questions.push(String((s.value as { text: unknown }).text));
    }
    if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) {
      const ms = Number((s.value as { ms: unknown }).ms) || 0;
      const cur = dwellByPage[s.page] ?? { seconds: 0, visits: 0 };
      dwellByPage[s.page] = { seconds: Math.round(ms / 1000), visits: cur.visits + 1 };
    }
  }

  const pages = Object.entries(dwellByPage).map(([page, d]) => ({
    page: Number(page),
    title: `Page ${page}`,
    seconds: d.seconds,
    visits: d.visits,
  }));

  const backtracks = pages.filter((p) => p.visits > 1).map((p) => `re-read page ${p.page} (${p.visits} times)`);

  const { data, cost } = await runAI(verdictTask, {
    documentText: doc.title,
    documentTitle: doc.title,
    readerName: recipient.label ?? "Reader",
    readerOrg: "",
    pages,
    backtracks,
    questionsAsked: questions,
    forwardedTo: [],
    openCount,
  }, { documentId: doc.title });

  return NextResponse.json({ verdict: data, costUsd: cost.usd, signalCount: rows.length });
}
