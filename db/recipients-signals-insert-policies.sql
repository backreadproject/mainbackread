-- ============================================================
-- FIX: recipients and signals have RLS enabled but NO insert policy,
-- so ALL inserts are rejected. Add insert policies.
-- ============================================================

-- RECIPIENTS insert:
-- Allowed if the caller can act on the parent document:
--   personal doc they own, OR org doc they can see (edit/manage via access model).
-- NOTE: the share-prospect route uses the admin client (bypasses RLS), but other
-- paths and safety require a proper policy too.
drop policy if exists "insert recipients" on recipients;
create policy "insert recipients" on recipients for insert with check (
  exists (
    select 1 from documents d
    where d.id = recipients.document_id
      and (
        (d.organization_id is null and d.owner_id = auth.uid())
        or (d.organization_id is not null and can_see_document(d.id))
      )
  )
);

-- SIGNALS insert:
-- Signals are created when READERS (external, often unauthenticated via the
-- read-token flow) interact with a document. Those writes typically go through
-- server routes. But to be safe for any authenticated path, allow insert when
-- the signal's recipient belongs to a document the caller can see.
--
-- IMPORTANT: the reader/tracking routes (/api/signal, /api/ask-live) run
-- server-side. If they use the anon/session client as an UNAUTHENTICATED reader,
-- auth.uid() is null and this policy would block them. Check how those routes
-- insert signals: if they use the service-role/admin client, they bypass RLS and
-- this policy only governs authenticated inserts (fine). If they use the anon
-- client, we need a more permissive insert (e.g. allow if the recipient token
-- exists). We add the owner-side policy here; reader-side is handled by those
-- routes using admin, which is the correct design for public tracking writes.
drop policy if exists "insert signals" on signals;
create policy "insert signals" on signals for insert with check (
  exists (
    select 1 from recipients r
    join documents d on d.id = r.document_id
    where r.id = signals.recipient_id
      and (
        (d.organization_id is null and d.owner_id = auth.uid())
        or (d.organization_id is not null and can_see_document(d.id))
      )
  )
);
