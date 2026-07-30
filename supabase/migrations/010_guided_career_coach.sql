alter table public.career_plans
  add column if not exists years_experience numeric(5,1),
  add column if not exists responsibilities text,
  add column if not exists current_skills text,
  add column if not exists desired_salary_min numeric(12,2),
  add column if not exists desired_salary_max numeric(12,2),
  add column if not exists work_preference text,
  add column if not exists biggest_barrier text,
  add column if not exists career_setup_complete boolean not null default false,
  add column if not exists plan_summary text,
  add column if not exists skill_gaps text[] not null default '{}',
  add column if not exists build_phase text[] not null default '{}',
  add column if not exists prove_phase text[] not null default '{}',
  add column if not exists move_phase text[] not null default '{}';

create table if not exists public.career_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  evidence_type text not null default 'achievement' check (evidence_type in ('achievement','project','certification','praise','metric','resume_bullet')),
  description text,
  result text,
  happened_on date,
  created_at timestamptz not null default now()
);

alter table public.career_evidence enable row level security;

drop policy if exists "career_evidence_own_all" on public.career_evidence;
create policy "career_evidence_own_all"
on public.career_evidence
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists career_evidence_user_idx on public.career_evidence(user_id, happened_on desc, created_at desc);
