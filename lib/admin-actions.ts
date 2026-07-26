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
    if (!me.can("destructive")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("documents.read")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("destructive")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("destructive")) return fail("Your role does not allow that.", 403);
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
    if (!me.can("erasure.handle")) return fail("Your role does not allow that.", 403);
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

export type ForwardMention = {
  signalId: string | null;      // null when this is their own reader record, not a mention
  recipientId: string;
  readerName: string;
  documentTitle: string;
  colleagueName: string;
  at: string;
  kind: "mention" | "record";
};

/** Finds every forwarded-signal that names this email.
 *
 *  A forwarded colleague DOES get a full recipients row with its own share_token
 *  (see /api/forward), so they can and do open the document and generate signals.
 *  This finder only surfaces the mention inside the forwarder's signal; the erase
 *  action below is what removes their actual record. An earlier version of this
 *  comment claimed they had no recipient row, and the erase path was built on that
 *  false premise, so erasure reported success while leaving the person's data intact. */
export async function findForwardMentions(email: string): Promise<ForwardMention[]> {
  const me = await getAdminUser();
  if (!me) return [];
    if (!me.can("erasure.handle")) return [];
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

  const recIds = [...new Set(hits.map((h) => h.recipient_id))];
  const { data: recs } = recIds.length ? await admin.from("recipients").select("id, label, first_name, last_name, document_id").in("id", recIds) : { data: [] };
  const recMap = new Map((recs ?? []).map((r) => [r.id, r]));
  const docIds = [...new Set((recs ?? []).map((r) => r.document_id))];
  const { data: docs } = docIds.length ? await admin.from("documents").select("id, title").in("id", docIds) : { data: [] };
  const docMap = new Map((docs ?? []).map((d) => [d.id, d.title as string]));

  // Their own reader records. A data subject request arrives as an email
  // address, not a document, so the search has to find everything that address
  // touches. Searching only forwards meant a direct recipient who was never
  // forwarded to came back as "nothing to erase" while their records sat there.
  const { data: ownRows } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, document_id, created_at")
    .ilike("email", needle);
  const ownDocIds = [...new Set((ownRows ?? []).map((r) => r.document_id as string))];
  const { data: ownDocs } = ownDocIds.length ? await admin.from("documents").select("id, title").in("id", ownDocIds) : { data: [] };
  const ownDocMap = new Map((ownDocs ?? []).map((d) => [d.id, d.title as string]));
  const ownEntries: ForwardMention[] = (ownRows ?? []).map((r) => ({
    signalId: null,
    recipientId: r.id as string,
    readerName: (r.label as string) || [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "This person",
    documentTitle: ownDocMap.get(r.document_id as string) ?? "a document",
    colleagueName: "",
    at: r.created_at as string,
    kind: "record" as const,
  }));

  const mentionEntries: ForwardMention[] = hits.map((h) => {
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
      kind: "mention" as const,
    };
  });

  return [...ownEntries, ...mentionEntries].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** Removes this person from every forwarded signal that names them. The forward
 *  event itself survives (the count stays honest); only their identity goes. */
export async function eraseForwardMentionsAction(email: string, confirmText: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
    if (!me.can("erasure.handle")) return fail("Your role does not allow that.", 403);
  const needle = (email ?? "").trim().toLowerCase();
  if (!needle) return fail("An email address is required.");
  if ((confirmText ?? "").trim().toLowerCase() !== needle) return fail("The email you typed does not match.");

  const admin = createAdminClient();
  const { data: sigs } = await admin
    .from("signals")
    .select("id, value")
    .eq("kind", "forwarded")
    .limit(2000);


  // 1. Their own recipient rows. A forwarded colleague is a real recipient with
  //    its own share_token, so this is where the bulk of their personal data
  //    lives: the row itself plus every signal and reader message, which cascade.
  const { data: theirRows } = await admin
    .from("recipients")
    .select("id, document_id")
    .ilike("email", needle);
  const rowIds = (theirRows ?? []).map((r) => r.id as string);
  let signalsRemoved = 0;
  let messagesRemoved = 0;
  if (rowIds.length) {
    const { count: sc } = await admin.from("signals").select("id", { count: "exact", head: true }).in("recipient_id", rowIds);
    const { count: mc } = await admin.from("reader_messages").select("id", { count: "exact", head: true }).in("recipient_id", rowIds);
    signalsRemoved = sc ?? 0;
    messagesRemoved = mc ?? 0;
    const { error: delErr } = await admin.from("recipients").delete().in("id", rowIds);
    if (delErr) return fail(delErr.message, 500);
  }

  // 2. The mention inside the forwarder's signal. The event stays so the sender's
  //    forward count remains truthful; only the person's details go.
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
    detail: {
      email: needle,
      signalsUpdated: changed,
      recipientRowsRemoved: rowIds.length,
      signalsRemoved,
      messagesRemoved,
    },
  });
  return { ok: true };
}

/* ---------------- support conversations ---------------- */

export async function replyToSupportAction(conversationId: string, message: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
  const text = (message ?? "").trim();
  if (!text) return fail("Write something first.");
  if (text.length > 4000) return fail("That is too long for a chat reply.");

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("support_conversations")
    .select("id, email, name, user_id, status")
    .eq("id", conversationId)
    .single();
  if (!conv) return fail("Conversation not found.", 404);
  const c = conv as { id: string; email: string | null; name: string | null; user_id: string | null; status: string };

  const { error } = await admin.from("support_messages").insert({
    conversation_id: c.id, role: "human", content: text,
  });
  if (error) return fail(error.message, 500);

  await admin.from("support_conversations")
    .update({ status: "answered", last_message_at: new Date().toISOString() })
    .eq("id", c.id);

  // Email it too: they may have closed the tab. Best effort, never fatal.
  if (c.email) {
    try {
      const { sendEmail } = await import("@/lib/email");
      const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#F8F9FA;padding:24px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #EAECEF;border-radius:12px;padding:24px;">
          <p style="font-size:16px;color:#0F1729;margin:0 0 14px;">${c.name ? `Hi ${c.name.split(" ")[0]},` : "Hi,"}</p>
          <p style="font-size:15px;color:#475467;line-height:1.6;margin:0 0 18px;white-space:pre-wrap;">${text.replace(/</g, "&lt;")}</p>
          <p style="font-size:13px;color:#98A2B3;line-height:1.5;margin:0;">Reply to this email and it reaches us directly, or continue in the chat on ReadProspects.</p>
        </div></body></html>`;
      await sendEmail("readprospects", { to: c.email, subject: "Re: your question about ReadProspects", html });
    } catch (err) {
      console.error("[support reply] email failed:", err instanceof Error ? err.message : String(err));
    }
  }

  await writeAudit({
    actorId: me.id, actorEmail: me.email, action: "support_reply",
    targetUserId: c.user_id, detail: { conversationId: c.id, emailed: !!c.email },
  });
  return { ok: true };
}

export async function closeSupportAction(conversationId: string): Promise<ActionResult> {
  const me = await getAdminUser();
  if (!me) return fail("Not found.", 404);
    if (!me.can("support.handle")) return fail("Your role does not allow that.", 403);
  const admin = createAdminClient();
  const { error } = await admin.from("support_conversations").update({ status: "closed" }).eq("id", conversationId);
  if (error) return fail(error.message, 500);
  await writeAudit({ actorId: me.id, actorEmail: me.email, action: "support_close", detail: { conversationId } });
  return { ok: true };
}
