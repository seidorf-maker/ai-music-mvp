---
description: Verifies every required environment variable is present by name in each environment, and that no secret has leaked into committed code or the client bundle. Use before deploying, and whenever a new external dependency is added.
disable-model-invocation: true
---

## Instructions

1. Check the current `.env.example` against the full list in `CLAUDE.md` Section 6 — flag any variable used in code but missing from the example file, and vice versa.
2. Grep for accidental hardcoded secrets in source (API keys, connection strings) — this check exists specifically because `CLAUDE.md` Section 4 prohibits committing secrets even in example/test files.
3. Confirm no `NEXT_PUBLIC_*`-prefixed variable holds a secret value — anything with that prefix ships to the client bundle by Next.js convention, so only genuinely public values (e.g., `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`) belong there.
4. Run this per environment (local, Netlify deploy previews, production) since a variable set locally but forgotten in Netlify's dashboard is a common, easy-to-miss failure mode.

## References

- `CLAUDE.md` Section 6 (full environment variable list)
- [Netlify environment variables](https://docs.netlify.com/environment-variables/overview/)
