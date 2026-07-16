---
description: Creates a personal, single-member organization transactionally the moment a new user signs up. Use when implementing or debugging the post-signup flow.
---

Every user must exist inside an org — there is no valid code path where `org_id` resolution is null. This is what lets solo and team usage share one data model with zero migration between them (`research/PRD.md` Section 4).

## Instructions

1. On the auth signup event, create the `organizations` row (`is_personal = true`) and the `organization_members` row (`role = 'owner'`) in a single database transaction — never as two separate writes that could succeed/fail independently and leave a user orgless.
2. Generate a unique `slug` for the personal org (e.g., derived from the user's name/email with a collision-safe suffix).
3. If this transaction fails, sign-up itself must fail visibly — don't let a user reach the app in a state with no org.
4. This is intentionally the same `organizations` table a team org uses (`org-team-management-ui`, `invite-flow`) — don't create a separate "personal account" concept.

## References

- `research/PRD.md` Section 4 ("no user ever exists outside an org")
- [Supabase Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks)
