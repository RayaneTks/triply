# Vérification QA — Fix Toaster SSR-safe (commit 2b2cde3)

**Date:** 2026-06-17
**Branche:** rework/master-plan (HEAD = 2b2cde3)
**Préparation:** `rm -rf .next` + `restart tri-app` ; dev server 200 sur http://localhost:5173
**Outil:** Playwright (Chromium headless, viewport 1440×900), clics réels + CDP console.

---

## VERDICT : CTA RÉPARÉ — OUI ✅

Les 3 CTA « Créer un voyage » (header, hero, CTA final) naviguent vers `/planifier`.
Aucune erreur d'hydratation. Aucune erreur console/page. Pas d'overlay d'erreur Next.

| Vérification | Résultat |
|---|---|
| Badge/overlay d'erreur d'hydratation visible | NON (page propre) |
| CTA header « Créer un voyage » → /planifier | ✅ OUI |
| CTA hero « Créer un voyage » → /planifier | ✅ OUI |
| CTA final « Créer un voyage » → /planifier | ✅ OUI |
| Erreurs d'hydratation console (« did not match »/« hydration ») | NON (0) |
| Erreurs console / pageerror | NON (0) |

> Note label : le CTA du HERO est libellé « Créer un voyage » (et non « Planifier mon voyage »). Tous les CTA appellent `enterApp → router.push('/planifier')`.

---

## Détails

### 1. Badge « 1 Issue » / overlay d'hydratation
- Aucun overlay d'erreur rouge, aucun dialog d'erreur (`errorDialog: null`) sur aucune capture.
- L'indicateur dev Next.js (bouton « Open issues overlay ») affiche un compteur (« 10 ») qui agrège des **warnings dev**, pas des erreurs :
  - `next/image` "/Logo-triply-dark.png" aspect-ratio (width/height) — warning
  - `next/image` LCP `loading="eager"` — warning
  - Mapbox WebGL « GPU stall due to ReadPixels » ×4 — warning
  - Mapbox « featureNamespace place-A … skip this selector » ×2 — warning
- **Aucun** de ces items n'est une erreur d'hydratation. L'ancien « Issue » bloquant (mismatch d'hydratation corrompant le contexte App Router) a disparu.

### 2-4. Navigation CTA
- Test définitif : chaque CTA dans un contexte navigateur neuf, clic réel, `waitForURL('**/planifier', 25s)` → **navigated: true** pour les 3, URL finale `http://localhost:5173/planifier`.
- `/planifier` rend correctement la page « Comment souhaitez-vous planifier ? » (AppShell + ToastProvider montés), sans overlay d'erreur.

### 5. Console (CDP)
- `console.error` : 0 ; `pageerror` : 0 ; messages contenant « hydrat »/« did not match »/« server rendered » : 0.

### 6. Bonus toast
- Non déclenché : les toasts de l'app nécessitent un flux authentifié ou un échec réseau (CityAutocomplete/TripDetail/Profile). Per consigne « sinon ignore ».
- Vérifié indirectement : le `Toaster` (gate `useSyncExternalStore` → portail vers `document.body` après hydratation) ne provoque aucune erreur d'hydratation sur `/` ni sur `/planifier`.

---

## Faux négatif observé (important)
Lors du 1er passage, le CTA header semblait ne PAS naviguer. Cause = **latence de compilation à la demande** de la route `/planifier` en dev (premier hit après purge `.next` > 15 s). Avec une attente de 25 s, le CTA header navigue correctement. Ce n'est PAS un bug applicatif.

## Captures (chemins absolus)
- `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\toast-cta-20260617-214403\home-clean.png`
- `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\toast-cta-20260617-214403\cta-header.png`
- `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\toast-cta-20260617-214403\cta-hero.png`
- `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\toast-cta-20260617-214403\cta-final.png`
- `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\toast-cta-20260617-214403\issues-overlay.png`
