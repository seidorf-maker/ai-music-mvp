---
description: Generates/updates human-readable API reference documentation from the actual tRPC router source, kept in sync as procedures change. Use after adding, removing, or changing a tRPC procedure.
disable-model-invocation: true
---

## Instructions

1. Read the current router source files in `packages/api`, not `research/PRD.md` Section 5 — the PRD table is the original spec, but the code is the current truth once implementation has diverged from it.
2. For each procedure, document: input/output shape (from the Zod schema), minimum required role, and rate limit if any.
3. If the generated doc reveals the code has drifted from `research/PRD.md` Section 5 in a way that looks unintentional, flag it rather than just documenting the drift as if it were correct.
4. Output to a single reference file (e.g. `docs/api-reference.md`) — don't scatter API docs across multiple files.

## References

- `research/PRD.md` Section 5 (original spec, for comparison)
- [tRPC docs](https://trpc.io/docs)
