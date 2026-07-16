# Product Requirements Document: AI Music Creation App

**Date:** 2026-07-15
**Depends on:** [viability-analysis.md](./viability-analysis.md) · [tech-stack.md](./tech-stack.md)

## A note on the wedge, before anything else

The viability analysis was explicit: "help creatives create music" is not a product — it's Suno's own tagline — and building it as stated is a **no-go** until there's a specific gap Suno doesn't already fill. This PRD can't be written generically and still be "detailed enough that a developer could understand exactly what to build," so it commits to a concrete wedge rather than staying abstract. If you validate a different wedge, Section 3 (features) and the org/team model in Sections 2 and 4 are what change — the generation/library/billing core underneath is stable either way.

**Chosen wedge for this PRD: collaborative studio workspaces.** Suno and Udio are built for one person generating alone. There is no shared workspace, no pooled credits, no role-based access, and no way for a small band, indie label, content studio, or podcast/video team to work from a shared library with a shared bill. That gap is real, it's testable in weeks not months, and — practically — it's also why the tech stack's multi-tenancy requirement makes sense: this PRD treats "organizations" as small creative teams (2–10 people), while every individual also gets a personal, single-member organization by default so solo creators aren't forced into team mechanics they don't need. **This wedge is a hypothesis, not a validated fact** — Section 8 treats team-creation rate as the metric that proves or kills it, and Section 3 deliberately sequences solo-first so the core generation loop is validated before collaboration is built on top of it.

---

## 1. Executive Summary

We're building a web application where small creative teams — bands, indie labels, content studios, podcast and video production teams — generate, organize, and iteratively refine AI-generated music together in a shared workspace, instead of each member running separate, disconnected Suno accounts and passing files back and forth over Slack or Drive. The application is a UI and collaboration layer on top of a third-party Suno API reseller ([sunoapi.org](https://docs.sunoapi.org/)); it does not train or host its own generation model.

**Primary value proposition:** one shared library, one shared credit pool, and one shared bill for a team that's currently duct-taping together individual AI music accounts — turning a solo creative tool into a team one without requiring anyone to leave the prompt-and-generate workflow they already understand.

**Target user persona (primary): "Dana," the creative lead of a 3–6 person content or music studio.** Dana is not a professional composer — she's a video editor, podcast producer, or indie band's de facto project manager who is responsible for getting usable music into finished work on a deadline, using a small, non-technical team. She's price-sensitive but not cheap: she'll pay for a tool that removes coordination overhead, because her time is the scarce resource, not the subscription fee. She's motivated by shipping finished work without friction; she's afraid of the team paying for five separate Suno subscriptions that nobody tracks, of losing track of "which version was the good one" across a Discord thread, and of a teammate generating something great that gets buried and never reused. Success, for Dana, looks like: her team opens one shared project, sees everything anyone has generated for it, and ships.

---

## 2. User Avatar Deep Dive

### Who exactly is this for?

Dana runs a small (2–10 person) creative operation — most plausibly a content studio producing video/podcast work at volume, an indie band or small label, or a game/animation micro-studio needing music beds and stings. She is the one who feels the pain of tool sprawl even when she's not the one generating every track. Her teammates range from technical (a video editor comfortable with software) to non-technical (a singer or a client-facing producer), so the product has to work for both without a learning curve.

### What is their current painful workflow?

Today, this team either:
- Shares one login to a single Suno account (against ToS, no accountability for who generated what or spent how many credits), or
- Each member has their own account, generates independently, and the "best" tracks get manually exported and dropped into a shared Drive folder or Slack channel with no structure — no link back to the prompt that made it, no way to regenerate a variation, no comments on what needs to change.

Either way, there is no shared record of what's been tried, no shared credit budget anyone can see, and no lightweight review step before a track goes into finished work. Dana finds out a track is unusable (wrong mood, too long, bad ending) only after it's already been dropped into an edit.

### What does success look like for them?

A shared project (e.g., "Episode 42" or "Summer EP") where any team member can generate, everyone can see everything that's been tried, comments live on the timestamp of a track rather than in a separate chat app, and Dana can see at a glance how many credits the team has left this month without asking anyone. The team ships the episode/track/scene faster because the "which version, whose credits, is this final" coordination tax disappears.

### What would make them tell a colleague about this product?

Not the generation quality (that's Suno's, not this product's) — the moment a teammate points at a comment thread on a track and says "oh yeah, fixed, listen to v3," and Dana realizes she never had to ask "which file is the latest one" for the whole project. That's the specific, nameable improvement over the status quo, and it's the thing worth telling another studio lead about.

---

## 3. Feature Specification

Features are sequenced deliberately: **P0 validates the core generation loop for a single user first** (the thing that has to work regardless of wedge), and **P1 adds the collaboration layer that is the actual differentiation hypothesis.** Don't build P1 before P0 is proven — if solo generation-and-organize doesn't retain users, team features won't save it.

### P0 — MVP-critical

**F1. Account creation & personal workspace**
- *User story:* As a new user, I want to sign up with email or Google and land in a ready-to-use workspace so that I can generate my first track without any setup friction.
- *Acceptance criteria:* User can register via email/password or Google OAuth (Supabase Auth); on first login, a personal organization (`is_personal = true`, single member, owner role) is auto-created; user lands directly in an empty project ready to generate.
- *Technical notes/dependencies:* Supabase Auth, `organizations` + `organization_members` tables (Section 4). PKCE flow reserved for future mobile app per tech-stack.md.

**F2. Prompt-based track generation**
- *User story:* As a creator, I want to describe a song in a text prompt and get a finished track so that I don't need musical training to produce usable music.
- *Acceptance criteria:* User submits a prompt (and optional style/genre tags); request is acknowledged in <500ms with a `queued` status; UI shows live status (`queued → processing → completed/failed`) without requiring a page refresh; on completion, the track is playable in-app within the session.
- *Technical notes/dependencies:* tRPC `generations.create` → sunoapi.org generation call; async job-status pattern (Section 6 of tech-stack.md) — the request returns immediately, status updates arrive via webhook + Supabase Realtime, not by holding the HTTP request open.

**F3. Track library & playback**
- *User story:* As a creator, I want every track I've generated saved and playable in one place so that I don't lose good takes.
- *Acceptance criteria:* All completed tracks appear in a paginated, searchable (by title/prompt text) library; in-browser playback with a waveform (wavesurfer.js); tracks are downloadable as audio files.
- *Technical notes/dependencies:* Audio served from signed, time-limited Cloudflare R2 URLs, not a public bucket.

**F4. Projects (folders)**
- *User story:* As a creator, I want to group tracks into a named project so that work for different outputs (e.g., different episodes or songs) doesn't blur together.
- *Acceptance criteria:* User can create/rename/archive a project; every generation can optionally be assigned to a project at creation time or moved afterward; the library view can be filtered by project.
- *Technical notes/dependencies:* `projects` and `project_id` FK on `tracks`/`generations` (Section 4).

**F5. Credits & billing (individual)**
- *User story:* As a user, I want to see how many credits I have and buy more so that I'm never surprised by a blocked generation.
- *Acceptance criteria:* Current balance always visible in the UI; generation is blocked with a clear message (not a silent failure) if balance is insufficient; Stripe Checkout purchase flow adds credits atomically on webhook confirmation; every balance change is visible in a credit history log.
- *Technical notes/dependencies:* Append-only `credit_transactions` ledger (never mutate a balance directly — Section 4); Stripe webhook handler; org-scoped balance even for personal (single-member) orgs, so the ledger design doesn't change when team billing (F9) ships.

### P1 — Important (the collaboration wedge)

**F6. Team workspaces**
- *User story:* As a studio lead, I want to create a shared organization and invite my team so that we all work from the same library instead of separate accounts.
- *Acceptance criteria:* User can create a new (non-personal) organization from any personal workspace; org has a name and a unique slug; creator becomes `owner`.
- *Technical notes/dependencies:* Same `organizations`/`organization_members` tables as F1 — a "team" is just a non-personal org with >1 member. No schema migration needed to go from solo to team.

**F7. Invites & roles**
- *User story:* As an org owner, I want to invite teammates with a specific role so that I control who can spend credits or change settings versus who can just generate and comment.
- *Acceptance criteria:* Owner/admin can invite by email with a role (`admin`, `member`, `viewer`); invite sends an emailed link with a 7-day-expiring token; accepting an invite while logged out prompts sign-up first; role permissions are enforced server-side, not just hidden in the UI (viewer cannot generate or invite; member cannot change org settings or remove members; admin can do everything except delete the org or change billing, which is owner-only).
- *Technical notes/dependencies:* `invites` table, role-checked tRPC middleware, Postgres RLS policies keyed on role, not just org membership.

**F8. Shared credit pool**
- *User story:* As a team member, I want my generations to draw from the team's shared credit balance so that I don't need my own subscription.
- *Acceptance criteria:* All generations within a team org draw from that org's single balance; every ledger entry records which user triggered it, so spend is attributable even though the pool is shared; owner/admin can see a per-member usage breakdown.
- *Technical notes/dependencies:* Extends F5's ledger design — `credit_transactions.user_id` was already present for exactly this reason.

**F9. Track comments**
- *User story:* As a teammate, I want to leave a comment pinned to a specific moment in a track so that feedback is unambiguous and doesn't live in a separate chat app.
- *Acceptance criteria:* Any org member (viewer included) can comment; a comment can optionally be pinned to a timestamp in the track and clicking it seeks playback to that point; comments are visible to the whole org, threaded per track.
- *Technical notes/dependencies:* `track_comments` table with nullable `timestamp_seconds`; this is the feature most directly testing the wedge hypothesis — track its usage rate specifically (Section 8).

**F10. Regeneration & version lineage**
- *User story:* As a creator, I want to regenerate a variation of an existing track and see it linked to the original so that the team can find "the good one" among iterations.
- *Acceptance criteria:* "Regenerate" on a track creates a new track record linked via `parent_track_id`; the library groups linked versions together by default rather than listing them as unrelated items.
- *Technical notes/dependencies:* Self-referencing FK on `tracks` (Section 4).

**F11. Stem download**
- *User story:* As an editor on the team, I want to download vocal/instrumental stems so that I can mix the generated track into finished work.
- *Acceptance criteria:* "Get stems" triggers the reseller's stem-separation call, shows a processing state, and produces downloadable stem files on completion.
- *Technical notes/dependencies:* Direct pass-through to sunoapi.org's stem-separation endpoint; treat as a separate async job from the original generation (its own status, not blocking the main track).

**F12. Lyrics generation & display**
- *User story:* As a songwriter, I want AI-suggested lyrics alongside the generated track so that I can edit and iterate on words, not just sound.
- *Acceptance criteria:* Lyrics are generated alongside or on-demand for a track; timestamped lyrics (if the provider returns them) sync visually with playback; lyrics are user-editable text, saved separately from the immutable generated audio.
- *Technical notes/dependencies:* Provider's timestamped-lyrics endpoint (confirmed available per the sunoapi.org docs reviewed in the viability analysis).

### P2 — Nice-to-have (explicitly deferred, see Section 7 for the full out-of-scope list)

**F13.** Basic waveform trim/region selection before download.
**F14.** Org-level activity feed ("Dana generated 3 tracks in Episode 42 today").
**F15.** Custom track tagging/mood labels for library filtering beyond project grouping.
**F16.** Team billing seat management UI beyond the basic role list (e.g., bulk invite, SSO — see Section 7).

---

## 4. Database Schema

Postgres (Supabase), multi-tenant via a shared-schema + row-level-security model — every tenant-scoped table carries an `org_id`, and Postgres RLS policies (not just application code) enforce that a user can only read/write rows belonging to an org they're a member of. **Every user gets a personal, single-member org at signup**; a "team" is simply a non-personal org with more than one member — this means F1 through F12 share one data model with no migration between solo and team usage.

### Entities and relationships

```
organizations 1───* organization_members *───1 users
organizations 1───* invites
organizations 1───* projects
organizations 1───* generations
organizations 1───* tracks
organizations 1───* credit_transactions
organizations 1───1 subscriptions
projects      1───* generations
projects      1───* tracks
generations   1───1 tracks           (one completed generation → one track)
tracks        1───* track_comments
tracks        1───* tracks           (self-referencing: parent_track_id, for regeneration lineage)
users         1───* track_comments
users         1───* generations      (created_by)
```

### Tables

**`organizations`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `name` | text | not null |
| `slug` | text | unique, not null, `^[a-z0-9-]{3,50}$` |
| `is_personal` | boolean | not null, default `false` |
| `plan` | text | not null, default `'free'`, check in `('free','pro','team')` |
| `credit_balance` | integer | not null, default `0`, check `>= 0` |
| `stripe_customer_id` | text | nullable, unique |
| `created_at` | timestamptz | not null, default `now()` |

**`organization_members`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `user_id` | uuid | FK → `auth.users.id`, not null |
| `role` | text | not null, check in `('owner','admin','member','viewer')` |
| `invited_by` | uuid | FK → `auth.users.id`, nullable |
| `joined_at` | timestamptz | not null, default `now()` |
| — | — | unique `(org_id, user_id)` |

**`invites`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `email` | text | not null |
| `role` | text | not null, check in `('admin','member','viewer')` (cannot invite as owner) |
| `token` | text | unique, not null |
| `invited_by` | uuid | FK → `auth.users.id`, not null |
| `expires_at` | timestamptz | not null |
| `accepted_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null, default `now()` |

**`projects`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `name` | text | not null, 1–120 chars |
| `description` | text | nullable |
| `archived_at` | timestamptz | nullable |
| `created_by` | uuid | FK → `auth.users.id`, not null |
| `created_at` | timestamptz | not null, default `now()` |

**`generations`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `project_id` | uuid | FK → `projects.id`, nullable, `on delete set null` |
| `user_id` | uuid | FK → `auth.users.id`, not null (who triggered it) |
| `prompt` | text | not null, 1–2000 chars |
| `model_version` | text | not null |
| `provider` | text | not null, default `'sunoapi_org'` |
| `provider_job_id` | text | nullable, indexed |
| `status` | text | not null, default `'queued'`, check in `('queued','processing','completed','failed')` |
| `error_message` | text | nullable |
| `credits_charged` | integer | not null, check `>= 0` |
| `created_at` | timestamptz | not null, default `now()` |
| `completed_at` | timestamptz | nullable |

**`tracks`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null (denormalized from `generations` for RLS/query speed), `on delete cascade` |
| `generation_id` | uuid | FK → `generations.id`, unique, not null, `on delete cascade` |
| `project_id` | uuid | FK → `projects.id`, nullable, `on delete set null` |
| `parent_track_id` | uuid | FK → `tracks.id`, nullable (regeneration lineage) |
| `title` | text | not null, default `'Untitled'` |
| `audio_url` | text | not null (R2 object key, resolved to signed URL at read time) |
| `duration_seconds` | numeric | nullable |
| `stems_url` | text | nullable |
| `lyrics` | text | nullable |
| `created_by` | uuid | FK → `auth.users.id`, not null |
| `created_at` | timestamptz | not null, default `now()` |

**`track_comments`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `track_id` | uuid | FK → `tracks.id`, not null, `on delete cascade` |
| `user_id` | uuid | FK → `auth.users.id`, not null |
| `body` | text | not null, 1–2000 chars |
| `timestamp_seconds` | numeric | nullable |
| `created_at` | timestamptz | not null, default `now()` |

**`credit_transactions`** (append-only ledger — never `UPDATE`, only `INSERT`)
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, not null, `on delete cascade` |
| `user_id` | uuid | FK → `auth.users.id`, nullable (system-triggered entries, e.g. plan grants, have no user) |
| `delta` | integer | not null, check `<> 0` |
| `reason` | text | not null, check in `('purchase','generation','refund','bonus','subscription_grant')` |
| `reference_id` | uuid | nullable (e.g. the `generations.id` that caused the debit) |
| `created_at` | timestamptz | not null, default `now()` |

**`subscriptions`**
| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → `organizations.id`, unique, not null, `on delete cascade` |
| `stripe_subscription_id` | text | unique, not null |
| `plan` | text | not null |
| `status` | text | not null, check in `('active','past_due','canceled','trialing')` |
| `current_period_end` | timestamptz | not null |
| `updated_at` | timestamptz | not null, default `now()` |

### Multi-tenancy architecture

- Every tenant-scoped table carries `org_id`. Row Level Security is enabled on all of them with a base policy: `org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())`.
- Write policies layer role checks on top of the membership check (e.g., `invites.insert` additionally requires the caller's role in that org to be `owner` or `admin`; `organizations.delete` requires `owner`).
- `credit_balance` lives on `organizations`, not `users` — this is what makes shared team pools (F8) work with zero schema change from the personal-org case; a personal org's balance is just a pool of one.
- No user ever exists "outside" an org — the personal org is created transactionally at signup, so there is no code path where `org_id` resolution can be null.

### Indexing strategy

Indexes chosen for the query patterns the features above actually need:
- `organization_members(user_id)` — resolving "which orgs am I in" on every authenticated request (this backs the RLS policy itself, so it's not optional).
- `organization_members(org_id)` — member list / role lookups.
- `generations(org_id, created_at desc)` — the library's default sort.
- `generations(status) WHERE status IN ('queued','processing')` — partial index for the polling/webhook worker scanning in-flight jobs; keeps that scan cheap regardless of total historical generation volume.
- `generations(provider_job_id)` — webhook callback lookup by provider's job ID.
- `tracks(org_id, project_id)` — project-filtered library view.
- `tracks(org_id, created_at desc)` — default library sort.
- `tracks(parent_track_id)` — version-lineage grouping (F10).
- `track_comments(track_id, timestamp_seconds)` — rendering comments in playback order.
- `credit_transactions(org_id, created_at desc)` — credit history view and balance reconciliation.
- `invites(token)` — unique index, invite-acceptance lookup.
- `invites(org_id, email) WHERE accepted_at IS NULL` — partial index, prevents/detects duplicate pending invites.

### Data validation rules

- Enforce all `check` constraints listed above at the database level, not just in application/Zod validation — the app is the first line of defense, the database is the one that can't be bypassed by a bug.
- `credit_balance` must never go negative — enforced by the `>= 0` check plus application logic that debits inside a single transaction alongside the ledger insert (`SELECT ... FOR UPDATE` on the org row to prevent concurrent-request race conditions, per the pain point flagged in tech-stack.md Section 6).
- `credit_transactions` is genuinely append-only: no `UPDATE`/`DELETE` grants on that table for the application role; corrections happen via a new offsetting entry (`reason = 'refund'`), never by editing history.
- Slugs, emails, and prompt/comment length limits are validated both in Zod (tRPC input schema, so bad requests fail fast with a clear error) and mirrored as database checks.
- Status transitions on `generations` (`queued → processing → completed|failed`) are enforced in application code as the single writer of that field; no client-facing mutation can set `status` directly — only the webhook handler and the initial insert can.

---

## 5. API Specification

The backend is tRPC (Section 2 of tech-stack.md), so "endpoints" are typed procedures, not hand-versioned REST routes — request/response shapes below are the Zod input/output contract for each. Two genuinely external HTTP endpoints exist outside tRPC because they're called by third parties that can't speak tRPC: the Suno provider's webhook and Stripe's webhook.

All procedures require an authenticated Supabase session unless marked public. Every org-scoped procedure additionally requires active membership in the target `org_id`, enforced by shared tRPC middleware (not repeated per-procedure) — so "auth requirement" below means *role* requirements beyond plain membership.

### Organizations
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `organizations.create` | `{ name }` | `Organization` | Any authenticated user | 10/hour/user |
| `organizations.get` | `{ orgId }` | `Organization` | Member | — |
| `organizations.update` | `{ orgId, name? }` | `Organization` | `admin`+ | — |
| `organizations.listMine` | — | `Organization[]` | Authenticated | — |

### Members & invites
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `members.list` | `{ orgId }` | `Member[]` | Member | — |
| `members.updateRole` | `{ orgId, userId, role }` | `Member` | `admin`+ (cannot promote to `owner`) | — |
| `members.remove` | `{ orgId, userId }` | `{ success }` | `admin`+ | — |
| `invites.create` | `{ orgId, email, role }` | `Invite` | `admin`+ | 20/hour/org |
| `invites.accept` | `{ token }` | `Member` | Authenticated (post-signup redirect) | — |

### Projects
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `projects.create` | `{ orgId, name, description? }` | `Project` | `member`+ | — |
| `projects.list` | `{ orgId, includeArchived? }` | `Project[]` | Member (incl. `viewer`) | — |
| `projects.update` | `{ projectId, name?, description?, archived? }` | `Project` | `member`+ | — |

### Generations
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `generations.create` | `{ orgId, projectId?, prompt, modelVersion? }` | `{ generationId, status: 'queued' }` | `member`+ (not `viewer`); blocked if `credit_balance` insufficient | **10/min/org** — the binding limit; protects against runaway Suno API spend, not just abuse |
| `generations.get` | `{ generationId }` | `Generation` | Member | — |
| `generations.list` | `{ orgId, projectId?, cursor?, limit? }` | `{ items: Generation[], nextCursor }` | Member | — |
| `generations.cancel` | `{ generationId }` | `{ success }` | Creator or `admin`+ | — |

### Tracks
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `tracks.list` | `{ orgId, projectId?, cursor?, limit?, search? }` | `{ items: Track[], nextCursor }` | Member | — |
| `tracks.get` | `{ trackId }` | `Track` (with signed `audioUrl`) | Member | Signed URL TTL: 15 min |
| `tracks.update` | `{ trackId, title? }` | `Track` | `member`+ | — |
| `tracks.delete` | `{ trackId }` | `{ success }` | Creator or `admin`+ | — |
| `tracks.requestStems` | `{ trackId }` | `{ jobStatus: 'processing' }` | `member`+; blocked if insufficient credits | 5/min/org |

### Comments
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `comments.create` | `{ trackId, body, timestampSeconds? }` | `Comment` | Member (incl. `viewer`) | 30/hour/user |
| `comments.list` | `{ trackId }` | `Comment[]` | Member | — |
| `comments.delete` | `{ commentId }` | `{ success }` | Author or `admin`+ | — |

### Credits & billing
| Procedure | Input | Output | Auth | Rate limit |
|---|---|---|---|---|
| `credits.getBalance` | `{ orgId }` | `{ balance }` | Member | — |
| `credits.history` | `{ orgId, cursor? }` | `{ items: CreditTransaction[], nextCursor }` | Member | — |
| `billing.createCheckoutSession` | `{ orgId, creditPack }` | `{ checkoutUrl }` | `admin`+ | 10/hour/org |
| `billing.createPortalSession` | `{ orgId }` | `{ portalUrl }` | `admin`+ | — |

### External webhooks (plain REST, not tRPC — called by third parties)
| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/webhooks/suno` | `POST` | Shared-secret signature header, verified before processing | Updates `generations.status`, writes `tracks` row on completion, triggers Supabase Realtime notification |
| `/api/webhooks/stripe` | `POST` | Stripe signature verification (`stripe-signature` header) | Updates `subscriptions`, inserts `credit_transactions` on successful purchase |

**Rate limiting implementation:** token-bucket counters in Upstash Redis, keyed by `org_id` (generation/stem endpoints, since spend is org-scoped) or `user_id` (auth-adjacent actions like comments/invites). The generation limit is the one that matters most — it's sized to protect against a single runaway client loop burning through the org's Suno credits, not primarily to stop abuse.

---

## 6. Non-Functional Requirements

**Performance targets:**
- A generation request is acknowledged (status = `queued`) in under 500ms server time, independent of how long the underlying Suno generation takes.
- API p95 latency under 300ms for all non-generation procedures.
- Web app Time-to-Interactive under 2.5s on a throttled 4G profile; Lighthouse performance score ≥ 90.
- Track library remains responsive (cursor-paginated, indexed queries) at 10,000+ tracks per org.

**Security requirements:**
- Tenant isolation is enforced at the database layer via Postgres RLS, not only in application code — verified by automated tests that assert cross-org access fails.
- All audio is served via signed, time-limited R2 URLs; no public bucket listing.
- Card data never touches our servers — Stripe Checkout/Customer Portal handles it, keeping PCI scope at SAQ-A.
- Both external webhooks verify their signature before processing any payload.
- Secrets (Suno reseller key, Stripe key, Supabase service role key) live in Netlify/Supabase environment secrets, never in client-shipped code.
- Role permissions (Section 3, F7) are enforced server-side in tRPC middleware and mirrored in RLS — a UI bug hiding a button is not the security boundary.

**Accessibility standards:**
- WCAG 2.1 AA as the baseline target across the app.
- All playback and generation-status controls are keyboard-operable; generation status changes are announced via `aria-live` regions (a screen-reader user should hear "generation complete" without needing to poll the page).
- Color contrast ≥ 4.5:1 for text; waveform/player controls have accessible labels, not icon-only with no text alternative.

**Mobile responsiveness:**
- No native mobile app in MVP (deferred to tech-stack.md's phase 2 Expo build) — but the web app itself must be fully responsive down to a 375px viewport for the core flows: generate, browse library, play, comment.
- Full waveform region-selection editing (P2, F13) may be desktop-optimized with a simplified mobile fallback (play/comment only); this is an accepted degradation, documented here so it isn't discovered as a surprise late in development.

---

## 7. Out of Scope

**Explicitly not building in MVP:**
- Native mobile app (React Native/Expo) — validated wedge first, mobile is additive per tech-stack.md's phased plan.
- Real-time simultaneous multiplayer editing (Google-Docs-style co-editing of a track). Collaboration in v1 is asynchronous (comments, shared library), not live.
- Any custom-trained or fine-tuned music model — the product is entirely dependent on the Suno reseller's models; there is no proprietary generation technology here.
- Full DAW-style multitrack timeline editing. Stem download (F11) and basic waveform trim (F13) are the ceiling; users needing real mixing take stems into their own DAW.
- A licensing/rights marketplace or direct distribution to streaming platforms.
- Voice cloning or custom persona/voice training.
- Enterprise SSO/SAML, custom contracts, or dedicated infrastructure for any single customer.
- Usage analytics dashboards beyond the basic per-member credit-spend breakdown in F8.
- Offline generation or offline playback caching.
- Non-USD billing/currencies.

**Future considerations for v2 (only after the wedge is validated by Section 8's metrics):**
- Native mobile app.
- Real-time co-editing.
- A licensing marketplace, positioned only if enough organizations request it.
- DAW plugin/integration (e.g., a VST or Ableton/Logic bridge) if the "editor pulling stems into a DAW" workflow proves common enough to be worth building directly into.
- SSO for larger studio customers, if/when org size trends past the 2–10 person range this PRD is scoped for.
- Deeper analytics for org owners (spend forecasting, per-project cost breakdown).

---

## 8. Success Metrics

These are launch hypotheses to validate, not committed targets — treat them the way the viability analysis treated the wedge itself: falsifiable, and worth being honest about if they're missed.

**What "working" means for this product specifically:** the wedge is collaboration, so the metric that matters most isn't generation volume (Suno already proves people want to generate music) — it's whether teams actually form and use the shared workspace instead of reverting to solo accounts.

**Launch week:**
- ≥ 100 signups (assuming a soft launch to a targeted creator community, not paid acquisition).
- ≥ 60% activation rate — user completes at least one successful generation within 24 hours of signup.
- Generation success rate ≥ 97% (`completed` vs. `failed` status, excluding user-side cancellations) — this is largely a proxy for the Suno reseller's reliability, and the number to watch for the "unofficial API" risk flagged in the viability analysis.
- Zero P0 incidents (data leakage across orgs, billing double-charges, or extended generation outage).

**Month 1:**
- **Team formation rate: ≥ 15% of active orgs are non-personal (multi-member) within 30 days of the account's first activity.** This is the single most important number in this document — it's the direct read on whether the collaboration wedge is real. If it's materially below this, the wedge hypothesis from the top of this PRD is wrong and the roadmap needs to change before investing further in P1 features.
- Comment usage: ≥ 30% of tracks in multi-member orgs receive at least one comment (tests whether F9 — the feature most specific to the wedge — is actually used, not just present).
- Week-1 (D7) retention ≥ 35% of activated users.
- Free-to-paid conversion ≥ 3% of activated orgs.

**Month 3:**
- Paid org monthly churn ≤ 8%.
- Suno API cost (COGS) stays under 35% of subscription + credit-pack revenue — this is the budget discipline tech-stack.md flagged as the real cost risk at scale, tracked here as a product metric, not just a finance one.
- Positive qualitative signal: at least a handful of unprompted "I told a colleague about this" reports (support tickets, org invites from outside the initial launch community, direct feedback) — the closest proxy available pre-scale for the referral moment described in Section 2.
- Revisit the team-formation-rate gate from Month 1: if it hasn't improved, this is the point to seriously consider whether the wedge needs to change rather than continuing to build P2 features on top of an unvalidated P1.
