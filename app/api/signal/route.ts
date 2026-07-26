import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { deliverForRecipient } from "@/lib/webhooks";
import { clampDwellMs, DWELL_CAP_MS } from "@/lib/dwell";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const { token, kind, page, value } = await req.json();
  if (!token || !kind) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, opened_notified, last_open_notified_at, document_id, documents ( id, title, owner_id )")
    .eq("share_token", token)
    .single();
  if (!recipient) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  // Cap dwell before it lands. The raw figure is kept as rawMs so nothing is
  // destroyed, and capped marks the row so readers know not to trust the value.
  let stored = value ?? null;
  if (kind === "page_dwell" && value && typeof value === "object" && "ms" in value) {
    const raw = Number((value as { ms: unknown }).ms) || 0;
    const ms = clampDwellMs(raw);
    stored = raw > DWELL_CAP_MS
      ? { ...(value as Record<string, unknown>), ms, rawMs: raw, capped: true }
      : { ...(value as Record<string, unknown>), ms };
  }
  await admin.from("signals").insert({ recipient_id: recipient.id, kind, page: page ?? null, value: stored });
  // Notify the owner the FIRST time this reader opens the document (in-app; best-effort).
  const lastNotified = (recipient as unknown as { last_open_notified_at: string | null }).last_open_notified_at;
  const quietFor = lastNotified ? Date.now() - new Date(lastNotified).getTime() : Infinity;
  const RENOTIFY_AFTER = 24 * 60 * 60 * 1000;
  if (kind === "opened" && (!recipient.opened_notified || quietFor > RENOTIFY_AFTER)) {
    const doc = recipient.documents as unknown as { id: string; title: string; owner_id: string } | undefined;
    if (doc) {
      await admin.from("recipients").update({ opened_notified: true, last_open_notified_at: new Date().toISOString() }).eq("id", recipient.id);
      const readerName = recipient.label || `${recipient.first_name ?? ""} ${recipient.last_name ?? ""}`.trim() || "A reader";
      notify({
        userId: doc.owner_id,
        type: "reader_opened",
        title: `${readerName} ${lastNotified ? "opened" : "opened"} ${doc.title}`,
        body: lastNotified ? "They came back to it." : "They have started reading.",
        params: { reader: readerName, doc: doc.title, again: lastNotified ? "1" : "" },
        link: `/documents/${doc.id}`,
        email: null,
      });
    }
  }
  if (kind === "opened") await deliverForRecipient(recipient.id, "reader.opened", { page: page ?? null });
  return NextResponse.json({ ok: true });
}




