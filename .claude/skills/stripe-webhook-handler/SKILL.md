---
description: Processes Stripe webhook events (checkout completion, subscription lifecycle) into subscriptions and credit_transactions rows. Use when building or debugging billing event handling.
---

Billing correctness bugs are expensive and hard to detect after the fact — treat this skill with the same care as `credit-ledger-transaction`, which it calls into.

## Instructions

1. Verify the `stripe-signature` header using the Stripe SDK's built-in verification before processing any event — never trust an unverified payload.
2. On `checkout.session.completed` for a credit-pack purchase: insert a `credit_transactions` row (`reason = 'purchase'`) via the `credit-ledger-transaction` pattern — don't write to the ledger directly from this handler without going through the same locked-transaction discipline.
3. On subscription lifecycle events (`created`, `updated`, `deleted`, `invoice.paid`, `invoice.payment_failed`): update the `subscriptions` row (`status`, `current_period_end`) to match Stripe's state exactly.
4. Route every event through `webhook-idempotency-guard` first — Stripe explicitly documents that events can be delivered more than once.
5. This is plain REST, not tRPC (`research/PRD.md` Section 5).

## References

- `research/PRD.md` Section 4 (`subscriptions`, `credit_transactions`) and Section 5 (webhook route table)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
- [Stripe webhook idempotency](https://docs.stripe.com/webhooks#handle-duplicate-events)
