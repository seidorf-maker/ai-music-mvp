---
description: Keeps the repo README (install steps, required env vars, how to run locally) in sync with the actual monorepo structure. Use after scaffolding changes or when onboarding steps go stale.
disable-model-invocation: true
---

## Instructions

1. Cover: prerequisites, install command, required environment variables (names only, pointing to `CLAUDE.md` Section 6 rather than duplicating the list), and the local dev run command.
2. Verify the documented steps actually work by checking them against the current `package.json` scripts and `.env.example` — don't describe an aspirational setup that doesn't match the real scaffold.
3. Keep this to onboarding mechanics, not product context — link to `research/PRD.md` and `CLAUDE.md` for the "what and why" rather than duplicating it here.

## References

- `CLAUDE.md` (project overview, env vars)
- `research/tech-stack.md` Section 1 (planned monorepo layout)
