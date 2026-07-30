-- Joye Life v3.2.0 beta launch: plan status, contextual coach, and editable memory.

create sequence if not exists public.beta_member_number_seq start 1;

alter table public.profiles
  add column if not exists plan_tier text not null default 'founding_beta',
  add column if not exists beta_joined_at timestamptz not null default now(),
  add column if not exists beta_member_number bigint;

update public.profiles
set beta_member_number = nextval('public.beta_member_number_seq')
where beta_member_number is null;

alter table public.profiles
  alter column beta_member_number set default nextval('public.beta_member_number_seq');

create unique index if not exists profiles_beta_member_number_key
  on public.profiles(beta_member_number)
  where beta_member_number is not null;

alter table public.joye_memory
  add column if not exists label text,
  add column if not exists source text not null default 'system',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.joye_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null default 'general' check (section in ('today','money','career','goals','weekly','general')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.joye_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.joye_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.joye_conversations enable row level security;
alter table public.joye_messages enable row level security;

drop policy if exists "conversations_own_all" on public.joye_conversations;
create policy "conversations_own_all" on public.joye_conversations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_own_all" on public.joye_messages;
create policy "messages_own_all" on public.joye_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "memory_own_update" on public.joye_memory;
create policy "memory_own_update" on public.joye_memory
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "memory_own_delete" on public.joye_memory;
create policy "memory_own_delete" on public.joye_memory
for delete using (auth.uid() = user_id);

create index if not exists joye_conversations_user_updated_idx
  on public.joye_conversations(user_id, section, updated_at desc);
create index if not exists joye_messages_conversation_created_idx
  on public.joye_messages(conversation_id, created_at);
create index if not exists joye_memory_user_importance_idx
  on public.joye_memory(user_id, importance desc, created_at desc);
