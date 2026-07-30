alter table public.recurring_bills
  add column if not exists due_date date;

alter table public.debts
  add column if not exists due_date date;

create index if not exists recurring_bills_user_due_date_idx
  on public.recurring_bills(user_id, due_date);

create index if not exists debts_user_due_date_idx
  on public.debts(user_id, due_date);
