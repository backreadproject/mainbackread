import { NextRequest, NextResponse } from "next/server";
import { findForwardMentions, eraseForwardMentionsAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, action, confirmText } = await req.json();
  if (action === "find") {
    const mentions = await findForwardMentions(email ?? "");
    return NextResponse.json({ mentions });
  }
  const res = await eraseForwardMentionsAction(email ?? "", confirmText ?? "");
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
