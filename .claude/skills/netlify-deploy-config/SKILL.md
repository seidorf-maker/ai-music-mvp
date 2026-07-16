---
description: Configures the Next.js app for Netlify deployment — the official Next.js adapter, environment variables, and function timeout awareness. Use when setting up or changing hosting configuration.
disable-model-invocation: true
---

## Instructions

1. Use Netlify's official Next.js adapter (zero-config for SSR/API routes) — don't hand-roll a custom build process.
2. Netlify's synchronous functions time out at 10 seconds. This is exactly why `suno-webhook-handler` and `generation-form-component` never hold a request open waiting for generation — confirm that pattern is intact before deploying, don't rediscover the constraint by shipping a broken flow.
3. Set up all required environment variables from `CLAUDE.md` Section 6 in Netlify's dashboard per environment (production, deploy previews) — run `secrets-env-audit` after.
4. Confirm Deploy Previews work on a test PR before considering setup done — this is the CI/CD workflow benefit tech-stack.md counted on.
5. If a background step genuinely needs more than 10 seconds, use Netlify Background Functions or move that one worker to Railway — don't restructure the whole app around it (`research/tech-stack.md` Section 4).

## References

- `research/tech-stack.md` Section 4 (hosting decision and rationale)
- [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify Background Functions](https://docs.netlify.com/functions/background-functions/)
