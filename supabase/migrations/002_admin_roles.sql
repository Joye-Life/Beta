-- Joye Life v3 role-based access control.
-- Run after 001_v3_foundation.sql.

do $$ begin
  create type public.app_role as enum ('owner','admin','beta_tester','user');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'user';

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role in ('owner','admin')
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Admins may review beta applications. Public submissions continue through
-- the server-side API using the Supabase secret key.
drop policy if exists "applications_admin_select" on public.beta_applications;
create policy "applications_admin_select"
on public.beta_applications
for select
to authenticated
using (public.is_admin());

drop policy if exists "applications_admin_update" on public.beta_applications;
create policy "applications_admin_update"
on public.beta_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Owners/admins may read profiles for user administration. A user can still
-- read and update their own profile through the original policies.
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
