-- Closed beta application review and secure invitation workflow.
-- Run after migrations 001-004.

alter type public.application_status add value if not exists 'waitlisted';

alter table public.beta_applications
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_sent_at timestamptz,
  add column if not exists invite_used_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create unique index if not exists beta_applications_invite_token_hash_key
  on public.beta_applications(invite_token_hash)
  where invite_token_hash is not null;

create index if not exists beta_applications_status_created_idx
  on public.beta_applications(status, created_at desc);
