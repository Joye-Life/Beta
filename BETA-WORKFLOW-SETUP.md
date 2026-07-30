# Closed beta setup

1. Run `supabase/migrations/005_closed_beta_invites.sql` in Supabase SQL Editor.
2. Confirm Vercel has `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, and `SUPABASE_SECRET_KEY`.
3. Optional email delivery:
   - Create a Resend API key.
   - Add `RESEND_API_KEY` to Vercel.
   - Add `EMAIL_FROM`, such as `Joye Life <onboarding@yourverifieddomain.com>`.
   - Before verifying a domain, Resend test-mode restrictions may limit recipients.
4. Redeploy after changing environment variables.
5. Visit `/admin/applications`, approve an applicant, and either confirm the email was sent or copy the generated secure link.
6. The applicant creates an account through `/invite/<token>` and is sent directly to required onboarding.

Invites expire after seven days and are one-time use. Clicking **New invite** invalidates the previous link and creates another.
