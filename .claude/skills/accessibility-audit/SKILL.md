---
description: Checks core flows (generate, browse, play, comment) against the WCAG 2.1 AA bar set in the PRD. Use before shipping a new UI component or screen.
disable-model-invocation: true
---

## Instructions

1. Check, don't just eyeball: keyboard-only operability of every control (tab order, focus visibility), color contrast ≥ 4.5:1 for text, and accessible labels on icon-only buttons (especially in `waveform-player-component`).
2. Confirm generation status changes are announced via `aria-live` regions, not just a visual state change — a screen-reader user should hear "generation complete" (`research/PRD.md` Section 6).
3. Produce a specific pass/fail checklist with concrete fixes ("the play button has no aria-label" beats "improve accessibility"), matching the specificity standard in `CLAUDE.md`.
4. Note explicitly which gaps are accepted degradations per the PRD (e.g., full waveform trim editing may be desktop-only) versus genuine failures that block shipping.

## References

- `research/PRD.md` Section 6 (accessibility standards)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [axe-core](https://github.com/dequelabs/axe-core)
