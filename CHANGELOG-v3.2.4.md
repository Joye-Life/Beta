# Joye Life v3.2.4

## Stateful guided conversations

- Fixes guided Ask Joye repeating its opening meal-prep response after the member answers a follow-up question.
- Uses the newest conversation messages rather than the oldest messages when building context.
- Carries meal-prep details forward across turns, including people, meal types, and number of prep days.
- Calculates total portions for 2-day and 3-day plans without inventing food preferences.
- Uses stated protein targets and meal counts to create a per-meal structure.
- Uses stated workout frequency and named weekdays to create a repeatable fitness schedule.
- No Supabase migration is required.
