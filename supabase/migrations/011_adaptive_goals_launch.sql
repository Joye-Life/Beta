alter table public.goals
  add column if not exists goal_type text not null default 'personal',
  add column if not exists tracking_mode text not null default 'milestones',
  add column if not exists weekly_frequency integer,
  add column if not exists success_definition text,
  add column if not exists original_input text,
  add column if not exists obstacle text,
  add column if not exists motivation text;

create table if not exists public.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  check_in_date date not null default current_date,
  value numeric(10,2) not null default 1,
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, goal_id, check_in_date)
);

alter table public.goal_checkins enable row level security;
drop policy if exists "goal_checkins_own_all" on public.goal_checkins;
create policy "goal_checkins_own_all" on public.goal_checkins
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists goal_checkins_user_week_idx on public.goal_checkins(user_id, check_in_date desc);
create index if not exists goals_user_type_idx on public.goals(user_id, goal_type, status);
