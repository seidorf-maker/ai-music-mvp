---
description: Unit tests for individual tRPC procedures — Zod input validation, permission/role checks, and error shapes. Use when writing or reviewing tests for any procedure in PRD Section 5.
---

## Instructions

1. For each procedure, cover at minimum: valid input succeeds; invalid input (wrong type, out-of-range length) is rejected by Zod before it reaches business logic; a caller below the required role gets a permission error, not a silent success or a 500.
2. Test against the actual role table in `research/PRD.md` Section 5, not assumptions — e.g., `comments.create` must succeed for `viewer`, while `generations.create` must not.
3. Mock `suno-provider-adapter` and Stripe calls in these tests — this skill covers procedure-level logic, not live third-party integration (that's `generation-flow-e2e-test`).
4. Rate-limited procedures should have a test confirming the limit actually triggers, not just that the happy path works.

## References

- `research/PRD.md` Section 5 (full procedure table)
- [tRPC testing](https://trpc.io/docs/server/server-side-calls)
- [Vitest](https://vitest.dev/)
