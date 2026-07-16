---
description: Wires up Supabase Auth for email/password and Google OAuth sign-in/sign-up, and the tRPC context that resolves the authenticated user on every request. Use when building or modifying sign-up, sign-in, or session handling.
---

## Instructions

1. Use `@supabase/ssr` for server-side session handling in the Next.js app, not the plain `@supabase/supabase-js` client alone — it handles cookie-based sessions correctly across server/client boundaries.
2. Support email/password and Google OAuth per `research/PRD.md` F1. Don't add other providers unless a PRD update requests them.
3. Every tRPC procedure's context must resolve `userId` from the Supabase session before any procedure body runs — this is what every other auth/permission skill (`role-permission-guard`, `org-provisioning`) builds on.
4. On first successful sign-up, hand off to `org-provisioning` — sign-up is not complete until a personal org exists; don't treat these as separate, independently-failable steps.
5. PKCE flow is reserved for the future mobile app (see `research/tech-stack.md`) — not needed for the web MVP, but don't build the web flow in a way that forecloses it later.

## References

- `research/PRD.md` Section 2 (F1: account creation & personal workspace) and Section 4 (auth-adjacent schema)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
