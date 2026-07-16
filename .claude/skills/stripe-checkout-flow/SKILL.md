---
description: Creates Stripe Checkout sessions for credit-pack purchases and subscription plans. Use when building the billing/upgrade UI or the billing.createCheckoutSession procedure.
---

## Instructions

1. Use Stripe Checkout (hosted), not a custom card form — this is what keeps PCI scope at SAQ-A per `research/PRD.md` Section 6. Never build a form that collects raw card details.
2. `billing.createCheckoutSession` and `billing.createPortalSession` require `admin`+ role (via `role-permission-guard`) — billing actions are not available to `member`/`viewer`.
3. Attach `org_id` as metadata on the Checkout session so the webhook handler (`stripe-webhook-handler`) knows which org to credit on completion.
4. Credit packs and subscriptions are two different Stripe products/prices — don't conflate them; the ledger `reason` differs (`purchase` vs `subscription_grant`).
5. Return only the `checkoutUrl` to the client; never expose the Stripe secret key to the frontend.

## References

- `research/PRD.md` Section 3 (F5, F8) and Section 5 (`billing.*` procedures)
- [Stripe Checkout](https://docs.stripe.com/checkout)
- [Stripe Node SDK](https://docs.stripe.com/api?lang=node)
