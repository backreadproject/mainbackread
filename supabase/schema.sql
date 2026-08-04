-- ReadProspects database schema
-- Generated 2026-08-03 from production (czfczustwcolgjuqvtta).
--
-- NOT COVERED, recreate by hand in a new project: storage buckets documents
-- (private) and avatars (public) with their policies; auth settings (email
-- confirmation, custom SMTP, site URL, redirect allowlist); extensions; data.

set check_function_bodies = off;

-- TABLES

create table if not exists public.access_grants (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  resource_type text not null,
  resource_id uuid not null,
  grantee_type text not null,
  grantee_id text not null,
  permission text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.admin_audit (
  id uuid default gen_random_uuid() not null,
  actor_id uuid not null,
  actor_email text,
  action text not null,
  target_user_id uuid,
  target_org_id uuid,
  detail jsonb,
  created_at timestamp with time zone default now() not null,
  kind text default 'mutation'::text not null
);

create table if not exists public.admin_users (
  user_id uuid not null,
  email text not null,
  role text not null,
  note text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  revoked_at timestamp with time zone
);

create table if not exists public.api_keys (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  name text default 'API key'::text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] default '{read}'::text[] not null,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.api_subscriptions (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  api_key_id uuid,
  target_url text not null,
  event text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.app_settings (
  id boolean default true not null,
  invite_only boolean default false not null,
  updated_at timestamp with time zone default now() not null,
  updated_by uuid
);

create table if not exists public.commissions (
  id uuid default gen_random_uuid() not null,
  referrer_id uuid not null,
  subscriber_id uuid,
  subscriber_email text,
  plan text not null,
  interval text not null,
  gross_collected numeric(12,2) not null,
  rate numeric(5,4) default 0.2500 not null,
  amount numeric(12,2) not null,
  currency text not null,
  cycle smallint not null,
  status text default 'pending'::text not null,
  available_at timestamp with time zone default (now() + '30 days'::interval) not null,
  processor_ref text not null,
  withdrawal_id uuid,
  note text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.document_variants (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  label text not null,
  note text,
  storage_path text,
  extracted_text text,
  extract_method text,
  needs_page_ocr boolean default false not null,
  page_count integer,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.documents (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  title text not null,
  storage_path text,
  page_count integer default 0,
  created_at timestamp with time zone default now(),
  archived_at timestamp with time zone,
  organization_id uuid,
  project_id uuid,
  extracted_text text,
  extract_method text,
  needs_page_ocr boolean default false not null,
  signing_enabled boolean default false not null,
  signing_completed_at timestamp with time zone,
  signed_storage_path text
);

create table if not exists public.gaps_cache (
  document_id uuid not null,
  fingerprint text not null,
  output jsonb not null,
  question_count integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.icp_profiles (
  id uuid default gen_random_uuid() not null,
  owner_id uuid,
  organization_id uuid,
  created_by uuid,
  revision integer not null,
  source text not null,
  refined_from integer,
  branch text not null,
  status text default 'draft'::text not null,
  answers jsonb default '{}'::jsonb not null,
  answers_hash text,
  output jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

create table if not exists public.invitations (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  email text not null,
  first_name text not null,
  last_name text not null,
  role text default 'member'::text not null,
  token text default encode(gen_random_bytes(24), 'hex'::text) not null,
  status text default 'pending'::text not null,
  invited_by uuid not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + '14 days'::interval) not null
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  params jsonb
);

create table if not exists public.organization_members (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  user_id uuid not null,
  role text default 'member'::text not null,
  created_at timestamp with time zone default now() not null,
  email text
);

create table if not exists public.organizations (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_by uuid not null,
  plan text default 'team'::text not null,
  created_at timestamp with time zone default now() not null,
  domain text,
  subscription_active boolean default false not null,
  subscribed_at timestamp with time zone
);

create table if not exists public.profiles (
  id uuid not null,
  workspace_name text,
  updated_at timestamp with time zone default now(),
  account_type text default 'personal'::text not null,
  active_org_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  trial_started_at timestamp with time zone,
  plan text,
  referred_by uuid,
  referred_at timestamp with time zone,
  commission_window_closed_at timestamp with time zone,
  approved_at timestamp with time zone,
  subscription_active boolean default false not null,
  subscribed_at timestamp with time zone
);

create table if not exists public.projects (
  id uuid default gen_random_uuid() not null,
  organization_id uuid,
  name text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.rate_limits (
  id uuid default gen_random_uuid() not null,
  bucket text not null,
  window_start timestamp with time zone not null,
  count integer default 0 not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.reader_messages (
  id uuid default gen_random_uuid() not null,
  recipient_id uuid not null,
  document_id uuid,
  role text not null,
  content text not null,
  page integer,
  escalate boolean default false not null,
  out_of_scope boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.recipients (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  share_token text default encode(gen_random_bytes(16), 'hex'::text) not null,
  label text,
  created_at timestamp with time zone default now(),
  first_name text,
  last_name text,
  email text,
  delivery text,
  opened_notified boolean default false not null,
  variant_id uuid,
  last_open_notified_at timestamp with time zone,
  outcome text,
  outcome_at timestamp with time zone,
  outcome_note text,
  outcome_snoozed_at timestamp with time zone,
  forwarded_by uuid,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  is_signer boolean default false not null,
  signed_at timestamp with time zone,
  signature_kind text,
  signature_data text,
  signed_email text,
  signed_ip text,
  declined_at timestamp with time zone,
  decline_reason text,
  sent_at timestamp with time zone
);

create table if not exists public.referrer_code_history (
  code text not null,
  referrer_id uuid not null,
  retired_at timestamp with time zone default now() not null
);

create table if not exists public.referrers (
  id uuid not null,
  code text not null,
  display_name text,
  contact_email text,
  payout jsonb,
  payout_currency text default 'USD'::text not null,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.report_cache (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  fingerprint text not null,
  report jsonb not null,
  reader_count integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.report_settings (
  user_id uuid not null,
  company_name text,
  logo_url text,
  default_reporter text,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.sales_settings (
  user_id uuid not null,
  quiet_days integer default 7 not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.signals (
  id uuid default gen_random_uuid() not null,
  recipient_id uuid not null,
  kind text not null,
  page integer,
  value jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.signature_fields (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  recipient_id uuid not null,
  page integer not null,
  x numeric not null,
  y numeric not null,
  w numeric default 0.24 not null,
  h numeric default 0.07 not null,
  kind text default 'signature'::text not null,
  label text,
  value text,
  created_at timestamp with time zone default now() not null,
  date_mode text
);

create table if not exists public.signature_objections (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  recipient_id uuid not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_note text
);

create table if not exists public.support_conversations (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  session_token text not null,
  email text,
  name text,
  surface text default 'marketing'::text not null,
  status text default 'bot'::text not null,
  escalated_at timestamp with time zone,
  last_message_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.support_messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.usage_events (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  org_id uuid,
  kind text not null,
  document_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.verdicts (
  id uuid default gen_random_uuid() not null,
  recipient_id uuid not null,
  document_id uuid,
  headline text not null,
  reasoning text not null,
  next_action text not null,
  confidence text not null,
  evidence jsonb,
  signal_count integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.webhook_deliveries (
  id uuid default gen_random_uuid() not null,
  webhook_id uuid not null,
  event text not null,
  ok boolean not null,
  status_code integer,
  error text,
  created_at timestamp with time zone default now() not null,
  payload jsonb
);

create table if not exists public.webhooks (
  id uuid default gen_random_uuid() not null,
  organization_id uuid not null,
  url text not null,
  secret text not null,
  events text[] default '{reader.opened,reader.question,reader.forwarded}'::text[] not null,
  active boolean default true not null,
  last_status integer,
  last_delivery_at timestamp with time zone,
  failure_count integer default 0 not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() not null,
  referrer_id uuid not null,
  amount numeric(12,2) not null,
  currency text not null,
  status text default 'requested'::text not null,
  processor_ref text,
  failure_reason text,
  requested_at timestamp with time zone default now() not null,
  settled_at timestamp with time zone
);

-- FUNCTIONS

CREATE OR REPLACE FUNCTION public.bump_rate_limit(p_bucket text, p_window timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare new_count integer;
begin
  insert into rate_limits (bucket, window_start, count, updated_at)
  values (p_bucket, p_window, 1, now())
  on conflict (bucket, window_start)
  do update set count = rate_limits.count + 1, updated_at = now()
  returning count into new_count;

  -- Opportunistic cleanup: ~1% of calls prune anything older than 3 days.
  -- Buckets embed share tokens, so we do not keep them longer than they are useful.
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '3 days';
  end if;

  return new_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_see_document(doc uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (select 1 from documents d where d.id = doc and d.owner_id = auth.uid())
    or exists (
      select 1 from documents d where d.id = doc and d.organization_id is not null
        and my_org_role(d.organization_id) in ('owner','admin')
    )
    or exists (
      select 1 from access_grants g join documents d on d.id = doc
      where g.resource_type='document' and g.resource_id=doc
        and ((g.grantee_type='user' and g.grantee_id=auth.uid()::text)
          or (g.grantee_type='role' and g.grantee_id = my_org_role(d.organization_id)))
    )
    or exists (
      select 1 from access_grants g join documents d on d.id = doc
      where d.project_id is not null
        and g.resource_type='project' and g.resource_id = d.project_id
        and ((g.grantee_type='user' and g.grantee_id=auth.uid()::text)
          or (g.grantee_type='role' and g.grantee_id = my_org_role(d.organization_id)))
    );
$function$
;

CREATE OR REPLACE FUNCTION public.can_see_project(proj uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from projects p
    where p.id = proj
      and (
        (p.organization_id is null and p.created_by = auth.uid())
        or (p.organization_id is not null and (
          is_org_member(p.organization_id)
          or exists (
            select 1 from access_grants g
            where g.resource_type = 'project' and g.resource_id = p.id
              and g.grantee_type = 'user' and g.grantee_id = auth.uid()::text
          )
        ))
      )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_domain text, p_plan text, p_migrate boolean)
 RETURNS TABLE(org_id uuid, org_name text, migrated integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_org uuid;
  v_moved integer := 0;
  v_type text;
  v_existing uuid;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  -- The same rules the route enforced, restated here because this function is
  -- the only thing that can hold all four writes in one transaction, and a rule
  -- checked outside the transaction can be raced.
  select account_type, active_org_id into v_type, v_existing
  from profiles where id = v_user;

  if v_type is distinct from 'organization' then
    raise exception 'Personal accounts cannot create an organization' using errcode = '42501';
  end if;
  if v_existing is not null then
    raise exception 'You already have an organization' using errcode = '23505';
  end if;

  v_plan := case when p_plan = 'business' then 'business' else 'team' end;

  insert into organizations (name, domain, created_by, plan, subscription_active)
  values (trim(p_name), nullif(trim(coalesce(p_domain, '')), ''), v_user, v_plan, false)
  returning id into v_org;

  insert into organization_members (organization_id, user_id, role, email)
  values (v_org, v_user, 'owner', (select email from auth.users where id = v_user));

  update profiles set active_org_id = v_org, updated_at = now() where id = v_user;

  if p_migrate then
    with moved as (
      update documents set organization_id = v_org
      where owner_id = v_user and organization_id is null
      returning id
    )
    select count(*) into v_moved from moved;
  end if;

  -- Any failure above rolls back all of it: no organisation without an owner,
  -- no owner row pointing at an organisation that does not exist.
  return query select v_org, trim(p_name), v_moved;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_document_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_plan text;
  v_acct text;
  v_count int;
  v_limit int := 2;   -- mirrors plans.ts: free.documentsPerMonth
begin
  select p.plan, p.account_type into v_plan, v_acct
  from public.profiles p where p.id = NEW.owner_id;

  -- Company/organization accounts and any non-Free plan: unlimited documents.
  if v_acct in ('company','organization') then return NEW; end if;
  if v_plan is distinct from 'free' then return NEW; end if;

  -- Free personal account: cap new documents per calendar month.
  select count(*) into v_count from public.documents
  where owner_id = NEW.owner_id
    and created_at >= date_trunc('month', now() at time zone 'utc');

  if v_count >= v_limit then
    raise exception 'DOCUMENT_LIMIT: The Free plan allows % documents per month.', v_limit
      using errcode = 'P0001';
  end if;
  return NEW;
end $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_raw text := coalesce(new.raw_user_meta_data->>'account_type', 'personal');
  v_type text;
  v_plan text := coalesce(new.raw_user_meta_data->>'plan', '');
  v_workspace text := nullif(trim(coalesce(new.raw_user_meta_data->>'workspace_name', '')), '');
  v_org uuid;
begin
  -- profiles_account_type_check permits only 'personal' and 'organization'. The
  -- app has used 'company' in places since it shipped, and the client-side upsert
  -- that wrote it never checked its error, so company signups silently failed to
  -- record their type for months. Normalise here so no spelling can break signup.
  v_type := case when v_raw in ('company', 'organization') then 'organization' else 'personal' end;

  if v_type = 'organization' then
    if v_plan not in ('team', 'business') then v_plan := 'team'; end if;
  else
    if v_plan <> 'personal' then v_plan := 'free'; end if;
  end if;

  insert into public.profiles (id, first_name, last_name, account_type, plan, trial_started_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    v_type,
    case when v_type = 'organization' then null else v_plan end,
    now(),
    now()
  )
  on conflict (id) do nothing;

  if v_type = 'organization' then
    insert into public.organizations (name, created_by, plan, subscription_active)
    values (coalesce(v_workspace, 'My workspace'), new.id, v_plan, false)
    returning id into v_org;

    insert into public.organization_members (organization_id, user_id, role, email)
    values (v_org, new.id, 'owner', new.email)
    on conflict (organization_id, user_id) do nothing;

    update public.profiles set active_org_id = v_org where id = new.id;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_member(org uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from organization_members
    where organization_id = org and user_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.mask_email(addr text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  -- ada.hold@northwind.com -> ad***@northwind.com
  -- Two characters is enough to recognise someone you referred yourself,
  -- and not enough to contact them. The domain stays: it is the part that
  -- tells a referrer which company converted, which is the useful signal.
  select case
    when addr is null or position('@' in addr) < 2 then null
    else left(split_part(addr, '@', 1), 2) || '***@' || split_part(addr, '@', 2)
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  -- Ada Hold -> Ada H.
  select case
    when full_name is null or btrim(full_name) = '' then null
    when position(' ' in btrim(full_name)) = 0 then btrim(full_name)
    else split_part(btrim(full_name), ' ', 1) || ' ' ||
         left(split_part(btrim(full_name), ' ', 2), 1) || '.'
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.my_document_permission(doc uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with perms as (
    select 'manage'::text as permission from documents d where d.id = doc and d.owner_id = auth.uid()
    union all
    select 'manage'::text from documents d where d.id = doc and d.organization_id is not null
      and my_org_role(d.organization_id) in ('owner','admin')
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
      where g.resource_type='project' and g.resource_id=d.project_id
        and g.grantee_type='user' and g.grantee_id=auth.uid()::text
    union all
    select g.permission from access_grants g join documents d on d.id=doc
      where g.resource_type='project' and g.resource_id=d.project_id
        and g.grantee_type='role' and g.grantee_id=my_org_role(d.organization_id)
  )
  select case
    when exists(select 1 from perms where permission='manage') then 'manage'
    when exists(select 1 from perms where permission='edit') then 'edit'
    when exists(select 1 from perms where permission='view') then 'view'
    else null end;
$function$
;

CREATE OR REPLACE FUNCTION public.my_org_role(org uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from organization_members
  where organization_id = org and user_id = auth.uid() limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.my_project_permission(proj uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with perms as (
    select 'manage'::text as permission from projects p where p.id = proj and p.created_by = auth.uid()
    union all
    select 'manage'::text from projects p where p.id = proj and p.organization_id is not null
      and my_org_role(p.organization_id) in ('owner','admin')
    union all
    select g.permission from access_grants g
      where g.resource_type='project' and g.resource_id=proj
        and g.grantee_type='user' and g.grantee_id=auth.uid()::text
    union all
    select g.permission from access_grants g join projects p on p.id=proj
      where g.resource_type='project' and g.resource_id=proj
        and g.grantee_type='role' and g.grantee_id=my_org_role(p.organization_id)
  )
  select case
    when exists(select 1 from perms where permission='manage') then 'manage'
    when exists(select 1 from perms where permission='edit') then 'edit'
    when exists(select 1 from perms where permission='view') then 'view'
    else null end;
$function$
;

CREATE OR REPLACE FUNCTION public.org_role(org uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from organization_members
  where organization_id = org and user_id = auth.uid()
  limit 1;
$function$
;

-- PRIMARY AND UNIQUE KEYS

alter table public.access_grants add constraint access_grants_pkey PRIMARY KEY (id);
alter table public.admin_audit add constraint admin_audit_pkey PRIMARY KEY (id);
alter table public.admin_users add constraint admin_users_pkey PRIMARY KEY (user_id);
alter table public.api_keys add constraint api_keys_pkey PRIMARY KEY (id);
alter table public.api_subscriptions add constraint api_subscriptions_pkey PRIMARY KEY (id);
alter table public.app_settings add constraint app_settings_pkey PRIMARY KEY (id);
alter table public.commissions add constraint commissions_pkey PRIMARY KEY (id);
alter table public.commissions add constraint commissions_processor_ref_key UNIQUE (processor_ref);
alter table public.commissions add constraint commissions_subscriber_id_interval_cycle_key UNIQUE (subscriber_id, "interval", cycle);
alter table public.document_variants add constraint document_variants_document_id_label_key UNIQUE (document_id, label);
alter table public.document_variants add constraint document_variants_pkey PRIMARY KEY (id);
alter table public.documents add constraint documents_pkey PRIMARY KEY (id);
alter table public.gaps_cache add constraint gaps_cache_pkey PRIMARY KEY (document_id, fingerprint);
alter table public.icp_profiles add constraint icp_profiles_pkey PRIMARY KEY (id);
alter table public.invitations add constraint invitations_pkey PRIMARY KEY (id);
alter table public.invitations add constraint invitations_token_key UNIQUE (token);
alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table public.organization_members add constraint organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id);
alter table public.organization_members add constraint organization_members_pkey PRIMARY KEY (id);
alter table public.organizations add constraint organizations_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.projects add constraint projects_pkey PRIMARY KEY (id);
alter table public.rate_limits add constraint rate_limits_bucket_window_start_key UNIQUE (bucket, window_start);
alter table public.rate_limits add constraint rate_limits_pkey PRIMARY KEY (id);
alter table public.reader_messages add constraint reader_messages_pkey PRIMARY KEY (id);
alter table public.recipients add constraint recipients_pkey PRIMARY KEY (id);
alter table public.recipients add constraint recipients_share_token_key UNIQUE (share_token);
alter table public.referrer_code_history add constraint referrer_code_history_pkey PRIMARY KEY (code);
alter table public.referrers add constraint referrers_code_key UNIQUE (code);
alter table public.referrers add constraint referrers_pkey PRIMARY KEY (id);
alter table public.report_cache add constraint report_cache_document_id_fingerprint_key UNIQUE (document_id, fingerprint);
alter table public.report_cache add constraint report_cache_pkey PRIMARY KEY (id);
alter table public.report_settings add constraint report_settings_pkey PRIMARY KEY (user_id);
alter table public.sales_settings add constraint sales_settings_pkey PRIMARY KEY (user_id);
alter table public.signals add constraint signals_pkey PRIMARY KEY (id);
alter table public.signature_fields add constraint signature_fields_pkey PRIMARY KEY (id);
alter table public.signature_objections add constraint signature_objections_pkey PRIMARY KEY (id);
alter table public.support_conversations add constraint support_conversations_pkey PRIMARY KEY (id);
alter table public.support_messages add constraint support_messages_pkey PRIMARY KEY (id);
alter table public.usage_events add constraint usage_events_pkey PRIMARY KEY (id);
alter table public.verdicts add constraint verdicts_pkey PRIMARY KEY (id);
alter table public.verdicts add constraint verdicts_recipient_id_key UNIQUE (recipient_id);
alter table public.webhook_deliveries add constraint webhook_deliveries_pkey PRIMARY KEY (id);
alter table public.webhooks add constraint webhooks_pkey PRIMARY KEY (id);
alter table public.withdrawals add constraint withdrawals_pkey PRIMARY KEY (id);

-- FOREIGN KEYS AND CHECKS

alter table public.access_grants add constraint access_grants_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.access_grants add constraint access_grants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.admin_users add constraint admin_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.admin_users add constraint admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.api_keys add constraint api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.api_subscriptions add constraint api_subscriptions_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE;
alter table public.api_subscriptions add constraint api_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.app_settings add constraint app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.commissions add constraint commissions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES referrers(id) ON DELETE RESTRICT;
alter table public.commissions add constraint commissions_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.commissions add constraint commissions_withdrawal_fk FOREIGN KEY (withdrawal_id) REFERENCES withdrawals(id) ON DELETE SET NULL;
alter table public.document_variants add constraint document_variants_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.documents add constraint documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.documents add constraint documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.documents add constraint documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
alter table public.gaps_cache add constraint gaps_cache_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.icp_profiles add constraint icp_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.icp_profiles add constraint icp_profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.icp_profiles add constraint icp_profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.invitations add constraint invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.invitations add constraint invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.organization_members add constraint organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.organization_members add constraint organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.organizations add constraint organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public.profiles add constraint profiles_active_org_id_fkey FOREIGN KEY (active_org_id) REFERENCES organizations(id) ON DELETE SET NULL;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES referrers(id) ON DELETE SET NULL;
alter table public.projects add constraint projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.projects add constraint projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.reader_messages add constraint reader_messages_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.reader_messages add constraint reader_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;
alter table public.recipients add constraint recipients_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.recipients add constraint recipients_forwarded_by_fkey FOREIGN KEY (forwarded_by) REFERENCES recipients(id) ON DELETE SET NULL;
alter table public.recipients add constraint recipients_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES document_variants(id) ON DELETE SET NULL;
alter table public.referrer_code_history add constraint referrer_code_history_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES referrers(id) ON DELETE CASCADE;
alter table public.referrers add constraint referrers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.report_cache add constraint report_cache_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.report_settings add constraint report_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.sales_settings add constraint sales_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.signals add constraint signals_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;
alter table public.signature_fields add constraint signature_fields_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.signature_fields add constraint signature_fields_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;
alter table public.signature_objections add constraint signature_objections_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.signature_objections add constraint signature_objections_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;
alter table public.signature_objections add constraint signature_objections_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);
alter table public.support_messages add constraint support_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE;
alter table public.verdicts add constraint verdicts_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
alter table public.verdicts add constraint verdicts_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;
alter table public.webhook_deliveries add constraint webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE;
alter table public.webhooks add constraint webhooks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.withdrawals add constraint withdrawals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES referrers(id) ON DELETE RESTRICT;
alter table public.access_grants add constraint access_grants_grantee_type_check CHECK ((grantee_type = ANY (ARRAY['user'::text, 'role'::text])));
alter table public.access_grants add constraint access_grants_permission_check CHECK ((permission = ANY (ARRAY['view'::text, 'edit'::text, 'manage'::text])));
alter table public.access_grants add constraint access_grants_resource_type_check CHECK ((resource_type = ANY (ARRAY['project'::text, 'document'::text])));
alter table public.admin_audit add constraint admin_audit_kind_check CHECK ((kind = ANY (ARRAY['mutation'::text, 'read'::text])));
alter table public.admin_users add constraint admin_users_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'support'::text, 'finance'::text, 'compliance'::text, 'engineering'::text])));
alter table public.app_settings add constraint app_settings_id_check CHECK (id);
alter table public.commissions add constraint commissions_cycle_check CHECK (((cycle >= 1) AND (cycle <= 3)));
alter table public.commissions add constraint commissions_interval_check CHECK (("interval" = ANY (ARRAY['monthly'::text, 'annual'::text])));
alter table public.commissions add constraint commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'available'::text, 'paid'::text, 'clawed_back'::text])));
alter table public.icp_profiles add constraint icp_complete_has_output CHECK (((status <> 'complete'::text) OR (output IS NOT NULL)));
alter table public.icp_profiles add constraint icp_one_scope CHECK (((owner_id IS NULL) <> (organization_id IS NULL)));
alter table public.icp_profiles add constraint icp_profiles_branch_check CHECK ((branch = ANY (ARRAY['operating'::text, 'startup'::text])));
alter table public.icp_profiles add constraint icp_profiles_source_check CHECK ((source = ANY (ARRAY['asserted'::text, 'refined'::text])));
alter table public.icp_profiles add constraint icp_profiles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'complete'::text])));
alter table public.icp_profiles add constraint icp_refined_names_parent CHECK (((source = 'refined'::text) = (refined_from IS NOT NULL)));
alter table public.invitations add constraint invitations_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])));
alter table public.invitations add constraint invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text])));
alter table public.organization_members add constraint organization_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])));
alter table public.profiles add constraint profiles_account_type_check CHECK ((account_type = ANY (ARRAY['personal'::text, 'organization'::text])));
alter table public.reader_messages add constraint reader_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'doc'::text])));
alter table public.recipients add constraint recipients_outcome_check CHECK ((outcome = ANY (ARRAY['won'::text, 'lost'::text, 'no_decision'::text])));
alter table public.recipients add constraint recipients_signature_kind_check CHECK ((signature_kind = ANY (ARRAY['typed'::text, 'drawn'::text, 'uploaded'::text])));
alter table public.referrer_code_history add constraint history_code_format CHECK ((code ~ '^[a-z0-9][a-z0-9-]{2,31}$'::text));
alter table public.referrers add constraint referrer_code_format CHECK ((code ~ '^[a-z0-9][a-z0-9-]{2,31}$'::text));
alter table public.referrers add constraint referrer_code_reserved CHECK ((code <> ALL (ARRAY['admin'::text, 'api'::text, 'app'::text, 'support'::text, 'privacy'::text, 'terms'::text, 'help'::text, 'login'::text, 'signup'::text, 'readprospects'::text, 'relay'::text, 'relaydocuments'::text, 'referrals'::text, 'console'::text, 'billing'::text, 'account'::text, 'settings'::text, 'dashboard'::text, 'www'::text, 'mail'::text, 'docs'::text, 'status'::text, 'pricing'::text])));
alter table public.referrers add constraint referrers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'closed'::text])));
alter table public.sales_settings add constraint sales_settings_quiet_days_check CHECK (((quiet_days >= 1) AND (quiet_days <= 90)));
alter table public.signature_fields add constraint signature_fields_date_mode_check CHECK ((date_mode = ANY (ARRAY['signed'::text, 'chosen'::text])));
alter table public.signature_fields add constraint signature_fields_h_check CHECK (((h > (0)::numeric) AND (h <= (1)::numeric)));
alter table public.signature_fields add constraint signature_fields_kind_check CHECK ((kind = ANY (ARRAY['signature'::text, 'date'::text, 'text'::text])));
alter table public.signature_fields add constraint signature_fields_page_check CHECK ((page >= 1));
alter table public.signature_fields add constraint signature_fields_w_check CHECK (((w > (0)::numeric) AND (w <= (1)::numeric)));
alter table public.signature_fields add constraint signature_fields_x_check CHECK (((x >= (0)::numeric) AND (x <= (1)::numeric)));
alter table public.signature_fields add constraint signature_fields_y_check CHECK (((y >= (0)::numeric) AND (y <= (1)::numeric)));
alter table public.usage_events add constraint usage_events_kind_check CHECK ((kind = ANY (ARRAY['verdict'::text, 'send'::text])));
alter table public.verdicts add constraint verdicts_confidence_check CHECK ((confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])));
alter table public.withdrawals add constraint withdrawals_amount_check CHECK ((amount > (0)::numeric));
alter table public.withdrawals add constraint withdrawals_status_check CHECK ((status = ANY (ARRAY['requested'::text, 'approved'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'rejected'::text])));

-- INDEXES

CREATE INDEX idx_grants_grantee_user ON public.access_grants USING btree (grantee_id) WHERE (grantee_type = 'user'::text);
CREATE INDEX idx_grants_resource ON public.access_grants USING btree (resource_type, resource_id);
CREATE INDEX admin_audit_kind_idx ON public.admin_audit USING btree (kind, created_at DESC);
CREATE INDEX admin_users_active_idx ON public.admin_users USING btree (user_id) WHERE (revoked_at IS NULL);
CREATE UNIQUE INDEX api_keys_hash_idx ON public.api_keys USING btree (key_hash);
CREATE INDEX api_keys_org_idx ON public.api_keys USING btree (organization_id);
CREATE INDEX api_subs_org_idx ON public.api_subscriptions USING btree (organization_id, event);
CREATE INDEX commissions_referrer_idx ON public.commissions USING btree (referrer_id, status);
CREATE INDEX commissions_ripening_idx ON public.commissions USING btree (available_at) WHERE (status = 'pending'::text);
CREATE INDEX document_variants_doc_idx ON public.document_variants USING btree (document_id);
CREATE INDEX documents_owner_id_idx ON public.documents USING btree (owner_id);
CREATE INDEX icp_profiles_asserted ON public.icp_profiles USING btree (COALESCE(organization_id, owner_id), revision DESC) WHERE ((source = 'asserted'::text) AND (status = 'complete'::text));
CREATE UNIQUE INDEX icp_profiles_one_draft ON public.icp_profiles USING btree (COALESCE(organization_id, owner_id)) WHERE (status = 'draft'::text);
CREATE UNIQUE INDEX icp_profiles_scope_revision ON public.icp_profiles USING btree (COALESCE(organization_id, owner_id), revision);
CREATE INDEX idx_invitations_org ON public.invitations USING btree (organization_id);
CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX profiles_referred_by_idx ON public.profiles USING btree (referred_by) WHERE (referred_by IS NOT NULL);
CREATE INDEX rate_limits_window_idx ON public.rate_limits USING btree (window_start);
CREATE INDEX reader_messages_document_idx ON public.reader_messages USING btree (document_id, created_at);
CREATE INDEX reader_messages_recipient_idx ON public.reader_messages USING btree (recipient_id, created_at);
CREATE INDEX recipients_document_id_idx ON public.recipients USING btree (document_id);
CREATE INDEX recipients_expires_at_idx ON public.recipients USING btree (expires_at) WHERE (expires_at IS NOT NULL);
CREATE INDEX recipients_forwarded_by_idx ON public.recipients USING btree (forwarded_by) WHERE (forwarded_by IS NOT NULL);
CREATE INDEX recipients_outcome_idx ON public.recipients USING btree (outcome) WHERE (outcome IS NOT NULL);
CREATE INDEX recipients_share_token_idx ON public.recipients USING btree (share_token);
CREATE INDEX recipients_signer_idx ON public.recipients USING btree (document_id) WHERE is_signer;
CREATE INDEX recipients_variant_idx ON public.recipients USING btree (variant_id);
CREATE INDEX report_cache_doc_idx ON public.report_cache USING btree (document_id, created_at DESC);
CREATE INDEX signals_recipient_id_idx ON public.signals USING btree (recipient_id);
CREATE INDEX signature_fields_document_idx ON public.signature_fields USING btree (document_id);
CREATE INDEX signature_objections_doc_idx ON public.signature_objections USING btree (document_id) WHERE (resolved_at IS NULL);
CREATE INDEX support_conv_status_idx ON public.support_conversations USING btree (status, last_message_at DESC);
CREATE INDEX support_conv_token_idx ON public.support_conversations USING btree (session_token);
CREATE INDEX support_msg_conv_idx ON public.support_messages USING btree (conversation_id, created_at);
CREATE INDEX usage_events_doc_kind_idx ON public.usage_events USING btree (document_id, kind, created_at);
CREATE INDEX usage_events_user_kind_idx ON public.usage_events USING btree (user_id, kind, created_at);
CREATE INDEX verdicts_document_idx ON public.verdicts USING btree (document_id);
CREATE INDEX webhook_deliveries_hook_idx ON public.webhook_deliveries USING btree (webhook_id, created_at DESC);
CREATE INDEX webhook_deliveries_hook_time ON public.webhook_deliveries USING btree (webhook_id, created_at DESC);
CREATE INDEX webhooks_org_idx ON public.webhooks USING btree (organization_id);
CREATE INDEX withdrawals_referrer_idx ON public.withdrawals USING btree (referrer_id, status);

-- VIEWS

create or replace view public.my_commissions with (security_invoker = true) as  SELECT c.id,
    c.referrer_id,
    mask_name(COALESCE(((p.first_name || ' '::text) || p.last_name), c.subscriber_email)) AS subscriber,
    mask_email(c.subscriber_email) AS subscriber_email,
    c.plan,
    c."interval",
    c.amount,
    c.currency,
    c.cycle,
    c.status,
    c.available_at,
    c.created_at
   FROM (commissions c
     LEFT JOIN profiles p ON ((p.id = c.subscriber_id)));

-- ROW LEVEL SECURITY

alter table public.access_grants enable row level security;
alter table public.admin_audit enable row level security;
alter table public.admin_users enable row level security;
alter table public.api_keys enable row level security;
alter table public.api_subscriptions enable row level security;
alter table public.app_settings enable row level security;
alter table public.commissions enable row level security;
alter table public.document_variants enable row level security;
alter table public.documents enable row level security;
alter table public.gaps_cache enable row level security;
alter table public.icp_profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.organization_members enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.rate_limits enable row level security;
alter table public.reader_messages enable row level security;
alter table public.recipients enable row level security;
alter table public.referrer_code_history enable row level security;
alter table public.referrers enable row level security;
alter table public.report_cache enable row level security;
alter table public.report_settings enable row level security;
alter table public.sales_settings enable row level security;
alter table public.signals enable row level security;
alter table public.signature_fields enable row level security;
alter table public.signature_objections enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.usage_events enable row level security;
alter table public.verdicts enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.webhooks enable row level security;
alter table public.withdrawals enable row level security;

-- POLICIES

create policy "create grants" on public.access_grants as PERMISSIVE for INSERT to public with check (((created_by = auth.uid()) AND (((resource_type = 'document'::text) AND (my_document_permission(resource_id) = 'manage'::text)) OR ((resource_type = 'project'::text) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = access_grants.resource_id) AND (p.created_by = auth.uid()))))))));
create policy "delete grants" on public.access_grants as PERMISSIVE for DELETE to public using (((created_by = auth.uid()) OR ((resource_type = 'document'::text) AND (my_document_permission(resource_id) = 'manage'::text)) OR ((resource_type = 'project'::text) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = access_grants.resource_id) AND (p.created_by = auth.uid())))))));
create policy "see grants" on public.access_grants as PERMISSIVE for SELECT to public using ((((resource_type = 'document'::text) AND can_see_document(resource_id)) OR ((resource_type = 'project'::text) AND can_see_project(resource_id))));
create policy "referrer sees own commissions" on public.commissions as PERMISSIVE for SELECT to public using ((referrer_id = auth.uid()));
create policy "create own or org documents" on public.documents as PERMISSIVE for INSERT to public with check ((((organization_id IS NULL) AND (owner_id = auth.uid())) OR ((organization_id IS NOT NULL) AND is_org_member(organization_id) AND (owner_id = auth.uid()))));
create policy "delete own or org documents" on public.documents as PERMISSIVE for DELETE to public using ((((organization_id IS NULL) AND (owner_id = auth.uid())) OR ((organization_id IS NOT NULL) AND (my_document_permission(id) = 'manage'::text))));
create policy "read own or org documents" on public.documents as PERMISSIVE for SELECT to public using (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND can_see_document(id))));
create policy "update own or org documents" on public.documents as PERMISSIVE for UPDATE to public using ((((organization_id IS NULL) AND (owner_id = auth.uid())) OR ((organization_id IS NOT NULL) AND (my_document_permission(id) = ANY (ARRAY['edit'::text, 'manage'::text])))));
create policy "icp_delete" on public.icp_profiles as PERMISSIVE for DELETE to public using (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND (my_org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])))));
create policy "icp_insert" on public.icp_profiles as PERMISSIVE for INSERT to public with check (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND (my_org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])))));
create policy "icp_select" on public.icp_profiles as PERMISSIVE for SELECT to public using (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND is_org_member(organization_id))));
create policy "icp_update" on public.icp_profiles as PERMISSIVE for UPDATE to public using (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND (my_org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text]))))) with check (((owner_id = auth.uid()) OR ((organization_id IS NOT NULL) AND (my_org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])))));
create policy "admins create invitations" on public.invitations as PERMISSIVE for INSERT to public with check ((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "admins delete invitations" on public.invitations as PERMISSIVE for DELETE to public using ((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "admins update invitations" on public.invitations as PERMISSIVE for UPDATE to public using ((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "members see org invitations" on public.invitations as PERMISSIVE for SELECT to public using (is_org_member(organization_id));
create policy "see own notifications" on public.notifications as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));
create policy "update own notifications" on public.notifications as PERMISSIVE for UPDATE to public using ((user_id = auth.uid()));
create policy "members read org roster" on public.organization_members as PERMISSIVE for SELECT to public using (is_org_member(organization_id));
create policy "owners admins add members" on public.organization_members as PERMISSIVE for INSERT to public with check (((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (user_id = auth.uid())));
create policy "owners admins remove members" on public.organization_members as PERMISSIVE for DELETE to public using (((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])) OR (user_id = auth.uid())));
create policy "owners admins update members" on public.organization_members as PERMISSIVE for UPDATE to public using ((org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "admins update their org" on public.organizations as PERMISSIVE for UPDATE to public using ((org_role(id) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "authenticated can create orgs" on public.organizations as PERMISSIVE for INSERT to public with check ((created_by = auth.uid()));
create policy "members read their orgs" on public.organizations as PERMISSIVE for SELECT to public using (is_org_member(id));
create policy "owners delete their org" on public.organizations as PERMISSIVE for DELETE to public using ((org_role(id) = 'owner'::text));
create policy "own profile read" on public.profiles as PERMISSIVE for SELECT to public using ((auth.uid() = id));
create policy "own profile update" on public.profiles as PERMISSIVE for UPDATE to public using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "own profile write" on public.profiles as PERMISSIVE for INSERT to public with check ((auth.uid() = id));
create policy "create projects" on public.projects as PERMISSIVE for INSERT to public with check ((((organization_id IS NOT NULL) AND is_org_member(organization_id)) OR ((organization_id IS NULL) AND (created_by = auth.uid()))));
create policy "manage projects delete" on public.projects as PERMISSIVE for DELETE to public using ((((organization_id IS NULL) AND (created_by = auth.uid())) OR ((organization_id IS NOT NULL) AND (org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])))));
create policy "manage projects update" on public.projects as PERMISSIVE for UPDATE to public using ((((organization_id IS NULL) AND (created_by = auth.uid())) OR ((organization_id IS NOT NULL) AND (org_role(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])))));
create policy "see projects" on public.projects as PERMISSIVE for SELECT to public using (can_see_project(id));
create policy "insert recipients" on public.recipients as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM documents d
  WHERE ((d.id = recipients.document_id) AND (((d.organization_id IS NULL) AND (d.owner_id = auth.uid())) OR ((d.organization_id IS NOT NULL) AND can_see_document(d.id)))))));
create policy "see recipients" on public.recipients as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM documents d
  WHERE ((d.id = recipients.document_id) AND (((d.organization_id IS NULL) AND (d.owner_id = auth.uid())) OR ((d.organization_id IS NOT NULL) AND can_see_document(d.id)))))));
create policy "referrer sees own codes" on public.referrer_code_history as PERMISSIVE for SELECT to public using ((referrer_id = auth.uid()));
create policy "referrer sees self" on public.referrers as PERMISSIVE for SELECT to public using ((id = auth.uid()));
create policy "referrer updates self" on public.referrers as PERMISSIVE for UPDATE to public using ((id = auth.uid()));
create policy "own report settings" on public.report_settings as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "own sales settings read" on public.sales_settings as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "own sales settings update" on public.sales_settings as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "own sales settings write" on public.sales_settings as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "insert signals" on public.signals as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM (recipients r
     JOIN documents d ON ((d.id = r.document_id)))
  WHERE ((r.id = signals.recipient_id) AND (((d.organization_id IS NULL) AND (d.owner_id = auth.uid())) OR ((d.organization_id IS NOT NULL) AND can_see_document(d.id)))))));
create policy "see signals" on public.signals as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM (recipients r
     JOIN documents d ON ((d.id = r.document_id)))
  WHERE ((r.id = signals.recipient_id) AND (((d.organization_id IS NULL) AND (d.owner_id = auth.uid())) OR ((d.organization_id IS NOT NULL) AND can_see_document(d.id)))))));
create policy "owner reads verdicts" on public.verdicts as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM (recipients r
     JOIN documents d ON ((d.id = r.document_id)))
  WHERE ((r.id = verdicts.recipient_id) AND ((d.owner_id = auth.uid()) OR ((d.organization_id IS NOT NULL) AND can_see_document(d.id)))))));
create policy "referrer sees own withdrawals" on public.withdrawals as PERMISSIVE for SELECT to public using ((referrer_id = auth.uid()));

-- TRIGGERS

CREATE TRIGGER trg_enforce_document_quota BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION enforce_document_quota();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

set check_function_bodies = on;

-- Recipient roles. A property of the person, not of any buyer profile:
-- captured once when they are added, held across every document they receive.
alter table public.recipients
  add column if not exists roles text[] not null default '{}',
  add column if not exists role_other text;

create index if not exists recipients_roles_idx
  on public.recipients using gin (roles)
  where array_length(roles, 1) > 0;

alter table public.recipients
  drop constraint if exists recipients_role_other_len;
alter table public.recipients
  add constraint recipients_role_other_len
  check (role_other is null or char_length(role_other) between 1 and 80);

alter table public.recipients
  drop constraint if exists recipients_roles_len;
alter table public.recipients
  add constraint recipients_roles_len
  check (coalesce(array_length(roles, 1), 0) <= 6);
