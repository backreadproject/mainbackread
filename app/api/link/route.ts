import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";

export const runtime = "nodejs";

// Ending a link, either on a schedule or now.
//
// Neither erases anything. The opens, questions, dwell and verdict are the
// customer's record of what happened and survive both -- only access dies.
// That distinction matters: a sender who revokes a link because a deal went
// elsewhere still needs the history that told them so.
const DAYS = new Set([1, 7, 14, 30, 90]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  if (!recipientId) return NextResponse.json({ error: "Which link?" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // Authorised by RLS, as outcome marking is: read the recipient's document
  // through the SESSION client, and if they can see it they may govern its
  // links. Reuses the grants and org-role model rather than inventing another.
  const { data: rec } = await admin
    .from("recipients")
    .select("id, document_id")
    .eq("id", recipientId)
    .maybeSingle();
  if (!rec) return NextResponse.json({ error: "No such link." }, { status: 404 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", rec.document_id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such link." }, { status: 404 });

  const action = String(body.action ?? "");

  if (action === "revoke" || action === "restore") {
    const { error } = await admin
      .from("recipients")
      .update({ revoked_at: action === "revoke" ? new Date().toISOString() : null })
      .eq("id", recipientId);
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
    return NextResponse.json({ ok: true, revoked: action === "revoke" });
  }

  if (action === "expiry") {
    // null clears it: a link with no end is the default and must stay
    // reachable, or someone who sets thirty days by mistake cannot undo it.
    if (body.days === null) {
      const { error } = await admin.from("recipients").update({ expires_at: null }).eq("id", recipientId);
      if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
      return NextResponse.json({ ok: true, expiresAt: null });
    }
    const days = Number(body.days);
    if (!DAYS.has(days)) return NextResponse.json({ error: "Not a valid period." }, { status: 400 });
    const at = new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await admin.from("recipients").update({ expires_at: at }).eq("id", recipientId);
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
    return NextResponse.json({ ok: true, expiresAt: at });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}