---
description: Generates, sends, and processes org invite tokens — creation, expiry, and acceptance including the logged-out-user-must-sign-up-first path. Use when building team invite features.
---

## Instructions

1. Invite creation (`invites.create`) requires `admin` or `owner` role — enforce via `role-permission-guard`, and note it can only assign `admin`/`member`/`viewer`, never `owner`.
2. Token: unique, unguessable, 7-day expiry (`expires_at`) per `research/PRD.md` F7.
3. Email sending is an **open dependency — no provider is chosen yet** (not in `research/tech-stack.md`). Don't silently pick one; flag it and ask before wiring a real send.
4. Acceptance flow: if the person clicking the invite link isn't logged in, route them through sign-up first, then resume acceptance — don't lose the invite token across that redirect.
5. On acceptance, create the `organization_members` row and set `invites.accepted_at` in the same transaction.
6. A duplicate pending invite to the same email in the same org should be prevented or surfaced, not silently create a second row (see the partial index in `research/PRD.md` Section 4).

## References

- `research/PRD.md` Section 3 (F7) and Section 4 (`invites` schema)
- `research/skills.md` (email provider flagged as an open decision)
