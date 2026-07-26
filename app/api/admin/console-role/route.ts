import { NextRequest, NextResponse } from "next/server";
import { grantConsoleRoleAction, revokeConsoleRoleAction } from "@/lib/admin-actions";
export const runtime = "nodejs";
// Contract: { action: "grant", email, role, note } | { action: "revoke", userId, confirmText }
// Typed rather than an untyped req.json(), because an admin route whose caller
// and handler can silently disagree is how the archive button once fell through
// to the delete branch.
type Body =
  | { action: "grant"; email?: string; role?: string; note?: string }
  | { action: "revoke"; userId?: string; confirmText?: string };
export async function POST(req: NextRequest) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  if (body.action === "grant") {
    const r = await grantConsoleRoleAction(body.email ?? "", body.role ?? "", body.note ?? "");
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
  }
  if (body.action === "revoke") {
    const r = await revokeConsoleRoleAction(body.userId ?? "", body.confirmText ?? "");
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}