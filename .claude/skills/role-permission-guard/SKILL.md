---
description: tRPC middleware that enforces org role requirements (owner/admin/member/viewer) before a procedure executes. Use when adding a new tRPC procedure or changing who's allowed to call an existing one.
---

## Instructions

1. Implement as reusable middleware, e.g. `requireRole('admin')`, applied at procedure definition — don't hand-roll a role check inline in each procedure body.
2. Role hierarchy is `owner > admin > member > viewer`. "Requires admin" means admin or owner; state the minimum role, not an exact match, unless the PRD specifies an exact-role action (e.g., only `owner` can delete an org or change billing).
3. Check `research/PRD.md` Section 5's per-procedure auth column before assuming a default — permissions differ by procedure (e.g., `viewer` can comment but not generate).
4. This is the application-layer check. `db-rls-policy-audit` is the database-layer backstop for the same rule — both must exist and agree; if they diverge, the RLS policy is the one that's actually enforced when this middleware has a bug, so don't treat this as sufficient on its own.
5. Failure mode: a clear, typed tRPC error (not a silent empty response) so the frontend can show "you don't have permission" rather than a blank state.

## References

- `research/PRD.md` Section 5 (full auth-requirement table per procedure)
- [tRPC middleware](https://trpc.io/docs/server/middlewares)
