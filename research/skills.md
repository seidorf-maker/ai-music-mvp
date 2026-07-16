# Skills Inventory: AI Music Creation App

**Date:** 2026-07-15
**Source:** [PRD.md](./PRD.md) (features, schema, API spec) · [tech-stack.md](./tech-stack.md) (stack decisions) · [Claude Code skills docs](https://code.claude.com/docs/en/skills)

## How this maps to actual Claude Code skills

A Claude Code skill is a directory at `.claude/skills/<skill-name>/SKILL.md` — a `description` in YAML frontmatter that tells Claude when to load it, plus markdown instructions. Two shapes matter for this project:

- **Reference skills** (conventions, patterns, domain knowledge) load automatically when Claude's work matches the description — e.g., "how we write RLS policies in this project."
- **Task skills** (a specific multi-step procedure like a migration or deploy) are usually invoked explicitly with `/skill-name` and marked `disable-model-invocation: true` so they don't fire by accident.

This inventory is the planning layer, not the skills themselves — none of these `.claude/skills/` directories exist yet (this project has no code yet, per `CLAUDE.md` Section 3). Treat each entry below as a spec for a skill to author once implementation starts, sequenced by the PRD's P0-before-P1 priority. Skills are grouped under the eight categories requested, each mapped back to the specific PRD features/schema/API entries that require it.

---

## 1. Database Operations

#### `db-schema-migration`
- **Description:** Authors and applies Drizzle schema changes matching PRD Section 4's table definitions, and generates the corresponding migration file.
- **Input:** The table/field change requested, plus the current schema file and PRD Section 4 as the source of truth for naming/types/constraints.
- **Output:** An updated Drizzle schema file, a generated migration (`drizzle-kit generate`), and a diff summary of what changed.
- **Dependencies:** Libraries: [Drizzle ORM](https://orm.drizzle.team/docs/overview), `drizzle-kit`. External APIs: Supabase Postgres connection. Other skills: none (foundational).
- **Documentation links:** [Drizzle migrations](https://orm.drizzle.team/docs/migrations) · [Supabase database docs](https://supabase.com/docs/guides/database)
- **Complexity:** Moderate
- **Example invocation:** "Add a `stems_url` column to `tracks`" → Claude loads this skill automatically; explicit form: `/db-schema-migration tracks add-column stems_url:text`

#### `db-rls-policy-audit`
- **Description:** Writes or reviews Postgres Row Level Security policies for a tenant-scoped table, ensuring the base membership check plus any role-specific write restriction from PRD Section 4 is present and correctly scoped.
- **Input:** Table name, the operation being restricted (select/insert/update/delete), and the required role level if any (e.g., invites require `admin`+).
- **Output:** SQL policy statements plus a written justification tying each policy back to the specific PRD requirement it enforces.
- **Dependencies:** Libraries: none beyond SQL. External APIs: Supabase Postgres. Other skills: `db-schema-migration` (policies ship alongside schema changes), `rls-isolation-test` (verifies the policy actually holds).
- **Documentation links:** [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Complexity:** Complex — this is the single highest-stakes skill in the project; a wrong policy is a cross-tenant data leak, not a cosmetic bug.
- **Example invocation:** "Write the RLS policy for `invites.insert`" → auto-loads; explicit: `/db-rls-policy-audit invites insert admin`

#### `credit-ledger-transaction`
- **Description:** Implements or reviews any code path that debits or credits `credit_transactions`, enforcing the append-only-ledger and non-negative-balance rules from PRD Section 4 and `CLAUDE.md`.
- **Input:** The triggering event (generation request, purchase, refund, subscription grant), the org and amount involved.
- **Output:** A transactional insert into `credit_transactions` plus a balance check, wrapped in `SELECT ... FOR UPDATE` to prevent concurrent-request race conditions (the pain point flagged in tech-stack.md Section 6).
- **Dependencies:** Libraries: Drizzle (transactions). External APIs: none directly. Other skills: `db-schema-migration`.
- **Documentation links:** [Drizzle transactions](https://orm.drizzle.team/docs/transactions) · [Postgres row locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- **Complexity:** Complex — concurrency bugs here cost real money.
- **Example invocation:** "Debit credits when a generation is created" → auto-loads for any code touching `credit_transactions`

#### `paginated-query-builder`
- **Description:** Builds cursor-paginated list queries (not offset-based) for the endpoints that need them per PRD Section 5: `generations.list`, `tracks.list`.
- **Input:** Table, filter fields (org, project, search term), sort order, page size.
- **Output:** A tRPC procedure returning `{ items, nextCursor }` backed by the correct index (see PRD Section 4 indexing strategy).
- **Dependencies:** Libraries: Drizzle. Other skills: `db-schema-migration` (needs the composite index to already exist).
- **Documentation links:** [Drizzle queries](https://orm.drizzle.team/docs/select)
- **Complexity:** Moderate
- **Example invocation:** "Add pagination to the track library query" → auto-loads

#### `db-seed-fixtures`
- **Description:** Generates local development/test seed data — a personal org, a team org with multiple roles, sample projects/tracks/comments — matching the schema so features can be built against realistic data without a live Suno API key.
- **Input:** Which scenario to seed (solo user, small team, org with pending invites, etc.).
- **Output:** A seed script runnable against a local Supabase instance.
- **Dependencies:** Libraries: Drizzle. Other skills: `db-schema-migration`.
- **Documentation links:** [Supabase local development](https://supabase.com/docs/guides/local-development)
- **Complexity:** Simple
- **Example invocation:** "Seed a team org with three members for testing" → `/db-seed-fixtures team`

---

## 2. Authentication and Authorization

#### `supabase-auth-setup`
- **Description:** Wires up Supabase Auth for email/password and Google OAuth sign-in/sign-up per PRD F1, including session handling on both server (tRPC context) and client.
- **Input:** Which auth methods to enable, redirect URLs.
- **Output:** Working sign-up/sign-in flow, a tRPC context that resolves the authenticated `user_id` on every request.
- **Dependencies:** Libraries: `@supabase/supabase-js`, `@supabase/ssr`. External APIs: Supabase Auth, Google OAuth. Other skills: `org-provisioning` (fires immediately after first sign-up).
- **Documentation links:** [Supabase Auth](https://supabase.com/docs/guides/auth) · [Supabase Next.js Auth guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **Complexity:** Moderate
- **Example invocation:** "Set up sign-up with Google" → auto-loads

#### `org-provisioning`
- **Description:** Creates a personal, single-member organization transactionally the moment a new user completes sign-up, per PRD Section 4's "no user ever exists outside an org" invariant.
- **Input:** New user ID and email (from the Supabase Auth signup event).
- **Output:** A new `organizations` row (`is_personal = true`) plus a matching `organization_members` row (`role = owner`) in a single transaction — never two separate writes that could fail independently.
- **Dependencies:** Libraries: Drizzle. Other skills: `supabase-auth-setup`, `db-schema-migration`.
- **Documentation links:** [Supabase Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- **Complexity:** Moderate
- **Example invocation:** Fires automatically on the auth signup webhook/hook; explicit: `/org-provisioning`

#### `role-permission-guard`
- **Description:** tRPC middleware that checks the caller's role (`owner`/`admin`/`member`/`viewer`) in the target org before allowing a procedure to execute, per the permission table in PRD Section 5.
- **Input:** The procedure's required minimum role.
- **Output:** Reusable middleware (`requireRole('admin')`) applied to procedure definitions; a 403-equivalent tRPC error on failure.
- **Dependencies:** Libraries: tRPC. Other skills: `supabase-auth-setup`, `db-rls-policy-audit` (this is the application-layer check; RLS is the database-layer backstop — both are required per `CLAUDE.md`).
- **Documentation links:** [tRPC middleware](https://trpc.io/docs/server/middlewares)
- **Complexity:** Moderate
- **Example invocation:** "Restrict invite creation to admins and owners" → auto-loads

#### `invite-flow`
- **Description:** Generates, emails, and processes org invite tokens per PRD F7 — creation, 7-day expiry, and acceptance (including the logged-out-user-must-sign-up-first path).
- **Input:** Org ID, invitee email, role.
- **Output:** An `invites` row with a unique token, an email send, and an acceptance procedure that creates the `organization_members` row and marks the invite accepted.
- **Dependencies:** Libraries: an email-send provider (**not yet chosen — open decision, not in tech-stack.md**). Other skills: `role-permission-guard`, `db-schema-migration`.
- **Documentation links:** none yet — pending email provider choice.
- **Complexity:** Moderate
- **Example invocation:** "Invite a teammate as an admin" → auto-loads

---

## 3. API Integration with External Services

#### `suno-provider-adapter`
- **Description:** Wraps every call to `sunoapi.org` (generate, extend, cover, add-vocals, stems, lyrics) behind a single internal interface, per the provider-abstraction requirement `CLAUDE.md` and the viability analysis flagged as non-negotiable given the reseller is unofficial and could change without notice.
- **Input:** Generation parameters (prompt, model version, project context).
- **Output:** A normalized internal `GenerationJob` type, independent of the reseller's exact response shape — so swapping resellers later touches only this file.
- **Dependencies:** Libraries: none beyond `fetch`/an HTTP client. External APIs: [sunoapi.org](https://docs.sunoapi.org/). Other skills: none (foundational for all generation features).
- **Documentation links:** [sunoapi.org docs](https://docs.sunoapi.org/)
- **Complexity:** Moderate — the API surface itself is simple; the abstraction discipline is what matters.
- **Example invocation:** "Call the Suno API to generate a track from this prompt" → auto-loads

#### `suno-webhook-handler`
- **Description:** Receives and processes the `/api/webhooks/suno` callback per PRD Section 5 — verifies the shared-secret signature, updates `generations.status`, writes the resulting `tracks` row, and pushes a Supabase Realtime notification.
- **Input:** Raw webhook payload and signature header.
- **Output:** Updated `generations`/`tracks` rows and a client-visible status change, with no dependence on holding an HTTP request open (the async job pattern from tech-stack.md Section 6).
- **Dependencies:** Libraries: none beyond crypto for signature verification. External APIs: sunoapi.org. Other skills: `suno-provider-adapter`, `webhook-idempotency-guard`.
- **Documentation links:** [sunoapi.org docs](https://docs.sunoapi.org/) · [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **Complexity:** Complex — this is the async-timeout risk `CLAUDE.md` calls out as the most consequential architectural decision in the stack.
- **Example invocation:** Fires on inbound webhook POST; explicit: `/suno-webhook-handler` (for manual replay/debugging)

#### `stripe-checkout-flow`
- **Description:** Creates Stripe Checkout sessions for both credit-pack one-time purchases and subscription plans, per PRD `billing.createCheckoutSession`.
- **Input:** Org ID, product type (credit pack size or plan tier).
- **Output:** A Checkout session URL the client redirects to.
- **Dependencies:** Libraries: `stripe` Node SDK. External APIs: Stripe. Other skills: `role-permission-guard` (admin+ only).
- **Documentation links:** [Stripe Checkout](https://docs.stripe.com/checkout) · [Stripe Node SDK](https://docs.stripe.com/api?lang=node)
- **Complexity:** Moderate
- **Example invocation:** "Let an org admin buy a credit pack" → auto-loads

#### `stripe-webhook-handler`
- **Description:** Processes Stripe webhook events (`checkout.session.completed`, subscription lifecycle events) into `subscriptions` and `credit_transactions` rows.
- **Input:** Raw webhook payload and `stripe-signature` header.
- **Output:** Updated `subscriptions` row and/or a new `credit_transactions` entry (`reason = 'purchase'` or `'subscription_grant'`).
- **Dependencies:** Libraries: `stripe` Node SDK. External APIs: Stripe. Other skills: `credit-ledger-transaction`, `webhook-idempotency-guard`.
- **Documentation links:** [Stripe webhooks](https://docs.stripe.com/webhooks)
- **Complexity:** Complex — billing correctness bugs are expensive and hard to detect.
- **Example invocation:** Fires on inbound webhook POST; explicit: `/stripe-webhook-handler` (manual replay)

#### `r2-signed-url`
- **Description:** Generates time-limited signed URLs for reading (and, for the provider adapter, writing) audio files in Cloudflare R2, per PRD Section 5's `tracks.get` (15-minute TTL) and the "never a public bucket" security requirement in Section 6.
- **Input:** R2 object key, operation (read/write), TTL.
- **Output:** A signed URL.
- **Dependencies:** Libraries: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2 is S3-compatible). External APIs: Cloudflare R2.
- **Documentation links:** [Cloudflare R2](https://developers.cloudflare.com/r2/) · [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- **Complexity:** Simple
- **Example invocation:** "Generate a download URL for this track's audio" → auto-loads

#### `redis-rate-limiter`
- **Description:** Implements the token-bucket rate limits from PRD Section 5 — most importantly the 10/min/org cap on `generations.create`, sized to protect against runaway Suno API spend, not just abuse.
- **Input:** Rate-limit key (org or user), limit, window.
- **Output:** A reusable `checkRateLimit(key, limit, window)` helper returning allow/deny, applied as tRPC middleware.
- **Dependencies:** Libraries: `@upstash/ratelimit`, `@upstash/redis`. External APIs: Upstash Redis.
- **Documentation links:** [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) · [Upstash Ratelimit SDK](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- **Complexity:** Simple
- **Example invocation:** "Rate-limit the generation endpoint" → auto-loads

---

## 4. Frontend Component Generation

#### `generation-form-component`
- **Description:** Builds the prompt input, submit action, and live status indicator for PRD F2 — the core generation loop.
- **Input:** Target org/project context.
- **Output:** A React component that calls `generations.create`, then subscribes to status updates (Supabase Realtime via TanStack Query) without polling on a fixed interval.
- **Dependencies:** Libraries: React Hook Form, Zod, TanStack Query. Other skills: `suno-webhook-handler` (the status this UI reflects), `redis-rate-limiter` (must surface the rate-limit error clearly, not silently).
- **Documentation links:** [React Hook Form](https://react-hook-form.com/) · [TanStack Query](https://tanstack.com/query/latest) · [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **Complexity:** Moderate
- **Example invocation:** "Build the generate-a-track form" → auto-loads

#### `waveform-player-component`
- **Description:** Wraps wavesurfer.js into a reusable playback component used across the track library, comment thread (seek-to-timestamp), and future trim UI (P2).
- **Input:** Signed audio URL, optional comment timestamps to render as markers.
- **Output:** A playback component with waveform, play/pause, and seek support, keyboard-accessible per PRD Section 6's accessibility bar.
- **Dependencies:** Libraries: [wavesurfer.js](https://wavesurfer.xyz/). Other skills: `r2-signed-url`.
- **Documentation links:** [wavesurfer.js docs](https://wavesurfer.xyz/docs/)
- **Complexity:** Moderate
- **Example invocation:** "Add a waveform player to the track view" → auto-loads

#### `track-library-view`
- **Description:** Builds the paginated, searchable track library per PRD F3, with project filtering and grouped version lineage (F10).
- **Input:** Org/project context, search term, cursor.
- **Output:** A list/grid component consuming `tracks.list`.
- **Dependencies:** Libraries: TanStack Query, Tailwind/shadcn. Other skills: `paginated-query-builder`, `waveform-player-component`.
- **Documentation links:** [TanStack Query](https://tanstack.com/query/latest) · [shadcn/ui](https://ui.shadcn.com/)
- **Complexity:** Moderate
- **Example invocation:** "Build the track library page" → auto-loads

#### `project-management-ui`
- **Description:** Create/rename/archive UI for projects (folders) per PRD F4.
- **Input:** Org context.
- **Output:** CRUD UI backed by the `projects.*` procedures.
- **Dependencies:** Libraries: React Hook Form, Zod. Other skills: none beyond the backend procedures.
- **Documentation links:** [React Hook Form](https://react-hook-form.com/)
- **Complexity:** Simple
- **Example invocation:** "Add a create-project dialog" → auto-loads

#### `org-team-management-ui`
- **Description:** Member list, role change controls, and invite form for PRD F6/F7 — the primary UI surface for the collaboration wedge this whole product is betting on.
- **Input:** Org context, current user's role (to conditionally show admin-only controls).
- **Output:** A settings page: member table with role dropdowns, pending invites list, invite-by-email form.
- **Dependencies:** Other skills: `role-permission-guard` (client-side hint only — the real enforcement is server-side), `invite-flow`.
- **Documentation links:** [shadcn/ui](https://ui.shadcn.com/)
- **Complexity:** Moderate
- **Example invocation:** "Build the team settings page" → auto-loads

#### `track-comment-thread`
- **Description:** Timestamp-pinned comment component for PRD F9 — clicking a comment seeks playback to that point.
- **Input:** Track ID.
- **Output:** A threaded comment list plus an add-comment input, integrated with `waveform-player-component` for seek behavior.
- **Dependencies:** Other skills: `waveform-player-component`.
- **Documentation links:** [TanStack Query](https://tanstack.com/query/latest)
- **Complexity:** Moderate
- **Example invocation:** "Add comments to the track view" → auto-loads

#### `credits-billing-ui`
- **Description:** Balance display (always visible, per `CLAUDE.md`'s "never fail silently on credits" principle), credit history log, and Stripe Checkout/Customer Portal launch buttons for PRD F5/F8.
- **Input:** Org context.
- **Output:** A persistent balance indicator plus a billing/history page.
- **Dependencies:** Other skills: `stripe-checkout-flow`.
- **Documentation links:** [Stripe Customer Portal](https://docs.stripe.com/customer-management)
- **Complexity:** Simple
- **Example invocation:** "Show the org's credit balance in the header" → auto-loads

---

## 5. Testing and Validation

#### `rls-isolation-test`
- **Description:** Automated test suite asserting that a user in Org A cannot read or write any row scoped to Org B, across every tenant-scoped table — the concrete verification `CLAUDE.md` requires for the RLS security requirement in PRD Section 6.
- **Input:** Table list (from schema), two seeded orgs with distinct data.
- **Output:** A passing/failing test report; any failure is treated as a security incident, not a normal bug.
- **Dependencies:** Other skills: `db-seed-fixtures`, `db-rls-policy-audit`.
- **Documentation links:** [Supabase RLS testing guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
- **Complexity:** Complex
- **Example invocation:** "Verify tenant isolation before shipping" → `/rls-isolation-test`

#### `trpc-procedure-test`
- **Description:** Unit tests for individual tRPC procedures — Zod input validation, permission/role checks, and expected error shapes — per the full procedure table in PRD Section 5.
- **Input:** The procedure under test.
- **Output:** A test file covering valid input, invalid input, and unauthorized-role cases.
- **Dependencies:** Libraries: Vitest or similar. Other skills: `role-permission-guard`.
- **Documentation links:** [tRPC testing](https://trpc.io/docs/server/server-side-calls) · [Vitest](https://vitest.dev/)
- **Complexity:** Moderate
- **Example invocation:** "Write tests for `generations.create`" → auto-loads

#### `generation-flow-e2e-test`
- **Description:** End-to-end test of the full generation loop (prompt submit → `queued` → webhook → `completed` → playable track) against a mocked Suno provider response, so the flow can be tested without burning real API credits.
- **Input:** A mock provider response fixture.
- **Output:** A passing E2E test covering the async job pattern specifically, since that's the highest-risk architectural piece.
- **Dependencies:** Other skills: `suno-provider-adapter` (mocked), `suno-webhook-handler`.
- **Documentation links:** [Playwright](https://playwright.dev/) (suggested, not yet chosen in tech-stack.md)
- **Complexity:** Complex
- **Example invocation:** "Test the full generation flow end to end" → `/generation-flow-e2e-test`

#### `accessibility-audit`
- **Description:** Checks core flows (generate, browse, play, comment) against the WCAG 2.1 AA bar set in PRD Section 6 — keyboard operability, `aria-live` status announcements, color contrast.
- **Input:** The page/component to audit.
- **Output:** A pass/fail checklist with specific fixes, not just a score.
- **Dependencies:** Libraries: `axe-core` or equivalent (not yet chosen).
- **Documentation links:** [WCAG 2.1](https://www.w3.org/TR/WCAG21/) · [axe-core](https://github.com/dequelabs/axe-core)
- **Complexity:** Moderate
- **Example invocation:** "Audit the generation form for accessibility" → `/accessibility-audit`

---

## 6. Deployment and Infrastructure

#### `monorepo-scaffold`
- **Description:** One-time setup of the Turborepo structure from tech-stack.md Section 1 (`apps/web`, `packages/api`, `packages/db`, `packages/config`) and CLAUDE.md Section 5's planned layout.
- **Input:** None beyond the existing tech-stack.md decisions.
- **Output:** The initial repo scaffold, shared TypeScript config, and workspace wiring.
- **Dependencies:** Libraries: [Turborepo](https://turbo.build/repo/docs).
- **Documentation links:** [Turborepo docs](https://turbo.build/repo/docs)
- **Complexity:** Simple — but foundational; everything else assumes it exists.
- **Example invocation:** "Scaffold the monorepo" → `/monorepo-scaffold` (one-time, explicit)

#### `netlify-deploy-config`
- **Description:** Configures the Next.js app for Netlify per tech-stack.md Section 4 — the official Next.js adapter, environment variables, and the 10-second function timeout constraint that shapes the async job pattern.
- **Input:** None beyond the app structure.
- **Output:** `netlify.toml`, environment variable checklist, verified Deploy Preview on a test PR.
- **Dependencies:** External APIs: Netlify.
- **Documentation links:** [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Netlify docs](https://docs.netlify.com/)
- **Complexity:** Simple
- **Example invocation:** "Set up Netlify deployment" → `/netlify-deploy-config`

#### `ci-pipeline-setup`
- **Description:** GitHub Actions workflow running lint/typecheck/test on every PR, per tech-stack.md Section 4.
- **Input:** None beyond the monorepo scaffold.
- **Output:** A `.github/workflows/ci.yml` that gates merges.
- **Dependencies:** External APIs: GitHub Actions. Other skills: `monorepo-scaffold`.
- **Documentation links:** [GitHub Actions](https://docs.github.com/en/actions)
- **Complexity:** Simple
- **Example invocation:** "Set up CI" → `/ci-pipeline-setup`

#### `secrets-env-audit`
- **Description:** Verifies every required environment variable from `CLAUDE.md` Section 6 is present (by name, not value) in each environment, and that no secret has leaked into a committed file or client bundle — the concrete check behind the "never commit secrets" rule.
- **Input:** The `.env.example` file and the deployed environment's variable list.
- **Output:** A pass/fail report per environment (local, preview, production).
- **Dependencies:** Other skills: none.
- **Documentation links:** [Netlify environment variables](https://docs.netlify.com/environment-variables/overview/) · [Supabase environment variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- **Complexity:** Simple
- **Example invocation:** "Check that all required env vars are set before deploy" → `/secrets-env-audit`

---

## 7. Documentation Generation

#### `api-reference-doc`
- **Description:** Generates/updates human-readable reference documentation for the tRPC routers, kept in sync with the actual procedure signatures rather than the static PRD Section 5 table.
- **Input:** The current router source files.
- **Output:** An up-to-date API reference doc (e.g., `docs/api-reference.md`).
- **Dependencies:** Other skills: none — reads code directly.
- **Documentation links:** [tRPC docs](https://trpc.io/docs)
- **Complexity:** Simple
- **Example invocation:** "Regenerate the API reference doc" → `/api-reference-doc`

#### `readme-onboarding-doc`
- **Description:** Keeps the repo README (install steps, required env vars, how to run locally) in sync with the actual monorepo structure as it evolves — the thing a new contributor reads first.
- **Input:** Current `package.json` scripts, `.env.example`, monorepo layout.
- **Output:** An updated `README.md`.
- **Dependencies:** Other skills: `monorepo-scaffold`, `secrets-env-audit`.
- **Documentation links:** none external.
- **Complexity:** Simple
- **Example invocation:** "Update the README to match the current setup" → `/readme-onboarding-doc`

---

## 8. Error Handling and Logging

#### `generation-error-messaging`
- **Description:** Maps every way a generation can fail (provider error, rate limit, insufficient credits, timeout) to a specific, honest, user-facing message — per the "never fail silently, especially on credits" UX principle in `CLAUDE.md` Section 7.
- **Input:** The failure mode being handled.
- **Output:** A consistent error-state UI pattern plus the copy for each failure case.
- **Dependencies:** Other skills: `suno-webhook-handler`, `redis-rate-limiter`, `generation-form-component`.
- **Documentation links:** none external — this is a project-specific UX pattern.
- **Complexity:** Simple
- **Example invocation:** "Handle the case where a generation fails" → auto-loads

#### `webhook-idempotency-guard`
- **Description:** Ensures both webhook handlers (`suno`, `stripe`) safely no-op on a duplicate delivery — both providers can and will redeliver the same event.
- **Input:** The webhook's unique event ID.
- **Output:** A dedupe check (e.g., a processed-events table or upsert-based handler) so a retried webhook never double-charges credits or double-writes a track.
- **Dependencies:** Other skills: `suno-webhook-handler`, `stripe-webhook-handler`, `credit-ledger-transaction`.
- **Documentation links:** [Stripe webhook idempotency](https://docs.stripe.com/webhooks#handle-duplicate-events)
- **Complexity:** Moderate
- **Example invocation:** "Make the Stripe webhook handler safe against duplicate deliveries" → auto-loads

#### `observability-setup`
- **Description:** Wires up structured logging and error tracking across the app. **Open decision, not resolved in tech-stack.md** — no monitoring/error-tracking service has been chosen yet. This skill's first job is to surface that gap and get a decision, not assume a tool.
- **Input:** N/A until a service is chosen.
- **Output:** A recommendation (with cost/complexity tradeoffs against the $50/mo budget ceiling) before any implementation.
- **Dependencies:** External APIs: none chosen yet — commonly Sentry or a Supabase-log-based approach would be evaluated here.
- **Documentation links:** none yet.
- **Complexity:** Simple (once a tool is chosen) — flagged Complex today only because the decision itself is unresolved.
- **Example invocation:** "Set up error tracking" → should prompt a decision question before proceeding, not silently pick a vendor

---

## Explicitly NOT needed (per instructions: worth naming what we're ruling out)

- **ML model training/fine-tuning skill** — the product is entirely dependent on the Suno reseller's models (PRD Section 7); there is no proprietary generation technology to build or train.
- **GraphQL schema generation skill** — tech-stack.md chose tRPC specifically to avoid maintaining a separate API schema layer; a GraphQL skill would fight that decision.
- **Native mobile build skill (Expo/EAS)** — explicitly phase 2 per tech-stack.md and PRD Section 7; premature before the web wedge is validated.
- **DAW/audio-DSP mixing skill** — full multitrack editing is explicitly out of scope (PRD Section 7); stem download is the ceiling for MVP.
- **Voice cloning / persona training skill** — out of scope (PRD Section 7).
- **SSO/SAML integration skill** — out of scope until org size trends past the 2–10 person range this PRD targets (PRD Section 7).
- **Custom search/indexing skill (e.g., Elasticsearch)** — PRD Section 4 explicitly defers to Postgres full-text search until there's evidence users need more.
- **Payment method / PCI handling skill** — deliberately not needed: Stripe Checkout keeps card data off our servers entirely (PRD Section 6), so there's no PCI-scope code to write.
