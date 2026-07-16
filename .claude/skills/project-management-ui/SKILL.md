---
description: Create/rename/archive UI for projects (folders) that group generations and tracks (PRD F4). Use when building project/folder management screens.
---

## Instructions

1. Keep this deliberately simple — projects are just a grouping mechanism (name + optional description + archived flag), not a nested hierarchy. Don't add sub-projects or tags here; that's out of scope (see `research/PRD.md` Section 7 / F15 tagging is P2).
2. Any org member (`member`+, not `viewer`) can create a project; archiving should be reversible in the UI, matching the `archived_at` nullable field rather than a hard delete.
3. The library view (`track-library-view`) filters by project — make sure project selection state is shareable/linkable (URL-driven), not just local component state, so a teammate can send a link to "the Episode 42 project."

## References

- `research/PRD.md` Section 3 (F4) and Section 4 (`projects` schema)
- [React Hook Form](https://react-hook-form.com/)
