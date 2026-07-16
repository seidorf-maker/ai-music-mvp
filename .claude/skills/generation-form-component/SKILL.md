---
description: Builds the prompt input, submit action, and live status indicator for track generation — the core generation loop (PRD F2). Use when building or modifying the generate-a-track UI.
---

## Instructions

1. Submit calls `generations.create` and returns immediately with `status: 'queued'` — the UI must not block/spin waiting for the full generation; it hands off to a status subscription.
2. Subscribe to status changes via Supabase Realtime (through TanStack Query), not a fixed-interval poll — the backend pushes `queued → processing → completed/failed` updates.
3. Surface `redis-rate-limiter` and `credit-ledger-transaction` failures with specific messages ("generation limit reached, try again shortly" / "not enough credits — buy more") — never a generic "something went wrong" for these two well-known cases. See `generation-error-messaging`.
4. Use React Hook Form + Zod for the prompt input, sharing the same validation schema as the backend's `generations.create` input where possible so client and server agree on limits (1–2000 chars per `research/PRD.md` Section 4).
5. Status changes must be accessible: announce completion via an `aria-live` region, not just a visual change (`research/PRD.md` Section 6).

## References

- `research/PRD.md` Section 3 (F2) and Section 6 (performance/accessibility targets)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)
