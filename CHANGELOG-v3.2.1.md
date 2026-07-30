# Joye Life v3.2.1 — Intent-aware guided coach

- Fixed guided Ask Joye returning the same unrelated response for different questions.
- Added intent routing for home buying, fitness, debt, purchases, budgeting, career, goals, weekly planning, and daily focus.
- Guided answers now acknowledge missing information and ask a focused follow-up instead of inventing details.
- Added a visible Guided fallback label when configured live AI fails.
- Added Start fresh and made topic changes begin a clean contextual conversation instead of mixing sections.
- Added `AI_ENABLED` as an explicit emergency switch. Live AI runs only when `AI_ENABLED=true` and `OPENAI_API_KEY` is present.
- Changed the documented fallback model to `gpt-4.1-mini`.
- No Supabase migration is required.
