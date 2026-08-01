import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";

export const runtime = "nodejs";

// Recording what actually happened to a deal.
//
// The verdict engine makes a claim -- "warm, they studied pricing, call
// Tuesday" -- and until now never found out whether it was right. This is the
// other half of that loop, and it is what lets the product eventually say
// "readers who asked a question closed 40% of the time" from the customer's
// own history rather than an invented benchmark.
const VALID = ["won", "lost", "no_decision"] as const;
type Outcome = (typeof VALID)[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  if (!recipientId) {
    return NextResponse.json({ error: "Which reader?" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // Authorization by RLS rather than a hand-rolled check: read the recipient's
  // document through the SESSION client, which can only see documents the
  // caller is entitled to. If that returns a row, they may mark it.
  const { data: rec } = await admin
    .from("recipients")
    .select("id, document_id")
    .eq("id", recipientId)
    .maybeSingle();
  if (!rec) return NextResponse.json({ error: "No such reader." }, { status: 404 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", rec.document_id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such reader." }, { status: 404 });

  // "Not now" is not "never". It suppresses the prompt for another cycle,
  // because whether a quiet deal is dead is a question whose answer changes.
  if (body.snooze === true) {
    const { error } = await admin
      .from("recipients")
      .update({ outcome_snoozed_at: new Date().toISOString() })
      .eq("id", recipientId);
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
    return NextResponse.json({ ok: true, snoozed: true });
  }

  // null clears the outcome, which is how "Change" works: the customer can be
  // wrong about a deal, and a record they cannot correct is one they stop
  // trusting.
  const outcome = body.outcome === null ? null : String(body.outcome ?? "");
  if (outcome !== null && !VALID.includes(outcome as Outcome)) {
    return NextResponse.json({ error: "Not a valid outcome." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;
  const { error } = await admin
    .from("recipients")
    .update({
      outcome,
      outcome_at: outcome ? new Date().toISOString() : null,
      outcome_note: outcome ? note : null,
    })
    .eq("id", recipientId);

  if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  return NextResponse.json({ ok: true, outcome });
}