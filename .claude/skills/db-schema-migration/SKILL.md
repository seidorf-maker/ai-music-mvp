---
description: Authors Drizzle schema changes and generates the corresponding migration for this project's Postgres/Supabase database. Use when adding/changing a table or column, or when a new PRD feature needs a schema update.
disable-model-invocation: true
---

`research/PRD.md` Section 4 is the source of truth for table names, field types, and constraints — don't invent naming that diverges from it. If the requested change isn't reflected there, update that section too, not just the code.

## Instructions

1. Read the current schema in `packages/db/schema.ts` (or wherever Drizzle schema lives) and `research/PRD.md` Section 4 for the target table.
2. Edit the Drizzle schema file: add/modify the column or table, matching the PRD's type, `not null`, `check`, `default`, and FK constraints exactly — don't loosen a constraint to make the change easier.
3. Every new tenant-scoped table must include `org_id` with a foreign key to `organizations.id` and `on delete cascade` (or an explicit reason it doesn't). Flag this if missing.
4. Run `drizzle-kit generate` to produce the migration file. Do not hand-edit generated SQL unless the auto-generated migration is wrong.
5. If the change affects RLS, note explicitly that `db-rls-policy-audit` needs to run next — a new tenant-scoped table with no RLS policy is a blocker, not a follow-up.
6. Applying the migration to a live database (`drizzle-kit migrate`) is a separate, explicit step — confirm with the user before running it against anything other than local dev.

## References

- `research/PRD.md` Section 4 (schema, indexing strategy, validation rules)
- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
