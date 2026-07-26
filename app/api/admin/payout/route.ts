import { NextRequest, NextResponse } from "next/server";
import { payoutAction } from "@/lib/admin-actions";
export const runtime = "nodejs";
// Contract: { withdrawalId, action: "approve" | "paid" | "reject", reason }
type Body = { withdrawalId?: string; action?: "approve" | "paid" | "reject"; reason?: string };
export async function POST(req: NextRequest) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const a = body.action;
  if (a !== "approve" && a !== "paid" && a !== "reject") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const r = await payoutAction(body.withdrawalId ?? "", a, body.reason ?? "");
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
}