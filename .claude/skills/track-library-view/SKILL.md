---
description: Builds the paginated, searchable track library with project filtering and version-lineage grouping (PRD F3, F10). Use when building or modifying the library/browse view.
---

## Instructions

1. Consume `tracks.list` via `paginated-query-builder`'s cursor contract — infinite-scroll or "load more," not numbered offset pages.
2. Group regenerated variations by `parent_track_id` (F10) so the library reads as "one song, several takes" rather than an unordered flat list — this is one of the concrete things that makes the shared library useful to a team, not just a personal history.
3. Support filtering by project and a text search over title/prompt (Postgres full-text search — no external search service, per `research/skills.md`'s explicit exclusions).
4. Use `waveform-player-component` for inline playback rather than a separate player implementation.
5. Must stay responsive at 10,000+ tracks per org (`research/PRD.md` Section 6) — this is a direct consequence of using cursor pagination and the indexes defined in Section 4, not something to solve with client-side filtering of a large fetched set.

## References

- `research/PRD.md` Section 3 (F3, F10) and Section 6 (performance targets)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
