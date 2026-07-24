import { NextRequest, NextResponse } from "next/server";
import { replyToSupportAction, closeSupportAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { conversationId, action, message } = await req.json();
  const res = action === "close"
    ? await closeSupportAction(conversationId)
    : await replyToSupportAction(conversationId, message ?? "");
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
