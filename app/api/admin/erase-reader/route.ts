import { NextRequest, NextResponse } from "next/server";
import { eraseReaderAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { recipientId, confirmText } = await req.json();
  const res = await eraseReaderAction(recipientId, confirmText ?? "");
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
