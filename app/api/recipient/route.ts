import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { isRoleId } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * Edit a reader's identity: the company they are at, and what they do.
 *
 * Both feed the buyer profile. Company is the strongest of the three grouping
 * edges in lib/accounts.ts, because a human asserted it rather than a string
 * being pattern-matched; roles are what personas are matched against.
 *
 * Authorization follows /api/outcome exactly: read the recipient with the
 * ADMIN client to learn its document, read that document with the SESSION
 * client so RLS decides entitlement, then write with admin. The recipients
 * table has SELECT and INSERT policies only, so an update through the session
 * client silently matches zero rows.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  if (!recipientId) return NextResponse.json({ error: "Which reader?" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

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

  // Unknown ids are dropped rather than rejected: the library grows, and a
  // stale client must not be told its edit is invalid.
  const roles = Array.isArray(body.roles)
    ? Array.from(new Set(body.roles.filter((r: unknown): r is string => typeof r === "string" && isRoleId(r)))).slice(0, 6)
    : [];
  const roleOther = typeof body.roleOther === "string" && body.roleOther.trim()
    ? body.roleOther.trim().slice(0, 80)
    : null;
  const company = typeof body.company === "string" && body.company.trim()
    ? body.company.trim().slice(0, 120)
    : null;

  const { error } = await admin
    .from("recipients")
    .update({ roles, role_other: roleOther, company })
    .eq("id", recipientId);

  if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  return NextResponse.json({ ok: true, roles, roleOther, company });
}