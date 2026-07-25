import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
// Marks a reader's reply as dealt with, so it leaves the top of the Intent Field.
//
// A reply always outranks inferred intent, which is correct until the sender has
// acted on it. Without this the field fills with replied readers and stops being
// a work queue. Reversible: marking something handled by mistake must not be
// permanent.
//
// Same auth shape as verdict-live: signed in AND owning the document behind
// this recipient. The RLS-scoped select is what enforces that.
export async function POST(req: NextRequest) {
  let body: { recipientId?: string; handled?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  const handled = body.handled !== false;
  if (!recipientId) return NextResponse.json({ error: "Missing reader." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, documents ( owner_id )")
    .eq("id", recipientId)
    .single();
  const doc = recipient?.documents as unknown as { owner_id: string } | undefined;
  if (!recipient || !doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const admin = createAdminClient();
  if (handled) {
    const { error } = await admin.from("signals").insert({
      recipient_id: recipientId,
      kind: "reply_handled",
      value: { by: user.id, at: new Date().toISOString() },
    });
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  } else {
    const { error } = await admin.from("signals").delete().eq("recipient_id", recipientId).eq("kind", "reply_handled");
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, handled });
}