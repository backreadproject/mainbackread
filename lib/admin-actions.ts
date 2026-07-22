// Server-only. Every mutating admin action routes through here so the allowlist
// re-check, the typed confirmation, and the audit write can never be skipped.
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser, writeAudit } from "@/lib/admin";

export type ActionResult = { ok: boolean; error?: string; status?: number };

function fail(error: string, status = 400): ActionResult {
  return { ok: false, error, status };
}

export async function deleteDocumentAction(documentId: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  if (!documentId) return fail("Missing document.");

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, title, owner_id, storage_path")
    .eq("id", documentId)
    .single();
  if (!doc) return fail("Document not found.", 404);

  const d = doc as { id: string; title: string; owner_id: string; storage_path: string | null };
  if ((confirmText ?? "").trim() !== (d.title ?? "").trim()) {
    return fail("The title you typed does not match.");
  }

  // Count what will go with it, for the audit record.
  const { count: recCount } = await admin
    .from("recipients").select("id", { count: "exact", head: true }).eq("document_id", d.id);

  // Storage file is best effort; the row delete is what matters.
  if (d.storage_path) {
    try { await admin.storage.from("documents").remove([d.storage_path]); } catch { /* ignore */ }
  }

  // recipients, signals and reader_messages cascade from this row.
  const { error } = await admin.from("documents").delete().eq("id", d.id);
  if (error) return fail(error.message, 500);

  await writeAudit({
    actorId: me.id, actorEmail: me.email, action: "delete_document",
    targetUserId: d.owner_id,
    detail: { documentId: d.id, title: d.title, recipientsRemoved: recCount ?? 0 },
  });
  return { ok: true };
}

export async function setDocumentArchivedAction(documentId: string, archived: boolean): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const admin = createAdminClient();
  const { data: doc } = await admin.from("documents").select("id, title, owner_id").eq("id", documentId).single();
  if (!doc) return fail("Document not found.", 404);
  const d = doc as { id: string; title: string; owner_id: string };

  const { error } = await admin
    .from("documents")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", d.id);
  if (error) return fail(error.message, 500);

  await writeAudit({
    actorId: me.id, actorEmail: me.email,
    action: archived ? "archive_document" : "unarchive_document",
    targetUserId: d.owner_id, detail: { documentId: d.id, title: d.title },
  });
  return { ok: true };
}
