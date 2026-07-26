import { NextRequest, NextResponse } from "next/server";
import { removeMemberAction, revokeInviteAction, deleteOrgAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { action, memberId, inviteId, orgId, confirmText } = await req.json();
  let res;
  if (action === "removeMember") res = await removeMemberAction(memberId);
  else if (action === "revokeInvite") res = await revokeInviteAction(inviteId);
  else if (action === "deleteOrg") res = await deleteOrgAction(orgId, confirmText ?? "");
  else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
