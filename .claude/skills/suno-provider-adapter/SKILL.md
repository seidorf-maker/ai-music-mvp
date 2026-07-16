---
description: Wraps all calls to the sunoapi.org Suno reseller (generate, extend, cover, add-vocals, stems, lyrics) behind a single internal interface. Use for any code that talks to the Suno generation provider.
---

`sunoapi.org` is an unofficial third-party wrapper around Suno, not an official API — `research/viability-analysis.md` flags this as the project's biggest structural risk. The whole point of this skill is that a reseller swap should only ever require changing this one file.

## Instructions

1. All provider calls go through one module (e.g., `packages/api/src/providers/suno.ts`) exposing normalized functions: `generateTrack()`, `extendTrack()`, `requestStems()`, `generateLyrics()`. No other file should import an HTTP client and call `sunoapi.org` directly.
2. Normalize the response into an internal `GenerationJob` type independent of the reseller's exact response shape — callers should never need to know provider-specific field names.
3. Handle the provider's async nature explicitly: a call here returns a job reference immediately, it does not block until generation completes. The webhook (`suno-webhook-handler`) is what resolves it.
4. Wrap provider errors (rate limits, invalid prompts, provider downtime) into typed internal errors that `generation-error-messaging` can map to user-facing copy — don't let raw provider error strings leak to the UI.
5. Never hardcode the API key — read `SUNO_API_KEY` from environment (see `secrets-env-audit`).

## References

- `research/viability-analysis.md` (why this dependency is risky)
- `research/PRD.md` Section 3 (F2, F11, F12) and Section 5 (`generations.create`)
- [sunoapi.org docs](https://docs.sunoapi.org/)
