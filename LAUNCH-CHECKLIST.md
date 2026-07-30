# Joye Life — Closed Beta Launch Checklist

## Required before inviting testers

- [ ] Run every migration through `012_beta_launch_context_coach_memory.sql` in order.
- [ ] Run `013_ai_usage_limits.sql` before setting `AI_ENABLED=true`.
- [ ] Confirm Vercel Production variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`.
- [ ] Confirm Supabase Site URL and redirect URL use the production Vercel domain.
- [ ] Test: apply → approve → invite link → account creation → onboarding → dashboard.
- [ ] Test one save action in Money, Career, Goals, Weekly, Profile, Memory, and Feedback.
- [ ] Test Ask Joye with gym consistency, protein, meal prep, money, career, and an unsupported topic.
- [ ] Confirm guided mode does not attach an unrelated goal to an unmatched question.
- [ ] Test mobile navigation and paycheck planning on a phone.
- [ ] Confirm owner can access `/admin/applications` and normal testers cannot.
- [ ] Keep Resend manual-link fallback until a sending domain is verified.

## AI choice for beta

Guided-only beta:

```env
AI_ENABLED=false
```

Limited AI beta: run migration 013, set `AI_ENABLED=true`, and configure the limits in `.env.example`. Confirm the remaining-message counter changes after each AI-enhanced response.

## First beta cohort

Invite 5–10 people first. Ask them to complete onboarding, create a paycheck plan, create one adaptive goal, build a career direction, use Ask Joye, and submit feedback. Fix blockers before expanding to 25 testers.
