---
description: Maps every way a generation can fail (provider error, rate limit, insufficient credits, timeout) to a specific, honest, user-facing message. Use when handling generation failure states anywhere in the UI.
---

"Never fail silently, especially on credits" (`CLAUDE.md` Section 7) is the standard every message here must meet — a user should always know *why* a generation didn't happen and what to do about it.

## Instructions

1. Maintain one mapping from internal failure type to user-facing copy, reused everywhere a generation failure can surface (not re-authored per component): insufficient credits → link to purchase; rate limit hit → "try again in a moment," with a rough time estimate if available; provider error/timeout → "generation failed, no credits were charged" (and confirm that's actually true — see `credit-ledger-transaction`'s refund pattern if a charge was already made).
2. Never show a generic "something went wrong" for a known failure mode — that's a signal the mapping is incomplete, not that the message is fine as a fallback.
3. Distinguish "this will never work" (e.g., a rejected prompt) from "try again" (e.g., transient provider downtime) in the copy — they call for different user actions.

## References

- `CLAUDE.md` Section 7 (UX principles)
- `research/PRD.md` Section 3 (F2, F5)
