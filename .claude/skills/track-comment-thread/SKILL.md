---
description: Timestamp-pinned comment thread on a track — clicking a comment seeks playback to that point (PRD F9). Use when building track feedback/comment UI.
---

This is the feature most directly testing the wedge hypothesis (`research/PRD.md` Section 3 note on F9) — track its usage rate, and keep the interaction simple enough that a non-technical teammate uses it without prompting.

## Instructions

1. Any org member including `viewer` can comment (per `research/PRD.md` Section 5) — don't gate this behind `member`+.
2. A comment can optionally pin to `timestamp_seconds`; clicking it should call into `waveform-player-component`'s seek function, not just display a number.
3. Comments are visible to the whole org on that track, threaded but flat (no nested replies specified in the PRD — don't add that complexity unless asked).
4. Keep the add-comment input always visible near the player, not hidden behind an extra click — friction here directly undermines the feature's reason for existing.

## References

- `research/PRD.md` Section 2 ("what would make them tell a colleague") and Section 3 (F9)
- [TanStack Query](https://tanstack.com/query/latest)
