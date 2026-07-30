# Guidance, feedback, and check-ins

1. Upload the project contents to the GitHub repository root.
2. Run `supabase/migrations/006_guidance_feedback_checkins.sql` in Supabase SQL Editor.
3. Redeploy Vercel.
4. Sign in and visit Profile to select a check-in interval.
5. The first due check-in appears as an in-app banner. `Enable alerts` requests browser notification permission.

The limited guidance is deterministic and uses saved account data. It does not call a paid model. The same database context is ready for future AI conversations, including active goals and weekly-plan memories.
