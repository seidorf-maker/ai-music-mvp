# AI Music Creation — MVP

A minimal Next.js app that generates a music track from a text prompt using [sunoapi.org](https://docs.sunoapi.org/) (a third-party Suno API reseller — see `research/viability-analysis.md` for why that's a known risk, not an oversight).

This is a deliberately reduced-scope prototype: **no database, no accounts, no credits system, no multi-tenancy.** It exists to validate the core "type a prompt, get a song" loop before any of the team/collaboration features in `research/PRD.md` get built. It is not "P0" from the PRD — it's a standalone spike that skips the accounts/org/credits layer entirely.

## How it works

- The Suno API key lives only in a server-side environment variable (`SUNO_API_KEY`) and is used only inside two Next.js API routes (`app/api/generate`, `app/api/status/[taskId]`). It is never sent to the browser.
- There's no database, so there's no webhook-based status tracking — the browser polls `/api/status/[taskId]` every 5 seconds until the track is ready. `/api/suno-callback` exists only because Suno's API requires a `callBackUrl` on every request; it intentionally does nothing with what it receives.
- Refreshing the page loses in-progress/completed tracks — nothing is persisted anywhere. That's expected for this scope.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` file (already created, gitignored) with:

```
SUNO_API_KEY=your-key-here
```

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify, "Add new site" → "Import an existing project" → pick this repo. Netlify auto-detects Next.js via `netlify.toml`'s `@netlify/plugin-nextjs`.
3. **Before the first deploy does anything useful:** add `SUNO_API_KEY` in Netlify's dashboard under Site configuration → Environment variables, with the same value that's in your local `.env.local`. It is not in the repo and will not deploy automatically — this is a manual step every time the key changes.
4. Deploy.

## Known limitations (by design, given the "no database" constraint)

- No generation history — closing the tab loses the result.
- No rate limiting — nothing stops rapid repeat submissions from spending API credits quickly. Fine for a single-user prototype; not fine to share a public link to without adding at least a basic guard.
- The `callBackUrl` webhook is a no-op — status comes entirely from polling, which is simpler but means the browser tab must stay open for status to update.
