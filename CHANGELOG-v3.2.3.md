# Joye Life v3.2.3

## Build fix

- Guarantees the coach conversation ID is a non-null string before it is passed to AI usage tracking or message queries.
- Fixes the Next.js TypeScript production-build error in `app/api/coach/route.ts`.
- No Supabase migration is required.
