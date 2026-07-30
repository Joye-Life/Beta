# AI beta setup

## Guided-only beta

Use this when you do not want API charges:

```env
AI_ENABLED=false
```

The OpenAI key may remain stored in Vercel. The route will not call OpenAI while the switch is false.

## Limited AI-enhanced beta

First run:

```text
supabase/migrations/013_ai_usage_limits.sql
```

Then set:

```env
AI_ENABLED=true
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
AI_DAILY_LIMIT=10
AI_MONTHLY_LIMIT=100
AI_MINUTE_LIMIT=4
AI_MAX_OUTPUT_TOKENS=500
```

Limits are enforced on the server per user. When a member reaches a limit, Joye automatically uses guided planning instead of sending another paid request.
