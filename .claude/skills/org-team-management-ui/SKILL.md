---
description: Builds the member list, role controls, and invite form for team workspaces (PRD F6/F7). Use when building org/team settings screens.
---

This is the primary UI surface for the collaboration wedge the whole product is betting on (`research/PRD.md`'s opening note, Section 8's team-formation-rate metric). Build it carefully — this isn't routine CRUD, it's the thing being tested.

## Instructions

1. Show a member table with role dropdowns (owner/admin/member/viewer) and a pending-invites list, gated by the current user's role — but remember the client-side gating is a UX hint only; `role-permission-guard` on the backend is the real enforcement, never trust the client check alone.
2. Converting a personal org into a team, or creating a new team org and inviting people into it, should feel like a natural upgrade path from solo use, not a separate product — reinforce that there's one org model (`org-provisioning`).
3. Surface the shared credit balance and per-member usage breakdown here too (F8) — this is where "who spent what" becomes visible to an owner/admin.
4. Invite form hands off to `invite-flow`; don't duplicate token/expiry logic in the component.

## References

- `research/PRD.md` Section 2 (why this feature exists), Section 3 (F6, F7, F8), Section 8 (team-formation-rate metric)
- [shadcn/ui](https://ui.shadcn.com/)
