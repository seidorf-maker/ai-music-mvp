---
description: Implements or reviews any code path that debits or credits the credit_transactions ledger — generation charges, purchases, refunds, subscription grants. Use for anything touching credits or organizations.credit_balance.
---

`credit_transactions` is append-only. Never write code that `UPDATE`s or `DELETE`s a row in this table — corrections are a new offsetting entry with `reason = 'refund'`, never an edit to history.

## Instructions

1. Every balance change is two things in one transaction: an `INSERT` into `credit_transactions` (with `delta`, `reason`, `reference_id`, and the triggering `user_id` if there is one) and the corresponding change reflected in `organizations.credit_balance`.
2. Wrap the whole operation in a database transaction with `SELECT ... FOR UPDATE` on the organization row before checking/adjusting the balance. This is not optional — two concurrent requests debiting the same org's balance without row locking is a real race condition, not a hypothetical one.
3. Never let `credit_balance` go negative. Check the balance inside the same locked transaction, before the debit, and reject the operation (with a clear user-facing reason — see `generation-error-messaging`) if insufficient.
4. `delta` must never be zero — a transaction that doesn't change the balance shouldn't be written.
5. If this change is user-facing (e.g., "insufficient credits" blocking a generation), the failure must be explicit in the UI, never a silent no-op. See `CLAUDE.md` Section 7.

## References

- `research/PRD.md` Section 4 (`credit_transactions` schema) and Section 8 (COGS/credit economics)
- `CLAUDE.md` Section 4 ("never mutate credit_transactions history outside the transactional debit/credit pattern")
- [Drizzle transactions](https://orm.drizzle.team/docs/transactions)
- [Postgres explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
