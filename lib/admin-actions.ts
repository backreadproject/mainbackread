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

/* ---------------- reader erasure (data subject requests) ---------------- */

export async function eraseReaderAction(recipientId: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  if (!recipientId) return fail("Missing reader.");

  const admin = createAdminClient();
  const { data: rec } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, email, document_id, documents ( title, owner_id )")
    .eq("id", recipientId)
    .single();
  if (!rec) return fail("Reader not found.", 404);

  const r = rec as unknown as {
    id: string; label: string | null; first_name: string | null; last_name: string | null;
    email: string | null; document_id: string; documents?: { title: string; owner_id: string };
  };

  // Confirm against whatever identifies them: email first, else their name.
  const expected = (r.email || r.label || [r.first_name, r.last_name].filter(Boolean).join(" ") || "").trim();
  if (!expected) return fail("That reader has no name or email to confirm against.");
  if ((confirmText ?? "").trim().toLowerCase() !== expected.toLowerCase()) {
    return fail("What you typed does not match this reader.");
  }

  // Count what goes, for the audit record.
  const { count: sigCount } = await admin.from("signals").select("id", { count: "exact", head: true }).eq("recipient_id", r.id);
  const { count: msgCount } = await admin.from("reader_messages").select("id", { count: "exact", head: true }).eq("recipient_id", r.id);

  // signals and reader_messages both cascade from recipients.
  const { error } = await admin.from("recipients").delete().eq("id", r.id);
  if (error) return fail(error.message, 500);

  await writeAudit({
    actorId: me.id, actorEmail: me.email, action: "erase_reader",
    targetUserId: r.documents?.owner_id ?? null,
    detail: {
      recipientId: r.id, email: r.email, name: expected,
      documentId: r.document_id, documentTitle: r.documents?.title ?? null,
      signalsRemoved: sigCount ?? 0, messagesRemoved: msgCount ?? 0,
    },
  });
  return { ok: true };
}

/* ---------------- forwarded colleagues (erasure for third parties) ---------------- */

export type ForwardMention = { signalId: string; recipientId: string; readerName: string; documentTitle: string; colleagueName: string; at: string };

/** Finds every forwarded-signal that names this email. These people never opened
 *  anything and have no recipient row, so they cannot be erased any other way. */
export async function findForwardMentions(email: string): Promise<ForwardMention[]> {
  const me = await getAdminUser();
  if (!me) return [];
  const needle = (email ?? "").trim().toLowerCase();
  if (!needle) return [];

  const admin = createAdminClient();
  const { data: sigs } = await admin
    .from("signals")
    .select("id, recipient_id, value, created_at")
    .eq("kind", "forwarded")
    .order("created_at", { ascending: false })
    .limit(2000);

  const hits = (sigs ?? []).filter((s) => {
    const v = (s.value ?? {}) as Record<string, unknown>;
    const cols = Array.isArray(v.colleagues) ? v.colleagues : [];
    return cols.some((c) => c && typeof c === "object" && String((c as { email?: unknown }).email ?? "").trim().toLowerCase() === needle);
  });
  if (hits.length === 0) return [];

  const recIds = [...new Set(hits.map((h) => h.recipient_id))];
  const { data: recs } = await admin.from("recipients").select("id, label, first_name, last_name, document_id").in("id", recIds);
  const recMap = new Map((recs ?? []).map((r) => [r.id, r]));
  const docIds = [...new Set((recs ?? []).map((r) => r.document_id))];
  const { data: docs } = docIds.length ? await admin.from("documents").select("id, title").in("id", docIds) : { data: [] };
  const docMap = new Map((docs ?? []).map((d) => [d.id, d.title as string]));

  return hits.map((h) => {
    const r = recMap.get(h.recipient_id) as { label: string | null; first_name: string | null; last_name: string | null; document_id: string } | undefined;
    const v = (h.value ?? {}) as Record<string, unknown>;
    const cols = Array.isArray(v.colleagues) ? v.colleagues : [];
    const match = cols.find((c) => c && typeof c === "object" && String((c as { email?: unknown }).email ?? "").trim().toLowerCase() === needle) as { name?: string } | undefined;
    return {
      signalId: h.id as string,
      recipientId: h.recipient_id as string,
      readerName: r?.label || [r?.first_name, r?.last_name].filter(Boolean).join(" ").trim() || "A reader",
      documentTitle: r ? (docMap.get(r.document_id) ?? "a document") : "a document",
      colleagueName: match?.name || "unnamed",
      at: h.created_at as string,
    };
  });
}

/** Removes this person from every forwarded signal that names them. The forward
 *  event itself survives (the count stays honest); only their identity goes. */
export async function eraseForwardMentionsAction(email: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
  const needle = (email ?? "").trim().toLowerCase();
  if (!needle) return fail("An email address is required.");
  if ((confirmText ?? "").trim().toLowerCase() !== needle) return fail("The email you typed does not match.");

  const admin = createAdminClient();
  const { data: sigs } = await admin
    .from("signals")
    .select("id, value")
    .eq("kind", "forwarded")
    .limit(2000);

  let changed = 0;
  for (const s of sigs ?? []) {
    const v = (s.value ?? {}) as Record<string, unknown>;
    const cols = Array.isArray(v.colleagues) ? v.colleagues : [];
    const kept = cols.filter((c) => !(c && typeof c === "object" && String((c as { email?: unknown }).email ?? "").trim().toLowerCase() === needle));
    if (kept.length === cols.length) continue;

    // Keep the event, record that someone was removed, drop their details.
    const next = { ...v, colleagues: kept, erasedCount: Number(v.erasedCount ?? 0) + (cols.length - kept.length) };
    const { error } = await admin.from("signals").update({ value: next }).eq("id", s.id);
    if (error) return fail(error.message, 500);
    changed++;
  }

  await writeAudit({
    actorId: me.id, actorEmail: me.email, action: "erase_forward_mentions",
    detail: { email: needle, signalsUpdated: changed },
  });
  return { ok: true };
}
