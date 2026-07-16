---
description: Builds cursor-paginated list queries for org-scoped resources — generations.list, tracks.list, and similar. Use whenever a new list-style tRPC procedure is needed.
---

Use cursor pagination (not offset/limit) for anything that can grow large per org — the PRD's 10,000+ track performance target assumes this.

## Instructions

1. Confirm the backing index exists for the query's filter + sort combination (see `research/PRD.md` Section 4 indexing strategy, e.g. `tracks(org_id, created_at desc)`). If it doesn't, that's a `db-schema-migration` task first.
2. Accept `{ orgId, cursor?, limit?, ...filters }` as input; default `limit` to a sane page size (e.g. 20-50), cap it server-side so a client can't request an unbounded page.
3. Return `{ items, nextCursor }`, where `nextCursor` is derived from the last item's sort key (typically `created_at` + `id` for tie-breaking), not an offset.
4. Always scope the query by `org_id` explicitly in the query itself, even though RLS also enforces it — defense in depth, and it keeps the query planner's index usage predictable.
5. For search filters (e.g. track title/prompt search), use Postgres full-text search — no external search service is planned for MVP (see `research/skills.md`, "Explicitly NOT needed").

## References

- `research/PRD.md` Section 4 (indexing strategy) and Section 5 (`generations.list`, `tracks.list` contracts)
- [Drizzle select/query docs](https://orm.drizzle.team/docs/select)
