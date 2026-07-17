import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwnerOfOpen } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { token, kind, page, value } = await req.json();
  if (!token || !kind) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, label, document_id, documents ( title, owner_id )")
    .eq("share_token", token)
    .single();

  if (!recipient) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  await admin.from("signals").insert({ recipient_id: recipient.id, kind, page: page ?? null, value: value ?? null });

  // Fire an email alert the first time a reader opens (best-effort, non-blocking).
  if (kind === "opened") {
    const doc = recipient.documents as unknown as { title: string; owner_id: string } | undefined;
    if (doc) {
      const { data: owner } = await admin.auth.admin.getUserById(doc.owner_id);
      const email = owner?.user?.email;
      if (email) {
        // don't await — never block the reader's experience on an email
        notifyOwnerOfOpen({ ownerEmail: email, readerLabel: recipient.label || "A reader", docTitle: doc.title });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
