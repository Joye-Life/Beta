create table if not exists public.financial_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paycheck_amount numeric(12,2) not null default 0,
  upcoming_bills numeric(12,2) not null default 0,
  available_margin numeric(12,2) not null default 0,
  top_priority text,
  updated_at timestamptz not null default now()
);
create table if not exists public.career_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_role text,
  target_role text,
  next_milestone text,
  updated_at timestamptz not null default now()
);
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  most_important_result text,
  progress_result text,
  relief_result text,
  guardrail text,
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);
alter table public.financial_profiles enable row level security;
alter table public.career_plans enable row level security;
alter table public.weekly_plans enable row level security;
create policy "financial_own_all" on public.financial_profiles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "career_own_all" on public.career_plans for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "weekly_own_all" on public.weekly_plans for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
