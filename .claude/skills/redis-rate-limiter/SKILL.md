---
description: Implements token-bucket rate limiting via Upstash Redis, most importantly the generation endpoint's per-org cap. Use when adding rate limits to any tRPC procedure.
---

## Instructions

1. Build one reusable helper, `checkRateLimit(key, limit, window)`, applied as tRPC middleware — don't reimplement bucket logic per-procedure.
2. The generation limit (10/min/org per `research/PRD.md` Section 5) is the one that matters most in this project: it exists to cap runaway Suno API spend, not primarily to stop abuse. Don't loosen it without understanding that's the reason it's there.
3. Key by `org_id` for spend-related limits (generation, stems) since cost is org-scoped; key by `user_id` for abuse-adjacent limits (comments, invites).
4. On limit exceeded, return a clear typed error the frontend can render as "you've hit the generation limit, try again in a moment" — not a generic failure (see `generation-error-messaging`).

## References

- `research/PRD.md` Section 5 (rate limit column per procedure)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Upstash Ratelimit SDK](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
