import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, verdictTask } from "@/lib/ai";
import { resolvePlanForUser, isLocked, checkVerdictQuota, logUsage } from "@/lib/plan-context";
import { buildVerdictInput, type SignalRow, type RecipientLite } from "@/lib/verdict-signals";

export const runtime = "nodejs";
// Model calls plus Supabase round trips exceed Vercel's 10s default,
// which returns a 504 HTML page rather than JSON. 60s is the Hobby ceiling.
export const maxDuration = 60;

// Sender-only. Reads a recipient's real signals and produces a verdict.
export async function POST(req: NextRequest) {
  const { recipientId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, email, documents ( id, title, owner_id, extracted_text )")
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

  const rows = (signals ?? []) as SignalRow[];

  // Everything below can throw: a missing API key, a model error, a response
  // that fails schema validation, or a document with no extracted text. An
  // unhandled throw here becomes a bare 500 HTML page, which tells the sender
  // nothing and tells us nothing without digging through platform logs.
  try {
    const input = buildVerdictInput(recipient as RecipientLite, doc, rows);
    const { data, cost } = await runAI(verdictTask, input, { documentId: doc.title });
    await logUsage(admin, "verdict", { userId: user.id, orgId: ctx.orgId, documentId: doc.id });
    return NextResponse.json({ verdict: data, costUsd: cost.usd, signalCount: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[verdict-live] failed", { recipientId, documentId: doc.id, hasText: !!doc.extracted_text, error: msg });
    return NextResponse.json({ error: "Could not read this reader: " + msg }, { status: 500 });
  }
}
