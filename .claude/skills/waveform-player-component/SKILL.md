---
description: Wraps wavesurfer.js into a reusable playback/waveform component, used by the track library, comment thread, and future trim UI. Use whenever audio needs to be played or a waveform rendered.
---

## Instructions

1. Build one shared component, not per-context copies — the library view, comment thread (seek-to-timestamp), and any future trim UI (P2) should all use the same underlying player.
2. Accept a signed audio URL from `r2-signed-url` (never a raw R2 path) and optional timestamp markers (for comment pins).
3. Controls must be keyboard-operable and carry accessible labels — no icon-only buttons with no text alternative (`research/PRD.md` Section 6).
4. Keep this component desktop-first but functional at 375px width; the full waveform region-selection editing (P2/F13) can be desktop-only — that's a documented, accepted degradation, not a bug to silently work around here.

## References

- `research/PRD.md` Section 3 (F3, F9) and Section 6 (accessibility, mobile responsiveness)
- [wavesurfer.js docs](https://wavesurfer.xyz/docs/)
