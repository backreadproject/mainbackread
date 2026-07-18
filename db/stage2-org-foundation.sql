-- ============================================================
-- BackRead STAGE 2: Organization data foundation + RLS
-- Model: a user is EITHER personal OR org, never both.
-- Run this whole file in the Supabase SQL Editor.
-- ============================================================

-- 1. ORGANIZATIONS ------------------------------------------------
create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_by    uuid not null references auth.users(id) on delete cascade,
  plan          text not null default 'business',   -- reserved for billing state
  created_at    timestamptz not null default now()
);

-- 2. ORGANIZATION MEMBERS ----------------------------------------
-- role: 'owner' | 'admin' | 'member'
create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner','admin','member')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- 3. DOCUMENTS gains organization_id (null = personal) -----------
alter table documents add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- 4. PROFILES gains account context ------------------------------
alter table profiles add column if not exists account_type text not null default 'personal' check (account_type in ('personal','organization'));
alter table profiles add column if not exists active_org_id uuid references organizations(id) on delete set null;

-- ============================================================
-- HELPER: is the current user a member of a given org?
-- SECURITY DEFINER so it can read organization_members without
-- recursing through that table's own RLS.
-- ============================================================
create or replace function is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org and user_id = auth.uid()
  );
$$;

create or replace function org_role(org uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select role from organization_members
  where organization_id = org and user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- RLS: ORGANIZATIONS
-- ============================================================
alter table organizations enable row level security;

drop policy if exists "members read their orgs" on organizations;
create policy "members read their orgs" on organizations
  for select using (is_org_member(id));

drop policy if exists "authenticated can create orgs" on organizations;
create policy "authenticated can create orgs" on organizations
  for insert with check (created_by = auth.uid());

drop policy if exists "owners update their org" on organizations;
create policy "owners update their org" on organizations
  for update using (org_role(id) = 'owner');

drop policy if exists "owners delete their org" on organizations;
create policy "owners delete their org" on organizations
  for delete using (org_role(id) = 'owner');

-- ============================================================
-- RLS: ORGANIZATION_MEMBERS
-- ============================================================
alter table organization_members enable row level security;

-- A member can see the member rows of orgs they belong to.
drop policy if exists "members read org roster" on organization_members;
create policy "members read org roster" on organization_members
  for select using (is_org_member(organization_id));

-- Owners/admins can add members. The creator seeding themselves as owner
-- is allowed (they just created the org).
drop policy if exists "owners admins add members" on organization_members;
create policy "owners admins add members" on organization_members
  for insert with check (
    org_role(organization_id) in ('owner','admin')
    or user_id = auth.uid()  -- allow self-insert as first owner at creation
  );

-- Owners/admins can change roles.
drop policy if exists "owners admins update members" on organization_members;
create policy "owners admins update members" on organization_members
  for update using (org_role(organization_id) in ('owner','admin'));

-- Owners/admins remove members; a member can remove themselves (leave).
drop policy if exists "owners admins remove members" on organization_members;
create policy "owners admins remove members" on organization_members
  for delete using (
    org_role(organization_id) in ('owner','admin')
    or user_id = auth.uid()
  );

-- ============================================================
-- RLS: DOCUMENTS  (rewrite for either/or ownership)
-- Replace the old owner-only policies with ones that allow
-- BOTH personal ownership AND org membership.
-- ============================================================
alter table documents enable row level security;

-- Drop old owner-only policies if they exist (names from earlier setup).
drop policy if exists "owner all on documents" on documents;
drop policy if exists "owner select documents" on documents;
drop policy if exists "owner insert documents" on documents;
drop policy if exists "owner update documents" on documents;
drop policy if exists "owner delete documents" on documents;
drop policy if exists "documents owner read"  on documents;

-- SELECT: personal owner OR member of the owning org.
drop policy if exists "read own or org documents" on documents;
create policy "read own or org documents" on documents
  for select using (
    (organization_id is null and owner_id = auth.uid())
    or (organization_id is not null and is_org_member(organization_id))
  );

-- INSERT: personal doc for self, OR org doc into an org you belong to.
drop policy if exists "create own or org documents" on documents;
create policy "create own or org documents" on documents
  for insert with check (
    (organization_id is null and owner_id = auth.uid())
    or (organization_id is not null and is_org_member(organization_id))
  );

-- UPDATE: same rule.
drop policy if exists "update own or org documents" on documents;
create policy "update own or org documents" on documents
  for update using (
    (organization_id is null and owner_id = auth.uid())
    or (organization_id is not null and is_org_member(organization_id))
  );

-- DELETE: personal owner, OR org owner/admin (members can't delete others' org docs).
drop policy if exists "delete own or org documents" on documents;
create policy "delete own or org documents" on documents
  for delete using (
    (organization_id is null and owner_id = auth.uid())
    or (organization_id is not null and (owner_id = auth.uid() or org_role(organization_id) in ('owner','admin')))
  );

-- ============================================================
-- NOTE on recipients & signals:
-- These reference documents. Their existing RLS (via the document's
-- owner) should be reviewed in Stage 3 once org UI exists, so org
-- members can see recipients/signals on org documents. For now the
-- personal path is unchanged and org documents are created but the
-- recipient/signal policies still key off document ownership.
-- We will extend those in Stage 3 alongside the UI that needs them.
-- ============================================================
