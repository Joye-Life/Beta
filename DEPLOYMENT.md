# Deployment checklist

1. Download or tag the current working repository before replacing it.
2. Extract this package and upload its contents to the repository root while preserving every folder.
3. Run all Supabase migrations in numerical order through `012_beta_launch_context_coach_memory.sql`.
4. Run `013_ai_usage_limits.sql` before enabling live AI.
5. In Vercel, confirm:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_EMAIL`
   - `RESEND_API_KEY` and `EMAIL_FROM` when email delivery is used
   - AI settings from `.env.example` when AI enhancement is enabled
6. Vercel Framework Preset: Next.js.
7. Root Directory: `./`.
8. Redeploy without the old build cache after major dependency or configuration changes.
9. Test `/`, `/apply`, `/login`, `/dashboard`, `/dashboard/coach`, and `/admin/applications`.
10. Press **Start fresh** in Ask Joye before testing the new guided responses so old conversation messages do not create confusion.
