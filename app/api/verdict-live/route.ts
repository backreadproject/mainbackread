import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, verdictTask } from "@/lib/ai";
import { resolvePlanForUser, isLocked, checkVerdictQuota, logUsage } from "@/lib/plan-context";

export const runtime = "nodejs";

// Sender-only. Reads a recipient's real signals and produces a verdict.
export async function POST(req: NextRequest) {
  const { recipientId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, documents ( id, title, owner_id, extracted_text )")
    .eq("id", recipientId)
    .single();

  const doc = recipient?.documents as unknown as { id: string; title: string; owner_id: string; extracted_text: string | null } | undefined;
  if (!recipient || !doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);

  // Soft lock: a company trial that lapsed unpaid can't run new verdicts.
  if (isLocked(ctx)) {
    return NextResponse.json({
      error: "Your free trial has ended. Subscribe to keep reading your readers.",
      trialEnded: true,
    }, { status: 402 });
  }

  // Volume cap: verdict runs per document per month (bites on Free only).
  const gate = await checkVerdictQuota(admin, ctx.plan, doc.id);
  if (!gate.allowed) {
    return NextResponse.json({
      error: `You've used all ${gate.limit} verdicts for this document this month on the ${ctx.plan.name} plan.`,
      limitReached: true, limit: gate.limit, used: gate.used, plan: ctx.plan.id,
    }, { status: 402 });
  }

  const { data: signals } = await admin
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: true });

  const rows = signals ?? [];
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
    page: Number(page), title: `Page ${page}`, seconds: d.seconds, visits: d.visits,
  }));
  const backtracks = pages.filter((p) => p.visits > 1).map((p) => `re-read page ${p.page} (${p.visits} times)`);
  const docText = (doc.extracted_text ?? "").trim() || doc.title;

  const { data, cost } = await runAI(verdictTask, {
    documentText: docText,
    documentTitle: doc.title,
    readerName: recipient.label ?? "Reader",
    readerOrg: "",
    pages, backtracks, questionsAsked: questions, forwardedTo: [], openCount,
  }, { documentId: doc.title });

  await logUsage(admin, "verdict", { userId: user.id, orgId: ctx.orgId, documentId: doc.id });

  return NextResponse.json({ verdict: data, costUsd: cost.usd, signalCount: rows.length });
}
