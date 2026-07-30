create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('bill','debt')),
  source_id uuid not null,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id, due_date)
);

create table if not exists public.career_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  milestone_type text not null default 'skill',
  target_date date,
  status text not null default 'planned' check (status in ('planned','in_progress','completed')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.career_plans
  add column if not exists target_date date,
  add column if not exists current_salary numeric(12,2),
  add column if not exists target_salary numeric(12,2),
  add column if not exists weekly_hours numeric(6,2) not null default 2;

alter table public.goals
  add column if not exists category text not null default 'personal',
  add column if not exists target_value numeric(12,2),
  add column if not exists current_value numeric(12,2) not null default 0,
  add column if not exists unit text,
  add column if not exists priority integer not null default 2 check (priority between 1 and 3);

create table if not exists public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  title text not null,
  day_of_week integer check (day_of_week between 1 and 7),
  minutes integer not null default 30,
  source_type text,
  source_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_records enable row level security;
alter table public.career_milestones enable row level security;
alter table public.goal_steps enable row level security;
alter table public.weekly_actions enable row level security;

drop policy if exists "payment_records_own_all" on public.payment_records;
create policy "payment_records_own_all" on public.payment_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "career_milestones_own_all" on public.career_milestones;
create policy "career_milestones_own_all" on public.career_milestones for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "goal_steps_own_all" on public.goal_steps;
create policy "goal_steps_own_all" on public.goal_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "weekly_actions_own_all" on public.weekly_actions;
create policy "weekly_actions_own_all" on public.weekly_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists payment_records_user_due_idx on public.payment_records(user_id, due_date desc);
create index if not exists career_milestones_user_idx on public.career_milestones(user_id, status, target_date);
create index if not exists goal_steps_goal_idx on public.goal_steps(goal_id, completed_at);
create index if not exists weekly_actions_user_week_idx on public.weekly_actions(user_id, week_start, day_of_week);
