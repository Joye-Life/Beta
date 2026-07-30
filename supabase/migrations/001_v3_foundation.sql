-- Joye Life v3 foundation. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

do $$ begin
  create type public.application_status as enum ('pending','approved','rejected','invited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.access_status as enum ('pending','active','suspended');
exception when duplicate_object then null; end $$;

create table if not exists public.beta_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text,
  primary_focus text not null,
  biggest_challenge text not null,
  desired_outcome text not null,
  expected_frequency text not null,
  status public.application_status not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  timezone text not null default 'America/New_York',
  access_status public.access_status not null default 'pending',
  onboarding_complete boolean not null default false,
  primary_focus text,
  available_minutes integer not null default 30 check (available_minutes between 0 and 1440),
  energy text not null default 'medium' check (energy in ('low','medium','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  minutes integer not null default 30 check (minutes between 5 and 1440),
  priority integer not null default 3 check (priority between 1 and 5),
  due_date timestamptz,
  completed_at timestamptz,
  goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.joye_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null,
  content jsonb not null,
  importance integer not null default 3 check (importance between 1 and 5),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.beta_applications enable row level security;
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.joye_memory enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "goals_own_all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_own_all" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memory_own_select" on public.joye_memory for select using (auth.uid() = user_id);
create policy "memory_own_insert" on public.joye_memory for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,display_name,access_status)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name',''),'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
