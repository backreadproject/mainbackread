import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, verdictTask } from "@/lib/ai";
import { buildVerdictInput, type SignalRow, type RecipientLite } from "@/lib/verdict-signals";

export const runtime = "nodejs";

/**
 * POST /api/verdict
 * Sender-only. Reads behavioural data about a named third party, so it is behind
 * auth and an ownership check (the document must belong to the signed-in user).
 */
export async function POST(req: NextRequest) {
  const { recipientId } = await req.json();
  if (!recipientId) return NextResponse.json({ error: "Missing recipient." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, email, documents ( id, title, owner_id, extracted_text )")
    .eq("id", recipientId)
    .single();
  const doc = recipient?.documents as unknown as { id: string; title: string; owner_id: string; extracted_text: string | null } | undefined;
  if (!recipient || !doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signals } = await admin
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: true });
  const rows = (signals ?? []) as SignalRow[];
  if (rows.length === 0) return NextResponse.json({ error: "No reads yet." }, { status: 404 });

  const input = buildVerdictInput(recipient as RecipientLite, doc, rows);
  try {
    const { data, cost } = await runAI(verdictTask, input, { documentId: doc.title });
    return NextResponse.json({ verdict: data, costUsd: cost.usd, signalCount: rows.length });
  } catch (err) {
    console.error("[verdict]", err);
    return NextResponse.json({ error: "Couldn't generate a verdict. Try again." }, { status: 502 });
  }
}
