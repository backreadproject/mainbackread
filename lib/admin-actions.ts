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


/* ---------------- organizations ---------------- */

export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const admin = createAdminClient();

  const { data: m } = await admin.from("organization_members").select("id, organization_id, user_id, email, role").eq("id", memberId).single();
  if (!m) return fail("Member not found.", 404);
  const row = m as { id: string; organization_id: string; user_id: string; email: string | null; role: string | null };

  const { error } = await admin.from("organization_members").delete().eq("id", row.id);
  if (error) return fail(error.message, 500);

  // Don't leave the profile pointing at an org it is no longer in.
  await admin.from("profiles").update({ active_org_id: null }).eq("id", row.user_id).eq("active_org_id", row.organization_id);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "remove_org_member",
    targetUserId: row.user_id, targetOrgId: row.organization_id, detail: { email: row.email, role: row.role } });
  return { ok: true };
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const admin = createAdminClient();

  const { data: inv } = await admin.from("invitations").select("id, organization_id, email").eq("id", inviteId).single();
  if (!inv) return fail("Invitation not found.", 404);
  const row = inv as { id: string; organization_id: string; email: string | null };

  const { error } = await admin.from("invitations").delete().eq("id", row.id);
  if (error) return fail(error.message, 500);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "revoke_invitation",
    targetOrgId: row.organization_id, detail: { email: row.email } });
  return { ok: true };
}

export async function deleteOrgAction(orgId: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const admin = createAdminClient();

  const { data: org } = await admin.from("organizations").select("id, name").eq("id", orgId).single();
  if (!org) return fail("Organization not found.", 404);
  const o = org as { id: string; name: string | null };
  if ((confirmText ?? "").trim() !== (o.name ?? "").trim()) return fail("The name you typed does not match.");

  // Storage does not cascade: clear org document files first.
  const { data: docs } = await admin.from("documents").select("id, storage_path").eq("organization_id", o.id);
  const documents = docs ?? [];
  const paths = documents.map((d) => d.storage_path).filter(Boolean) as string[];
  if (paths.length) { try { await admin.storage.from("documents").remove(paths); } catch { /* ignore */ } }

  const { count: memberCount } = await admin.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", o.id);
  const { count: projectCount } = await admin.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", o.id);

  // projects, members, invitations, access_grants and documents cascade from this row.
  const { error } = await admin.from("organizations").delete().eq("id", o.id);
  if (error) return fail(error.message, 500);

  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "delete_organization", targetOrgId: o.id,
    detail: { name: o.name, documentsRemoved: documents.length, membersRemoved: memberCount ?? 0, projectsRemoved: projectCount ?? 0 } });
  return { ok: true };
}
