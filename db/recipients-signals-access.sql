-- Extend recipients/signals visibility to match document access (need-to-know).
-- Personal docs: owner sees them. Org docs: anyone who can_see_document.

drop policy if exists "own recipients" on recipients;
drop policy if exists "see recipients" on recipients;
create policy "see recipients" on recipients for select using (
  exists (
    select 1 from documents d
    where d.id = recipients.document_id
      and ( (d.organization_id is null and d.owner_id = auth.uid())
         or (d.organization_id is not null and can_see_document(d.id)) )
  )
);

drop policy if exists "own signals" on signals;
drop policy if exists "read own signals" on signals;
drop policy if exists "see signals" on signals;
create policy "see signals" on signals for select using (
  exists (
    select 1 from recipients r
    join documents d on d.id = r.document_id
    where r.id = signals.recipient_id
      and ( (d.organization_id is null and d.owner_id = auth.uid())
         or (d.organization_id is not null and can_see_document(d.id)) )
  )
);
