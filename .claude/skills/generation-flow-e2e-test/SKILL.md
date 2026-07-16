---
description: End-to-end test of the full generation loop (prompt submit → queued → webhook → completed → playable track) against a mocked Suno provider. Use to validate the async job pattern without spending real API credits.
disable-model-invocation: true
---

This test exists specifically to cover the highest-risk architectural piece: the async job pattern (`suno-provider-adapter` → `suno-webhook-handler` → Realtime → UI). A passing unit test on each piece individually doesn't prove the handoffs between them work.

## Instructions

1. Mock `suno-provider-adapter`'s response instead of hitting `sunoapi.org` — this test must run in CI without a live API key or real credit spend.
2. Drive the full path: submit a generation → assert `queued` status returned immediately (under the 500ms target in `research/PRD.md` Section 6) → simulate the webhook callback → assert the track appears and status updates without a page reload/poll.
3. Include a failure-path variant: simulate a provider error via the webhook and assert the user sees a specific message, not a stuck "processing" state forever.
4. Include a duplicate-webhook-delivery variant to confirm `webhook-idempotency-guard` actually prevents a double-write.

## References

- `research/tech-stack.md` Section 6 (async generation pain point) and `research/PRD.md` Section 6 (performance targets)
- [Playwright](https://playwright.dev/)
