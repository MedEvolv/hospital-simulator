-- Institutional Mirror access allowlist
-- Paste in the Supabase SQL editor if the CLI workflow is not wired.
-- OTP send/verify stay fail-closed until this table exists: unknown and
-- pending emails never receive a code. Seeded founder emails can still OTP.
-- The app does not mail-merge applicants. Bhai writes from the queue by hand.

create table if not exists public.mirror_access_requests (
  id uuid primary key default gen_random_uuid(),
  work_email text not null unique,
  full_name text not null,
  role text not null,
  organisation text not null,
  organisation_type text not null check (
    organisation_type in ('hospital', 'lab', 'insurer', 'vendor', 'researcher', 'other')
  ),
  organisation_type_other text,
  city text not null,
  linkedin_url text not null,
  mirror_for text[] not null,
  mirror_for_other text,
  use_sentence text not null,
  attest_rehearsal_only boolean not null default false,
  attest_not_certification boolean not null default false,
  attest_authorised boolean not null default false,
  contact_ok boolean not null default false,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'denied', 'revoked')
  ),
  deny_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  denied_at timestamptz,
  revoked_at timestamptz,
  constraint mirror_access_attests_required check (
    attest_rehearsal_only
    and attest_not_certification
    and attest_authorised
    and contact_ok
  )
);

alter table public.mirror_access_requests
  add column if not exists linkedin_url text;
alter table public.mirror_access_requests
  add column if not exists contact_ok boolean not null default false;

update public.mirror_access_requests
set
  linkedin_url = coalesce(nullif(linkedin_url, ''), 'https://www.linkedin.com/in/dr-ishaan-wadhwa-98a017244'),
  contact_ok = true
where linkedin_url is null or linkedin_url = '' or contact_ok is not true;

alter table public.mirror_access_requests
  alter column linkedin_url set not null;

alter table public.mirror_access_requests
  drop constraint if exists mirror_access_attests_required;
alter table public.mirror_access_requests
  add constraint mirror_access_attests_required check (
    attest_rehearsal_only
    and attest_not_certification
    and attest_authorised
    and contact_ok
  );

create index if not exists mirror_access_requests_status_idx
  on public.mirror_access_requests (status, created_at desc);

alter table public.mirror_access_requests enable row level security;

revoke all on public.mirror_access_requests from public;
grant insert on public.mirror_access_requests to anon;
grant all on public.mirror_access_requests to service_role;

drop policy if exists mirror_access_anon_insert_pending on public.mirror_access_requests;
create policy mirror_access_anon_insert_pending
  on public.mirror_access_requests
  for insert
  to anon
  with check (
    status = 'pending'
    and approved_at is null
    and denied_at is null
    and revoked_at is null
    and deny_reason is null
    and attest_rehearsal_only = true
    and attest_not_certification = true
    and attest_authorised = true
    and contact_ok = true
  );

insert into public.mirror_access_requests (
  work_email,
  full_name,
  role,
  organisation,
  organisation_type,
  organisation_type_other,
  city,
  linkedin_url,
  mirror_for,
  use_sentence,
  attest_rehearsal_only,
  attest_not_certification,
  attest_authorised,
  contact_ok,
  status,
  approved_at
) values
  (
    'dr.ishaan@medevolv.in',
    'Dr. Ishaan Wadhwa',
    'Founder',
    'ArchLife',
    'other',
    'Estate',
    'Delhi',
    'https://www.linkedin.com/in/dr-ishaan-wadhwa-98a017244',
    array['DPDP'],
    'Seeded founder access so the rehearsal door and the access queue can be reached.',
    true,
    true,
    true,
    true,
    'approved',
    now()
  ),
  (
    'hello@archlife.in',
    'ArchLife',
    'Founder',
    'ArchLife',
    'other',
    'Estate',
    'Delhi',
    'https://www.linkedin.com/in/dr-ishaan-wadhwa-98a017244',
    array['DPDP'],
    'Seeded public work email from the ArchLife site so the door can be reached.',
    true,
    true,
    true,
    true,
    'approved',
    now()
  )
on conflict (work_email) do nothing;
