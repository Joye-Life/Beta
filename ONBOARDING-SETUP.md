# Required onboarding setup

1. Upload v3.0.3 to GitHub.
2. Run `supabase/migrations/004_required_onboarding.sql` in Supabase SQL Editor.
3. Redeploy Vercel.

After deployment, any signed-in user whose `profiles.onboarding_complete` is false is automatically redirected to `/onboarding`.

To retest onboarding with an existing account, run this in Supabase SQL Editor after replacing the UUID:

```sql
update public.profiles
set onboarding_complete = false,
    onboarding_completed_at = null
where id = 'USER_UUID_HERE';
```

Or toggle `onboarding_complete` to false in Table Editor → profiles.
