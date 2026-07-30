# Joye Life admin access

1. In Vercel, set `ADMIN_EMAIL` to the exact email address you will use for the owner account.
2. In Supabase SQL Editor, run `supabase/migrations/002_admin_roles.sql` after migration 001.
3. Create an account at `/signup` with that exact email and verify it.
4. Sign in and visit `/admin/applications`.

On the first authenticated admin-page visit, the server compares the signed-in email with `ADMIN_EMAIL` and assigns that profile the `owner` role. Other accounts must already have `owner` or `admin` in `profiles.role` to enter admin pages.

## Promote another administrator

Run this in Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin', access_status = 'active'
where lower(email) = lower('person@example.com');
```

## Remove administrator access

```sql
update public.profiles
set role = 'user'
where lower(email) = lower('person@example.com');
```
