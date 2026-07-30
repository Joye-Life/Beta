-- Joye Life v3.2.2: server-enforced AI quotas and usage records.

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.joye_conversations(id) on delete set null,
  model text not null,
  status text not null default 'reserved' check (status in ('reserved','success','error')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  request_id text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.ai_usage_events enable row level security;

drop policy if exists "ai_usage_own_select" on public.ai_usage_events;
create policy "ai_usage_own_select" on public.ai_usage_events
for select using (auth.uid() = user_id);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events(user_id, created_at desc);
create index if not exists ai_usage_events_user_status_created_idx
  on public.ai_usage_events(user_id, status, created_at desc);

create or replace function public.reserve_ai_usage(
  p_user_id uuid,
  p_conversation_id uuid,
  p_model text,
  p_daily_limit integer,
  p_monthly_limit integer,
  p_minute_limit integer
)
returns table (
  allowed boolean,
  reason text,
  event_id uuid,
  daily_used integer,
  monthly_used integer,
  minute_used integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily integer;
  v_monthly integer;
  v_minute integer;
  v_event uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.ai_usage_events
  set status = 'error', completed_at = now(), error_code = 'reservation_timeout'
  where user_id = p_user_id
    and status = 'reserved'
    and created_at < now() - interval '5 minutes';

  select count(*)::integer into v_daily
  from public.ai_usage_events
  where user_id = p_user_id
    and status in ('reserved','success')
    and created_at >= date_trunc('day', now());

  select count(*)::integer into v_monthly
  from public.ai_usage_events
  where user_id = p_user_id
    and status in ('reserved','success')
    and created_at >= date_trunc('month', now());

  select count(*)::integer into v_minute
  from public.ai_usage_events
  where user_id = p_user_id
    and status in ('reserved','success')
    and created_at >= now() - interval '1 minute';

  if v_minute >= greatest(p_minute_limit, 1) then
    return query select false, 'minute_limit', null::uuid, v_daily, v_monthly, v_minute;
    return;
  end if;

  if v_daily >= greatest(p_daily_limit, 1) then
    return query select false, 'daily_limit', null::uuid, v_daily, v_monthly, v_minute;
    return;
  end if;

  if v_monthly >= greatest(p_monthly_limit, 1) then
    return query select false, 'monthly_limit', null::uuid, v_daily, v_monthly, v_minute;
    return;
  end if;

  insert into public.ai_usage_events (user_id, conversation_id, model, status)
  values (p_user_id, p_conversation_id, p_model, 'reserved')
  returning id into v_event;

  return query select true, 'allowed', v_event, v_daily + 1, v_monthly + 1, v_minute + 1;
end;
$$;

create or replace function public.finalize_ai_usage(
  p_event_id uuid,
  p_status text,
  p_input_tokens integer default 0,
  p_output_tokens integer default 0,
  p_total_tokens integer default 0,
  p_request_id text default null,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events
  set status = case when p_status = 'success' then 'success' else 'error' end,
      input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
      output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
      total_tokens = greatest(coalesce(p_total_tokens, 0), 0),
      request_id = p_request_id,
      error_code = p_error_code,
      completed_at = now()
  where id = p_event_id;
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, uuid, text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.finalize_ai_usage(uuid, text, integer, integer, integer, text, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, uuid, text, integer, integer, integer) to service_role;
grant execute on function public.finalize_ai_usage(uuid, text, integer, integer, integer, text, text) to service_role;
