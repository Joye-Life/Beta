# Joye Life v3.2.2 — Mobile and AI behavior

## Mobile behavior

- Four primary mobile destinations plus a More menu.
- Safe-area spacing for iPhones with a home indicator.
- Touch targets sized for phones.
- 16px mobile input text to avoid iOS form zoom.
- Sticky mobile header, long-text wrapping, and compact cards.
- Ask Joye responses use narrow mobile-friendly line lengths and concise action lists.

## Guided mode

With `AI_ENABLED=false`, Joye uses the structured guided planner and sends no OpenAI requests. It supports common planning areas such as money, career, goals, weekly planning, gym consistency, nutrition structure, meal prep, sleep routines, stress, and home preparation.

The guided planner now refuses to attach an unrelated goal when a real topic match is missing. It asks for a focused detail instead.

## AI-enhanced mode

With `AI_ENABLED=true`, an API key, the Supabase secret, and migration 013 installed, Joye may use live AI. Server-side daily, monthly, and per-minute limits are enforced. Token usage is recorded. When AI fails or reaches a limit, Joye automatically returns to guided planning.
