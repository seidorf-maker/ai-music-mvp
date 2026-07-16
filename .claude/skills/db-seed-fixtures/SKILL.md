---
description: Generates local development/test seed data — personal orgs, team orgs with multiple roles, sample projects/tracks/comments. Use when setting up a local dev environment or writing tests that need realistic data without a live Suno API key.
disable-model-invocation: true
---

## Instructions

1. Support at least these scenarios, invoked by name: `solo` (one personal org, a few tracks), `team` (a non-personal org with owner/admin/member/viewer), `pending-invites` (a team org with unaccepted invites).
2. Seed data must satisfy every constraint in `research/PRD.md` Section 4 — don't take shortcuts that would fail the real schema's checks (e.g., a `credit_transactions` history that actually sums to the seeded `credit_balance`).
3. Use placeholder audio URLs/durations rather than calling the real Suno provider — seeding must work with zero external API calls.
4. Keep the seed script idempotent (safe to re-run against a fresh local database) rather than accumulating duplicate rows on each run.

## References

- `research/PRD.md` Section 4 (full schema)
- [Supabase local development](https://supabase.com/docs/guides/local-development)
