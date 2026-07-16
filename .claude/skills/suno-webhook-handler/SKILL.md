---
description: Receives and processes the /api/webhooks/suno callback — verifies signature, updates generation status, writes the resulting track, and notifies the client. Use when building or debugging the async generation completion flow.
---

This is the most consequential architectural piece in the stack (`CLAUDE.md` Section 2) — generation takes seconds to minutes, well past any serverless function timeout, so the request-response cycle for `generations.create` never waits for this to happen.

## Instructions

1. Verify the webhook's shared-secret signature before processing anything. Reject unsigned/invalid requests immediately.
2. On a completion payload: update `generations.status` to `completed`, write a new `tracks` row (via `credit-ledger-transaction` if this is also where a charge is finalized), and push a Supabase Realtime notification so the client updates without polling.
3. On a failure payload: update `generations.status` to `failed`, store `error_message`, and ensure `generation-error-messaging` has enough detail to show a specific reason, not a generic error.
4. This webhook can be delivered more than once for the same event — route through `webhook-idempotency-guard` so a duplicate delivery never writes a duplicate track or double-processes a status change.
5. This is plain REST (`research/PRD.md` Section 5), not a tRPC procedure — it's called by a third party that can't speak tRPC.

## References

- `research/PRD.md` Section 5 (webhook route table) and `research/tech-stack.md` Section 6 (async job pattern pain point)
- [sunoapi.org docs](https://docs.sunoapi.org/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
