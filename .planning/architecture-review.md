# Architecture Review — Backend Triply

**Date:** 2026-05-11
**Scope:** `backend/app/`
**Method:** mattpocock `/improve-codebase-architecture` skill — deepening opportunities

## Vocabulary

Module = anything with interface + implementation. Interface = everything caller must know. Depth = leverage at interface. Seam = where interface lives. Adapter = concrete thing at seam. Locality = bugs/changes concentrate at one place.

---

## Deepening Candidates

### 1. HTTP-Aware Integration Services

**Files:** `app/Services/Integrations/ChatAssistantService.php`, `AmadeusClient.php`

**Problem:** Services mix HTTP concerns (retry, token cache, error mapping) with domain logic. `ChatAssistantService.handle()` reads `Request->all()` directly, returns HTTP status codes in payload (`_httpStatus` key), `AssistantChatController` unwraps. Controller must know service's HTTP-tunneling convention. Testing requires mocking Http facade + internal signaling.

**Solution:** Thin HTTP adapter layer. Integration clients = domain-only services (return domain objects/exceptions). Controller handles HTTP mapping. Domain exceptions like `LocationNotFoundException`, `TokenExpired`.

**Benefits:**
- **Locality:** HTTP↔domain mapping concentrates at controller seam
- **Leverage:** Integrations testable without `Http::fake()`; callers deal with clean exceptions
- **Tests:** Services become pure; HTTP isolated to integration tests

**Deletion test:** Removing adapter doesn't break domain logic, only transport. ~3 places need refactor.

---

### 2. Entity Serialization Responsibility

**Files:** `TripService.php` (serializeTrip), `ActivityService.php` (serializeActivity), etc.

**Problem:** Each service hardcodes response shape (array keys, nesting). API contract change → touch 6+ `serializeX()` methods. No single place defines "what is a Trip in JSON". Services call `$model->fresh(['relations'])` — pushes Eloquent into domain.

**Solution:** Extract serializers (`TripsResponseSerializer`, `ActivitiesResponseSerializer`). Services pass models to serializers, serializers handle eager loading + shape. Services ignorant of response structure.

**Benefits:**
- **Locality:** Response changes concentrate in serializer classes
- **Leverage:** Frontend + API docs reference serializers as contracts; easier versioning
- **Tests:** Serializers are pure (model → array); services test behavior, not format

**Deletion test:** Services would still need to return arrays for HTTP — earning their keep. ~8-12 callers depend on shape consistency.

---

### 3. User Context Injection

**Files:** `TripService.php`, `ActivityService.php`, `SharingService.php`, `BookingService.php`, ~15+ methods

**Problem:** Every service method calls `Auth::user()` or checks Auth directly. Implicit global dependency. Hard to test (mock Auth facade or set up fake state). `SharingService` does `Auth::setUser($owner)` to re-auth — fragile. No way to run service as different user.

**Solution:** Explicit User. Services accept `User $user` as constructor or method param. Push Auth context to HTTP layer (controllers inject authenticated user). Services context-agnostic.

**Benefits:**
- **Locality:** User authority concentrates at controller (who requested this?)
- **Leverage:** Services reusable for CLI, jobs, different auth contexts
- **Tests:** Zero Auth mocking; pass test User directly

**Deletion test:** Removing param forces re-adding global Auth checks everywhere. ~15+ methods across 4 services.

---

### 4. Snapshot Compaction Logic ⭐ (overlaps with planned TripService split)

**Files:** `TripService.php` (compactSnapshotForStorage, extractBudgetTotal, resolveDestination, syncStructuredTripData, duplicateStructuredTripData)

**Problem:** 500+ LOC in TripService managing `plan_snapshot` (frontend form → Voyage cols + Journee/Etape/Transport/Hebergement models). Snapshot logic mixed with CRUD. Schema change → 5+ methods touched. New fields need manual sync in 3+ places.

**Solution:** `SnapshotNormalizer` service. Transform frontend snapshot → internal model structure. Separate read/write operations.

**Benefits:**
- **Locality:** Snapshot schema changes concentrate in normalizer
- **Leverage:** CLI commands, webhooks, bulk imports reuse normalizer
- **Tests:** Normalizer testable independently; TripService tests ignore snapshot internals

**Deletion test:** Deleting forces logic back to TripService (heavy cost). ~6 CRUD operations + duplication depend.

**Note:** Aligned with Phase D.1 (SnapshotSyncService) in current plan. Confirms the split.

---

### 5. Location Resolution Coupling

**Files:** `ActivityService.php`, `PlacesService.php`, `TripService.php` (resolveDestination), `Geo/AmadeusCityCountryResolver.php`

**Problem:** Multiple services resolve city/country. Each has custom missing/null handling. `AmadeusCityCountryResolver` tightly bound to Amadeus. Swap resolvers → rewire bindings. No abstraction over "city name → country code".

**Solution:** `GeocodingService` interface with pluggable impls (`AmadeusResolver`, `StaticCountryResolver` for tests). PlacesService + others use interface.

**Benefits:**
- **Locality:** Geo logic + API choice concentrates in GeocodingService
- **Leverage:** Add caching, fallback resolvers, offline mode without touching consumers
- **Tests:** Use `StaticCountryResolver`; no Amadeus calls

**Deletion test:** Forces city→country coupling back. ~5 methods across 3 services.

**Status:** `CityCountryResolverInterface` already exists. Need to extend usage + add static test impl.

---

### 6. Booking Deeplink Building

**Files:** `BookingService.php` (buildDeeplink, ~100 LOC, 6+ switch statements)

**Problem:** `buildDeeplink()` contains logic for Booking.com, Skyscanner, GetYourGuide URLs (provider + kind matrix). New provider → edit switch. Can't test "Skyscanner deeplink" in isolation; must call `checkout()` + verify string. Procedural, not OO.

**Solution:** `DeeplinkBuilder` interface + provider impls (`SkyscannerDeeplinkBuilder`, `BookingDeeplinkBuilder`, `GetYourGuideDeeplinkBuilder`). BookingService calls builder for provider.

**Benefits:**
- **Locality:** Each provider's URL format in one builder class
- **Leverage:** Frontend can invoke builder directly; new providers = new class
- **Tests:** Builders tested independently

**Deletion test:** Forces logic back to BookingService. Moderate cost; supports 3+ providers.

---

### 7. Assistant Prompt Management

**Files:** `ChatAssistantService.php` (~200 LOC prompt logic + intent routing), `AssistantPrompts.php` (constants)

**Problem:** Prompt engineering mixed with validation, API construction, response formatting. Intent-specific prompts (regenerate_activity, qa, itinerary) buried in `handle()`. Hard to A/B test variants. New intent → edit service method.

**Solution:** `PromptBuilder` interface + per-mode impls (`QaPromptBuilder`, `ItineraryPromptBuilder`, `ActivityRegenerationPromptBuilder`). Builder encapsulates system prompt, temperature, context. ChatAssistantService becomes dispatcher.

**Benefits:**
- **Locality:** Per-intent prompt logic in one builder class
- **Leverage:** Builders versionable (V2), testable, swappable at runtime
- **Tests:** PromptBuilder outputs testable as strings; service tests routing/error

**Deletion test:** Forces prompt logic back to service. Moderate cost; supports 3+ intents.

---

## Priority Recommendation

Per skill: **#3 (User Context)** + **#2 (Serializers)** unblock testing across 50+ methods. **#4 (Snapshot Normalizer)** aligns with existing Phase D plan (SnapshotSyncService) — confirm + proceed.

## Alignment with Audit Plan

| Candidate | Current Plan Phase | Action |
|---|---|---|
| #4 SnapshotNormalizer | Phase D.1 (SnapshotSyncService) | ✅ Confirmed, proceed |
| #3 User Context | Not in plan | **Decision needed** — add before tests? |
| #2 Serializers | Not in plan | **Decision needed** — high effort, blocks API versioning if deferred |
| #1, #5, #6, #7 | Not in plan | Defer (lower friction, can address post-tests) |

## Risk if Deferred

- **#3 User Context** deferred → tests must mock Auth facade extensively. Heavy boilerplate.
- **#2 Serializers** deferred → tests verify whole JSON output; brittle to format tweaks.

## Next Step

User picks 1-3 candidates to fold into Phase D refactor (or confirm sticking to plan as-is with only #4).
