# CLAUDE.md — AI Music Creation App

This file is kept concise per [Claude Code memory conventions](https://code.claude.com/docs/en/memory) (target: under 200 lines, full detail lives in linked docs). Full detail lives in `./research/`. Read those files on demand — they are not auto-imported here so this file stays light on every session.

## 1. Project Identity

- **Name:** AI Music Creation App (working title — no brand name chosen yet)
- **One-line description:** A web app where small creative teams (bands, indie labels, content/podcast studios) generate, organize, and iterate on AI-generated music together in a shared workspace, built on top of a third-party Suno API reseller.
- **Core mission:** prove that shared team workspaces (pooled credits, roles, comments) are a real gap Suno/Udio don't fill for small creative teams — not to out-generate Suno.
- **Success criteria:** see `./research/PRD.md` Section 8. The single most important number is **month-1 team-formation rate (≥15% of orgs become multi-member)** — that's the direct test of whether the whole product wedge is real.
- **Full context:** `./research/PRD.md` (product spec) ← `./research/tech-stack.md` (stack) ← `./research/viability-analysis.md` (should we build this at all)

## 2. Technical Context

**Stack (full rationale in `./research/tech-stack.md`):**
- Frontend: Next.js (React), Tailwind + shadcn/ui, TanStack Query (server state) + Zustand (client state), wavesurfer.js for playback/waveform. Mobile (Expo/React Native) is explicitly phase 2, not MVP.
- Backend: Node.js + TypeScript, tRPC (not REST/GraphQL) for end-to-end type safety with the frontend.
- Database: Supabase (Postgres) — chosen over Firebase/MongoDB specifically because credits/billing need relational transaction guarantees.
- ORM/migrations: Drizzle.
- Object storage: Cloudflare R2 for audio (zero egress fees — audio must never be proxied through the app server or Netlify).
- Cache/rate limiting: Upstash Redis.
- Billing: Stripe (Checkout + Customer Portal + webhooks).
- Hosting: Netlify (swapped in from an original Vercel recommendation — same Next.js support, same 10s sync function timeout constraint).
- Generation provider: `sunoapi.org` — an **unofficial third-party wrapper** around Suno, not an official API. This is the single biggest external risk in the project; see Section 3.

**Key architectural decisions:**
- **Multi-tenancy via a single `organizations` table.** Every user gets an auto-created personal (single-member) org at signup; a "team" is just a non-personal org with more members. No schema migration between solo and team usage — this is deliberate, don't "add teams later" as a separate model.
- **Async job pattern for generation, always.** Suno generation takes seconds to minutes, well past serverless function timeouts. Never hold an HTTP request open waiting for a generation — enqueue, return `queued` immediately, update status via webhook + Supabase Realtime.
- **Credits ledger is append-only.** `credit_transactions` is insert-only; balances are never mutated directly. Corrections are offsetting entries, not edits.
- **Provider abstraction required.** Wrap all `sunoapi.org` calls behind a single interface (e.g. `generateTrack()`) so a reseller swap doesn't ripple through the codebase — the viability analysis flagged this dependency as unstable.

**Coding standards:** No dedicated style guide has been written yet — default to the global Claude Code conventions already in effect (no unnecessary comments, no speculative abstraction, minimal diffs) until this project defines its own in a future `.claude/rules/` file.

## 3. Current State

- **Built so far: a standalone frontend MVP spike, not P0 of the PRD.** A single-page Next.js app (`app/`) that takes a text prompt and generates a track via `sunoapi.org`, with two server-side API routes (`app/api/generate`, `app/api/status/[taskId]`) proxying the Suno key. **No database, no accounts, no orgs, no credits, no multi-tenancy** — this deliberately skips the entire data model in `./research/PRD.md` Section 4. Treat it as a UX/integration validation spike, not the start of P0 implementation; the Turborepo/Supabase/tRPC stack from `./research/tech-stack.md` has not been scaffolded and this app does not use it.
- **Not yet a git repository.** Still true as of this build — commit before doing anything further, including this MVP's code.
- **In progress:** nothing beyond the MVP spike above. The real P0 implementation (accounts, personal orgs, credits ledger) per `./research/PRD.md` Section 3 has not started.
- **Known issues / technical debt:**
  - The core "collaborative wedge" (team workspaces) is an **unvalidated hypothesis**, not a confirmed market need — don't over-invest in P1 features before P0 (solo generation loop) is proven.
  - `sunoapi.org` is an unofficial reseller with no SLA — expect breakage risk as Suno changes its product.
  - No budget headroom past ~1,000 users at the $50/mo hosting cap — see tech-stack.md Section 4 before scaling infra.
  - The MVP spike's Suno API key lives in `.env.local` (gitignored) and must be added to Netlify's environment variables manually before that deploy will work — it does not deploy with the code.
  - The MVP spike has no rate limiting — don't share its deployed URL publicly without adding at least a basic guard, since nothing stops rapid repeat submissions from spending API credits.

## 4. Agent Instructions

**How to approach this codebase:**
- Before writing any feature code, check its priority in `./research/PRD.md` Section 3 (P0/P1/P2) — build P0 solo-generation features before any P1 team/collaboration feature, even if team features seem more interesting to build.
- Treat `./research/PRD.md` Section 4 (database schema) as the source of truth for table/field names — don't invent new tables or rename existing ones without updating that doc.
- Every tenant-scoped table must carry `org_id` and be covered by an RLS policy. Never write a query that reads/writes org-scoped data without going through the org-membership check.

**Questions to ask before making changes:**
- Does this feature belong in P0, P1, or P2? If it's not in the PRD at all, ask whether it should be added there first rather than building ad hoc.
- Does this change touch the credits ledger, billing, or RLS policies? If yes, slow down — these are the areas where a mistake is expensive (real money, or a cross-tenant data leak).
- Does this introduce a new external dependency not listed in Section 6? Flag it before adding it.

**Never do without explicit approval:**
- Never mutate `credit_transactions` history or `organizations.credit_balance` outside the transactional debit/credit pattern described in the PRD.
- Never bypass or weaken Row Level Security policies "temporarily" for debugging in a way that could ship.
- Never commit secrets/API keys (Suno, Stripe, Supabase service role, R2) to source control, even in example/test files.
- Never push to a production branch, deploy to Netlify production, or run Stripe in live mode without confirming first.
- Never change the core tech stack choices (Section 2) or the wedge/target persona (Section 7) without flagging that it contradicts prior research — those were deliberate, documented decisions.

## 5. File Structure Map

**Current actual structure:**
```
./
├── .claude/CLAUDE.md      # this file
└── research/
    ├── viability-analysis.md
    ├── tech-stack.md
    └── PRD.md
```

**Planned structure (per tech-stack.md's Turborepo recommendation — not yet created):**
```
./
├── apps/
│   └── web/                # Next.js app: pages, components, tRPC client
├── packages/
│   ├── api/                 # tRPC routers (one file per domain: organizations, generations, tracks, billing...)
│   ├── db/                  # Drizzle schema, migrations, RLS policy SQL
│   └── config/               # shared tsconfig/eslint
├── turbo.json
└── package.json
```
**Naming conventions (to establish when scaffolding begins):** kebab-case files/directories, PascalCase React components, camelCase functions/variables, snake_case plural Postgres table names (matches PRD schema, e.g. `organization_members`), one tRPC router file per domain named `<domain>.router.ts`.

## 6. External Dependencies

| Service | Purpose | Docs |
|---|---|---|
| sunoapi.org | Music generation, lyrics, stems (unofficial Suno reseller) | https://docs.sunoapi.org/ |
| Supabase | Postgres, Auth, Realtime, small-asset storage | https://supabase.com/docs |
| Cloudflare R2 | Audio file object storage (zero egress) | https://developers.cloudflare.com/r2/ |
| Upstash Redis | Rate limiting, job/cache state | https://upstash.com/docs/redis/overall/getstarted |
| Stripe | Subscriptions, credit-pack purchases, billing portal | https://docs.stripe.com/ |
| Netlify | Hosting, functions, CI/CD deploy previews | https://docs.netlify.com/ |
| GitHub Actions | Lint/typecheck/test on PRs | https://docs.github.com/en/actions |

**Environment variables needed (names only — never store values here or in code):**
`SUNO_API_KEY`, `SUNO_WEBHOOK_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

## 7. User Avatar Reminder

**Who we're building for:** "Dana" — the creative lead of a 2–10 person studio (content/video, indie label, or band). Not a musician herself; she's accountable for shipping finished work on a deadline with a small, mixed-skill team. Full detail: `./research/PRD.md` Section 2.

**Key UX principles for this audience:**
- Minimize coordination overhead — the product's whole value is replacing scattered Slack/Drive handoffs with one shared, structured view. Every feature should be judged against "does this reduce the 'which version, whose credits' tax."
- No learning curve for non-technical teammates — a client-facing producer or a singer with no software background must be able to comment on a track and understand roles without training.
- Never fail silently, especially on credits — a blocked generation must say why, not just not happen.
- Design desktop-first but keep core flows (generate, browse, play, comment) usable at 375px width; full waveform editing can degrade gracefully on mobile.
