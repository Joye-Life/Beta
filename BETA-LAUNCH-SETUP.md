# Joye Life v3.2.2 — Beta Launch Setup

## 1. Deploy the code
Replace the repository contents with this package, commit to `main`, and allow Vercel to deploy.

## 2. Run migrations
Run every migration in numerical order. The newest migration is:

```text
supabase/migrations/013_ai_usage_limits.sql
```

Migration 013 is required before `AI_ENABLED=true`. Guided-only mode can remain disabled while the migration is being prepared.

## 3. Required Vercel variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL=https://joye-life.vercel.app`
- `ADMIN_EMAIL`

For invitation email delivery:
- `RESEND_API_KEY`
- `EMAIL_FROM`

Guided-only beta:
- `AI_ENABLED=false`

Limited AI-enhanced beta:
- `AI_ENABLED=true`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4.1-mini`
- `AI_DAILY_LIMIT=10`
- `AI_MONTHLY_LIMIT=100`
- `AI_MINUTE_LIMIT=4`
- `AI_MAX_OUTPUT_TOKENS=500`

## 4. Beta smoke test
1. Submit and approve a beta application.
2. Create the invited account and complete onboarding.
3. Save one bill, debt, paycheck plan, career plan, adaptive goal, and weekly plan.
4. Ask about gym consistency, protein, meal prep, money, career, and the current week.
5. Confirm Joye does not attach an unrelated goal to an unmatched question.
6. When AI is enabled, confirm the remaining-message count decreases.
7. Test the limit by temporarily setting `AI_DAILY_LIMIT=1`.
8. Add and delete a Memory note.
9. Submit feedback.
10. Test on an iPhone-sized browser and desktop.

## 5. Public-facing language
Keep the product labeled `Private Beta` or `Founding Beta`. Do not promise professional financial, legal, nutrition, or medical advice.
