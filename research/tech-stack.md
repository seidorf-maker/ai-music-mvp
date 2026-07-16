# Tech Stack Recommendation: AI Music Creation App

**Date:** 2026-07-15
**Depends on:** [viability-analysis.md](./viability-analysis.md)

**Assumption:** The viability analysis flagged the concept as too vague to build as stated and called for a specific wedge before any code gets written. This stack assumes a plausible feature set implied by that analysis — prompt-based generation via a Suno API reseller, a track library, playback/waveform editing, credits/subscription billing, and eventually a niche workflow layered on top. If your actual wedge changes the feature set materially (e.g., real-time collaboration, heavy audio DSP), revisit Section 6 first — it's the one most sensitive to that.

---

## 1. Frontend Recommendation

**Framework: Next.js (React) for web MVP now; Expo (React Native) for mobile in phase 2, sharing code via a Turborepo monorepo.**

Don't build React and React Native simultaneously for an unvalidated concept — that doubles your surface area before you know anyone wants the product. Ship the web app first on Next.js, validate the wedge, then add Expo once there's a reason (creators expect a mobile app for on-the-go recording/prompting). Structuring the repo as a Turborepo monorepo from day one means the API client, types, and business logic are shared and the mobile app is additive, not a rewrite.

- [Next.js docs](https://nextjs.org/docs)
- [React docs](https://react.dev/)
- [Expo docs](https://docs.expo.dev/)
- [Turborepo docs](https://turbo.build/repo/docs)

**Key libraries for this feature set:**

| Need | Library | Why |
|---|---|---|
| Audio playback + waveform editing | [wavesurfer.js](https://wavesurfer.xyz/) | Purpose-built for waveform rendering, region selection, and playback — directly relevant once you touch stem editing or trimming |
| Styling/components | [Tailwind CSS](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com/) | Fast to build with, no design system to invent for an MVP, components are copy-owned (no dependency lock-in) |
| Forms (prompts, account, billing) | [React Hook Form](https://react-hook-form.com/) | Minimal re-renders, pairs cleanly with tRPC input validation via [Zod](https://zod.dev/) |
| Server-state / polling generation status | [TanStack Query](https://tanstack.com/query/latest) | Suno generation is async (seconds to a couple minutes) — you need polling/refetch-on-interval and cache invalidation, which is what this library is for |

**State management approach:** Don't reach for Redux. Split state into two buckets:
- **Server state** (tracks, generation jobs, user/credits) → TanStack Query, which handles caching, polling, and invalidation for you.
- **Client-only UI state** (editor selection, playback position, modals) → [Zustand](https://github.com/pmndrs/zustand), a few KB, no boilerplate.

This split avoids the most common state-management mistake in apps like this: treating server data as client state and hand-rolling cache invalidation.

---

## 2. Backend Recommendation

**Runtime: Node.js (TypeScript), not Python.**

The core backend job here is I/O orchestration — call the Suno reseller's REST API, track credits, handle webhooks/polling, serve authenticated requests — not machine learning or audio DSP (the reseller already does generation and stem separation for you). Node's async I/O model fits that job well, and using TypeScript end-to-end means the frontend and backend share types and validation logic with zero translation layer. Python would only pull ahead if you later add your own audio analysis (BPM/key detection, custom DSP) using `librosa`/`essentia` — if that becomes a real feature, add it as a small isolated Python microservice rather than rewriting the core backend.

- [Node.js docs](https://nodejs.org/en/docs)

**API architecture: tRPC**, not REST or GraphQL.

With a TypeScript frontend and backend in the same monorepo, [tRPC](https://trpc.io/docs) gives end-to-end type safety (frontend autocompletes backend responses, no OpenAPI/GraphQL schema to maintain) with far less ceremony than GraphQL for a small team. It works fine from React Native too via its vanilla client, so it doesn't block the phase-2 mobile app. If you later need a public/partner-facing API, expose a thin REST layer on top rather than switching paradigms.

**Authentication strategy: Supabase Auth.**

Since Supabase is the database (Section 3), use its built-in auth rather than a separate provider — one less vendor, and it integrates directly with Postgres Row Level Security so "user X can only see user X's tracks" is enforced at the database layer, not just in application code. Supports email/password and OAuth (Google, Apple — relevant for a creator audience). Use PKCE flow for the future mobile app.

- [Supabase Auth docs](https://supabase.com/docs/guides/auth)

---

## 3. Database Recommendation

**Primary: Supabase (managed Postgres).**

Of your three listed options, this is the clear fit over Firebase or MongoDB Atlas because your core data is inherently relational and needs integrity guarantees: users, credits ledger, generation jobs, tracks, subscriptions/payments. A credits/billing ledger in particular wants transactional guarantees (never double-spend a credit) that a document store makes you build yourself. Supabase gets you Postgres plus auth, object storage, and realtime subscriptions (useful for pushing "your track is ready" without polling) in one managed product.

- [Supabase docs](https://supabase.com/docs)

**Schema approach (relational core):**
```
users              (id, email, plan, credits_balance, created_at)
generations        (id, user_id, prompt, provider_job_id, status, model_version, created_at)
tracks             (id, generation_id, user_id, title, audio_url, duration, stems_url, created_at)
projects/playlists (id, user_id, name)
project_tracks     (project_id, track_id)
credit_transactions(id, user_id, delta, reason, created_at)   -- append-only ledger, never mutate balances directly
```
Keep `credit_transactions` append-only and derive `credits_balance` from it (or reconcile periodically) — that's the pattern that survives refunds, disputes, and bugs without silent drift.

**Secondary data stores:**
- **Object storage for audio files:** [Cloudflare R2](https://developers.cloudflare.com/r2/) rather than Supabase Storage for the audio itself. R2 has zero egress fees, which matters a lot for an audio app (users streaming/downloading tracks repeatedly) — Supabase's own storage bills egress. Keep Supabase Storage for small assets (avatars) where the volume doesn't matter.
- **Cache / job state:** [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) — serverless, pay-per-request, fits a spiky MVP workload better than a provisioned Redis instance. Use it for generation-status short-term cache and basic rate limiting against the Suno reseller's API.
- **Search:** Not needed at MVP. Postgres full-text search on `tracks.title`/`prompt` is sufficient until you have evidence users need it.

**Backup and migration strategy:**
- Supabase Pro tier includes automated daily backups (7-day retention) — this is one of the concrete reasons to upgrade off the free tier before you have real user data worth losing, not just at a traffic threshold.
- Schema migrations via [Drizzle ORM](https://orm.drizzle.team/docs/overview) migrations (or Prisma, if you prefer its more batteries-included DX) — check migration files into git, run them in CI before deploy, never hand-edit schema in the Supabase dashboard for anything past prototyping.

---

## 4. Infrastructure and Hosting

**Deployment platform: Netlify for the Next.js app.** Netlify's official [Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) supports SSR, API routes, and ISR, so nothing in Sections 1–3 changes — the tRPC/Next.js setup deploys the same way it would anywhere else. Netlify's standard (synchronous) Functions time out at 10 seconds, same ballpark as Vercel's lower tiers, which is exactly why the job-status pattern in Section 6 (enqueue and return immediately, don't hold the request open) isn't optional — it's what makes the platform choice a non-issue for the generation flow. If a background step genuinely needs to run longer (e.g., downloading a finished track and pushing it to R2), use [Netlify Background Functions](https://docs.netlify.com/functions/background-functions/) (up to 15 minutes, paid plans) or move just that worker to [Railway](https://docs.railway.app/) — don't restructure the whole app around it.

**CI/CD:** [GitHub Actions](https://docs.github.com/en/actions) for lint/typecheck/test on every PR, with Netlify's built-in Deploy Previews handling the actual deploy step (every PR gets a live preview URL on the free plan — same workflow benefit as Vercel here, useful for reviewing generation UX changes before merge).

**Estimated monthly costs** (infrastructure only — Suno API credits are a separate, usage-based cost of goods sold, not "hosting," and are called out separately because at scale they will dwarf hosting):

| Stage | Netlify | Supabase | Upstash | Cloudflare R2 | Domain | **Infra total** | Suno API (COGS, separate) |
|---|---|---|---|---|---|---|---|
| **MVP** (pre-revenue, dev/test traffic) | Free (300 credits) — $0 | Free — $0 | Free — $0 | Free (10GB) — $0 | ~$1/mo | **~$1–20/mo** | ~$10–20/mo (testing) |
| **1,000 users** | Pro — ~$20 | Pro — $25 | ~$0–5 | ~$2–5 | ~$1 | **~$50–55/mo** | ~$50–300/mo (usage-driven) |
| **10,000 users** | Pro + extra credits — ~$20–60 | Pro + compute add-on — ~$75–200 | ~$20–50 | ~$15–75 | ~$1 | **~$170–410/mo** | Likely $1,000+/mo (usage-driven) |

Netlify moved to a credit-based plan (Free: $0/300 credits; Pro: $20/mo, unlimited team members, 3,000 credits, ~20 credits/GB bandwidth beyond that). One thing worth calling out explicitly: because audio files are served directly from Cloudflare R2 (Section 3) rather than proxied through Netlify, Netlify's bandwidth usage stays low regardless of how much audio users stream — it's only serving the app shell and API calls. That's why Netlify's cost barely moves between 1,000 and 10,000 users in this table, while Supabase (which does gate on egress/compute) is the line that grows.

**Budget reality check against your $50/mo cap:** MVP stays comfortably under budget on free tiers. At 1,000 users, infra lands right at the edge of $50–55/mo — stay on free tiers as long as actual usage allows and only upgrade Supabase/Netlify when you hit real limits (not proactively). By 10,000 users, hosting infra likely exceeds $50/mo regardless of choices here (Supabase's compute add-on is the main driver, not Netlify) — at that scale the budget constraint should shift to "infra costs less than X% of subscription revenue," and the dominant cost line becomes Suno API credits, not hosting. Pass those costs through in your pricing (credits-based plans, like Suno's own model) rather than treating them as a fixed cost to minimize.

---

## 5. MCP Server Availability

This matters for your dev workflow with Claude Code, not the product itself. Official or well-maintained MCP servers exist for:

| Service | MCP server | What it enables |
|---|---|---|
| **Supabase** | [Official remote MCP server](https://supabase.com/docs/guides/getting-started/mcp) | Claude Code can inspect your schema, write/run migrations, query data, and manage the project directly from chat — this is the strongest MCP fit in the stack, and a real point in Supabase's favor over Firebase/MongoDB for this project specifically |
| **Netlify** | [Official MCP server](https://github.com/netlify/netlify-mcp) | Create/deploy/manage sites, inspect deployments and logs, and manage env vars and domains from Claude Code without leaving the terminal |
| **Cloudflare** | Official MCP servers (Workers, R2, etc.) | Manage R2 buckets and inspect storage from chat |
| **GitHub** | Official MCP server | PRs, issues, CI status — standard for any repo already |
| **Stripe** | Official MCP server | Useful once you add billing — inspect customers/subscriptions/webhooks from chat while debugging payment flows |

**What this enables concretely:** during development, you can ask Claude Code to check the actual Supabase schema before writing a migration, inspect a failed Vercel deploy log, or look up a Stripe webhook event — all without you context-switching to five different dashboards. It's a workflow accelerant, not a reason to pick a service on its own; every recommendation above was chosen on technical merit first and happens to also have good MCP coverage.

---

## 6. Integration Map

```
┌─────────────┐         ┌──────────────────────┐
│  Next.js    │  tRPC   │  Node.js/TS backend   │
│  (React,    │◄───────►│  (tRPC router, runs   │
│  Netlify)   │         │  on Netlify functions)│
└─────────────┘         └──────────┬────────────┘
      │                            │
      │ Supabase JS SDK            │ Server-side calls
      ▼                            ▼
┌─────────────┐   ┌───────────────────────────┐
│  Supabase   │   │  sunoapi.org (3rd-party    │
│  - Postgres │   │  Suno reseller) — generate,│
│  - Auth     │   │  extend, stems, lyrics     │
│  - Realtime │   └──────────────┬─────────────┘
└─────────────┘                  │ audio files
      │                          ▼
      │                  ┌───────────────┐
      │                  │ Cloudflare R2 │
      │                  │ (audio store) │
      │                  └───────────────┘
      ▼
┌─────────────┐      ┌──────────────┐      ┌────────┐
│ Upstash     │      │ Stripe       │      │ (later)│
│ Redis       │      │ (billing)    │      │ Expo   │
│ (job/cache) │      │              │      │ mobile │
└─────────────┘      └──────────────┘      └────────┘
```

**Flow for the core feature:** user submits a prompt (Next.js → tRPC) → backend deducts credits (Postgres transaction) → calls sunoapi.org → polls/receives webhook on completion → downloads audio, pushes to R2, writes `tracks` row → Supabase Realtime notifies the client → frontend fetches the R2 URL and plays via wavesurfer.js.

**Integration pain points to plan for, not just note:**

1. **Async generation vs. serverless timeouts.** Suno generation can take well over Netlify's 10-second synchronous function timeout. Don't try to hold a request open waiting for it — use a job-status pattern (write a `generations` row as `pending`, return immediately, update via webhook/poll, push the update through Supabase Realtime). This is the single most consequential architectural decision in this stack; get it wrong and the app feels broken under any real load.
2. **Vendor lock-in to one Suno reseller.** The viability analysis already flagged that `sunoapi.org` is unofficial and its terms could change without notice. Put a thin provider-abstraction interface between your backend and the reseller's API (one function: `generateTrack(prompt) -> job`) so swapping to a different reseller — or adding a fallback — doesn't touch the rest of the codebase.
3. **Credits ledger correctness under concurrency.** Two simultaneous requests decrementing the same user's balance is a classic race condition. Use a Postgres transaction (`SELECT ... FOR UPDATE` or an atomic decrement with a check constraint preventing negative balances) rather than read-then-write in application code.
4. **Monorepo type-sharing once mobile arrives.** tRPC's type inference requires the mobile app to import types from the same TypeScript project as the backend — set up the Turborepo workspace structure before you need it, not when you're mid-way through the Expo app and discover the types don't resolve.
5. **R2 vs. Supabase Storage split.** Having two object storage locations (R2 for audio, Supabase Storage for small assets) is a deliberate cost optimization, but it's one more thing to keep straight in upload/delete logic — document which store owns which asset type early so it doesn't become inconsistent as features get added.

---

## Reference: full documentation links

- [Next.js](https://nextjs.org/docs) · [React](https://react.dev/) · [Expo](https://docs.expo.dev/) · [Turborepo](https://turbo.build/repo/docs)
- [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [wavesurfer.js](https://wavesurfer.xyz/) · [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://github.com/pmndrs/zustand)
- [tRPC](https://trpc.io/docs) · [Node.js](https://nodejs.org/en/docs)
- [Supabase](https://supabase.com/docs) · [Supabase Auth](https://supabase.com/docs/guides/auth) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) · [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Netlify](https://docs.netlify.com/) · [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Railway](https://docs.railway.app/) · [GitHub Actions](https://docs.github.com/en/actions)
- [Stripe](https://docs.stripe.com/)
- [Suno API (sunoapi.org) docs](https://docs.sunoapi.org/)
