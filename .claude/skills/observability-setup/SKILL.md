---
description: Wires up structured logging and error tracking across the app. No monitoring/error-tracking service has been chosen yet — use this skill to surface that open decision, not to silently pick and install a vendor.
disable-model-invocation: true
---

This is an unresolved decision, not a resolved implementation task. `research/tech-stack.md` never chose a monitoring tool.

## Instructions

1. Do not install or configure any error-tracking/logging vendor (e.g., Sentry) without first presenting the tradeoff to the user — cost against the $50/mo hosting ceiling (`research/tech-stack.md` Section 4) matters here, and this project is budget-constrained.
2. When asked to "set up error tracking" or similar, respond with the decision that needs to be made (which service, free-tier limits, how it fits the budget) before writing any integration code.
3. Once a tool is chosen, this skill should be rewritten to reflect the actual choice — replace this note with real setup instructions and a docs link, and remove the `disable-model-invocation` gate if appropriate.

## References

- `research/tech-stack.md` Section 4 (hosting budget)
- `research/skills.md` (this skill's entry explains why it's flagged as open)
