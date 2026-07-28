import { NextRequest, NextResponse } from "next/server";
import { setInviteOnlyAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { inviteOnly } = await req.json();
  const res = await setInviteOnlyAction(!!inviteOnly);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
