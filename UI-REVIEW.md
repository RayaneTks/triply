# Triply — Audit UI visuel de la landing (`frontend/app/page.tsx`)

**Date :** 17 juin 2026
**Branche :** `rework/master-plan`
**Cible :** http://localhost:5173 (conteneur `tri-app`, build `.next` purgé + redémarrage avant capture)
**Méthode :** audit visuel only (aucune modification du code source). Captures Playwright (Chromium), pleine page, desktop 1440px + mobile 390px, thèmes sombre & clair.

---

## Préparation du rendu (anti-cache Windows)

- `docker compose -f compose.dev.yaml exec tri-app sh -lc "rm -rf .next"` → cache purgé (workdir conteneur : `/app/frontend`).
- `docker compose -f compose.dev.yaml restart tri-app` → conteneur redémarré.
- Poll http://localhost:5173 → **200** après recompilation (~15 s).
- **Le NOUVEAU contenu est bien servi** (vérifié sur le HTML réel + captures). Aucun reliquat de l'ancienne landing.

---

## Screenshots produits (chemins absolus)

| Vue | Thème | Chemin |
|---|---|---|
| Desktop ~1440px, pleine page | Sombre (défaut) | `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\landing-20260617-211232\desktop-default.png` |
| Desktop ~1440px, pleine page | Clair (ThemeToggle) | `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\landing-20260617-211232\desktop-toggled.png` |
| Mobile ~390px, pleine page | Sombre (défaut) | `C:\Users\rayan\Desktop\triply\.planning\ui-reviews\landing-20260617-211232\mobile-default.png` |

---

## Checklist — vérifiée dans le rendu réel

| Point | Statut | Constat |
|---|---|---|
| Hero = « Organisez votre voyage, jour par jour. » | ✅ | Exact, titre `font-title` 4xl→6xl, hiérarchie nette. |
| Plus aucun « Plan / React / Live » | ✅ | Badge « Plan · React · Live » absent du HTML servi. |
| Plus de badge « Plan · React · Live » | ✅ | Absent. |
| Plus de « Marc D. » | ✅ | Absent du HTML servi. |
| Nav ≈ « Comment ça marche / Ce que vous pouvez faire / Aperçu » | ✅ | Exact (visible desktop, masquée < md, normal). |
| Sections : hero, Comment ça marche (3 étapes), Ce que Triply fait pour vous (~6 aides), Aperçu, CTA final, footer | ✅ | Les 6 sections présentes et ordonnées ; 3 étapes + 6 aides bien rendues. |
| Charte cyan #0096C7 cohérente, rendu premium | ✅ | Cyan `--primary` sur numéros d'étapes, icônes, liens, CTA, toggle actif. Rendu soigné. |
| Responsive mobile : pas d'overflow horizontal | ✅ | `scrollWidth == clientWidth == 390` (aucun débordement). Sections empilées, texte non tronqué. |
| **CTA « Créer un voyage » → /planifier** | ❌ **ÉCHEC** | Le clic **ne navigue pas**. Voir anomalie critique ci-dessous. |
| ThemeToggle : pas de flash/mismatch visible | ✅ (sur le toggle) | Défaut sombre, bascule clair OK ; script no-flash + `suppressHydrationWarning` sur `<html>` → pas de flash de thème. **Mais** mismatch d'hydratation global ailleurs (voir ci-dessous). |

---

## 🔴 Anomalie critique — le CTA principal est mort

**Le bouton « Créer un voyage » (header, hero ET CTA final) ne déclenche aucune navigation vers `/planifier`.**

Preuves (Playwright, build propre) :
- Navigation directe vers `/planifier` → **OK** (h1 « Comment souhaitez-vous planifier ? »). La route existe.
- Clic réel sur le bouton → URL reste `http://localhost:5173/`, **aucun `history.pushState`/`replaceState`** émis.
- Le `onClick` React **est bien attaché** (`hasReactOnClick: true`) et le clic natif est reçu (`clicks: 1`).
- Appel **direct** du handler `onClick()` → **aucune navigation, aucune exception**. `router.push('/planifier')` est donc un **no-op silencieux**.
- Baseline d'interactivité OK : le **ThemeToggle fonctionne** (sombre → clair), donc React est bien hydraté/interactif — le problème est spécifique à la navigation router.

**Cause racine : erreur d'hydratation dans `ToastProvider` / `Toaster` (`app/layout.tsx`).**
Le diff d'hydratation pointe précisément le `Toaster` :

```
<Toaster toasts={[...]} onDismiss={...}>
+  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10050] ..."   ← client
-  <script id="_R_">                                                            ← serveur
```

Le serveur rend un marqueur `<script id="_R_">` là où le client rend le conteneur de toasts → React jette l'arbre et le régénère côté client (« this tree will be regenerated on the client »). Cette défaillance d'hydratation au niveau du layout corrompt le contexte de l'App Router → `router.push` devient inopérant sur la landing.

Indice visuel : le badge dev rouge **« 1 Issue »** en bas-gauche des captures = cet échec d'hydratation (overlay Next dev).

**Correctif recommandé (hors périmètre audit, à faire par l'équipe) :** corriger le rendu SSR du `Toaster` (rendu identique serveur/client : monter le portail derrière un flag `mounted`, ou `suppressHydrationWarning`, ou ne rendre le conteneur qu'après montage). Une fois l'hydratation propre, revérifier que le CTA navigue.

> Note : audit en mode **dev**. À confirmer sur un build prod (`npm run build`), mais le mismatch SSR du Toaster existerait aussi en prod (sans l'overlay).

---

## Scores par pilier (1–4)

| Pilier | Score | Constat clé |
|---|---|---|
| 1. Copywriting | 4/4 | FR clair, orienté bénéfice, CTA explicites, zéro label générique. |
| 2. Visuels | 4/4 | Hero globe + dégradés, hiérarchie forte, premium. (Badge « 1 Issue » = overlay dev, pas le design.) |
| 3. Couleur | 4/4 | Cyan #0096C7 cohérent, 60/30/10 respecté, accent réservé aux éléments clés. |
| 4. Typographie | 4/4 | `font-title` titres, échelle cohérente, lisibilité bonne en clair & sombre. |
| 5. Espacement | 4/4 | Rythme régulier (`py-20`, `max-w-7xl`, `gap-5`), pas de valeurs arbitraires douteuses. |
| 6. Experience Design | **1/4** | **CTA principal mort** (navigation no-op) + erreur d'hydratation globale. Action de conversion n°1 cassée. |

**Total : 21/24** — mais **verdict bloquant** : un visuel excellent ne compense pas un CTA principal non fonctionnel.

---

## Verdict

**Visuellement : PRÊT (premium, conforme à la maquette et à la charte).**
**Fonctionnellement : À CORRIGER AVANT MERGE.** L'erreur d'hydratation (`Toaster`) casse la navigation du CTA « Créer un voyage » → blocant pour la conversion.

### Top 3 correctifs prioritaires
1. **Hydratation `Toaster` (layout)** — casse le router → CTA mort. Rendre le conteneur de toasts SSR-safe (mount-gate / portail après montage).
2. **Re-tester la navigation CTA** après correctif (header + hero + CTA final → `/planifier`).
3. **Nettoyage warnings** (mineur) : `<Image>` logo (width/height non appariés → ajouter `style={{height:'auto'}}`), et préchargements de polices non utilisés à temps.

---

## Anomalies mineures
- Aucun débordement horizontal, aucun texte tronqué, aucune section cassée (desktop & mobile).
- Contraste correct en sombre et clair sur les captures.
- Avertissements console non bloquants : ratio dimensions `<Image>` logo, polices préchargées « not used within a few seconds ».
