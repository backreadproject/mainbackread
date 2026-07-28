import { NextRequest, NextResponse } from "next/server";
import { setUserSuspendedAction, setUserApprovedAction, resetPasswordLinkAction, deleteUserAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { targetUserId, action, suspended, approved, confirmText } = await req.json();
  let res;
  if (action === "suspend") res = await setUserSuspendedAction(targetUserId, !!suspended);
  else if (action === "approve") res = await setUserApprovedAction(targetUserId, !!approved);
  else if (action === "reset") res = await resetPasswordLinkAction(targetUserId);
  else if (action === "delete") res = await deleteUserAction(targetUserId, confirmText ?? "");
  else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true, link: res.link });
}
