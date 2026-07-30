alter table public.profiles
  add column if not exists check_in_interval_hours integer not null default 6,
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists last_check_in_at timestamptz;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text not null default 'general',
  rating integer check (rating between 1 and 5),
  message text not null,
  can_contact boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.feedback
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists category text not null default 'general',
  add column if not exists rating integer,
  add column if not exists message text,
  add column if not exists can_contact boolean not null default false,
  add column if not exists status text not null default 'new',
  add column if not exists created_at timestamptz not null default now();
alter table public.feedback enable row level security;
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback for insert with check (auth.uid() = user_id);
drop policy if exists "feedback_read_own" on public.feedback;
create policy "feedback_read_own" on public.feedback for select using (auth.uid() = user_id);
