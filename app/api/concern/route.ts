import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Resolving a concern. Sender side, so a real session and RLS decide it.
//
// Authorised by reading the DOCUMENT through the session client: if RLS lets
// them see it they may resolve concerns on it. That reuses the grants and
// org-role model rather than inventing a second one, exactly as /api/outcome
// does.
//
// signature_objections is service-role only (RLS on, no policies), so the write
// goes through the admin client AFTER ownership is proven above.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
  const reopen = body.reopen === true;
  if (!id) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("signature_objections")
    .select("id, document_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "No such concern." }, { status: 404 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", row.document_id as string)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  const { error } = await admin
    .from("signature_objections")
    .update(
      reopen
        ? { resolved_at: null, resolved_by: null, resolution_note: null }
        : { resolved_at: new Date().toISOString(), resolved_by: user.id, resolution_note: note || null },
    )
    .eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });

  return NextResponse.json({ ok: true, resolved: !reopen });
}