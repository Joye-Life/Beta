-- Required first-login onboarding fields for Joye Life v3.0.3.
alter table public.profiles
  add column if not exists biggest_challenge text,
  add column if not exists desired_outcome text,
  add column if not exists planning_style text default 'balanced',
  add column if not exists onboarding_completed_at timestamptz;

-- Keep planning style constrained without breaking existing rows.
do $$ begin
  alter table public.profiles
    add constraint profiles_planning_style_check
    check (planning_style in ('gentle','balanced','direct'));
exception when duplicate_object then null; end $$;
