create table if not exists public.income_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gross_monthly_income numeric(12,2) not null default 0,
  typical_take_home numeric(12,2) not null default 0,
  pay_frequency text not null default 'biweekly',
  next_payday date,
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_day integer check (due_day between 1 and 31),
  frequency text not null default 'monthly',
  essential boolean not null default true,
  autopay boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  debt_type text not null default 'credit_card',
  balance numeric(12,2) not null default 0,
  minimum_payment numeric(12,2) not null default 0,
  interest_rate numeric(7,3) not null default 0,
  credit_limit numeric(12,2),
  due_day integer check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists public.paycheck_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paycheck_date date not null,
  paycheck_amount numeric(12,2) not null check (paycheck_amount >= 0),
  allocations jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.income_profiles enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.debts enable row level security;
alter table public.paycheck_plans enable row level security;

drop policy if exists "income_profiles_own_all" on public.income_profiles;
create policy "income_profiles_own_all" on public.income_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recurring_bills_own_all" on public.recurring_bills;
create policy "recurring_bills_own_all" on public.recurring_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "debts_own_all" on public.debts;
create policy "debts_own_all" on public.debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "paycheck_plans_own_all" on public.paycheck_plans;
create policy "paycheck_plans_own_all" on public.paycheck_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists recurring_bills_user_id_idx on public.recurring_bills(user_id);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists paycheck_plans_user_id_date_idx on public.paycheck_plans(user_id, paycheck_date desc);
