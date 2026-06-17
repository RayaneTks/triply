# Plan d'élévation Anti-Slop — Triply

**Design Read:** Application produit voyage premium dark-first pour voyageurs 25–55, langage cyan Chillax/Gotham, barre Linear/Raycast côté outil (pas landing SaaS générique).

**Dials (design-taste-frontend, surface produit):** `DESIGN_VARIANCE: 5` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 5`

**Date:** 2026-06-15 (relance audit)  
**Références verrouillées:** `DESIGN.md`, `PRODUCT.md`, skills `design-taste-frontend`, `impeccable` (register `product.md`), `emil-design-eng`

---

## 1. Diagnostic — Slop Score actuel : **5.6 / 10**

*(10 = slop maximal. Objectif post-Passe 4 : ≤ 2.0)*

| Zone | Score slop | Verdict |
|------|------------|---------|
| Landing (`app/page.tsx`) | **7.5** | Template marketing IA, cartes égales, hero centré |
| Wizard (`Wizard.tsx`) | **6.0** | Emerald parasite, modale theme-break, labels eyebrows |
| Trip detail (`TripDetailView.tsx`) | **5.0** | Produit réel mais side-stripe, palette arc-en-ciel, god file |
| Itinéraire mock (`ItineraryView.tsx`) | **9.0** | Page mensongère entière |
| Pricing (`PricingView.tsx`) | **6.5** | SaaS pricing générique, boutons plats |
| Mode Libre (`ManualCanvasView.tsx`) | **5.5** | Bon moment `rounded-[40px]`, delay factice, emerald |
| Tokens (`globals.css`) | **5.0** | Scrollbars cachées, pas de `prefers-reduced-motion` |
| Motion / perf | **6.0** | Mapbox eager landing, `framer-motion` legacy, `z-[9999]` |

**Moyenne pondérée (surfaces auditées):** 5.6/10

---

### Tells concrets par fichier

#### `frontend/app/page.tsx` (250 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| Hero centré + map + triple calque gradient | 73–117 | Anti-default landing (design-taste §0.D) |
| Section `id="pricing"` intitulée « Intelligence artificielle » | 139–144 | Marketing IA lourd, jargon vitrine |
| 3 cartes IA identiques + tags `FONCTION IA`, `ANALYSE DE DONNÉES`, `BUDGET MALIN` | 23–45, 148–185 | Grille 3 colonnes égales (impeccable ban) |
| Étapes numérotées 1/2/3 dans cercles | 17–21, 126–135 | Step scaffolding décoratif |
| SVG icons hand-rolled (route, spark, wallet) | 152–175 | design-taste §3.C — pas de hand-roll SVG |
| `backdrop-blur-sm/md` sur cartes et header | 49, 128, 150, 191, 200 | Glassmorphism décoratif (impeccable ban) |
| Témoignage « Marc D. — Voyageur fréquent » + « révolution » | 200–203 | Fake social proof |
| `WorldMap` import statique (pas `dynamic`) | 7, 77–96 | LCP / bundle landing |
| Nav « Intelligence IA » → section pricing | 57 | Copy jargon |
| Lien « Explorer toutes les fonctionnalités » → `#destinations` | 146 | CTA sans intent clair |
| Footer CTA « Gratuit… — Aucune carte » | 229 | Em-dash (design-taste §9.G) |
| Liste « Pourquoi Triply » = 3 `<li>` cartes identiques | 208–212 | Card-grid répétitif |

#### `frontend/app/globals.css` (528 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| `* { scrollbar-width: none }` + `::-webkit-scrollbar { display: none }` | 442–466 | Affordance masquée (impeccable product) |
| Pas de `@media (prefers-reduced-motion)` sur `.btn-primary` lift | 365–406 | DESIGN.md promet reduced-motion, absent |
| Alias `--light-bg` / `--light-border` en dark-first | 33–35 | Nommage legacy confus (risque tokens mal appliqués) |
| Overrides `emerald-*` massifs | 287–327 | Encourage dérive emerald hors success |
| `transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s` sur `.triply-card` | 224 | OK partiel — pas de `all` |
| Points forts à préserver | 217–228, 365–423 | `triply-card`, `.btn-primary` 3D, tokens cyan |

#### `frontend/src/components/planner/Wizard.tsx` (~1073 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| `bg-emerald-*` sélection destination + récap succès | 778–801, 1050–1056 | Emerald ≠ cyan brand (DESIGN.md) |
| Modale auth `bg-white text-slate-900` figée | 597–608 | Light/dark theme cassé |
| `z-[9999]` overlay | 597 | Z-index arbitraire (impeccable) |
| `Étape {n}/{total}` + tous les labels `uppercase tracking-widest` | 662, 761, 860, 975+ | Eyebrow grammar (impeccable ban) |
| `import from "framer-motion"` (legacy) | 4 | design-taste préfère `motion/react` |
| Step transition `x: 20` slide (8 étapes/jour) | 681–686 | Motion décoratif fréquent (Emil: réduire) |
| God component monolithique | fichier entier | Polish inégal, dette |
| Boutons nav `Précédent` / `Continuer` = classes ad hoc, pas `<Button>` | 707–730 | Vocabulaire bouton mixte |
| `text-amber-700` hint validation | 702 | OK warning — vérifier contraste dark |

#### `frontend/src/features/trips/TripDetailView.tsx` (~931 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| `WorldMap` import eager | 27 | Bundle tab carte |
| KPI `text-emerald-600` budget restant | 466 | Emerald comme accent décoratif |
| Titre `Voyage — ${destination}` | 417 | Em-dash |
| Side-stripe `w-2 h-full bg-brand/10` sur cartes jour fallback | 585 | impeccable ban side-stripe |
| `DAY_PALETTE` arc-en-ciel 8 couleurs | 180–183 | Accent hors charte (cyan + micro-design) |
| `uppercase tracking-widest` sur filtres carte / villes | 520, 666, 720 | Eyebrows répétés |
| Skeleton `bg-slate-200` hardcodé | 369–376 | Pas tokens theme |
| Bouton « Dupliquer » / « Archiver » sans handler | 439–456 | Boutons morts (confiance) |
| God component | fichier entier | Split requis |
| Points forts | 481–503, 786–796 | Tabs produit, copilote sidebar |

#### `frontend/src/components/app/ItineraryView.tsx` (106 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| **Données entièrement fictives** Rome, Colisée, 14–17 Mai | 21–67 | Mensonge utilisateur |
| Boutons « Exporter le PDF » / « Finaliser les réservations » sans action | 96–97 | Boutons morts |
| `Jour {n} — Exploration` | 46 | Em-dash |
| Timeline `border-l` + dot brand | 44–45 | Pattern générique mais acceptable si données réelles |
| `bg-emerald-50 text-emerald-600` statut | 87 | Emerald décoratif |
| `text-5xl` titre mock | 21 | Display trop large pour surface produit (impeccable product) |

#### `frontend/src/features/pricing/PricingView.tsx` (172 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| Boutons `rounded-xl bg-brand` plats | 128–146 | Pas `<Button>` / `.btn-primary` (DESIGN.md) |
| Badge `-20%` en `emerald-600` | 93 | Accent hors palette |
| Pill « Le plus populaire » `uppercase tracking-wider` | 108 | Eyebrow pricing cliché |
| Grille 4 features icon + titre uppercase centrés | 153–167 | Pattern landing en surface produit |
| Toggle billing sans états focus documentés | 83–91 | États interaction incomplets |
| Points forts | 16–40 | Checkout wire réel, auth gate |

#### `frontend/src/features/modes/ManualCanvasView.tsx` (231 lignes)

| Tell | Ligne(s) | Règle violée |
|------|----------|--------------|
| `setTimeout(..., 800)` analyse factice | 59–64 | Fake delay (DESIGN.md anti-pattern) |
| Bouton Upload sans handler | 99–101 | Bouton mort |
| Bloc budget `bg-emerald-50` + copy `uppercase` | 219–221 | Emerald + eyebrow |
| CTA Envoyer = `bg-brand rounded-2xl` flat, pas 3D | 105 | Mix systèmes bouton |
| `hover:scale-[1.02] active:scale-95` | 105 | OK si isolé (DESIGN.md autorise hero CTAs) |
| Points forts à préserver | 96 | `rounded-[40px]` textarea = signature designer |

#### Fichiers liés (hors scope lecture mais tells connus)

| Fichier | Tell |
|---------|------|
| `CityAutocomplete.tsx` | `ring-emerald-500` quand `selected` — contredit DESIGN.md |
| `ReplanModal.tsx` | Steps `Étape 1/3 —`, emoji dans UI |
| `RegisterView.tsx` | OAuth GitHub/Google décoratif |
| `PRODUCT.md` L68 | « emerald ring » contredit DESIGN.md cyan |

---

## 2. North Star

Ouvrir Triply, c'est ouvrir un carnet de voyage numérique posé sur un bureau la nuit : fond anthracite `#1c1c1c`, typo Chillax calme, cyan `#0096C7` qui guide l'œil comme une lampe de poche sur la carte. Chaque clic répond tout de suite — bouton qui s'enfonce (3D), état qui change, jamais un spinner qui ment. Les écrans parlent comme un ami organisé (« Ajoutez votre première étape »), pas comme un pitch deck (« Intelligence artificielle », « révolution »). Rien n'est cliquable si ça ne fait rien. Rome n'apparaît que si c'est votre voyage. Le mode clair est aussi soigné que le sombre. La carte charge quand on en a besoin, pas sur la page d'accueil.

**Test slop final:** un utilisateur habitué à Linear/Notion s'assoit et fait confiance sans pause à chaque composant.

---

## 3. Règles de marque verrouillées

### Couleur

| Token | Valeur | Usage |
|-------|--------|-------|
| `--primary` | `#0096C7` | CTAs, sélection, focus, identité |
| `--secondary` | `#115C75` | Pressed, ombre 3D bouton |
| `--micro-design` | `#00A896` | Accents teal secondaires (tags landing OK avec parcimonie) |
| `--cyan-accent` | `#22d3ee` / `#0891b2` | Highlights ponctuels |
| `--success-*` | tokens sémantiques | Validé / succès uniquement |

**INTERDIT:** `emerald-*` comme ring de sélection, badge promo, décoration. Gradients purple/blue. Literals `#0096c7` hors `var(--primary)`.

### Typographie

- **Display:** Chillax (`--font-title`, `.font-display`) — titres, prix, hero
- **UI / body:** Gotham (`--font-text`) — formulaires, labels, données denses
- **Produit:** échelle fixe rem (pas `text-5xl` fluid sur dashboards)
- **INTERDIT:** `uppercase tracking-widest` en eyebrow sur chaque champ (≤ 1 eyebrow / 3 sections)

### Boutons — un seul système

1. **Primaire:** `<Button variant tone="tone1">` ou `.btn-primary` (3D — ne pas aplatir)
2. **Secondaire:** `<Button tone="tone2">` ou `.btn-secondary`
3. **Destructif:** `.bg-error` + texte blanc
4. **INTERDIT:** `rounded-xl bg-brand py-4` ad hoc (PricingView, Wizard nav, ManualCanvas)

### Rayons (designer)

| Surface | Classe |
|---------|--------|
| Inputs, chips | `rounded-md` / `rounded-lg` |
| Cartes standard | `triply-card` (`1rem`) |
| Moment hero / brief | `rounded-[32px]` à `rounded-[40px]` — **intentionnel**, ne pas uniformiser à la baisse |

### Motion (Emil)

| Contexte | Durée | Easing |
|----------|-------|--------|
| Press bouton | 100–160ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Modale / drawer | 200–300ms | ease-out enter |
| Wizard step (8×/session) | 150ms opacity max | pas slide x:20 |
| Map autoRotate | 0 si `prefers-reduced-motion` | — |

**INTERDIT:** `setTimeout` pour simuler chargement. `transition: all`. `ease-in` sur UI. `z-[9999]`. Animation sur actions clavier répétées.

### Copy

- Voix PRODUCT.md : chaleureux, direct, exploratoire — pas corporate, pas « IA » en hero
- **INTERDIT:** em-dash `—` / en-dash `–` en UI. « Révolution », « seamless », « FONCTION IA », faux témoignages, numéros d'étape décoratifs
- Erreurs : actionable, jamais code HTTP brut

### Composants produit (impeccable product)

- États complets : default, hover, focus-visible, active, disabled, loading, error
- Modales : `role="dialog"`, focus trap, tokens theme (`bg-card`, pas `bg-white` figé)
- Scrollbars : visibles ou custom discret — pas masquage global
- Pas de side-stripe `border-left` > 1px sur cartes
- Lucide : accepté (legacy projet) — ne pas mixer une 2e lib icônes

---

## 4. Passe 1 « Confiance » — 48 h

*Retirer tout ce qui ment à l'utilisateur.*

| # | Action | Fichier(s) | Critère done |
|---|--------|------------|--------------|
| 1.1 | Retirer ou brancher `/itineraire` : redirect trip réel ou empty state « Créez un voyage » | `ItineraryView.tsx`, route | Zéro Rome hardcodé |
| 1.2 | PDF / réservations → `disabled` + « Bientôt » ou wire export | `ItineraryView.tsx` | Pas de promesse fausse |
| 1.3 | OAuth décoratif : retirer ou implémenter | `RegisterView.tsx`, connexion | 0 bouton sans effet |
| 1.4 | Upload Mode Libre : retirer ou implémenter | `ManualCanvasView.tsx` L99 | Pas d'icône morte |
| 1.5 | Supprimer témoignage « Marc D. » | `page.tsx` L200–204 | Social proof réel ou rien |
| 1.6 | Remplacer `setTimeout(800)` par parsing synchrone | `ManualCanvasView.tsx` | Pas de delay artificiel |
| 1.7 | Lien « Explorer… » → `/planifier` ou supprimer | `page.tsx` L146 | Lien actionnable |
| 1.8 | Dupliquer / Archiver TripDetail : wire ou retirer | `TripDetailView.tsx` L439–456 | 0 bouton fantôme |
| 1.9 | Grep global boutons sans handler | repo | 0 fantômes |

**Verify:**
```bash
docker compose -f compose.dev.yaml exec tri-app sh -c "grep -r 'Week-end à Rome' frontend/ | wc -l"  # → 0
docker compose -f compose.dev.yaml exec tri-app npm run lint
```

---

## 5. Passe 2 « Cohérence » — 1 semaine

*Tokens cyan, light mode, un système boutons.*

| # | Action | Fichier(s) |
|---|--------|------------|
| 2.1 | Emerald → `--success-*` ou `--primary` selon sémantique | Wizard, TripDetail, ManualCanvas, Pricing, Itinerary, CityAutocomplete |
| 2.2 | `CityAutocomplete` selected : `ring-brand border-brand` | `CityAutocomplete.tsx` |
| 2.3 | Modale wizard auth : `bg-card text-foreground border-border` | `Wizard.tsx` L597–608 |
| 2.4 | PricingView boutons → `<Button>` ou `.btn-primary` | `PricingView.tsx` |
| 2.5 | Wizard nav + ManualCanvas CTA → même système bouton | Wizard, ManualCanvas |
| 2.6 | `PRODUCT.md` L68 → « brand cyan ring » | `PRODUCT.md` |
| 2.7 | Retirer scrollbar global hide ; style discret theme-aware | `globals.css` L442–466 |
| 2.8 | Grep `text-slate-`, `bg-white` hardcodés → tokens | Wizard modale, TripDetail skeleton |
| 2.9 | `motion.css` : `--ease-out`, `prefers-reduced-motion` sur `.btn-primary` | `globals.css` |
| 2.10 | Z-index scale sémantique : remplacer `z-[9999]` / `z-[100]` | Wizard, TripDetail modales |
| 2.11 | TripDetail side-stripe fallback → fond tint ou rien | `TripDetailView.tsx` L585 |
| 2.12 | `DAY_PALETTE` carte → dérivés cyan/secondary/micro-design | `TripDetailView.tsx` |

### Table Emil — cohérence

| Before | After | Why |
|--------|-------|-----|
| `ring-emerald-500` (autocomplete) | `ring-brand border-brand` | Un accent sur tout le produit |
| `bg-white text-slate-900` (modale wizard) | `bg-card text-foreground` | Light mode cohérent |
| `w-full py-4 rounded-xl bg-brand` (Pricing) | `<Button label={cta} tone="tone1" className="w-full" />` | Vocabulaire unique |
| `text-emerald-600` KPI budget | `text-success-fg` ou `text-brand` | Success ≠ promo |

---

## 6. Passe 3 « Craft » — 2 semaines

*Emil polish, a11y, perf, structure.*

| # | Action | Détail |
|---|--------|--------|
| 3.1 | Lazy Mapbox `dynamic(..., { ssr: false })` + skeleton | `page.tsx`, `TripDetailView.tsx` |
| 3.2 | Split god files | Wizard → `WizardShell`, `WizardSteps/*`, `WizardAuthModal` ; TripDetail → `TripHeader`, `TripTabs`, `TripMapPanel` |
| 3.3 | `:active scale(0.97)` + `transition-[transform,box-shadow]` sur tous les boutons | globals + composants |
| 3.4 | Modales : focus trap, Escape, `aria-labelledby` | Replan, Budget, wizard auth |
| 3.5 | `prefers-reduced-motion` : map rotate off, AnimatePresence → opacity 0ms | Map, Wizard, ManualCanvas |
| 3.6 | Skeletons theme-aware (`bg-surface`) pas `bg-slate-200` | TripDetail loading |
| 3.7 | Wizard step : retirer slide `x:20`, opacity 150ms | `Wizard.tsx` L681–686 |
| 3.8 | Remplacer SVG hand-rolled landing par lib icônes | `page.tsx` L152–175 |
| 3.9 | Tests Vitest funnel wizard (destination → dates → mock API) | `Wizard.test.tsx` |
| 3.10 | `framer-motion` → `motion/react` (migration progressive) | Wizard, TripDetail, ManualCanvas |

### Table Emil — motion

| Before | After | Why |
|--------|-------|-----|
| `setTimeout(800)` analyse | `setSummary(parseBrief(text))` immédiat | Honnêteté perçue |
| `transition-all` CTA Mode Libre | `transition-[transform,box-shadow] duration-150` | GPU + intention |
| `autoRotateSpeed={5}` always | `autoRotateSpeed={reducedMotion ? 0 : 5}` | OS preference |
| `initial={{ x: 20 }}` wizard steps | `initial={{ opacity: 0 }}` 150ms | Fréquence élevée = motion minimale |

---

## 7. Passe 4 « Voice » — copy avant/après

### Landing (`page.tsx`)

| Avant | Après |
|-------|-------|
| « Intelligence artificielle » (section + nav) | « Ce que Triply fait pour vous » / nav « Fonctionnalités » |
| Tag `FONCTION IA` | Supprimer ou « Itinéraire » |
| « Triply analyse vos préférences… » | « Vous indiquez destination, dates et budget. Triply structure le reste. » |
| « Une révolution… » — Marc D. | Supprimer |
| « Gratuit… — Aucune carte requise » | « Gratuit pour votre premier voyage. Aucune carte requise. » |
| « Construisez un voyage sur mesure avec Triply » | « Planifiez votre prochain voyage » (moins pitch) |

### Wizard

| Avant | Après |
|-------|-------|
| « Connectez-vous pour générer votre voyage » | « Enregistrez ce voyage sur votre compte » |
| « Tout est en ordre ! » (box emerald) | « Prêt à créer le voyage » (`--success-bg`) |
| Label `DESTINATION` uppercase | « Destination » sentence case |
| « Étape 3 / 8 » mobile | Barre dots seule (desktop déjà OK) |

### Pricing

| Avant | Après |
|-------|-------|
| « Un copilote pour chaque budget » | « Choisissez votre formule » |
| « Assistant Pro » | « Copilote avancé » (moins jargon SaaS) |

### Erreurs (pattern global)

| Avant | Après |
|-------|-------|
| `Erreur 422: validation failed` | « La date de fin doit être après la date de début. » |
| `Network request failed` | « Connexion interrompue. Vérifiez le réseau et réessayez. » |
| `Impossible de démarrer le paiement.` | « Le paiement n'a pas pu démarrer. Réessayez ou contactez le support. » |

### Produit / itinéraire

| Avant | Après |
|-------|-------|
| `Jour 2 — Exploration` (mock) | `Jour 2 · {titre réel du jour}` |
| « Mon avis : Réservation obligatoire… » (mock Bot) | Conseil contextuel sur vraie étape |

---

## 8. Checklist Pre-Flight (avant chaque merge UI)

Un seul échec = pas de merge.

### Confiance
- [ ] Chaque bouton/lien = action réelle ou `disabled` + label explicite
- [ ] Aucune donnée fictive (Rome, Marc D., stats rondes)
- [ ] Pas de `setTimeout` pour simuler latence

### Anti-tells (design-taste + impeccable)
- [ ] Zéro em-dash `—` dans copy visible
- [ ] Zéro `emerald-*` hors états success sémantiques
- [ ] Pas de 3 cartes égales consécutives sans asymétrie (landing)
- [ ] Eyebrows `uppercase tracking-widest` ≤ ceil(sections/3)
- [ ] Pas de « révolution », « seamless », « FONCTION IA »
- [ ] Pas d'OAuth / upload décoratif
- [ ] Pas de side-stripe accent sur cartes
- [ ] Pas de glassmorphism décoratif (`backdrop-blur` sur cartes data)
- [ ] Pas de SVG icons hand-rolled

### Marque Triply
- [ ] Accent = `var(--primary)` cyan
- [ ] Boutons = `<Button>` ou `.btn-primary`/`.btn-secondary`
- [ ] Modales = tokens theme
- [ ] Focus ring brand visible
- [ ] `rounded-[40px]` conservé sur brief Mode Libre

### Produit (impeccable product)
- [ ] États hover, focus-visible, active, disabled, loading
- [ ] Empty state utile si liste vide
- [ ] Contraste WCAG AA 4.5:1
- [ ] Scrollbars pas masquées sur zone modifiée

### Motion (emil)
- [ ] `prefers-reduced-motion` respecté
- [ ] Durées UI < 300ms
- [ ] Pas de `transition: all`
- [ ] Mapbox lazy si nouvel import carte
- [ ] Z-index depuis échelle sémantique

### Tests
- [ ] `docker compose -f compose.dev.yaml exec tri-app npm run lint`
- [ ] `docker compose -f compose.dev.yaml exec tri-app npm run test:run` (fichiers touchés)
- [ ] Vérification mentale light + dark sur le flux modifié

---

## 9. Commandes `/impeccable` par zone

Syntaxe : `/impeccable <commande> <cible>`. Lire `reference/<commande>.md` avant exécution. Register = **product** (pas brand) sauf landing.

### Landing — `frontend/app/page.tsx`

```
/impeccable audit frontend/app/page.tsx
/impeccable critique frontend/app/page.tsx
/impeccable distill frontend/app/page.tsx
/impeccable quieter frontend/app/page.tsx
/impeccable typeset frontend/app/page.tsx
/impeccable polish frontend/app/page.tsx
/impeccable optimize frontend/app/page.tsx
```

**Focus:** cartes 3 colonnes, témoignage fake, hero gradient stack, marketing IA, SVG hand-roll, lazy map.

### Wizard — `frontend/src/components/planner/Wizard.tsx`

```
/impeccable audit frontend/src/components/planner/Wizard.tsx
/impeccable critique frontend/src/components/planner/Wizard.tsx
/impeccable distill frontend/src/components/planner/Wizard.tsx
/impeccable polish frontend/src/components/planner/Wizard.tsx
/impeccable harden frontend/src/components/planner/Wizard.tsx
/impeccable clarify frontend/src/components/planner/Wizard.tsx
/impeccable animate frontend/src/components/planner/Wizard.tsx
```

**Focus:** modale theme, emerald, god component, eyebrows labels, step motion.

### Trip detail — `frontend/src/features/trips/TripDetailView.tsx`

```
/impeccable audit frontend/src/features/trips/TripDetailView.tsx
/impeccable critique frontend/src/features/trips/TripDetailView.tsx
/impeccable optimize frontend/src/features/trips/TripDetailView.tsx
/impeccable layout frontend/src/features/trips/TripDetailView.tsx
/impeccable polish frontend/src/features/trips/TripDetailView.tsx
/impeccable colorize frontend/src/features/trips/TripDetailView.tsx
```

**Focus:** lazy map, DAY_PALETTE, side-stripe, KPI tokens, boutons morts, split.

### Itinéraire — `frontend/src/components/app/ItineraryView.tsx`

```
/impeccable audit frontend/src/components/app/ItineraryView.tsx
/impeccable onboard frontend/src/components/app/ItineraryView.tsx
/impeccable distill frontend/src/components/app/ItineraryView.tsx
/impeccable harden frontend/src/components/app/ItineraryView.tsx
```

**Focus:** supprimer mock, empty state honnête, boutons morts.

### Pricing — `frontend/src/features/pricing/PricingView.tsx`

```
/impeccable audit frontend/src/features/pricing/PricingView.tsx
/impeccable critique frontend/src/features/pricing/PricingView.tsx
/impeccable polish frontend/src/features/pricing/PricingView.tsx
/impeccable colorize frontend/src/features/pricing/PricingView.tsx
/impeccable clarify frontend/src/features/pricing/PricingView.tsx
```

**Focus:** boutons 3D, emerald badge, grille 4 colonnes, copy SaaS.

### Mode Libre — `frontend/src/features/modes/ManualCanvasView.tsx`

```
/impeccable audit frontend/src/features/modes/ManualCanvasView.tsx
/impeccable distill frontend/src/features/modes/ManualCanvasView.tsx
/impeccable polish frontend/src/features/modes/ManualCanvasView.tsx
/impeccable animate frontend/src/features/modes/ManualCanvasView.tsx
```

**Focus:** fake delay, upload mort, emerald, préserver `rounded-[40px]`.

### Modales trips — `ReplanModal`, `BudgetReshuffleModal`

```
/impeccable audit frontend/src/components/trips/ReplanModal.tsx
/impeccable harden frontend/src/components/trips/ReplanModal.tsx
/impeccable clarify frontend/src/components/trips/ReplanModal.tsx
/impeccable polish frontend/src/components/trips/BudgetReshuffleModal.tsx
```

**Focus:** em-dash steps, emoji, focus trap, light mode.

### Tokens globaux — `frontend/app/globals.css`

```
/impeccable audit frontend/app/globals.css
/impeccable colorize frontend/app/globals.css
/impeccable harden frontend/app/globals.css
```

**Focus:** scrollbars, `prefers-reduced-motion`, séparation success vs brand.

### Session live (si dev server up)

```
/impeccable live
```

Cibler visuellement hero landing, wizard step destination, trip tabs, pricing cards.

---

## 10. Ordre d'exécution

```
Passe 1 Confiance (48h)
    ↓
Passe 2 Cohérence (semaine 1)
    ↓
Passe 4 Voice (copy en parallèle landing/wizard/pricing)
    ↓
Passe 3 Craft (semaines 2–3)
    ↓
/impeccable audits finaux zone par zone
    ↓
Checklist pre-flight sur chaque PR UI
```

### KPI Slop cible ≤ 2.0/10

| Critère | État actuel | Cible |
|---------|-------------|-------|
| ItineraryView mock | Rome hardcodé | Empty state ou trip réel |
| Emerald accent hors success | ~25 occurrences | 0 |
| Boutons morts | ≥6 connus | 0 |
| Em-dash UI | ≥5 | 0 |
| Map eager landing | Oui | `dynamic()` |
| Section « Intelligence artificielle » | Oui | Renommée / recentrée |
| Faux témoignage | Oui | Supprimé |
| `prefers-reduced-motion` | Absent | Présent sur boutons + map |
| God files >800 lignes | Wizard, TripDetail | Split <400 lignes/fichier |

---

## 11. Ce qu'on ne touche pas (décisions verrouillées)

- Cyan `#0096C7` — pas d'emerald comme identité
- Bouton 3D skeuomorphique — ne pas aplatir
- `rounded-[40px]` sur textarea Mode Libre — signature designer
- Dark-first default — light = toggle `[data-theme="light"]`
- Chillax + Gotham — pas Inter/system-ui swap
- Lucide — legacy accepté, pas de migration icônes dans cette passe

---

*Document vivant — recalculer le Slop Score après chaque passe. Dernière relance : audit fichiers page.tsx, Wizard, TripDetailView, ItineraryView, PricingView, ManualCanvasView, globals.css.*
