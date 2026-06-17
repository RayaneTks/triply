# Rapport Audit Consolidé Triply — Juin 2026

**Référence :** `main` @ `fa14d96`  
**Date :** 15 juin 2026  
**Vérification live :** 15 juin 2026 — stack Docker up, **228 PHPUnit ✅**, **21 Vitest ✅**  
**Sources :** `AUDIT-REPORT-2026-06-15.md`, `ANTI-SLOP-ELEVATION-PLAN.md`, `architecture-review.md`, `UI-REVIEW.md`, code review ciblée (Stripe, policies, Mapbox), audit fonctionnel partiel.

---

## Executive Summary

Triply est un **MVP travel SaaS techniquement crédible** : backend Laravel découpé en services, funnel wizard → trip detail opérationnel, intégrations Amadeus/Stripe fonctionnelles quand configurées, et **228 tests PHPUnit verts** sur le cœur métier. Le frontend reste **sous-armé** (21 Vitest, 0 E2E) et le polish produit **en dessous d’une démo investisseur premium**.

**Verdict chef de projet :** le cœur fonctionne, la confiance utilisateur ne tient pas. Bloquants avant toute démo externe :

1. **Stripe P0** — fallback sans `STRIPE_SECRET_KEY` active l’abonnement sans vérification paiement (`SubscriptionController.php` L87-94).
2. **Confiance UI** — boutons morts (PDF, archiver, dupliquer, OAuth, upload), page mock Rome (`/itineraire`), jargon développeur visible.
3. **Sécurité défensive** — policies `return true` non enregistrées ; mot de passe share link validé mais jamais appliqué.
4. **Perf frontend** — Mapbox importé en eager (0 `next/dynamic` dans le frontend).

**Scores clés :** UI/UX **6,8/10** · Design système **6,6/10** · Slop **5,8/10** (objectif ≤ 2,0) · Global **6,2/10**.

**Priorité semaine 1 :** Phase 1 Confiance (3–5 j) + correctif Stripe P0 (< 2 h) en parallèle. ROI maximal avant polish ou nouvelles features.

---

## Scorecard — 6 axes

| Axe | Score | État | Signal principal |
|-----|-------|------|------------------|
| **1. Technique** | **7,0/10** | 🟢 Solide | Services focalisés, snapshot sync mature, CI Docker-first ; god components (~1070L Wizard, ~930L TripDetailView), waterfall API |
| **2. Produit / Fonctionnel** | **6,0/10** | 🟡 Cœur OK | Wizard + trip detail + recap + pricing opérationnels ; gaps PWA, export PDF/ICS, collab temps réel, archiver, drag-drop |
| **3. UX / UI** | **6,8/10** | 🟡 Utilisable | 6 piliers UI-REVIEW = 17/24 ; flows principaux OK ; CTAs morts, mock Rome, light mode modales cassé |
| **4. Design système** | **6,6/10** | 🟡 Au-dessus MVP | Tokens cyan dark-first, boutons 3D ; emerald persiste (~20 fichiers), doc contradictoire (`PRODUCT.md` vs `DESIGN.md`) |
| **5. Tests (Nyquist)** | **6,0/10** | 🟡 Backend fort | **228 PHPUnit ✅** · **21 Vitest ✅** · 0 E2E · gaps Stripe négatif, wizard finalize, policies, places fallback |
| **6. Sécurité & confiance** | **5,5/10** | 🔴 Risque | Sanctum OK ; Stripe fallback prod, policies mortes, bearer sessionStorage, share password fantôme |

**Global pondéré : 6,2/10** — bon MVP SaaS voyage ; écart « premium millions d’euros » = confiance + barrière régression + polish.

### Scores satellites (référence)

| Mesure | Score | Lecture |
|--------|-------|---------|
| **Anti-slop** (design-taste §9) | **5,8/10** slop | Plus haut = plus générique ; landing IA lourde, témoignage fake, emerald parasite |
| **Architecture backend** (mai 2026) | Profonde | SnapshotSync confirmé ; User Context + Serializers à décider avant scale tests |

---

## Forces

### Backend
- Auth Sanctum complète (register, login, reset, verify) + tests Feature.
- **TripService + SnapshotSyncService** : wizard → `plan_snapshot` → tables structurées.
- Travel CRUD (vols, hôtels, transports locaux) persisté et testé.
- **Amadeus** : proxy, circuit breaker, fallback Mapbox/Nominatim.
- Partage public TTL, recap scrubé, replan + budget reshuffle + free-time testés.
- Stripe checkout + confirm **quand secret configuré** (vérif session, email, metadata).
- Refactor TripService 902L → 389L + 3 services extraits.

### Frontend
- Wizard multi-étapes avec reprise post-login (`pendingWizard`).
- Trip detail : onglets, carte Mapbox, replan, budget, undo delete activités.
- Recap sections + partage + deeplink booking.
- Pricing gate auth + redirect Stripe.
- Composants a11y isolés : `CityAutocomplete`, `ReplanModal`, `DayTimeline`.

### Qualité & infra
- **Shell tests verts** (vérifié 15/06) : `make test` 228 passed · `npm run test:run` 21 passed.
- Docker-first dev, CI lint + tests backend + Vitest + build Next.
- Audit sécurité mai 2026 documenté (HSTS, throttle, headers).

---

## P0 bloquants

| ID | Problème | Impact | Preuve / fichier |
|----|----------|--------|------------------|
| **P0-1** | Fallback Stripe sans secret → premium sans paiement | Fraude abonnement, perte crédibilité | `SubscriptionController.php` L87-94 |
| **P0-2** | Boutons morts visibles (PDF, Archiver, Dupliquer, upload, OAuth) | Confiance détruite au 1er clic | `ItineraryView`, `TripDetailView`, `ManualCanvasView`, `RegisterView` |
| **P0-3** | `/itineraire` mock « Week-end à Rome » | Fausse promesse dans AppShell | `ItineraryView.tsx` L21 |
| **P0-4** | Jargon dev visible (« API », « Placeholder », « Branchement ») | Non professionnel en démo | `TripDetailView` sidebar |
| **P0-5** | Policies `return true`, non enregistrées | IDOR si endpoint sans `findUserTrip` | `TripPolicy.php`, `ActivityPolicy.php` ; absent de `AuthServiceProvider` |
| **P0-6** | Mot de passe share validé API, jamais appliqué | Fausse sécurité | `CreateShareLinkRequest` vs `SharingService` |
| **P0-7** | Échec IA wizard silencieux (`catch → aiDays = []`) | Voyage vide sans explication | `Wizard.tsx` L384-386 |
| **P0-8** | Promesse PDF pricing vs `ExportServiceStub` | Mensonge commercial | `PricingView` + stub backend |

### Code review ciblée (confirmée)

| Sujet | Constat | Action |
|-------|---------|--------|
| **Stripe P0** | Branche `else` active l’abonnement si secret absent | Prod + secret vide → **503** ; fallback dev uniquement |
| **Policies** | `view/update/delete` → `return true` + TODO | Ownership `Voyage`/`Etape` + `$this->authorize()` controllers |
| **Mapbox lazy** | **0** `next/dynamic` dans frontend | `dynamic(() => import Map, { ssr: false })` onglet carte + landing |

---

## En cours / partiel

| Domaine | État | Détail |
|---------|------|--------|
| Export PDF/ICS | Stub 202 | `ExportServiceStub` ; UI PDF morte |
| Dupliquer voyage | API ✅ / UI ❌ | `POST /trips/{id}/duplicate` ; bouton sans `onClick` |
| Archiver | Absent | Pas de route ; bouton décoratif |
| OAuth GitHub/Google | Décoratif | Boutons sans handler |
| Mode manuel | Partiel | `setTimeout(800)` fake ; upload sans action |
| Stripe webhooks | TODO | Confirm `session_id` MVP seulement |
| Auth token | sessionStorage | Roadmap cookies HttpOnly |
| Light mode | Partiel | Modales vol/hôtel dark-only |
| Charte couleur | Partiel | ~20 fichiers `emerald-*` vs cyan `#0096C7` |
| Mapbox perf | Non optimisé | Import statique, LCP impacté |
| PWA / offline | Absent | PRODUCT juin 2026 ; pas de service worker |
| Collab temps réel | Absent | Promis PRODUCT ; pas de WebSocket |
| Drag-drop activités | Absent UI | Legacy dans `TripConfigurationForm` seulement |
| Cookie consent | Stub | `ConsentServiceStub` |
| Tests frontend métier | Minimal | 4 fichiers Vitest ; 0 Wizard/TripDetailView |
| E2E | 0 | Aucun Playwright/Cypress |

### User flows

| Flow | Verdict |
|------|---------|
| Wizard création | ✅ Solide (⚠️ échec IA silencieux) |
| Trip detail | ⚠️ Partiel (CTAs morts, sidebar placeholder) |
| Recap + partage | ✅ Bon (⚠️ ShareModal sans focus trap) |
| Pricing / Stripe | ✅ Si secret OK (⚠️ fallback P0) |
| Auth email | ✅ OK (⚠️ OAuth décoratif) |
| Mode manuel | ⚠️ Fake IA + upload mort |
| `/itineraire` | ❌ Mock |
| Admin metrics | ✅ OK |

---

## Roadmap exécution — 6 phases

Estimation **1 dev + Claude**, rythme soutenu. Durées incluent tests de non-régression ciblés.

### Phase 1 — Confiance produit (P0 UX)
**Durée : 3–5 jours** · **Dépend de :** rien · **Bloque :** démo investisseur crédible

| Livrable | Action |
|----------|--------|
| CTAs morts | Brancher **ou** retirer **ou** `disabled` + « Bientôt » + tooltip |
| `/itineraire` | Redirect trip réel / empty state **ou** supprimer route + nav |
| Copy produit | Remplacer jargon API/Placeholder par copy voyageur |
| Wizard IA | Toast erreur + « continuer sans IA » explicite |
| Pricing | Retirer « Exports PDF » des tiers non livrés |
| OAuth | Masquer boutons jusqu’à intégration réelle |

**Done :** 0 bouton primaire sans handler ; 0 chaîne « API »/« Placeholder » visible ; smoke items 1, 2, 12 OK.

**Fichiers :** voir annexe Phase 1 ci-dessous.

---

### Phase 2 — Sécurité & monétisation
**Durée : 2–4 jours** · **Dépend de :** Phase 1 · **Bloque :** prod payante

| Livrable | Action |
|----------|--------|
| Stripe fallback | Prod + secret vide → **503** |
| Policies | Ownership + enregistrement `AuthServiceProvider` + `authorize()` |
| Share password | Hash + vérif **ou** retirer champ partout |
| Webhooks Stripe | `POST /webhooks/stripe` idempotent |
| CSP / auth | Durcir headers Next ; doc cookies HttpOnly |

**Done :** test confirm sans secret prod → 503 ; user A ≠ trip user B → 403/404.

**Fichiers :** voir annexe Phase 2.

---

### Phase 3 — Barrière régression (tests P0 Nyquist)
**Durée : 4–6 jours** · **Dépend de :** Phase 2 · **Parallélisable** avec Phase 4

| Suite | Fichiers à créer |
|-------|------------------|
| Stripe négatifs | `SubscriptionConfirmationNegativeTest.php` |
| Checkout Next | `frontend/app/api/stripe/checkout/__tests__/route.test.ts` |
| Wizard finalize | `Wizard.finalize.test.tsx` |
| Places fallback | `AmadeusPlacesSearchTest.php` |
| Policies | `TripPolicyTest.php` |
| Share password | `TripSharingPasswordTest.php` |

**Done :** `make test` ≥ 250 · `npm run test:run` ≥ 40 · 8 gaps P0 Nyquist couverts.

---

### Phase 4 — Design premium (impeccable / taste / emil)
**Durée : 5–8 jours** · **Dépend de :** Phase 1 · **Parallélisable** avec Phase 3

| Livrable | Action |
|----------|--------|
| Emerald → cyan | ~20 fichiers → tokens brand |
| Modales vol/hôtel | `var(--foreground)`, `var(--surface)` ; fin slate hardcodé |
| Anti-slop | Landing sans « Intelligence artificielle », témoignage fake, tags `FONCTION IA` |
| a11y | Focus-visible, `prefers-reduced-motion`, focus trap ShareModal |
| Scrollbars | Ne plus masquer globalement sur `*` |
| Voice | Copy voyageur ; 0 em-dash UI |

**Done :** UI/UX ≥ 8,0/10 couleur+composants+a11y · Slop ≤ 2,0 · modales lisibles en light mode.

**Référence détaillée :** `.planning/ANTI-SLOP-ELEVATION-PLAN.md` (passes 1–4).

---

### Phase 5 — Features promises branchées
**Durée : 6–10 jours** · **Dépend de :** Phases 2–3

| Feature | Action |
|---------|--------|
| Dupliquer | Wire bouton → API + redirect |
| Export PDF/ICS | Remplacer stub **ou** job queue documenté |
| Archiver | `status=archived` **ou** retirer bouton |
| Upload brief manuel | Brancher **ou** retirer |
| Lazy Mapbox | `dynamic()` onglet carte + landing |
| Refactor god components | `useWizardFinalize`, `useTripDetail` ; < 600L chacun |

**Done :** dupliquer visible en liste ; chunk Mapbox séparé au build.

---

### Phase 6 — Niveau « millions d’euros »
**Durée : 10–15 jours** · **Dépend de :** Phases 3–5

| Livrable | Action |
|----------|--------|
| E2E Playwright | 8–12 scénarios critiques |
| PWA | manifest + SW cache trip actif |
| Perf | `Promise.all` trip+activities ; LCP < 2,5s |
| Consent RGPD | `ConsentService` réel + bannière |
| Observabilité | Sentry front+back |
| Collab | Roadmap séparée — ne pas promettre en UI |

**Done :** Playwright CI green · PWA installable · score global ≥ 8,5/10.

### Graphe de dépendances

```
Phase 1 (Confiance) ──┬──► Phase 4 (Design) ──► Phase 6 (Premium)
                      │
                      └──► Phase 2 (Sécu) ──► Phase 3 (Tests) ──► Phase 5 (Features) ──► Phase 6
```

**Séquentiel :** ~30–48 j · **Parallélisé (3+4 après 1) :** ~22–32 j.

---

## Matrice effort / impact

| Item | Impact | Effort | Phase |
|------|--------|--------|-------|
| Retirer/brancher boutons morts | 🔴 Très haut | 🟢 Faible | 1 |
| Supprimer mock `/itineraire` | 🔴 Très haut | 🟢 Faible | 1 |
| **Stripe fallback prod** | 🔴 Très haut | 🟢 Faible (< 2 h) | 2 |
| Wizard erreur IA explicite | 🔴 Haut | 🟢 Faible | 1 |
| Policies ownership | 🔴 Haut | 🟡 Moyen | 2 |
| Tests wizard + Stripe P0 | 🔴 Haut | 🟡 Moyen | 3 |
| Emerald → cyan + anti-slop landing | 🟡 Moyen | 🟡 Moyen | 4 |
| Modales light mode | 🟡 Moyen | 🟡 Moyen | 4 |
| **Lazy Mapbox** | 🟡 Moyen | 🟢 Faible | 5 |
| Export PDF réel | 🟡 Moyen | 🔴 Élevé | 5 |
| Webhooks Stripe | 🟡 Moyen | 🟡 Moyen | 2 |
| E2E Playwright | 🔴 Haut | 🔴 Élevé | 6 |
| PWA offline | 🟡 Moyen | 🔴 Élevé | 6 |
| Collab temps réel | 🟡 Long terme | 🔴 Très élevé | hors scope 6 |

---

## Suite tests — Smoke + E2E

### Automatisé (vérifié 15/06 — verts)

```bash
# Backend — 228 tests, 538 assertions
make test

# Frontend — 21 tests (4 fichiers)
docker compose -f compose.dev.yaml exec tri-app npm run test:run
docker compose -f compose.dev.yaml exec tri-app npm run lint
docker compose -f compose.dev.yaml exec tri-app npm run build

# Santé API
curl -s http://127.0.0.1:8000/api/v1/health
```

### Smoke post-Phase 1 (~15 min)

| # | Scénario | Succès |
|---|----------|--------|
| 1 | Chaque CTA trip detail | Action ou « Bientôt » explicite |
| 2 | Visiter `/itineraire` | Redirect ou contenu réel, pas Rome |
| 3 | Wizard IA coupée | Message erreur, pas voyage vide silencieux |
| 4 | Register | Pas de boutons OAuth morts |

### E2E manuels complets (~30 min)

| # | Scénario | Succès attendu |
|---|----------|----------------|
| 1 | Wizard non connecté → login → reprise | Voyage créé |
| 2 | Destination sans clic liste | Next désactivé |
| 3 | Autocomplete `Marseill` | Suggestions OK |
| 4 | IATA lookup départ (public) | 200 |
| 5–7 | CRUD vol / hôtel | Persisté ou 422 explicite |
| 8 | Replan preview → appliquer | Snapshot cohérent |
| 9–10 | Share link / expiré | Recap scrubé / 404 |
| 11 | Export PDF/ICS | Fichier ou stub documenté |
| 12–14 | Tarifs / Stripe / email mismatch | Gate auth + tier correct |
| 15 | Token expiré | Session cleared |
| 16–18 | Admin / budget / free-time | Comportement attendu |
| 19–20 | Light mode modales / reduced-motion | Lisible, pas de lift agressif |

### E2E Playwright cibles (Phase 6)

1. `wizard-anonymous-login-resume.spec.ts`
2. `wizard-destination-validation.spec.ts`
3. `trip-detail-tabs-map.spec.ts`
4. `trip-duplicate.spec.ts`
5. `stripe-checkout-confirm.spec.ts`
6. `share-public-recap.spec.ts`
7. `replan-apply.spec.ts`
8. `auth-401-clears-session.spec.ts`

---

## Actions semaine 1

Ordre recommandé pour **max ROI** (5 jours ouvrés).

| Jour | Action | Livrable | Owner |
|------|--------|----------|-------|
| **J1 matin** | Correctif **P0-1 Stripe** : prod sans secret → 503 | PR + test négatif | Backend |
| **J1 après-midi** | Audit grep boutons morts + liste fichiers | Checklist 8 fichiers | Frontend |
| **J2** | Phase 1.1–1.2 : `/itineraire` + CTAs trip detail | 0 mock Rome ; handlers ou disabled | Frontend |
| **J3** | Phase 1.3–1.5 : OAuth masqué, wizard IA toast, copy sidebar | 0 jargon API visible | Frontend |
| **J4** | Phase 1.6 : Pricing sans PDF fantôme ; ManualCanvas upload | Promesses alignées backend | Frontend |
| **J5** | Smoke manuel 4 scénarios + grep validation | Rapport smoke OK | QA / PM |

**Parallèle possible J2–J4 :** début Phase 2 policies (ownership) si bande passante backend.

**Ne pas faire semaine 1 :** refactor god components, PWA, collab, export PDF complet, landing redesign complet — après confiance rétablie.

**KPI fin semaine 1 :**
- [ ] P0-1 fermé avec test automatisé
- [ ] 0 bouton primaire fantôme (grep + smoke)
- [ ] `/itineraire` ne montre plus Rome
- [ ] Slop landing : témoignage fake retiré
- [ ] Score confiance interne : prêt démo équipe (pas investisseur)

---

## Annexes — fichiers par phase

### Phase 1 — Confiance produit
```
frontend/src/components/app/ItineraryView.tsx
frontend/app/itineraire/page.tsx
frontend/src/features/trips/TripDetailView.tsx
frontend/src/features/modes/ManualCanvasView.tsx
frontend/src/features/auth/RegisterView.tsx
frontend/src/features/pricing/PricingView.tsx
frontend/src/components/layout/AppShell.tsx
frontend/src/components/planner/Wizard.tsx
frontend/app/page.tsx
```

### Phase 2 — Sécurité & monétisation
```
backend/app/Http/Controllers/Api/V1/SubscriptionController.php
backend/app/Policies/TripPolicy.php
backend/app/Policies/ActivityPolicy.php
backend/app/Providers/AuthServiceProvider.php
backend/app/Http/Controllers/Api/V1/TripController.php
backend/app/Services/SharingService.php
backend/routes/api.php
frontend/next.config.ts
```

### Phase 3 — Tests P0
```
backend/tests/Feature/Http/SubscriptionConfirmationNegativeTest.php
backend/tests/Feature/Integrations/AmadeusPlacesSearchTest.php
backend/tests/Unit/Policies/TripPolicyTest.php
frontend/src/components/planner/__tests__/Wizard.finalize.test.tsx
frontend/app/api/stripe/checkout/__tests__/route.test.ts
```

### Phase 4 — Design premium
```
frontend/app/globals.css
frontend/app/page.tsx
frontend/src/components/Button/Button.tsx
frontend/src/components/CityAutocomplete/CityAutocomplete.tsx
frontend/src/components/FlightSearchModal/FlightSearchModal.tsx
frontend/src/components/HotelSearchModal/HotelSearchModal.tsx
frontend/src/features/pricing/PricingView.tsx
PRODUCT.md
.planning/ANTI-SLOP-ELEVATION-PLAN.md
```

### Phase 5 — Features branchées
```
backend/app/Services/Stubs/ExportServiceStub.php
frontend/src/features/trips/TripDetailView.tsx
frontend/src/components/Map/Map.tsx
frontend/src/hooks/useWizardFinalize.ts
frontend/src/hooks/useTripDetail.ts
```

### Phase 6 — Premium
```
frontend/playwright.config.ts
frontend/e2e/*.spec.ts
frontend/public/manifest.json
backend/app/Services/ConsentService.php
```

### Documents de référence
| Fichier | Usage |
|---------|-------|
| `.planning/AUDIT-REPORT-2026-06-15.md` | Rapport détaillé initial |
| `.planning/ANTI-SLOP-ELEVATION-PLAN.md` | Passes anti-slop + checklist pre-flight |
| `.planning/architecture-review.md` | Deepening backend (serializers, user context) |
| `UI-REVIEW.md` | Audit 6 piliers frontend (mai 2026) |
| `DESIGN.md` / `PRODUCT.md` | Charte et scope produit |

---

## Prochaine action

1. **Immédiat :** PR Stripe P0 (< 2 h).  
2. **Sprint :** lancer Phase 1 (`/gsd:execute-phase` ou sprint dédié).  
3. **Gate démo externe :** smoke 4 scénarios + P0-1 à P0-4 fermés.

---

*Rapport consolidé gsd-planner — généré 15 juin 2026. Tests shell re-vérifiés le même jour.*
