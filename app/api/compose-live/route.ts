import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { runAI, composeTask } from "@/lib/ai";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 60;

// Sender-only. Produces a deliverable (message, summary, talking points) grounded
// in a reader's real signals + the verdict + the document. Same auth model as
// verdict-live: must be signed in AND own the document behind this recipient.
export async function POST(req: NextRequest) {
  const { recipientId, ask, channel, context, verdict } = await req.json();

  if (typeof ask !== "string" || !ask.trim()) {
    return NextResponse.json({ error: "Tell me what to draft." }, { status: 400 });
  }
  if (ask.length > 2000) {
    return NextResponse.json({ error: "That ask is too long." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // The layout walls a browser out; nothing stopped a direct POST with a valid
  // session, so a lapsed account could still work through the API.
  const gate = await requirePaidAccess(createAdminClient(), user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // RLS-scoped: only returns a recipient row the sender owns.
  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, documents ( title, owner_id, extracted_text )")
    .eq("id", recipientId)
    .single();

  const doc = recipient?.documents as unknown as { title: string; owner_id: string; extracted_text: string | null } | undefined;
  if (!recipient || !doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Pull this recipient's signals (admin: signals have no sender-facing RLS read path).
  const admin = createAdminClient();
  const { data: signals } = await admin
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: true });

  const rows = signals ?? [];
  const dwellByPage: Record<number, { seconds: number; visits: number }> = {};
  const questions: string[] = [];
  for (const s of rows) {
    if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) {
      questions.push(String((s.value as { text: unknown }).text));
    }
    if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) {
      const ms = Number((s.value as { ms: unknown }).ms) || 0;
      const cur = dwellByPage[s.page] ?? { seconds: 0, visits: 0 };
      dwellByPage[s.page] = { seconds: Math.round(ms / 1000), visits: cur.visits + 1 };
    }
  }
  const pagesEngaged = Object.entries(dwellByPage)
    .map(([page, d]) => ({ page: Number(page), seconds: d.seconds, visits: d.visits }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 8);

  // Sender's name for voice / signing.
  const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const senderName = `${(prof?.first_name as string) ?? ""} ${(prof?.last_name as string) ?? ""}`.trim();

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "fr" ? "fr" : "en";

  const docText = (doc.extracted_text ?? "").trim() || doc.title;

  const validChannels = ["email", "linkedin", "text", "whatsapp"];
  const cleanChannel = typeof channel === "string" && validChannels.includes(channel) ? channel : "";

  // Wrapped for the same reason as verdict-live: a throw here becomes a bare
  // 500 HTML page, which tells the sender nothing and hides the real cause.
  try {
  const { data, cost } = await runAI(composeTask, {
    documentText: docText,
    documentTitle: doc.title,
    readerName: recipient.label ?? "the reader",
    verdict: verdict && typeof verdict === "object" ? verdict : undefined,
    questionsAsked: questions,
    pagesEngaged,
    ask: ask.trim(),
    channel: cleanChannel as "" | "email" | "linkedin" | "text" | "whatsapp",
    context: typeof context === "string" ? context.slice(0, 4000) : "",
    senderName,
    locale,
  }, { documentId: doc.title });

  return NextResponse.json({ output: data.output, note: data.note, costUsd: cost.usd });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[compose-live] failed", { recipientId, ask: String(ask).slice(0, 80), error: msg });
    return NextResponse.json({ error: "Could not draft this: " + msg }, { status: 500 });
  }
}
