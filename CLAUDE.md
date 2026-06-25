# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Backend**: Laravel 11 (PHP 8.4), PostgreSQL 16, Sanctum bearer-token auth.
- **Frontend**: Next.js 16 App Router (standalone output), React 19, Tailwind v4.
- **Infra**: Docker Compose dev (`compose.dev.yaml`), prod on triply.ovh behind Traefik (`compose.prod.yaml`).

## Daily commands (Docker-first)

| Command | Purpose |
|---|---|
| `make init` (or `make install`) | First-time setup: build, migrate, generate key, swagger |
| `make up` | Start all services (no rebuild) |
| `make reload` | Sync env, migrate, regenerate swagger after pull |
| `make test` | Full backend PHPUnit suite |
| `make test-feature` / `make test-unit` | Backend subsets |
| `make routes` | `php artisan route:list --path=api` |
| `make swagger` | Regenerate OpenAPI spec |
| `make logs-back` | `tri-php-fpm` + `tri-api` logs |
| `make shell` | bash into `tri-php-fpm` |
| `make docker-reinstall` | Reset stack (drops Postgres data, rebuilds with cache) |

Backend test single file: `docker compose -f compose.dev.yaml exec tri-php-fpm php artisan test tests/Feature/Services/TripServiceTest.php`

Frontend (Next.js in `tri-app` container):
```bash
docker compose -f compose.dev.yaml exec tri-app npm run lint
docker compose -f compose.dev.yaml exec tri-app npm run test:run        # Vitest
docker compose -f compose.dev.yaml exec tri-app npm run build           # prod build sanity
```

### Adding an npm dependency

`node_modules` lives in named volume `tri-spa-node_modules`. Local `npm install` does NOT propagate to the container. Always:

```bash
docker compose -f compose.dev.yaml exec tri-app npm install <pkg>
```

## URLs (dev)

- Next.js: http://localhost:5173
- API: http://127.0.0.1:8000 (health: `/api/v1/health`)
- Swagger UI: http://127.0.0.1:8000/api/documentation
- PgAdmin: http://127.0.0.1:8080

## Backend architecture

`backend/app/` follows an interface + implementation pattern. Controllers are thin; logic lives in services bound in `app/Providers/AppServiceProvider.php`:

| Interface | Real impl |
|---|---|
| `AuthServiceInterface` | `AuthService` |
| `TripServiceInterface` | `TripService` (orchestrator) |
| `SnapshotSyncServiceInterface` | `SnapshotSyncService` — plan_snapshot ↔ DB rows |
| `TripRecapServiceInterface` | `TripRecapService` — recap sections + polylines |
| `RouteServiceInterface` | `RouteService` — haversine segments per day |
| `ActivityServiceInterface` | `ActivityService` |
| `SharingServiceInterface` | `SharingService` |
| `BookingServiceInterface` | `BookingService` (affiliate deeplinks) |
| `TravelServiceInterface` | `TravelService` (flights/hotels/local transports) |
| `PlacesServiceInterface` | `PlacesService` (Amadeus POI) |
| `AiServiceInterface` | `AiServiceStub` ⚠ WIP — returns 202 stubs |
| `ExportServiceInterface` | `ExportServiceStub` ⚠ WIP — PDF/ICS not implemented |
| `ConsentServiceInterface` | `ConsentServiceStub` ⚠ WIP |
| `ObservabilityServiceInterface` | `ObservabilityService` — real metrics for `/admin/metrics` |

Routes live in `backend/routes/api.php`, all under `/api/v1`. Auth routes throttled (10/min), AI routes throttled (20/min), Places (60/min).

### Domain models

`User` ← `Voyage` (trip) → `Journee` (day) → `Etape` (activity, soft deletes). `Voyage` also has many `Hebergement`, `Transport`, `LocalTransport`, `ShareLink`, `Abonnement`. Factories exist for all main models (used in tests).

### Plan snapshot pattern

A `Voyage` carries a JSON `plan_snapshot` (frontend wizard output). On create/update, `SnapshotSyncService` denormalises that snapshot into structured tables (`transports`, `hebergements`, `journees`, `etapes`). On read, `serializeTrip` merges the persisted structured data back into a snapshot shape via `buildFromStructured`. Tests that touch trip CRUD must `Http::fake` Frankfurter (currency) and Amadeus (geocoding) — see `TripServiceTest::setUp`.

## Integration proxy pattern

All sensitive third-party APIs are proxied through Laravel under `/api/v1/integrations/*`. Frontend never embeds Amadeus / OpenAI / Stripe-secret tokens. Mapbox is the exception — its `pk.*` token is public-safe and lives in `NEXT_PUBLIC_MAPBOX_TOKEN`.

### Autocomplete fallback chain

`AmadeusClient::locationsByKeyword` tries in order:
1. **Amadeus** `/v1/reference-data/locations` (3s timeout). On failure, a file-cache "circuit breaker" key is set for 5 min and step 1 is skipped on subsequent calls.
2. **Mapbox geocoding** (`autocomplete=true`) — handles prefix queries that Nominatim can't (e.g. `Marseill` → Marseille). Uses `MAPBOX_TOKEN` env (falls back to `NEXT_PUBLIC_MAPBOX_TOKEN`).
3. **Nominatim** (OpenStreetMap) — last resort, deduplicated by `(city, country)`.

Results are normalised to the same shape: `{ id, name, iataCode, subType, address: { cityName, countryName }, geoCode: { latitude, longitude } }`.

## Frontend architecture

App Router pages in `frontend/app/`. Feature views in `frontend/src/features/*View.tsx`. Shared components in `frontend/src/components/`.

- **Auth client** (`src/lib/auth-client.ts`): bearer token in sessionStorage by default; `parseJsonResponse` auto-clears the session and dispatches `triply-auth-changed` on 401.
- **Generic fetch** (`src/hooks/useFetch.ts`): cancellation-token pattern with `{ data, loading, error, refetch }`.
- **Wizard** (`src/components/planner/Wizard.tsx`): trip creation flow. Step 1 destination requires a click on a list item (`destinationSelected` flag) — typing alone won't activate the Next button.
- **CityAutocomplete**: when given `selected={true}` it renders an emerald ring + check icon. Always pass `onInputChange` to reset the parent's "selected" flag on keystroke.

`NEXT_PUBLIC_*` env vars are inlined at **build time**. The prod Dockerfile (`docker/spa-prod/Dockerfile`) declares them as `ARG` so the compose root `.env` must contain the value before `docker compose build`.

## Stripe subscription flow

1. `/tarifs` (PricingView) gates checkout on `authClient.getToken()` — redirects unauthenticated users to `/connexion?returnTo=/tarifs`.
2. `POST /api/stripe/checkout` (Next Route Handler) instantiates Stripe lazily per request (avoids build-time crash when `STRIPE_SECRET_KEY` is missing), passes `metadata: { plan, billing }`, and appends `?plan=&billing=` to the `success_url`.
3. `/tarifs/success` POSTs `/api/v1/subscriptions/confirm` with `{ session_id, plan, billing }`. Backend `SubscriptionController` upserts an `Abonnement` row and sets `user.subscription_tier`.
4. Backend trusts the session_id for MVP — webhook validation is a documented TODO.

## Git workflow

- **Work branch**: `d-backend` (active dev).
- **Integration**: merge `d-backend → m-develop` to run CI.
- **Prod**: merge `m-develop → main`. CI re-runs on main; CD (workflow_run) deploys to VPS, runs `migrate --force` + `optimize:clear`, prunes images.
- Commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `ci/cd:`).
- Never push directly to `main` or `develop` without explicit user authorization.
- Force-push to `main` only when the user explicitly asks for a revert.

## Design System & Skills

**Config files:**
- `DESIGN.md` — palette (emerald/slate/amber), typo, spacing, components, accessibility, motion, anti-patterns
- `PRODUCT.md` — personas, features, priorities, constraints, tone

**Installed skills** (all symlinked to `.claude/skills/` + `.agents/skills/`):

*Design & Frontend:*
- **impeccable** — 23 design commands (`/audit`, `/polish`, `/shape`, `/critique`, `/harden`, etc.) + PostToolUse hooks on Edit/Write UI files
- **taste-skill** (13 variants) — anti-slop frontend: `design-taste-frontend`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `image-to-code`, `redesign-existing-projects`, `imagegen-*`, etc.
- **emil-design-eng** — UI polish philosophy, animations, invisible details

*Memory & Knowledge (claude-mem, 16 skills):*
- **mem-search** — Search project memory (audit notes, workflows, past decisions)
- **knowledge-agent** — Consult stored context before tasks
- **make-plan** — Create detailed plans for complex work
- **learn-codebase** — Explore/map codebase structure before major changes
- **smart-explore** — Navigate code intelligently, find patterns
- **standup**, **timeline-report**, **weekly-digests** — Progress tracking
- Plus: `babysit`, `design-is`, `do`, `how-it-works`, `oh-my-issues`, `pathfinder`

*Mattpocock Core (29 skills):*
- **diagnose** — Systematic debug: reproduce → minimize → hypothesize → fix → regression test
- **qa** — Test completeness: edge cases, performance, usability, accessibility
- **design-an-interface** — Detailed interface design (extends taste-frontend)
- **request-refactor-plan** — Ask for structured refactor strategy
- **prototype** — Build throwaway prototypes before commitment
- **tdd** — Test-driven: write tests first, implement second
- **to-issues** — Convert context to GitHub issues
- **to-prd** — Convert context to PRD document
- **zoom-out** — Step back, big-picture view
- **grill-me** — Challenge plan/decision (stress-test)
- **grill-with-docs** — Grill with project context (DESIGN.md, PRODUCT.md)
- Plus: `grill-with-docs`, `improve-codebase-architecture`, `triage`, `review`, `teach`, `write-a-skill`, `git-guardrails-claude-code`, `setup-pre-commit`

**How Claude uses skills** (user talks plain English, Claude interprets intent):

*Daily usage (silent, before work starts):*
- `mem-search` + `knowledge-agent` — Load project memory + DESIGN.md + PRODUCT.md
- `learn-codebase` — If exploring unfamiliar area
- `grill-with-docs` — If decision-heavy, stress-test against project guidelines

*On user requests (mattpocock + design):*
- User: "design X interface" → `design-an-interface` (detailed) or `design-taste-frontend` (anti-slop)
- User: "fix this bug/broken thing" → `diagnose` (systematic reproduce-minimize-hypothesize-fix)
- User: "review my code/PR" → `code-review` or `review`
- User: "test this" / "check edge cases" → `qa`
- User: "refactor this" → `request-refactor-plan` (gets structured proposal)
- User: "I want to refactor but not sure how" → `request-refactor-plan` (ask for plan first)
- User: "turn this into a GitHub issue" → `to-issues`
- User: "write PRD for this feature" → `to-prd`
- User: "let me try a quick version" → `prototype`
- User: "grilling/decision-heavy task" → `grill-with-docs` (challenge against DESIGN.md + PRODUCT.md)
- User: "step back, show me the big picture" → `zoom-out`

**Pattern**: User never specifies skill/command — Claude reads intent, chooses tools silently, translates into precise execution. Memory + context run invisibly first.

## Caveman Mode (Active: Ultra)

Drop articles (a/the), filler (just/really/simply), pleasantries (sure/happy to), hedging (maybe/probably).
Fragments OK. Code/commits/security: normal English.

Toggle: `/caveman:caveman lite|full|ultra` or "stop caveman".

## Memory Files

Project-specific notes live in `C:/Users/rayan/.claude/projects/C--Users-rayan-Desktop-triply/memory/`:
- `MEMORY.md` — index of memory files
- `project_audit_plan.md` — full audit progress checklist
- `project_api_routes.md` — route + service inventory
- `feedback_workflow.md` — workflow preferences

Read the index first when picking up an unfamiliar area.
