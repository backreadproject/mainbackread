// Server-only. Every mutating admin action routes through here so the allowlist
// re-check, the typed confirmation, and the audit write can never be skipped.
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser, writeAudit } from "@/lib/admin";

export type ActionResult = { ok: boolean; error?: string; status?: number; link?: string };

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

/* ---------------- users ---------------- */

export async function setUserSuspendedAction(targetUserId: string, suspended: boolean): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  if (targetUserId === me.id) return fail("You cannot suspend your own admin account.");

  const admin = createAdminClient();
  const { data: target } = await admin.auth.admin.getUserById(targetUserId);
  if (!target?.user) return fail("User not found.", 404);

  const { error } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: suspended ? "876000h" : "none" });
  if (error) return fail(error.message, 500);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: suspended ? "suspend_user" : "unsuspend_user",
    targetUserId, detail: { email: target.user.email } });
  return { ok: true };
}

export async function resetPasswordLinkAction(targetUserId: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const admin = createAdminClient();
  const { data: target } = await admin.auth.admin.getUserById(targetUserId);
  const email = target?.user?.email;
  if (!email) return fail("That account has no email.", 400);

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error) return fail(error.message, 500);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "generate_password_reset", targetUserId, detail: { email } });
  return { ok: true, link: data?.properties?.action_link ?? "" };
}

export async function deleteUserAction(targetUserId: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  if (targetUserId === me.id) return fail("You cannot delete your own admin account.");

  const admin = createAdminClient();
  const { data: target } = await admin.auth.admin.getUserById(targetUserId);
  const email = target?.user?.email ?? "";
  if (!target?.user) return fail("User not found.", 404);
  if ((confirmText ?? "").trim().toLowerCase() !== email.trim().toLowerCase()) {
    return fail("The email you typed does not match.");
  }

  // Storage does NOT cascade, so remove the files before the rows go.
  const { data: docs } = await admin.from("documents").select("id, storage_path").eq("owner_id", targetUserId);
  const documents = docs ?? [];
  const paths = documents.map((d) => d.storage_path).filter(Boolean) as string[];
  if (paths.length) { try { await admin.storage.from("documents").remove(paths); } catch { /* ignore */ } }

  // Everything else cascades from auth.users.
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return fail(error.message, 500);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "delete_user", targetUserId,
    detail: { email, documentsRemoved: documents.length, filesRemoved: paths.length } });
  return { ok: true };
}

