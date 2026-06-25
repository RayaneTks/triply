# Audit UI/UX Frontend Triply — A à Z

**Audité :** 15 juin 2026  
**Baseline :** `DESIGN.md`, `PRODUCT.md`, `globals.css` (pas de `UI-SPEC.md`)  
**Périmètre :** `frontend/app/`, `frontend/src/features/`, `frontend/src/components/`  
**Stack :** Next.js 16 App Router, React 19, Tailwind v4  
**Screenshots :** Non capturés (Playwright a échoué malgré serveur actif sur `:5173`) — audit code + DESIGN.md

---

## Executive Summary

Triply dispose d’un **design system cyan dark-first mature** (`globals.css`, boutons 3D, `triply-card`, toggle thème anti-flash) nettement au-dessus d’un MVP générique. Le copywriting français est globalement chaleureux et orienté action sur les flows principaux (wizard, auth, pricing).

Le score global **6,1/10** est freiné par un problème structurel de **confiance produit** : plusieurs surfaces exposent des **boutons morts**, une **page mock Rome** (`/itineraire`), du **jargon développeur visible**, des **promesses non tenues** (PDF, OAuth), et un **échec IA silencieux** dans le wizard. Le thème clair est partiellement géré via des overrides CSS massifs, mais les **modales vol/hôtel restent dark-only** (`text-slate-100`). L’accessibilité est **inégale** : bons patterns sur certains composants (combobox, modales replan), mais scrollbars masquées globalement et absence de `prefers-reduced-motion` sur les boutons 3D.

**Verdict :** Interface premium en apparence, MVP crédible sur le funnel création → détail voyage, **non prête pour une démo investisseur** tant que tout clic ne mène pas à une action réelle.

---

## Scores par pilier (0–10)

| Pilier | Score | Synthèse |
|--------|-------|----------|
| **1. Copywriting** | **7,0** | Français chaleureux, CTAs clairs ; jargon dev, mock Rome, promesse PDF, anglicisme « Logout » |
| **2. User flows** | **6,0** | Wizard + trip detail solides ; `/itineraire` mock, IA wizard silencieuse, mode manuel fake delay |
| **3. Boutons morts / interactions** | **4,0** | PDF, Dupliquer, Archiver, OAuth, upload, réseaux sociaux — clics sans effet |
| **4. Dark / Light** | **6,5** | Tokens + overrides `[data-theme="light"]` solides ; modales legacy dark-only |
| **5. Accessibilité (a11y)** | **6,0** | Focus brand, quelques `role="dialog"` ; scrollbars cachées, reduced-motion absent, labels manquants |
| **6. Anti-slop** | **6,0** | Identité cyan + 3D distinctifs ; landing template (hero centré, témoignage générique, emerald vs cyan) |

**Score global : 6,1 / 10** (moyenne des 6 piliers)

---

## Ce qui fonctionne

### Design system & fondations
- **`globals.css`** : palette cyan `#0096C7`, surfaces dark-first, alias `.text-brand`, `.bg-brand/10`, sémantiques success/warning/error adaptatives light/dark.
- **Boutons 3D** (`Button.tsx`, `.btn-primary`) : signature brand intentionnelle, états loading/disabled.
- **Thème** : script anti-flash dans `layout.tsx`, `useTheme` + `ThemeToggle` avec `aria-label`, persistance `localStorage`.
- **Typographie** : Chillax (titres) + Gotham (corps) chargées via `@font-face`, `.font-display` disponible.

### Flows produit utilisables
- **Wizard** (`Wizard.tsx`) : validation par étape, destination avec sélection obligatoire, overlay IA 4 étapes, messages d’erreur sauvegarde.
- **Liste voyages** (`TripsListView.tsx`) : empty state, confirmation suppression, navigation trip.
- **Trip detail** (`TripDetailView.tsx`) : onglets jour/vol/hôtel/carte, replan, budget reshuffle, undo delete activités, recap linké.
- **Mode sélection** (`ModeSelectionView.tsx`) : cartes claires, gating abonnement mode manuel.
- **Pricing** (`PricingView.tsx`) : gate auth, toggle annuel, états loading checkout.
- **Composants état** : `EmptyState.tsx`, `ErrorState.tsx` réutilisables avec copy FR.

### Accessibilité isolée (bons exemples)
- `CityAutocomplete.tsx` : pattern combobox, `aria-label` sur check sélection.
- `ReplanModal.tsx`, `BudgetReshuffleModal.tsx` : `role="dialog"`, `aria-modal`, focus visible.
- `FlightSearchModal.tsx` : `aria-labelledby`, bouton fermer `aria-label`.

---

## P0 — Bloquants confiance produit

| ID | Problème | Fichier(s) | Impact |
|----|----------|------------|--------|
| **P0-1** | Boutons sans `onClick` : **Dupliquer**, **Archiver** | `TripDetailView.tsx` L439–456 | Clic frustrant sur action secondaire visible |
| **P0-2** | **Exporter le PDF** + **Finaliser les réservations** morts | `ItineraryView.tsx` L96–97 | Fausse promesse sur page accessible via AppShell |
| **P0-3** | Page **`/itineraire` entièrement mock** (« Week-end à Rome ») | `ItineraryView.tsx`, `app/itineraire/page.tsx` | Piège UX : utilisateur croit voir son voyage |
| **P0-4** | **OAuth GitHub/Google** décoratifs | `RegisterView.tsx` L182–191 | Clic sans redirection = perte confiance inscription |
| **P0-5** | **Upload** sans handler | `ManualCanvasView.tsx` L99–101 | Bouton icône sans action ni `aria-label` |
| **P0-6** | **Échec IA wizard silencieux** (`catch → aiDays = []`) | `Wizard.tsx` L384–386 | Voyage créé vide sans explication |
| **P0-7** | Promesse **« Exports PDF »** alors que backend stub | `PricingView.tsx` L47 | Mensonge commercial tarifs |

---

## P1 — Incohérences design & thème

| ID | Problème | Fichier(s) | Fix concret |
|----|----------|------------|-------------|
| **P1-1** | **Emerald** pour sélection/succès au lieu de cyan brand | `CityAutocomplete.tsx` L258, `Wizard.tsx`, 16+ fichiers | Remplacer `ring-emerald-500` par `ring-brand`, success via tokens sémantiques |
| **P1-2** | Modales vol/hôtel **dark-only** (`text-slate-100`, `placeholder:text-slate-500`) | `FlightSearchModal.tsx`, `HotelSearchModal.tsx`, `Searchbar.tsx`, `TripConfigurationForm.tsx` | Migrer vers `text-foreground`, `placeholder:text-light-muted`, fond `var(--card)` |
| **P1-3** | **Jargon développeur visible** (« Placeholder », « À connecter à l'API ») | `TripDetailView.tsx` L773–805 | Masquer section ou copy utilisateur (« Bientôt disponible ») |
| **P1-4** | Liens réseaux **`href="#"`** | `SiteFooter.tsx` L41–42 | Retirer ou lier URLs réelles ; `aria-disabled` si absent |
| **P1-5** | Couleurs **hardcodées inline** (hors tokens) | `RecapVoyageView.tsx` L258, 571, 625 | Remplacer par `var(--success-fg)` / classes sémantiques |
| **P1-6** | **« Logout »** en anglais dans shell FR | `AppShell.tsx` L122 | « Déconnexion » |
| **P1-7** | `setTimeout(800)` analyse mode manuel | `ManualCanvasView.tsx` L61–64 | Parsing synchrone instantané ou spinner honnête sans faux délai |

---

## P2 — Polish, a11y, anti-slop

| ID | Problème | Fichier(s) |
|----|----------|------------|
| **P2-1** | Scrollbars **masquées globalement** (`*::-webkit-scrollbar { display: none }`) | `globals.css` L442–466 |
| **P2-2** | Pas de **`prefers-reduced-motion`** sur lift 3D boutons | `Button.tsx` L113–118 |
| **P2-3** | Landing **anti-slop** : hero centré, 3 cartes IA template, témoignage « Marc D. » générique | `app/page.tsx` |
| **P2-4** | Nav landing : lien « Intelligence IA » → `#pricing` (id section pricing, label confus) | `app/page.tsx` L57 |
| **P2-5** | `MobileBottomNav` sans **`aria-current="page"`** | `MobileBottomNav.tsx` |
| **P2-6** | Trop de tailles typo (`text-xs` à `text-6xl` sans hiérarchie stricte) | 40+ fichiers features/components |
| **P2-7** | `uppercase tracking-widest` surutilisé (labels criards) | Wizard, TripDetail, Profile |
| **P2-8** | PRODUCT.md mentionne focus **emerald** ; DESIGN.md dit **cyan** — doc incohérente | `PRODUCT.md` L68 |

---

## Fichiers les plus problématiques

| Fichier | Problèmes principaux | Priorité |
|---------|---------------------|----------|
| `src/components/app/ItineraryView.tsx` | Mock Rome, boutons PDF morts | P0 |
| `src/features/trips/TripDetailView.tsx` | Dupliquer/Archiver morts, jargon dev sidebar | P0/P1 |
| `src/components/planner/Wizard.tsx` | Emerald success, IA silencieuse, god component ~1070L | P0/P1 |
| `src/features/auth/RegisterView.tsx` | OAuth mort, emerald success | P0 |
| `src/features/modes/ManualCanvasView.tsx` | Upload mort, fake delay, emerald callout | P0/P1 |
| `src/components/FlightSearchModal/FlightSearchModal.tsx` | Light mode cassé, slate hardcodé | P1 |
| `src/components/HotelSearchModal/HotelSearchModal.tsx` | Idem vol | P1 |
| `src/components/CityAutocomplete/CityAutocomplete.tsx` | Ring emerald vs brand cyan | P1 |
| `src/features/pricing/PricingView.tsx` | Promesse PDF | P0 |
| `src/components/layout/SiteFooter.tsx` | Liens `#` morts | P1 |
| `app/page.tsx` | Anti-slop landing, nav labels | P2 |
| `app/globals.css` | Scrollbars cachées | P2 |
| `src/features/recap/RecapVoyageView.tsx` | Couleurs inline RGB | P1 |

---

## Top 10 corrections prioritaires

1. **Brancher ou retirer** Dupliquer, Archiver, PDF, OAuth, upload — aucun CTA visible ne doit être décoratif.
2. **Supprimer ou rediriger `/itineraire`** vers le dernier voyage réel ou `/voyages` avec empty state explicite.
3. **Surfacer l’échec IA wizard** : toast/overlay « L’assistant n’a pas pu générer d’activités — vous pouvez les ajouter manuellement » au lieu de `catch` silencieux.
4. **Retirer « Exports PDF »** du pricing tant que `ExportServiceStub` ; ou badge « Bientôt ».
5. **Migrer modales vol/hôtel** vers tokens thème (`--foreground`, `--card`) pour light mode lisible.
6. **Remplacer emerald sélection** par `ring-brand` / `border-brand` dans `CityAutocomplete` et badges wizard review.
7. **Remplacer copy dev** (« Placeholder », « À connecter à l'API ») par messages utilisateur ou masquer l’onglet Notes.
8. **Corriger liens sociaux** : retirer ou URL réelles ; ne pas laisser `href="#"`.
9. **Ajouter `prefers-reduced-motion`** sur animations 3D + framer-motion hero ; rétablir scrollbars ou indicateurs scroll.
10. **Landing anti-slop** : réduire hero centré, remplacer témoignage générique par preuve produit (capture app réelle), aligner nav labels (`#pricing` → « Fonctionnalités IA »).

---

## Détail par pilier

### 1. Copywriting — 7,0/10

**Points forts**
- Ton chaleureux FR : « Quelque chose a changé ? », « Laissez-vous porter par notre assistant », erreurs actionnables dans auth.
- CTAs orientés action : « Créer mon itinéraire », « Démarrer mon premier voyage », « Recevoir le lien ».
- Placeholders contextuels (brief Hurghada, villes FR).

**Points faibles**
- `TripDetailView.tsx` L805 : `d: 'Placeholder'` visible utilisateur.
- `ItineraryView.tsx` L21 : contenu fictif Rome hardcodé.
- `app/page.tsx` L202–203 : témoignage « Marc D. — Voyageur fréquent » sans preuve.
- `AppShell.tsx` L122 : « Logout » vs interface FR.
- Tags landing « FONCTION IA », « ANALYSE DE DONNÉES » : ton marketing générique.

---

### 2. User flows — 6,0/10

| Flow | Verdict | Notes |
|------|---------|-------|
| Landing → Planifier | ✅ | CTAs fonctionnels vers `/planifier` |
| Wizard création | ⚠️ | Validation solide ; échec IA silencieux |
| Mode sélection → wizard/manuel | ✅ | Gating abonnement clair |
| Mode manuel → wizard seed | ⚠️ | Fake delay 800ms ; upload mort |
| Liste voyages → détail | ✅ | Delete confirm, navigation OK |
| Trip detail (édition) | ⚠️ | Replan/budget OK ; duplicate/archive morts |
| `/itineraire` | ❌ | Mock statique Rome |
| Auth email | ✅ | Loading states, erreurs |
| Auth OAuth | ❌ | Boutons morts |
| Pricing → Stripe | ✅ | Gate auth, loading |
| Recap + partage | ✅ | Copy partage FR |
| Thème dark/light | ⚠️ | Toggle OK ; modales cassées en light |

---

### 3. Boutons morts / interactions — 4,0/10

**Inventaire confirmé (sans handler ou `href="#"`)**

| Élément | Fichier | Ligne |
|---------|---------|-------|
| Exporter le PDF | `ItineraryView.tsx` | 96 |
| Finaliser les réservations | `ItineraryView.tsx` | 97 |
| Dupliquer | `TripDetailView.tsx` | 439–444 |
| Archiver | `TripDetailView.tsx` | 451–456 |
| GitHub / Google OAuth | `RegisterView.tsx` | 183–190 |
| Upload (icône) | `ManualCanvasView.tsx` | 99–101 |
| Instagram / Twitter | `SiteFooter.tsx` | 41–42 |
| Ressources sidebar (liens décoratifs) | `TripDetailView.tsx` | 803–816 |

**Interactions fonctionnelles notables** : replan, budget reshuffle, suppression voyage avec undo activités, checkout Stripe, wizard navigation, theme toggle.

---

### 4. Dark / Light — 6,5/10

**Points forts**
- `:root` dark + `[data-theme="light"]` avec 70+ overrides pour `text-white`, `bg-white/5`, slate, cyan.
- `.triply-card`, `.input-assistant`, `.btn-primary` adaptés aux deux thèmes.
- Logo adaptatif `.triply-logo-dark` / `.triply-logo-light`.
- `ThemeToggle` utilise `#0096C7` en light (cohérent brand).

**Points faibles**
- Modales vol/hôtel : `text-slate-100`, `border-white/10`, `focus-visible:ring-offset-slate-950` — non remappés en light.
- `TripConfigurationForm.tsx` : inputs `text-slate-100` legacy Vite.
- `RecapVoyageView.tsx` : styles inline RGB non thémés.
- `RegisterView.tsx` L75 : panneau gauche `bg-[#0f172a]` fixe (OK décoratif mais non tokenisé).

---

### 5. Accessibilité — 6,0/10

**Conforme / partiel**
- `lang="fr"` sur `<html>` (`layout.tsx`).
- Focus visible brand sur ThemeToggle, plusieurs modales.
- 10 composants avec `role="dialog"` + `aria-modal`.
- `CityAutocomplete` : combobox pattern, label sélection.
- `viewport` : `maximumScale: 5` (zoom autorisé).

**Manques WCAG AA**
- Scrollbars masquées globalement — repère visuel scroll perdu (`globals.css` L442–466).
- Pas de `@media (prefers-reduced-motion)` sur boutons 3D (`Button.tsx`).
- Upload bouton icône seul sans `aria-label` (`ManualCanvasView.tsx`).
- `MobileBottomNav` : pas `aria-current`, labels en uppercase difficiles à scanner.
- Incohérence doc : PRODUCT.md « emerald ring » vs DESIGN.md « brand cyan ring ».
- Onglets trip detail : `button` sans `role="tablist"` / `aria-selected`.

---

### 6. Anti-slop — 6,0/10

**Distinctif (au-dessus du template)**
- Carte Mapbox rotative hero (`page.tsx`) avec fallback gradient brand.
- Boutons skeuomorphiques 3D — identité forte, non flat shadcn.
- Palette cyan `#0096C7` documentée et appliquée sur CTAs.
- `rounded-[40px]` brief mode libre — signature designer respectée.
- `triply-card` + micro-motion framer sur mode sélection.

**Signaux slop / générique**
- Hero landing centré + sous-titre + 1 CTA (pattern SaaS template).
- Grille 3 cartes « Intelligence IA » avec tags uppercase.
- Témoignage flottant sans photo ni lien vérifiable.
- Emerald massif pour succès/sélection (ressemble à l’ancienne charte Wanderlog, pas cyan Triply).
- Section CTA finale « Prêt à explorer ? » — copy interchangeable.
- Nav `#pricing` libellée « Intelligence IA » alors que section tarifs absente de la landing.

---

## Registry Safety

`components.json` absent — **audit registry shadcn ignoré**.

---

## Fichiers audités

### `frontend/app/`
`layout.tsx`, `page.tsx`, `globals.css`, `planifier/*`, `voyages/*`, `connexion`, `inscription`, `tarifs`, `profil`, `itineraire`, `recap-voyage`, `a-propos`, `legal/*`, `admin`, `share/*`, `not-found.tsx`, `global-error.tsx`

### `frontend/src/features/`
`ModeSelectionView`, `ManualCanvasView`, `TripDetailView`, `DayTimeline`, `PricingView`, `ProfileView`, `RegisterView`, `ForgotPasswordView`, `ResetPasswordView`, `OnboardingView`, `AboutView`, `RecapVoyageView`, `NotFoundView`, `LegalViews`

### `frontend/src/components/` (échantillon représentatif)
`Button`, `ThemeToggle`, `AppShell`, `SiteFooter`, `MobileBottomNav`, `Wizard`, `CityAutocomplete`, `EmptyState`, `ErrorState`, `ItineraryView`, `TripsListView`, `FlightSearchModal`, `HotelSearchModal`, `ReplanModal`, `BudgetReshuffleModal`, `Assistant`, `AiProgressOverlay`

### Références design
`DESIGN.md`, `PRODUCT.md`, `.planning/AUDIT-REPORT-2026-06-15.md`

---

## Recommandation

**Phase 1 (3–5 jours)** : éliminer tous les P0 UX (boutons morts, mock `/itineraire`, IA silencieuse, promesse PDF).  
**Phase 2 (2–3 jours)** : unifier cyan vs emerald, modales light-ready.  
**Phase 3 (2 jours)** : a11y scrollbars/reduced-motion, polish landing anti-slop.

Objectif cible post-corrections : **≥ 7,5/10** sur confiance produit et cohérence thème.
