---
description: Persistent credit balance display, credit history log, and Stripe checkout/portal launch buttons (PRD F5/F8). Use when building billing or credit-visibility UI.
---

## Instructions

1. The balance must be visible everywhere a user could hit it unexpectedly (e.g., near the generation form), not tucked into a settings page — this is the concrete form of `CLAUDE.md`'s "never fail silently on credits" principle.
2. A blocked generation due to insufficient credits must link directly to the purchase flow (`stripe-checkout-flow`), not just state the problem.
3. History view reads from `credits.history` — render `credit_transactions` entries with their `reason` in plain language ("Generation: 'lofi beat for episode 42'", "Purchase: 1,000 credits"), not raw enum values.
4. Billing actions (buy credits, manage subscription) are `admin`+ only — non-admins can see the balance and history but not trigger a purchase; reflect that in the UI, matching `role-permission-guard`.

## References

- `research/PRD.md` Section 3 (F5, F8) and Section 5 (`credits.*`, `billing.*`)
- [Stripe Customer Portal](https://docs.stripe.com/customer-management)
