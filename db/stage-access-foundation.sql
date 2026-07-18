-- ============================================================
-- BackRead ACCESS MODEL: Projects + granular sharing + RLS
-- Need-to-know: you see a resource only if you created it or
-- it's been granted to you (directly, by role, or via project).
-- Grant cascades: project permission applies to its documents.
-- Run the WHOLE file in Supabase SQL Editor.
-- ============================================================

-- 1. PROJECTS ----------------------------------------------------
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- 2. DOCUMENTS gains project_id (null = loose / org-level) --------
alter table documents add column if not exists project_id uuid references projects(id) on delete set null;

-- 3. ACCESS GRANTS ----------------------------------------------
-- One row per grant. resource is a project or a document.
-- grantee is a specific user OR a role ('owner'|'admin'|'member').
create table if not exists access_grants (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  resource_type   text not null check (resource_type in ('project','document')),
  resource_id     uuid not null,
  grantee_type    text not null check (grantee_type in ('user','role')),
  grantee_id      text not null,   -- user uuid (as text) OR role name
  permission      text not null check (permission in ('view','edit','manage')),
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now()
);
create index if not exists idx_grants_resource on access_grants(resource_type, resource_id);
create index if not exists idx_grants_grantee_user on access_grants(grantee_id) where grantee_type = 'user';

-- ============================================================
-- HELPER FUNCTIONS (security definer -> bypass RLS internally,
-- avoiding recursion; pinned search_path for safety)
-- ============================================================

-- My role in an org (null if not a member). Reuses Stage 2 pattern.
create or replace function my_org_role(org uuid)
returns text language sql security definer set search_path = public as $$
  select role from organization_members
  where organization_id = org and user_id = auth.uid() limit 1;
$$;

-- Does the current user have >= 'view' on a PROJECT?
create or replace function can_see_project(proj uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    -- creator
    select 1 from projects p where p.id = proj and p.created_by = auth.uid()
  ) or exists (
    -- direct user grant
    select 1 from access_grants g
    where g.resource_type = 'project' and g.resource_id = proj
      and g.grantee_type = 'user' and g.grantee_id = auth.uid()::text
  ) or exists (
    -- role grant: granted to a role I currently hold in the project's org
    select 1 from access_grants g
    join projects p on p.id = proj
    where g.resource_type = 'project' and g.resource_id = proj
      and g.grantee_type = 'role'
      and g.grantee_id = my_org_role(p.organization_id)
  );
$$;

-- Does the current user have >= 'view' on a DOCUMENT?
-- Visible if: creator, OR direct/role grant on the doc, OR the doc's
-- project is visible (cascade).
create or replace function can_see_document(doc uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from documents d where d.id = doc and d.owner_id = auth.uid()
  ) or exists (
    select 1 from access_grants g
    where g.resource_type = 'document' and g.resource_id = doc
      and g.grantee_type = 'user' and g.grantee_id = auth.uid()::text
  ) or exists (
    select 1 from access_grants g
    join documents d on d.id = doc
    where g.resource_type = 'document' and g.resource_id = doc
      and g.grantee_type = 'role'
      and g.grantee_id = my_org_role(d.organization_id)
  ) or exists (
    -- cascade: doc is in a project I can see
    select 1 from documents d
    where d.id = doc and d.project_id is not null and can_see_project(d.project_id)
  );
$$;

-- Highest permission I hold on a document ('manage'>'edit'>'view'>null).
-- Used later by UI/policies to gate edit/delete. Cascades from project.
create or replace function my_document_permission(doc uuid)
returns text language sql security definer set search_path = public as $$
  with perms as (
    select 'manage'::text as permission
      from documents d where d.id = doc and d.owner_id = auth.uid()
    union all
    select g.permission from access_grants g
      where g.resource_type='document' and g.resource_id=doc
        and g.grantee_type='user' and g.grantee_id=auth.uid()::text
    union all
    select g.permission from access_grants g join documents d on d.id=doc
      where g.resource_type='document' and g.resource_id=doc
        and g.grantee_type='role' and g.grantee_id=my_org_role(d.organization_id)
    union all
    select g.permission from access_grants g join documents d on d.id=doc
      join projects p on p.id=d.project_id
      where g.resource_type='project' and g.resource_id=d.project_id
        and g.grantee_type='user' and g.grantee_id=auth.uid()::text
    union all
    select g.permission from access_grants g join documents d on d.id=doc
      join projects p on p.id=d.project_id
      where g.resource_type='project' and g.resource_id=d.project_id
        and g.grantee_type='role' and g.grantee_id=my_org_role(d.organization_id)
  )
  select case
    when exists(select 1 from perms where permission='manage') then 'manage'
    when exists(select 1 from perms where permission='edit') then 'edit'
    when exists(select 1 from perms where permission='view') then 'view'
    else null end;
$$;

-- ============================================================
-- RLS: PROJECTS
-- ============================================================
alter table projects enable row level security;

drop policy if exists "see projects" on projects;
create policy "see projects" on projects for select using (can_see_project(id));

drop policy if exists "create projects" on projects;
create policy "create projects" on projects for insert
  with check (created_by = auth.uid() and is_org_member(organization_id));

drop policy if exists "manage projects update" on projects;
create policy "manage projects update" on projects for update
  using (created_by = auth.uid());  -- refined later for 'manage' grantees

drop policy if exists "manage projects delete" on projects;
create policy "manage projects delete" on projects for delete
  using (created_by = auth.uid());

-- ============================================================
-- RLS: ACCESS_GRANTS
-- You can see grants on resources you can see. You can create grants
-- if you 'manage' the resource (creator counts as manage).
-- ============================================================
alter table access_grants enable row level security;

drop policy if exists "see grants" on access_grants;
create policy "see grants" on access_grants for select using (
  (resource_type='document' and can_see_document(resource_id))
  or (resource_type='project' and can_see_project(resource_id))
);

drop policy if exists "create grants" on access_grants;
create policy "create grants" on access_grants for insert with check (
  created_by = auth.uid() and (
    (resource_type='document' and my_document_permission(resource_id) = 'manage')
    or (resource_type='project' and exists(select 1 from projects p where p.id=resource_id and p.created_by=auth.uid()))
  )
);

drop policy if exists "delete grants" on access_grants;
create policy "delete grants" on access_grants for delete using (
  created_by = auth.uid() or (
    resource_type='document' and my_document_permission(resource_id)='manage'
  ) or (
    resource_type='project' and exists(select 1 from projects p where p.id=resource_id and p.created_by=auth.uid())
  )
);

-- ============================================================
-- RLS: DOCUMENTS  (replace org-wide read with need-to-know)
-- Personal docs (organization_id is null) stay owner-only.
-- Org docs use can_see_document().
-- ============================================================
drop policy if exists "read own or org documents" on documents;
create policy "read own or org documents" on documents for select using (
  (organization_id is null and owner_id = auth.uid())
  or (organization_id is not null and can_see_document(id))
);

drop policy if exists "create own or org documents" on documents;
create policy "create own or org documents" on documents for insert with check (
  (organization_id is null and owner_id = auth.uid())
  or (organization_id is not null and is_org_member(organization_id) and owner_id = auth.uid())
);

drop policy if exists "update own or org documents" on documents;
create policy "update own or org documents" on documents for update using (
  (organization_id is null and owner_id = auth.uid())
  or (organization_id is not null and my_document_permission(id) in ('edit','manage'))
);

drop policy if exists "delete own or org documents" on documents;
create policy "delete own or org documents" on documents for delete using (
  (organization_id is null and owner_id = auth.uid())
  or (organization_id is not null and my_document_permission(id) = 'manage')
);

-- ============================================================
-- NOTE: recipients & signals visibility (org docs) is extended in
-- the NEXT step once we've verified this layer in isolation.
-- Personal-path recipients/signals policies are unchanged.
-- ============================================================
