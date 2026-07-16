---
description: Writes or reviews Postgres Row Level Security policies for a tenant-scoped table. Use whenever a new table is added, an existing table's access rules change, or before shipping any feature that touches tenant data.
---

This is the highest-stakes skill in the project. A wrong or missing policy is a cross-tenant data leak, not a cosmetic bug — treat every policy change with that weight.

## Instructions

1. Confirm the table has an `org_id` column. If not, stop — that's a schema problem (`db-schema-migration`), not a policy problem.
2. Write the base SELECT policy every tenant-scoped table needs:
   ```sql
   org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
   ```
3. For INSERT/UPDATE/DELETE, layer a role check on top of the membership check where PRD Section 5's permission table requires one (e.g., `invites.insert` requires `admin` or `owner`; `organizations.delete` requires `owner`). Don't apply a uniform policy across operations that have different role requirements.
4. Write out the exact SQL policy statements, plus a one-line justification per policy tying it to the specific PRD requirement it enforces.
5. This is an application-layer *and* database-layer control — `role-permission-guard` handles the tRPC side. Both must exist; RLS is the backstop if the application check is ever bypassed or buggy, not a redundant duplicate.
6. After writing or changing a policy, `rls-isolation-test` must be run before considering the change done — a policy that "looks right" and a policy that's verified are not the same thing.

## References

- `research/PRD.md` Section 4 (multi-tenancy architecture) and Section 5 (per-procedure auth requirements)
- `CLAUDE.md` Section 4 ("never bypass or weaken RLS policies temporarily")
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
