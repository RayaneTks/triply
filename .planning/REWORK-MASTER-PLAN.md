# Triply Rework — Master Plan (executable phases)

**Authored:** 2026-06-15.
**Sources:** `.planning/AUDIT-REPORT-FINAL-2026-06-15.md` (FINAL), `.planning/AUDIT-REPORT-2026-06-15.md` (AUDIT), `.planning/ANTI-SLOP-ELEVATION-PLAN.md` (ANTI-SLOP), `.planning/ui-reviews/FRONTEND-AZ-UI-REVIEW.md` (UI-AZ), `.planning/ui-reviews/TRIPLY-FULL-UI-AUDIT.md` (UI-FULL).
**Constraint:** Designer charte **locked** — cyan `#0096C7`, dark `#1c1c1c`, 3D Button + retro `0 4px 0 0` btn shadow, Chillax+Gotham, `rounded-[40px]` hero. Never swap brand, flatten Button, or substitute emerald.
**Already shipped (this rework session):**
- P0 dead code purge (9 backend stubs + `TripCreationWizard.tsx` orphan)
- P1 docs sync (DESIGN.md mirrors designer code; PRODUCT.md flips dark/PWA)
- P4.1 Constraint Replanner (backend AI + 5 tests + ReplanModal frontend)
- P4.2 Free-time Concierge (backend Amadeus POI + 4 tests + FreeTimeWidget frontend)
- P4.5 Budget Reshuffler (backend deterministic + 4 tests + BudgetReshuffleModal frontend)
- **Current green: 228 PHPUnit, 21 Vitest, lint+tsc clean.**

---

## Phase 0 — Discovery (DONE)

Parallel subagents extracted findings from 5 audit docs. Consolidated P0 registry and slop tells embedded below. No re-research needed.

**Allowed APIs (verified in code, do not invent):**
- Backend service binding: `app/Providers/AppServiceProvider.php`.
- Trip-scoped lookup: `Voyage::where('user_id', Auth::user()->id)->firstOrFail()` (used in `TripService::findUserTrip` L280, `TripReplanController::findUserTrip`).
- AI: `App\Services\Integrations\ChatAssistantService::handle($body)` (real) / `::replan($body)` (added). Stub controllers `/ai/*` still return 202 — wizard does NOT use them.
- Amadeus POI: `AmadeusClient::pointsOfInterest($lat,$lng,$radiusMeters,$categories)` — categories `SIGHTS,RESTAURANT,SHOPPING,NIGHTLIFE,HISTORICAL,BEACH_PARK`.
- Frontend API call: `apiFetch<unknown>(path, {method, body})` from `src/lib/http.ts`.
- Plan snapshot type: `PlanSnapshot { days: PlanSnapshotDay[]; ... }` from `src/lib/plan-snapshot.ts`.
- Trip update path: `tripsClient.update(tripId, { plan_snapshot })` from `src/lib/trips-client.ts`.

**Anti-patterns guard (do NOT do):**
- Do not write `AiService::*` for new features — bypass the stub; extend `ChatAssistantService` directly.
- Do not store secrets in `NEXT_PUBLIC_*` env.
- Do not introduce emerald/blue/purple for brand surfaces; emerald only in `--success-fg` semantic token.
- Do not flatten the 3D `<Button>` or `.btn-primary` `0 4px 0 0` shadow.
- Do not insert arbitrary `z-[9999]`. Centralize z scale via tokens.
- Do not add `setTimeout` placeholder loading delays.

---

## Phase 1 — Confiance (kill lies) · 2–3 days

**Goal:** zero dead buttons, zero mock pages, zero developer jargon visible to end users. Maps to ANTI-SLOP Pass 1 (L205–225), AUDIT L116–134, FINAL L137–149.

### What to implement

1. **Disable or wire every CTA.** For each, choose: real wire / `disabled + title="Bientôt disponible"` / remove entirely.
   - `frontend/src/features/trips/TripDetailView.tsx` L439–456 — "Dupliquer", "Archiver" buttons.
     - Duplicate: wire to `POST /trips/{trip}/duplicate` (already exists, see `TripController::duplicate` L35). Redirect to new trip's detail page on success.
     - Archive: backend route does not exist. Either implement `POST /trips/{trip}/archive` (adds a `statut='archived'` column write) **or** disable with `aria-disabled` + tooltip "Bientôt disponible".
   - `frontend/src/features/recap/RecapVoyageView.tsx` "Export PDF" + "Finaliser réservations" — disable until Phase 2 ExportService lands.
   - `frontend/src/features/modes/ManualCanvasView.tsx` L99–101 — "Upload" button: disable with tooltip, remove visual prominence (smaller, ghost variant).
   - `frontend/src/features/auth/RegisterView.tsx` L182–191 — OAuth GitHub/Google buttons: remove from JSX until backend Sanctum OAuth ships.
   - `frontend/src/components/Footer/SiteFooter.tsx` L41–42 — replace `href="#"` socials with `aria-disabled` placeholders or remove the row.
2. **Delete `/itineraire` mock page entirely.**
   - `frontend/app/itineraire/page.tsx` + `frontend/src/features/itineraire/ItineraryView.tsx` (~280L) — hardcoded "Week-end à Rome" L21 (AUDIT L65, ANTI-SLOP L21+L94).
   - Remove nav entry pointing to `/itineraire` (search `Itinéraire` in `AppShell.tsx`, `MobileBottomNav.tsx`, sidebar).
   - Replace any link target with `/voyages`.
3. **Strip developer jargon from sidebar.**
   - `frontend/src/features/trips/TripDetailView.tsx` L773–805 — rewrite docs/ressources panel content per ANTI-SLOP L287–329 voice table. Replace "API", "Placeholder", "Branchement", "À connecter à l'API" with user-language equivalents or remove entirely. Targets: replace technical labels with action-oriented copy ("Ajouter un document", "Téléverser une réservation").
4. **Wizard AI silent failure → real error surface.**
   - `frontend/src/components/planner/Wizard.tsx` L384–386 — currently `catch → aiDays = []`. Replace with explicit error state, toast, and a "Réessayer la génération" CTA. Keep snapshot creation if user opts to skip AI, but surface the failure.
5. **`/itineraire` reference cleanup in marketing copy** — landing page "Voir un itinéraire" links must point elsewhere or be removed.

### Documentation references (copy patterns from)

- ANTI-SLOP L205–225: exact 48h confiance checklist + verify commands.
- AUDIT L116–134: per-file action list with file:line.
- FINAL L137–149: same items at executive summary level.
- ANTI-SLOP L287–329: voice rewrites table (before / after copy).

### Verification checklist

- `grep -rn 'href="#"' frontend/app frontend/src` → 0 results.
- `grep -rn '/itineraire' frontend/app frontend/src` → 0 results (the route folder + ItineraryView deleted).
- `grep -rn 'Placeholder\|API\|À connecter' frontend/src/features/trips/TripDetailView.tsx` → 0 user-facing strings (only inside comments allowed).
- Manual: every button in TripDetailView, RecapVoyageView, RegisterView, ManualCanvasView triggers a real action OR is `disabled` with explanatory tooltip.
- `npm run lint && npx tsc --noEmit && npm run test:run` clean.
- `php artisan test --filter=DuplicateTripTest` (write the test as part of Phase 1) — `POST /trips/{trip}/duplicate` returns new ID; old one untouched.

### Anti-pattern guards

- Do **not** create new mock data anywhere.
- Do **not** leave a CTA without `onClick` or `disabled` — pick one.
- Do **not** rename routes silently — update every internal link + nav.

---

## Phase 2 — Sécurité · 2 days

**Goal:** close all P0 security gaps. Maps to AUDIT L137–154, FINAL L155–169, ANTI-SLOP implicit (confiance pass).

### What to implement

1. **Stripe fallback removal.**
   - `backend/app/Http/Controllers/Api/V1/SubscriptionController.php` L87–94 — remove the "no secret key → activate anyway" fallback branch. Return 503 with `STRIPE_NOT_CONFIGURED` error code when key missing.
   - `frontend/app/api/stripe/checkout/route.ts` — same fallback removed; redirect to `/tarifs?error=stripe_unavailable`.
2. **Stripe webhook real handler.**
   - New `App\Http\Controllers\Api\V1\StripeWebhookController` with `handle(Request $request)`.
   - Signature validation: `Stripe::setApiKey(...); Webhook::constructEvent($payload, $sig, $secret)`.
   - Events handled: `checkout.session.completed` (set Abonnement.statut='active'), `invoice.payment_failed` (mark Abonnement.statut='past_due'), `customer.subscription.deleted` (statut='cancelled').
   - Route `POST /api/v1/stripe/webhook` **outside** `auth:sanctum` middleware, throttled `60/min`.
   - Test: `StripeWebhookTest` — invalid signature 400, valid `checkout.session.completed` upserts Abonnement.
3. **Policies register + IDOR scan.**
   - `backend/app/Providers/AuthServiceProvider.php` — register `Voyage::class => TripPolicy::class`, `Etape::class => ActivityPolicy::class`, `Hebergement::class => TravelPolicy::class`, `Transport::class => TravelPolicy::class`, `LocalTransport::class => TravelPolicy::class`, `ShareLink::class => SharingPolicy::class`.
   - Each policy: `view`, `update`, `delete`, `share` returning `$user->id === $resource->user_id` (chain via parent voyage for child resources).
   - Audit every controller using `findUserTrip` to confirm policy authorize call OR explicit user_id scope. Endpoints to verify: all `TripController`, `TripActivityController`, `TripTravelController`, `TripReplanController`, `TripFreeTimeController`, `TripBudgetController`, `TripSharingController`.
4. **Share link password applied.**
   - `backend/app/Services/SharingService.php` — currently accepts password param but does not store / verify. Add `password_hash` column to `share_links` migration (nullable string).
   - On create: `bcrypt($password)` if provided.
   - On public access `GET /share/{token}` — if `password_hash` set, require `?password=` query param, return 401 + `SHARE_PASSWORD_REQUIRED` if missing/mismatched.
   - Test: `SharingPasswordTest` (create with password / access without / access with correct / access with wrong).
5. **Sanctum token expiry verification.**
   - `backend/config/sanctum.php` `expiration` must be set (default null = never expires). Set 60*24*30 minutes (30 days). Already set per FINAL L159 — verify.

### Documentation references

- AUDIT L137–154: per-fix file:line.
- Stripe webhook signature: Laravel Cashier pattern (not in repo yet — read https://stripe.com/docs/webhooks/signatures or copy from `stripe/stripe-php` SDK README).

### Verification checklist

- `php artisan test --filter=StripeWebhookTest` green (≥3 tests).
- `php artisan test --filter=SharingPasswordTest` green (≥4 tests).
- `php artisan test --filter=PolicyAuthorizationTest` green — write a test asserting that user A cannot PATCH/DELETE user B's trip, day, activity, hotel, flight, share link, replan, free-time, budget.
- `grep -n 'Gate::policy\|protected \$policies' backend/app/Providers/AuthServiceProvider.php` returns the 5+ policy bindings.
- `grep -n 'STRIPE_SECRET_KEY missing\|FALLBACK' backend/app/Http/Controllers/Api/V1/SubscriptionController.php` → 0 results (fallback removed).
- All Phase 1 + 228 prior tests still green.

### Anti-pattern guards

- Never trust client-supplied `session_id` alone — always verify against Stripe.
- Never skip the webhook signature header check.
- Never write a policy that returns `true` unconditionally.

---

## Phase 3 — Cohérence visuelle (anti-slop, charte intacte) · 4–6 days

**Goal:** purge emerald parasite, fix dark-only modals, add `prefers-reduced-motion`, fix arbitrary z-indices. Designer cyan + dark base + 3D Button untouched. Maps to ANTI-SLOP Pass 2 (L229–256), AUDIT L182–203.

### What to implement

1. **Emerald purge (selection/badges/rings → brand cyan).**
   - Audit: `grep -rn 'emerald-' frontend/src frontend/app | grep -v emerald-50 | grep -v emerald-100` (the 50/100 alias variants are mapped to `--success-bg` in globals.css and are fine).
   - Replace `ring-emerald-500`, `border-emerald-500`, `text-emerald-600` used as **selection or brand emphasis** with `ring-brand`, `border-brand`, `text-brand`.
   - Keep emerald only when semantically meaning *success* (positive confirmation badges, validation OK).
   - Targets called out in audits: `CityAutocomplete.tsx` (AUDIT L127), Wizard L778–801 + 1050–1056 (ANTI-SLOP L64), TripDetailView KPI stat color L416 (`text-emerald-600` for "Budget restant" — switch to `text-brand`).
2. **Light mode modal coverage.**
   - `FlightSearchModal.tsx`, `HotelSearchModal.tsx`, `Searchbar.tsx`, `TripConfigurationForm.tsx`: replace any `text-slate-100`, `bg-slate-900`, `border-slate-800` *hardcoded* with theme tokens (`text-foreground`, `bg-card`, `border-light-border`) so the light theme toggle works end-to-end.
   - Wizard auth modal L597–608 — `bg-white text-slate-900` hardcoded → `bg-card text-foreground border-light-border`.
3. **Focus states audit.**
   - Every interactive element gets `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]`. Document the helper in `globals.css` as `.focus-brand` utility for reuse.
   - Targets: pricing toggle, autocomplete options, MultiSelect chips, theme toggle.
4. **`prefers-reduced-motion` guard on Button 3D.**
   - `frontend/src/components/Button/Button.tsx` — wrap the `transform: translateY(-0.2em)` keyframes/transition in `@media (prefers-reduced-motion: no-preference)`.
   - `frontend/app/globals.css` `.btn-primary` `transform: translateY(-2px)` hover (L395–398) — same guard.
5. **Z-index scale tokens.**
   - Add `:root` tokens `--z-base: 0; --z-sticky: 10; --z-dropdown: 30; --z-modal-backdrop: 60; --z-modal: 70; --z-toast: 80;`.
   - Replace `z-[100]`, `z-[9999]` literals in ReplanModal, BudgetReshuffleModal, FreeTimeWidget, Wizard auth modal with `z-[var(--z-modal)]`.
6. **Scrollbar affordance returned (selective).**
   - `globals.css` L442–466 hides scrollbars globally on `*`. Replace with class-scoped `.no-scrollbar` and apply only where horizontal carousels need it. Long lists get default browser scrollbars back.
7. **`framer-motion` retained** (designer-chosen; do not migrate to `motion/react` unless designer signs off — ANTI-SLOP L69 calls this LOW).

### Documentation references

- ANTI-SLOP L229–256: Cohérence pass + Emil before/after token table.
- AUDIT L182–203: design fixes per file.
- DESIGN.md (this repo): authoritative charte after this rework's sync.

### Verification checklist

- `grep -rn 'ring-emerald\|border-emerald-[2-9]\|text-emerald-[6-9]' frontend/src frontend/app` → 0 results except inside files semantically representing success state.
- `grep -rn 'z-\[9' frontend/src frontend/app` → 0 results.
- Toggle theme manually in dev: every modal renders without invisible text in light mode.
- Lighthouse a11y on `/`, `/connexion`, `/voyages`, `/voyages/<id>`, `/tarifs` → ≥ 95.
- 21 Vitest + 228+ PHPUnit + lint + tsc still green.

### Anti-pattern guards

- **Do not** strip the 3D translate from Button — only guard with reduced-motion.
- **Do not** introduce new hardcoded hex literals.
- **Do not** swap cyan for any other brand color.
- **Do not** remove the `rounded-[40px]` on Mode Libre brief (designer signature).

---

## Phase 4 — Voice & copy · 2 days

**Goal:** copy passes from generic SaaS template to specific, warm, action-oriented Triply voice. Maps to ANTI-SLOP Pass 4 (L287–329).

### What to implement

1. **Landing `app/page.tsx`** rewrites per ANTI-SLOP L287–329 table — replace centered SaaS hero copy with offset asymmetric statement. Replace fake "Marc D." testimonial (L202–203) with a real one or remove.
2. **Wizard step labels** — eyebrow `uppercase tracking-widest` (L662, 761, 860, 975) reduced to one per step, not every label.
3. **Pricing** — buttons currently `rounded-xl bg-brand` ad-hoc (ANTI-SLOP L102–110) — replace with `<Button>` component variants from `src/components/Button`.
4. **Empty / error / loading states** — every view audited for clear, specific copy. Replace generic "Chargement…" with context: "Chargement de votre voyage", "Recherche d'inspirations", etc.
5. **Error tone** — every `error.message` rendered to user passes through a helper `userFacingMessage(err)` that translates backend keys (`REPLAN_FAILED`, `STRIPE_UNAVAILABLE`, etc.) to warm sentences. Helper location: `src/lib/error-messages.ts`.

### Documentation references

- ANTI-SLOP L287–329 voice table.
- PRODUCT.md "Content & Tone" section.

### Verification checklist

- Read each view's user-facing strings out loud — passes 3-sentence smell test (specific, warm, action).
- `grep -rn '"Chargement"\|"Erreur"\|"Une erreur"' frontend/src frontend/app` → 0 generic strings.

### Anti-pattern guards

- No emojis in body copy (designer charte, brand voice — emojis only in chip-style categorization).
- No marketing buzzwords ("révolutionnaire", "ultime", "incroyable").

---

## Phase 5 — Architecture · 4–6 days

**Goal:** split god components, lazy-load Mapbox, add error boundary, sync badges. Maps to ANTI-SLOP Pass 3 (L259–284), AUDIT L205–223, architecture-review.md.

### What to implement

1. **Lazy-load Mapbox.**
   - Convert `import { WorldMap } from 'src/components/Map/Map'` callsites to `const WorldMap = dynamic(() => import('@/src/components/Map/Map').then(m => m.WorldMap), { ssr: false, loading: () => <MapSkeleton /> });`.
   - Sites: `TripDetailView.tsx`, `RecapVoyageView.tsx`, landing hero map (`app/page.tsx`).
   - Add `MapSkeleton` component (charte: dark surface, cyan loading shimmer).
2. **Split Wizard (1070L).**
   - Extract step components: `WizardStepDestination.tsx`, `WizardStepDates.tsx`, `WizardStepTravelers.tsx`, `WizardStepBudget.tsx`, `WizardStepStyles.tsx`, `WizardStepReview.tsx`, `WizardAuthModal.tsx`.
   - Shared state via a `useWizardState` hook in `src/components/planner/useWizardState.ts`.
   - Target: `Wizard.tsx` < 250 lines after split.
3. **Split TripDetailView (931L).**
   - Extract tab panels: `TripItineraryTab.tsx`, `TripFlightsTab.tsx`, `TripHotelsTab.tsx`, `TripMapTab.tsx`, `TripDocsTab.tsx`.
   - Header into `TripHeader.tsx` (stats + actions).
   - Target: `TripDetailView.tsx` < 300 lines.
4. **Global error boundary.**
   - `frontend/app/global-error.tsx` exists but bare. Add `<ErrorBoundary>` wrapper around `(app)` segment with designer charte fallback: dark surface, cyan retry button, "Quelque chose s'est mal passé" copy.
5. **Trip sync badge.**
   - In `TripsListView.tsx`, when fallback to localStorage triggers (`storedOnly`), display a small "Local" chip on the card. When synced from API, "Cloud" or no chip.
6. **Toast / undo trip delete.**
   - Add `<ToastProvider>` (charte: dark surface, cyan accent for action button, slate for body). Use `sonner` library — already in deps? Check `package.json`; if absent add it.
   - On delete: optimistic remove + 5-second toast "Voyage supprimé — Annuler" → real DELETE if not undone.

### Documentation references

- ANTI-SLOP L259–284 Craft pass with Emil motion table.
- AUDIT L205–223 features wiring.
- architecture-review.md L?? (read in phase) — backend split deferred per FINAL L82.

### Verification checklist

- `wc -l frontend/src/components/planner/Wizard.tsx` < 250.
- `wc -l frontend/src/features/trips/TripDetailView.tsx` < 300.
- `grep -rn "import.*from '@/src/components/Map/Map'" frontend/src frontend/app | grep -v dynamic` → 0 results (every Mapbox import is dynamic).
- Network panel: `mapbox-gl.js` not in initial bundle on `/voyages`.
- Lighthouse LCP on landing improves vs baseline.
- All prior tests still green.

### Anti-pattern guards

- Do not introduce new prop-drilling — share state via the wizard hook or context.
- Do not rewrite logic during the split — pure mechanical extraction with characterization tests first.

---

## Phase 6 — Differentiators continued · 6–8 days

**Goal:** ship remaining differentiator features from the rework roadmap. Picks up where this session left off.

### What to implement

1. **P4.3 Plan Variants A/B.**
   - Backend: add `parent_voyage_id` nullable column on `voyages` (migration). Add `POST /trips/{trip}/variants` returning a forked snapshot bound to the same parent.
   - Frontend: side-by-side diff component `PlanVariantsCompareView.tsx`. Toggle "Variante A / Variante B" tabs on a single trip detail.
   - Merge winner: `POST /trips/{trip}/variants/{variant}/promote` replaces parent's snapshot.
2. **P4.6 Live Trip Mode.**
   - New view `frontend/src/features/trips/LiveTripView.tsx`. Mounted on `/voyages/{id}/live`.
   - Detect current etape based on now() vs dayIndex schedule. Highlight current, countdown to next.
   - "Running late by X minutes" → POST `/trips/{trip}/days/{day}/cascade-delay` { delay_minutes }, backend recomputes downstream etape start times.
3. **P4.4 Group Voting + AI Reconciliation.**
   - Backend: `voyage_travelers` pivot table (user_id, role, preferences JSON). `etape_votes` table (etape_id, user_id, vote: 'love'|'neutral'|'dislike').
   - Endpoints: `POST /trips/{trip}/travelers`, `POST /trips/{trip}/activities/{activity}/vote`, `POST /trips/{trip}/days/{day}/reconcile`.
   - Reconcile uses `ChatAssistantService::reconcile(traveler_prefs, votes)` — extend the service like `replan` was extended.
4. **Activity restore via FreeTimeWidget reload** — already wired; verify nothing regresses.

### Documentation references

- Existing `TripReplanController.php`, `TripFreeTimeController.php`, `TripBudgetController.php` — copy controller pattern.
- `ReplanModal.tsx`, `FreeTimeWidget.tsx`, `BudgetReshuffleModal.tsx` — copy frontend modal/widget pattern (designer charte applied).
- `AssistantPrompts::replanInstructions` — copy prompt pattern for `reconcileInstructions`.

### Verification checklist

- `php artisan test --filter=PlanVariantsTest` ≥ 4 tests green.
- `php artisan test --filter=LiveTripModeTest` ≥ 3 tests green.
- `php artisan test --filter=GroupVotingTest` ≥ 5 tests green.
- Frontend Vitest: at least one snapshot/render test per new modal/view.
- Lint + tsc clean.

### Anti-pattern guards

- Do not bypass `findUserTrip` for any of these — every endpoint scopes by Auth::user.
- Do not store traveler preferences as plain text — use JSON column or relation.

---

## Phase 7 — Premium · 4–5 days

**Goal:** observability, E2E, PWA offline, GDPR. Maps to ANTI-SLOP "Craft" tail, FINAL L222–235.

### What to implement

1. **ExportService real (PDF + ICS).**
   - PDF: `dompdf/dompdf` via composer. Service `ExportService::pdf(Voyage $v)` returns binary stream. Endpoint `POST /trips/{trip}/export/pdf` streams as `application/pdf`.
   - ICS: pure PHP writer (no lib needed). Event per etape with VEVENT block.
   - Replace `ExportServiceStub` binding in `AppServiceProvider`.
   - Tests: response Content-Type, byte length > 0, deterministic structure.
2. **GDPR export + delete.**
   - `ProfileService::exportUserData(User $u)` → real JSON archive { user, trips, activities, hotels, flights, bookings, shares, payments }. Stream as download.
   - `ProfileService::deleteUser(User $u)` → soft-delete cascade trips/activities/etc., anonymize personal columns, revoke tokens.
   - Tests cover both flows.
3. **Consent persistence.**
   - `consent_preferences` table per user_id, columns analytics/marketing/functional bool. Replace `ConsentServiceStub` with real impl.
4. **PWA / offline.**
   - `next-pwa` plugin OR hand-rolled `service-worker.ts` at `app/sw.ts`. Cache: current trip snapshot JSON, day-of view shell, Mapbox tiles for active city.
   - Manifest at `app/manifest.ts` with icons + theme color cyan.
   - Install prompt CTA in `AppShell`.
5. **Observability.**
   - Backend: Sentry SDK (`sentry/sentry-laravel`) wired with DSN env. Capture 5xx + queue failures.
   - Frontend: Sentry browser SDK wired in `app/layout.tsx`. Capture client errors.
   - `/admin/metrics` dashboard charts (already returns real data per AUDIT — add chart components using `recharts` or `visx`).
6. **E2E with Playwright.**
   - `e2e/` directory with scenarios: signup, create trip via wizard, replan a trip (mocked OpenAI fixture), add POI from free-time concierge, run budget reshuffle, share trip, login again.
   - GitHub Actions job runs on PR.

### Verification checklist

- `php artisan test --filter=ExportPdfTest` returns non-empty PDF.
- `php artisan test --filter=GdprExportTest` returns user archive with all relations.
- `npm run test:e2e` runs ≥ 6 Playwright scenarios green.
- Lighthouse PWA score ≥ 90.
- Sentry test event arrives in both backend + frontend projects.

### Anti-pattern guards

- Never log PII to Sentry breadcrumbs.
- Never ship the dompdf binary HTML escaping disabled.
- Service worker scope = `/`, NOT broader.

---

## Phase 8 — Verification & shipping · 2 days

**Goal:** prove every prior phase landed; close the loop on the Anti-Slop pre-flight checklist (ANTI-SLOP L333–377).

### What to verify

1. Run `php artisan test` — expect 280+ tests green.
2. Run `npm run lint && npx tsc --noEmit && npm run test:run && npm run test:e2e` — green.
3. Run `make swagger` — OpenAPI spec covers every new endpoint (replan, free-time, budget-reshuffle, variants, live, voting, gdpr, export, webhook).
4. Manual smoke matrix (AUDIT L303–335 20 scenarios) — record results in `.planning/SMOKE-RESULTS-<date>.md`.
5. Anti-Slop pre-flight checklist (ANTI-SLOP L333–377) — every box ticked.
6. Designer charte audit:
   - `grep -rn '#10b981\|#34d399\|emerald-500' frontend/src frontend/app | grep -v plan-snapshot.test | grep -v __tests__` → 0 brand-misuse hits.
   - Visual: walk every screen in dark + light mode. Screenshot diffs vs baseline reviewed.
7. Update `.planning/REWORK-MASTER-PLAN.md` (this file) marking each phase ✅ with commit SHA range.
8. Tag release `v1.0-investor-ready` on `m-develop` branch.

### Anti-pattern guards

- Do not skip the smoke matrix; investor demo regressions hide here.
- Do not commit a phase as "done" if even one of its verification commands red.

---

## Cross-cutting non-goals (this plan does NOT touch)

- Brand color change (charte locked).
- Button visual identity (charte locked).
- Migration to a different stack (Vue, Astro, Remix) — Next.js 16 + Laravel 11 stays.
- Replacing Amadeus with Sabre/Skyscanner direct.
- Mobile native app (iOS/Android) — PWA is the path.

---

## How to pick up this plan in a new context

Each Phase is self-contained. To execute Phase N:

1. Open this file. Read Phase N's "What to implement" + "Documentation references" + "Verification checklist" + "Anti-pattern guards".
2. Read the cited audit lines (ANTI-SLOP L###, AUDIT L###, FINAL L###).
3. Read the named source files (cited via file:line) and the corresponding existing code patterns (e.g. for Phase 6 differentiator work, copy `TripReplanController` pattern verbatim).
4. Implement strictly. Run the verification checklist before moving on.
5. Mark the phase ✅ in this file with the commit SHA range.

No phase requires re-running Phase 0 discovery — the consolidated findings are embedded above with exact line citations.
