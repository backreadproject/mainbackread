import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRoleId } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * Edit a reader's identity: roles, a typed role, and the company they are at.
 *
 * Authorisation reuses the document, exactly as /api/outcome does. If RLS lets
 * this person read the recipient's document, they may edit the reader on it.
 * That inherits grants and org roles rather than inventing a second model.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const b = body as { recipientId?: string; roles?: unknown; roleOther?: unknown; company?: unknown };
  if (!b.recipientId) return NextResponse.json({ error: "Missing recipient." }, { status: 400 });

  // The join is the authorisation: an unreadable document returns no row.
  const { data: rec } = await supabase
    .from("recipients")
    .select("id, document_id, documents ( id )")
    .eq("id", b.recipientId)
    .maybeSingle();
  if (!rec || !rec.documents) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Unknown ids are dropped rather than rejected: the library grows, and a
  // stale client must not be told its edit is invalid.
  const roles = Array.isArray(b.roles)
    ? Array.from(new Set(b.roles.filter((r: unknown): r is string => typeof r === "string" && isRoleId(r)))).slice(0, 6)
    : [];
  const roleOther = typeof b.roleOther === "string" && b.roleOther.trim() ? b.roleOther.trim().slice(0, 80) : null;
  const company = typeof b.company === "string" && b.company.trim() ? b.company.trim().slice(0, 120) : null;

  const { data, error } = await supabase
    .from("recipients")
    .update({ roles, role_other: roleOther, company })
    .eq("id", b.recipientId)
    .select("id, roles, role_other, company")
    .single();

  if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
  return NextResponse.json({ ok: true, recipient: data });
}