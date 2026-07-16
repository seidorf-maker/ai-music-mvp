---
description: One-time setup of the Turborepo structure — apps/web, packages/api, packages/db, packages/config. Use to bootstrap this repository before any implementation begins.
disable-model-invocation: true
---

Nothing has been built yet (`CLAUDE.md` Section 3) — this is the first real implementation step, before any feature code.

## Instructions

1. Initialize git first if it hasn't been already (`CLAUDE.md` notes this project isn't a git repo yet) — confirm with the user before running `git init`, since this is the kind of setup action worth a quick check.
2. Create the layout from `research/tech-stack.md` Section 1 and `CLAUDE.md` Section 5:
   ```
   apps/web/         # Next.js app
   packages/api/      # tRPC routers
   packages/db/        # Drizzle schema + migrations
   packages/config/     # shared tsconfig/eslint
   ```
3. Wire up Turborepo (`turbo.json`) and workspace `package.json`s so `packages/api` and `packages/db` are consumable by `apps/web` via workspace references — this is what makes tRPC's end-to-end type inference work across the monorepo.
4. Don't scaffold the future `apps/mobile` (Expo) directory yet — that's explicitly phase 2 (`research/PRD.md` Section 7).
5. After scaffolding, update `CLAUDE.md` Section 5's "current actual structure" to match reality.

## References

- `research/tech-stack.md` Section 1 and Section 6 (integration map)
- `CLAUDE.md` Section 5 (planned structure)
- [Turborepo docs](https://turbo.build/repo/docs)
