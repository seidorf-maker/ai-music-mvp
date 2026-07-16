---
description: Automated test suite asserting a user in one org cannot read or write data scoped to another org, across every tenant-scoped table. Use before shipping any change that touches schema or RLS policies.
disable-model-invocation: true
---

Any failure here is a security incident, not a normal bug — treat it accordingly, don't just fix and move on without understanding how the leak was possible.

## Instructions

1. Use `db-seed-fixtures` to create two orgs (A and B) with distinct data across every tenant-scoped table.
2. For every table, assert: a session authenticated as an Org A member cannot `SELECT`, `INSERT`, `UPDATE`, or `DELETE` any row belonging to Org B, even when supplying Org B's row ID directly.
3. Also assert the positive case — an Org A member *can* access Org A's own data — so a failing test can't be caused by an overly broad "deny everything" policy masquerading as correct isolation.
4. Run this test whenever `db-schema-migration` adds a table or `db-rls-policy-audit` changes a policy — treat it as a required gate, not optional coverage.
5. Test role-scoped writes too (e.g., a `member` cannot call `invites.create` even within their own org) — isolation and role enforcement are both being verified here.

## References

- `research/PRD.md` Section 4 (multi-tenancy architecture) and Section 6 (security requirements)
- [Supabase RLS testing guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
