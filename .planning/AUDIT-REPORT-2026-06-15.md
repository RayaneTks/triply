# Rapport Audit Triply — Juin 2026

> **Version consolidée (chef de projet) :** voir [AUDIT-REPORT-FINAL-2026-06-15.md](./AUDIT-REPORT-FINAL-2026-06-15.md) — scores UI 6,8 · Design 6,6 · Slop 5,8 · tests shell re-vérifiés (228 PHPUnit, 21 Vitest).

**Référence :** `main` @ `fa14d96`  
**Date :** 15 juin 2026  
**Sources consolidées :** code review, audit UI/UX (6,8/10), Nyquist couverture tests, audit fonctionnel partiel, architecture review (mai 2026), vérifications code directes.  
**Note :** l’audit design impeccable + taste + emil-design-eng a été lancé mais **non terminé** dans les transcripts ; la section Design intègre UI/UX + critères des skills impeccable/taste/emil.

---

## Executive Summary

Triply possède un **socle technique solide** (Laravel services découpés, ~228 tests PHPUnit, wizard + trip detail + Amadeus/Stripe fonctionnels) mais **n’est pas prêt pour une démo investisseur « millions d’euros »** tant que la confiance utilisateur n’est pas rétablie. Le produit expose encore des **boutons morts**, une **page mock Rome**, des **promesses non tenues** (PDF, OAuth), et un **fallback Stripe sans secret** activable en prod. Le design system cyan dark-first est au-dessus de la moyenne MVP, mais **emerald persiste**, le **light mode casse les modales vol/hôtel**, et l’accessibilité est inégale. La couverture backend est correcte sur le cœur métier ; le frontend est **quasi nu** (~22 Vitest, 0 E2E). Priorité absolue : **Phase 1 Confiance produit** (retirer ou brancher tout ce qui ment), puis **sécurité monétisation**, puis **tests P0 du funnel**, puis polish design premium.

---

## Scorecard global (/10)

| Axe | Score | Justification courte |
|-----|-------|----------------------|
| **Technique** | **7,0** | Services backend focalisés, snapshot sync mature, CI basique OK ; god components (~1070L Wizard, ~930L TripDetailView), Mapbox non lazy-loaded, waterfall API |
| **Produit** | **6,0** | Funnel création + détail voyage riche ; export/archive/duplicate/OAuth/PWA/collab absents ou trompeurs |
| **Design** | **6,5** | Design system documenté, boutons 3D, tokens ; incohérences emerald/cyan, AI slop landing, modales legacy |
| **Tests** | **6,0** | 228 PHPUnit solides sur domaine ; frontend <5 % logique UI, 0 E2E, gaps Stripe/wizard/places/policies |
| **Sécurité** | **5,5** | Sanctum + `findUserTrip` OK ; policies mortes, Stripe fallback, bearer sessionStorage, share password fantôme |
| **UX** | **6,0** | Flows principaux utilisables ; frustration garantie sur CTAs morts, jargon dev visible, scrollbars cachées |
| **Global pondéré** | **6,2** | Bon MVP travel SaaS ; écart « premium irréprochable » = confiance + polish + barrières régression |

---

## Ce qui fonctionne (forces)

### Backend
- **Auth Sanctum** complète (register, login, reset, verify) avec tests Feature.
- **TripService + SnapshotSyncService** : persistance wizard → `plan_snapshot` → tables structurées, tests characterization.
- **Travel** : CRUD vols/hôtels/transports locaux persistés (`TravelService`, `TripTravelControllerTest`).
- **Amadeus** : proxy intégrations, circuit breaker, fallback Mapbox/Nominatim (`AmadeusClient`).
- **Partage** : liens publics TTL, recap scrubé (`SharingService`, tests).
- **Replan + budget reshuffle + free-time** : API testée.
- **Admin metrics** : observabilité réelle.
- **Abonnement Stripe** : checkout Next.js + confirm backend **quand secret configuré** (vérif session, email, metadata).

### Frontend
- **Wizard multi-étapes** : destination avec sélection obligatoire, reprise post-login (`pendingWizard`), overlay IA.
- **Trip detail** : onglets, carte Mapbox, replan, budget, undo delete activités, vols/hôtels branchés.
- **Recap** : sections jour/vol/hôtel, partage, deeplink booking.
- **Pricing** : gate auth, états loading, redirect Stripe.
- **Design tokens** : `globals.css` dark-first, `triply-card`, boutons 3D, thème toggle anti-flash.
- **Composants a11y isolés** : `CityAutocomplete` (combobox), `ReplanModal`, `DayTimeline`.

### Infra & qualité
- Docker-first dev, CI lint + tests backend + Vitest + build Next.
- Audit sécurité mai 2026 (HSTS, throttle, headers) documenté dans `project_audit_plan.md`.
- Refactor TripService 902L → 389L + 3 services extraits.

---

## Ce qui ne fonctionne pas (P0 bloquants)

| # | Problème | Impact | Preuve |
|---|----------|--------|--------|
| **P0-1** | **Fallback Stripe sans `STRIPE_SECRET_KEY`** → activation premium sans vérif paiement | Fraude abonnement, perte crédibilité investisseur | `SubscriptionController.php` L87-94 |
| **P0-2** | **Boutons morts visibles** (PDF, Archiver, Dupliquer, upload manuel, OAuth) | Confiance produit détruite au premier clic | `ItineraryView.tsx` L96-97, `TripDetailView.tsx` L439-456, `ManualCanvasView.tsx`, `RegisterView.tsx` |
| **P0-3** | **`/itineraire` mock Rome** | Fausse promesse, piège UX dans AppShell | `ItineraryView.tsx` L21 « Week-end à Rome » |
| **P0-4** | **Jargon développeur visible** (« API », « Placeholder ») | Non professionnel en démo | `TripDetailView.tsx` sidebar docs/ressources |
| **P0-5** | **Policies `return true` non enregistrées** | IDOR si nouveau endpoint sans `findUserTrip` | `TripPolicy.php`, `ActivityPolicy.php` |
| **P0-6** | **Mot de passe share link validé mais jamais appliqué** | Fausse sécurité | `CreateShareLinkRequest` `password min:6` ; `SharingService` sans password |
| **P0-7** | **IA wizard échoue silencieusement** (`catch → aiDays = []`) | Voyage vide sans explication | `Wizard.tsx` L384-386 |
| **P0-8** | **Promesse PDF pricing** alors que `ExportServiceStub` | Mensonge commercial | `PricingView.tsx` + stub backend |

---

## En cours / partiel

| Domaine | État | Détail |
|---------|------|--------|
| **Export PDF/ICS** | Stub 202 | `ExportServiceStub`, `TripExportController` ; UI PDF morte |
| **Duplicate voyage** | API ✅ / UI ❌ | `POST /trips/{id}/duplicate` existe ; bouton sans `onClick` |
| **Archiver** | Absent | Pas de route archive ; bouton décoratif |
| **OAuth GitHub/Google** | Décoratif | Boutons sans handler |
| **Mode manuel** | Partiel | Parser brief OK ; `setTimeout(800)` fake analyse ; upload sans action |
| **Stripe webhooks** | TODO documenté | Confirm via `session_id` MVP seulement (`CLAUDE.md`) |
| **Auth token** | sessionStorage | Volable XSS ; cookies HttpOnly en roadmap |
| **Light mode** | Partiel | Modales vol/hôtel dark-only (`FlightSearchModal`, `HotelSearchModal`, `Searchbar`) |
| **Charte couleur** | Partiel | ~20 fichiers avec `emerald-*` vs cyan `#0096C7` (`DESIGN.md`) |
| **Mapbox perf** | Non optimisé | Import statique, 0 `next/dynamic` dans le frontend |
| **Collaboration temps réel** | Absent | PRODUCT.md le promet ; pas de WebSocket |
| **Drag-drop activités** | Absent UI | `TripConfigurationForm` a du drag legacy ; pas sur trip detail |
| **PWA / offline** | Absent | In scope PRODUCT (juin 2026) ; pas de service worker |
| **Cookie consent** | Stub | `ConsentServiceStub` |
| **IA legacy `/ai/*`** | Stub 202 | Wizard utilise `/integrations/assistant` (réel) |
| **Tests frontend métier** | Minimal | 4 fichiers Vitest ; 0 Wizard/TripDetailView |
| **E2E** | 0 | Aucun Playwright/Cypress |
| **Audit design impeccable** | Inachevé | Subagent interrompu ; critères emil/taste non scorés séparément |

### User flows (synthèse)

| Flow | Verdict |
|------|---------|
| Wizard création | ✅ Solide (⚠️ échec IA silencieux) |
| Trip detail | ⚠️ Partiel (CTAs morts, sidebar placeholder) |
| Recap + partage | ✅ Bon (⚠️ ShareModal sans focus trap) |
| Pricing / Stripe | ✅ Si secret configuré (⚠️ fallback P0) |
| Auth email | ✅ OK (⚠️ OAuth décoratif) |
| Mode manuel | ⚠️ Fake IA + upload mort |
| `/itineraire` | ❌ Mock |
| Admin | ✅ Metrics (⚠️ autres endpoints peu testés) |

---

## Roadmap exécution en 6 phases

Estimation pour **1 dev + Claude** en rythme soutenu. Les durées incluent tests de non-régression ciblés.

### Phase 1 — Confiance produit (P0 UX)
**Durée :** 3–5 jours · **Dépend de :** rien · **Bloque :** démo investisseur crédible

**Objectif :** Aucun clic utilisateur ne mène à un trou.

| Livrable | Action |
|----------|--------|
| CTAs morts | Brancher **ou** retirer **ou** désactiver avec « Bientôt » + tooltip |
| `/itineraire` | Rediriger vers trip réel / recap **ou** supprimer route + nav |
| Copy produit | Remplacer jargon API/Placeholder par copy voyageur |
| Wizard IA | Toast erreur + choix « continuer sans IA » explicite |
| Pricing | Retirer « Exports PDF » des tiers non livrés |
| OAuth | Masquer boutons jusqu’à intégration réelle |

**Critères done :**
- [ ] Checklist 18 scénarios smoke § « E2E manuels » : items 1, 2, 12 passent sans frustration
- [ ] 0 bouton primaire sans handler dans `TripDetailView`, `ItineraryView`, `ManualCanvasView`, `RegisterView`
- [ ] Aucune chaîne « API », « Placeholder », « Branchement » visible en UI produit

---

### Phase 2 — Sécurité & monétisation
**Durée :** 2–4 jours · **Dépend de :** Phase 1 (copy pricing alignée) · **Bloque :** mise en prod payante

**Objectif :** Impossible d’obtenir un premium sans paiement réel ; défense en profondeur ownership.

| Livrable | Action |
|----------|--------|
| Stripe fallback | `APP_ENV=production` + secret vide → **503** ; fallback dev uniquement |
| Policies | Implémenter ownership `Voyage`/`Etape` ; enregistrer dans `AuthServiceProvider` ; `$this->authorize()` controllers |
| Share password | Implémenter hash + vérif **ou** retirer champ UI/API |
| Webhooks Stripe | `POST /webhooks/stripe` idempotent (subscription created/updated/deleted) |
| CSP / auth | Durcir headers Next ; documenter roadmap cookies HttpOnly |

**Critères done :**
- [ ] Test : confirm sans secret en prod → 503
- [ ] Test : user A ne peut pas `GET/PATCH/DELETE` trip de user B (403/404)
- [ ] Test : share avec password refuse accès sans password (ou feature retirée partout)
- [ ] Webhook test Stripe CLI documenté

---

### Phase 3 — Barrière régression (tests P0)
**Durée :** 4–6 jours · **Dépend de :** Phase 2 (comportement Stripe/policies figé) · **Parallélisable partiellement** avec Phase 4

**Objectif :** CI protège funnel #1 et monétisation.

| Suite | Fichiers clés à créer |
|-------|----------------------|
| Stripe négatifs | `SubscriptionConfirmationNegativeTest.php` |
| Checkout Next | `frontend/app/api/stripe/checkout/__tests__/route.test.ts` |
| Wizard finalize | `Wizard.finalize.test.tsx` |
| Places fallback | `AmadeusPlacesSearchTest.php` |
| Replan merge | `ReplanModal.merge.test.ts` |
| Export stub | `TripExportControllerTest.php` |
| Policies | `TripPolicyTest.php` |
| Share password | `TripSharingPasswordTest.php` |

**Critères done :**
- [ ] `make test` ≥ 250 tests, 0 échec
- [ ] `npm run test:run` ≥ 40 tests frontend
- [ ] CI exécute les deux sans régression
- [ ] Couverture documentée des 8 gaps P0 Nyquist

---

### Phase 4 — Design premium (impeccable / taste / emil)
**Durée :** 5–8 jours · **Dépend de :** Phase 1 (surfaces stables) · **Parallélisable** avec Phase 3

**Objectif :** Cohérence marque cyan, light mode fiable, détails « premium » invisibles.

| Livrable | Action |
|----------|--------|
| Emerald → cyan | Remplacer `emerald-*` par `ring-brand`, `--success-fg`, tokens (`~20 fichiers`) |
| Modales vol/hôtel | Refactor styles → `var(--foreground)`, `var(--surface)` ; supprimer slate hardcodé |
| Accessibilité | `Button` focus-visible ; `prefers-reduced-motion` sur lift 3D ; focus trap ShareModal |
| Scrollbars | Ne plus masquer globalement sur `*` ; cibler composants si besoin esthétique |
| Motion emil | États loading/error/empty intentionnels ; supprimer `setTimeout` artificiels (`TripsListView`, `ManualCanvasView`) |
| Anti-slop | Landing : réduire uppercase/tracking, témoignage, tags `FONCTION IA` |
| Docs | Aligner `CLAUDE.md` + `PRODUCT.md` (emerald ring → cyan ring) sur `DESIGN.md` |

**Critères done :**
- [ ] Audit UI/UX rescoring cible **≥ 8,0/10** sur piliers Couleur + Composants + a11y
- [ ] Modales vol/hôtel lisibles en `[data-theme="light"]` (capture + test visuel)
- [ ] `rg emerald` frontend → 0 usages décoratifs (success token seulement si sémantique)
- [ ] Lighthouse a11y ≥ 90 sur `/planifier` et `/voyages/[id]`

---

### Phase 5 — Features promises branchées
**Durée :** 6–10 jours · **Dépend de :** Phases 2–3

**Objectif :** Livrer ce que le produit affiche ou retirer définitivement.

| Feature | Action |
|---------|--------|
| Dupliquer | Wire bouton → `POST /trips/{id}/duplicate` + redirect |
| Export PDF/ICS | Remplacer `ExportServiceStub` par impl minimale (PDF recap, ICS jours) **ou** job queue + email |
| Archiver | `status=archived` sur `Voyage` + filtre liste **ou** retirer bouton |
| Upload brief manuel | Brancher stockage temporaire + parser **ou** retirer |
| Lazy Mapbox | `dynamic(() => import Map, { ssr: false })` onglet carte |
| Refactor god components | Extraire `useWizardFinalize`, `useTripDetail` ; sous-composants par step/onglet |

**Critères done :**
- [ ] Dupliquer crée voyage `(copie)` visible en liste
- [ ] Export PDF retourne fichier téléchargeable ou 202 + polling job documenté
- [ ] Bundle trip detail : chunk Mapbox séparé (analyse `npm run build`)
- [ ] Wizard.tsx < 600L, TripDetailView.tsx < 600L (extraction hooks)

---

### Phase 6 — Niveau « millions d’euros »
**Durée :** 10–15 jours · **Dépend de :** Phases 3–5

**Objectif :** Barrière E2E, perf, différenciateurs PRODUCT.

| Livrable | Action |
|----------|--------|
| E2E Playwright | 8–12 scénarios critiques (wizard, trip, stripe test mode, share) |
| PWA | manifest + service worker cache trip actif |
| Perf | `Promise.all` trip+activities ; endpoint agrégé optionnel ; Core Web Vitals |
| Collab / drag-drop | Roadmap séparée si hors scope immédiat — au minimum ne pas promettre dans UI |
| Consent RGPD | `ConsentService` réel + bannière |
| Error boundary | Global Next + fallback français |
| Observabilité | Sentry ou équivalent front+back |

**Critères done :**
- [ ] Playwright CI green sur 8 scénarios
- [ ] PWA installable, trip consulté offline (snapshot cache)
- [ ] LCP < 2,5s trip detail (lazy map)
- [ ] Score global audit **≥ 8,5/10** toutes catégories

### Graphe de dépendances

```
Phase 1 (Confiance) ──┬──► Phase 4 (Design) ──► Phase 6 (Premium)
                      │
                      └──► Phase 2 (Sécu) ──► Phase 3 (Tests) ──► Phase 5 (Features) ──► Phase 6
```

**Parallélisation recommandée :** Phase 3 + Phase 4 après Phase 1 ; Phase 5 après Phase 2+3.

**Durée totale séquentielle :** ~30–48 jours · **Avec parallélisation :** ~22–32 jours.

---

## Matrice effort / impact

| Item | Impact | Effort | Phase |
|------|--------|--------|-------|
| Retirer/brancher boutons morts | 🔴 Très haut | 🟢 Faible | 1 |
| Supprimer mock `/itineraire` | 🔴 Très haut | 🟢 Faible | 1 |
| Stripe fallback prod | 🔴 Très haut | 🟢 Faible | 2 |
| Wizard erreur IA explicite | 🔴 Haut | 🟢 Faible | 1 |
| Policies ownership | 🔴 Haut | 🟡 Moyen | 2 |
| Tests wizard + Stripe P0 | 🔴 Haut | 🟡 Moyen | 3 |
| Emerald → cyan | 🟡 Moyen | 🟡 Moyen | 4 |
| Modales light mode | 🟡 Moyen | 🟡 Moyen | 4 |
| Lazy Mapbox | 🟡 Moyen | 🟢 Faible | 5 |
| Export PDF réel | 🟡 Moyen | 🔴 Élevé | 5 |
| Webhooks Stripe | 🟡 Moyen | 🟡 Moyen | 2 |
| E2E Playwright | 🔴 Haut | 🔴 Élevé | 6 |
| PWA offline | 🟡 Moyen | 🔴 Élevé | 6 |
| Refactor god components | 🟢 Faible court terme | 🔴 Élevé | 5 |
| Collab temps réel | 🟡 Moyen long terme | 🔴 Très élevé | hors scope 6 |

---

## Suite tests smoke + E2E à exécuter

### Automatisé (Docker dev)

```bash
# Backend complet (~228 tests)
make test
make test-feature
make test-unit

# Frontend
docker compose -f compose.dev.yaml exec tri-app npm run test:run
docker compose -f compose.dev.yaml exec tri-app npm run lint
docker compose -f compose.dev.yaml exec tri-app npm run build

# Santé API
curl -s http://127.0.0.1:8000/api/v1/health
```

### Smoke post-Phase 1 (15 min)

| # | Scénario | Succès |
|---|----------|--------|
| 1 | Cliquer chaque CTA trip detail | Action ou « Bientôt » explicite |
| 2 | Visiter `/itineraire` | Redirect ou contenu réel, pas Rome |
| 3 | Finaliser wizard avec IA coupée | Message erreur, pas voyage vide silencieux |
| 4 | Register : pas de boutons OAuth morts | Masqués ou fonctionnels |

### E2E manuels complets (~30 min)

| # | Scénario | Succès attendu |
|---|----------|----------------|
| 1 | Wizard non connecté → login → reprise | Voyage créé, `/voyages/{id}` |
| 2 | Destination sans clic liste → Next désactivé | Validation stricte |
| 3 | Autocomplete `Marseill` | Suggestions, sélection OK |
| 4 | IATA lookup départ (public) | 200 |
| 5 | Recherche vols depuis voyage | Résultats ou 422 explicite |
| 6 | CRUD vol complet | Persisté |
| 7 | CRUD hôtel dates invalides | Erreur validation |
| 8 | Replan preview → appliquer | Snapshot cohérent |
| 9 | Share link → `/share/{token}` | Recap sans URLs booking |
| 10 | Share expiré | 404/410 |
| 11 | Export PDF/ICS | Fichier ou 202 stub documenté |
| 12 | Tarifs sans auth | Redirect connexion |
| 13 | Stripe test → success | Tier activé |
| 14 | Confirm email mismatch | Erreur, tier inchangé |
| 15 | Token expiré → API | Session cleared |
| 16 | Admin non-admin | 403 |
| 17 | Budget reshuffle | Proposition retournée |
| 18 | Free-time jour | Suggestions POI |
| 19 | Light mode modales vol/hôtel | Lisible, contrastes OK |
| 20 | `prefers-reduced-motion` | Pas de lift 3D agressif |

### E2E Playwright cibles (Phase 6)

1. `wizard-anonymous-login-resume.spec.ts`
2. `wizard-destination-validation.spec.ts`
3. `trip-detail-tabs-map.spec.ts`
4. `trip-duplicate.spec.ts`
5. `stripe-checkout-confirm.spec.ts` (test mode)
6. `share-public-recap.spec.ts`
7. `replan-apply.spec.ts`
8. `auth-401-clears-session.spec.ts`

---

## Annexes : fichiers à toucher par phase

### Phase 1 — Confiance produit

```
frontend/src/components/app/ItineraryView.tsx
frontend/app/itineraire/page.tsx
frontend/src/features/trips/TripDetailView.tsx
frontend/src/features/modes/ManualCanvasView.tsx
frontend/src/features/auth/RegisterView.tsx
frontend/src/features/pricing/PricingView.tsx
frontend/src/components/layout/AppShell.tsx          # « Logout » → français
frontend/src/components/planner/Wizard.tsx           # catch IA silencieux
frontend/app/page.tsx                                # ancres nav incohérentes
```

### Phase 2 — Sécurité & monétisation

```
backend/app/Http/Controllers/Api/V1/SubscriptionController.php
backend/app/Policies/TripPolicy.php
backend/app/Policies/ActivityPolicy.php
backend/app/Providers/AuthServiceProvider.php
backend/app/Http/Controllers/Api/V1/TripController.php
backend/app/Http/Controllers/Api/V1/TripActivityController.php
backend/app/Http/Controllers/Api/V1/TripTravelController.php
backend/app/Http/Controllers/Api/V1/TripSharingController.php
backend/app/Services/SharingService.php
backend/app/Http/Requests/Api/V1/Sharing/CreateShareLinkRequest.php
backend/routes/api.php                               # webhook stripe
backend/database/migrations/                       # share password hash si impl
frontend/next.config.ts                              # CSP
```

### Phase 3 — Tests P0

```
backend/tests/Feature/Http/SubscriptionConfirmationNegativeTest.php
backend/tests/Feature/Integrations/AmadeusPlacesSearchTest.php
backend/tests/Feature/Http/TripExportControllerTest.php
backend/tests/Unit/Policies/TripPolicyTest.php
backend/tests/Feature/Http/TripSharingPasswordTest.php
frontend/src/components/planner/__tests__/Wizard.finalize.test.tsx
frontend/src/components/trips/__tests__/ReplanModal.merge.test.ts
frontend/app/api/stripe/checkout/__tests__/route.test.ts
frontend/src/features/trip-creation/__tests__/step1-form-patch.test.ts
.github/workflows/                                   # gate tests si besoin
```

### Phase 4 — Design premium

```
frontend/app/globals.css
frontend/src/components/Button/Button.tsx
frontend/src/components/CityAutocomplete/CityAutocomplete.tsx
frontend/src/components/FlightSearchModal/FlightSearchModal.tsx
frontend/src/components/HotelSearchModal/HotelSearchModal.tsx
frontend/src/components/Searchbar/Searchbar.tsx
frontend/src/components/Sidebar/Sidebar.tsx
frontend/src/components/planner/Wizard.tsx
frontend/src/components/planner/OriginPicker.tsx
frontend/src/features/trips/TripDetailView.tsx
frontend/src/features/recap/RecapVoyageView.tsx      # ShareModal a11y
frontend/src/features/pricing/PricingView.tsx
frontend/src/features/auth/RegisterView.tsx
frontend/src/components/app/TripsListView.tsx
frontend/app/page.tsx
CLAUDE.md
PRODUCT.md
DESIGN.md                                            # si ajustements
```

### Phase 5 — Features branchées

```
backend/app/Services/Stubs/ExportServiceStub.php     # → ExportService
backend/app/Services/ExportService.php
backend/app/Http/Controllers/Api/V1/TripExportController.php
backend/app/Http/Controllers/Api/V1/TripController.php  # archive status
backend/database/migrations/                       # voyage.status
frontend/src/features/trips/TripDetailView.tsx     # duplicate wire + dynamic map
frontend/src/components/Map/Map.tsx
frontend/src/lib/trips-client.ts
frontend/src/hooks/useWizardFinalize.ts              # nouveau
frontend/src/hooks/useTripDetail.ts                  # nouveau
frontend/src/components/planner/Wizard.tsx           # extraction
```

### Phase 6 — Premium

```
frontend/playwright.config.ts
frontend/e2e/*.spec.ts
frontend/public/manifest.json
frontend/app/sw.ts ou next-pwa config
frontend/src/components/ErrorBoundary.tsx
backend/app/Services/ConsentService.php              # remplace stub
frontend/src/components/CookieConsent.tsx
compose.prod.yaml                                    # env Sentry etc.
```

---

## Synthèse design (impeccable + taste + emil — dérivée)

**Design Read (1 ligne) :** Travel SaaS dark-first cyan crédible, entaché par reliquats emerald, surfaces mock et motion non intentionnelle.

| Dimension impeccable/taste | Constat | Cible Phase 4 |
|----------------------------|---------|---------------|
| Pas d’emerald décoratif | ~20 fichiers violents | 0 emerald hors `--success-fg` |
| Eyebrow restraint | `uppercase tracking-widest` partout | Limiter aux labels navigation |
| États vides/erreur emil | Sidebar placeholder, voyage vide IA | Copy + illustrations cohérentes |
| Feedback tactile | 3D buttons OK | + reduced-motion + focus visible |
| Pas de fausses promesses | Rome, PDF, OAuth | Phase 1 préalable au polish |
| Light/dark parity | Modales cassées | Token-only styling |

---

## Prochaine action recommandée

Exécuter **Phase 1** immédiatement (`/gsd:execute-phase` ou sprint dédié) : ROI maximal en 3–5 jours avant toute démo externe. En parallèle, corriger **P0-1 Stripe** (1 PR, <2h).

---

*Rapport généré par consolidation gsd-planner — read-only sauf ce fichier.*
