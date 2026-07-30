# Joye Life v3.2.2

## Safer guided coaching

- Added dedicated guided responses for nutrition, protein planning, meal prep, sleep routines, stress, fitness, home preparation, money, career, goals, and weekly planning.
- Added typo tolerance for short common terms such as `gym`.
- Guided goal matching now requires a real topic match and will not attach an unrelated saved goal.
- Short follow-up questions can inherit the topic from recent user messages.
- Unknown questions now ask for one missing detail instead of returning an unrelated career or goal answer.
- Goal context now includes optional target value, current value, and unit when those fields are relevant.

## Controlled AI enhancement

- Added server-enforced per-user daily, monthly, and per-minute limits.
- Added AI usage records with model and token counts.
- Added a visible remaining-message counter.
- Added automatic guided fallback when AI is disabled, unavailable, or over quota.
- Added a master `AI_ENABLED` switch and configurable output limit.

## Required migration

Run `supabase/migrations/013_ai_usage_limits.sql` before enabling live AI. Guided-only mode does not call the OpenAI API.
