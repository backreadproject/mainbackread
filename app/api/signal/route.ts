import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Receives behavioural signals from the reader page. No login (readers are
// anonymous), so we resolve the share token to a recipient server-side and
// write via the admin client. The token is the only thing the reader proves.
export async function POST(req: NextRequest) {
  const { token, kind, page, value } = await req.json();

  if (!token || !kind) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: recipient } = await admin
    .from("recipients")
    .select("id")
    .eq("share_token", token)
    .single();

  if (!recipient) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  await admin.from("signals").insert({
    recipient_id: recipient.id,
    kind,
    page: page ?? null,
    value: value ?? null,
  });

  return NextResponse.json({ ok: true });
}
