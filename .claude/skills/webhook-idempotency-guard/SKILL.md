---
description: Ensures the Suno and Stripe webhook handlers safely no-op on a duplicate event delivery. Use whenever building or modifying a webhook handler.
---

Both providers can and will redeliver the same event — this isn't a hypothetical edge case, it's documented behavior for both.

## Instructions

1. Every inbound webhook event must carry (or be assigned) a unique event ID. Before processing, check whether that ID has already been handled (e.g., a `processed_webhook_events` table or an upsert keyed on the provider's event ID) — if so, return success without reprocessing.
2. This must be checked *before* any side effect (ledger write, track creation, status update) — checking after is the same bug with extra steps.
3. Combine with `credit-ledger-transaction`'s locking discipline for any webhook that touches credits — idempotency and concurrency safety are two different guarantees and both are needed.
4. Log (but don't error loudly on) a detected duplicate — it's expected provider behavior, not an incident.

## References

- `research/PRD.md` Section 5 (webhook routes)
- [Stripe webhook idempotency](https://docs.stripe.com/webhooks#handle-duplicate-events)
