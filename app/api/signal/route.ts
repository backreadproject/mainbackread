import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const { token, kind, page, value } = await req.json();
  if (!token || !kind) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, opened_notified, document_id, documents ( id, title, owner_id )")
    .eq("share_token", token)
    .single();
  if (!recipient) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  await admin.from("signals").insert({ recipient_id: recipient.id, kind, page: page ?? null, value: value ?? null });
  // Notify the owner the FIRST time this reader opens the document (in-app; best-effort).
  if (kind === "opened" && !recipient.opened_notified) {
    const doc = recipient.documents as unknown as { id: string; title: string; owner_id: string } | undefined;
    if (doc) {
      await admin.from("recipients").update({ opened_notified: true }).eq("id", recipient.id);
      const readerName = recipient.label || `${recipient.first_name ?? ""} ${recipient.last_name ?? ""}`.trim() || "A reader";
      notify({
        userId: doc.owner_id,
        type: "reader_opened",
        title: `${readerName} opened ${doc.title}`,
        body: "They have started reading. Open ReadProspects to read their read.",
        link: `/documents/${doc.id}`,
        email: null,
      });
    }
  }
  if (kind === "opened") await deliverForRecipient(recipient.id, "reader.opened", { page: page ?? null });
}


