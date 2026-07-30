# Joye Life v3.2.2 — Closed Beta

Joye Life is an invite-only personal planning application built with Next.js, Supabase, and Vercel.

## Included

- Closed-beta applications, admin approval, secure invites, and required onboarding
- Personalized Today brief with upcoming bills and check-ins
- Paycheck-based Money planning with bills, debt, payment history, and saved allocations
- Guided Career planning with a three-phase path and evidence library
- Adaptive Goals that begin with natural-language input
- Weekly planning connected to goals and career actions
- Contextual Ask Joye, editable Memory, and Journey history
- Founding Beta status, legal starter pages, and mobile-ready navigation

## v3.2.2 coaching safeguards

Guided mode now recognizes common planning topics including fitness, protein and nutrition structure, meal prep, sleep routines, stress, home preparation, money, career, goals, and weekly planning. It no longer substitutes an unrelated goal when it cannot find a real topic match.

Optional live AI now has server-enforced daily, monthly, and per-minute limits. When AI is disabled, unavailable, or over quota, Joye switches to guided planning.

## Deploy

1. Replace the repository contents with this folder while preserving all folders.
2. Run all migrations in order, including `012_beta_launch_context_coach_memory.sql`.
3. Run `013_ai_usage_limits.sql` before enabling live AI.
4. Confirm Vercel variables from `.env.example`.
5. Complete `LAUNCH-CHECKLIST.md` before inviting testers.

See `AI-BETA-SETUP.md` for guided-only and limited-AI configurations.
