# PWA offline — Triply (P6)

Différenciateur mobile : les voyageurs perdent le réseau à l'étranger. Cette couche PWA
rend l'app installable et garde l'itinéraire consultable hors-ligne.

> Charte designer respectée : aucun fichier `globals.css`, `Button.tsx` ni `DESIGN.md` modifié.
> Tout l'UI réutilise `.triply-card`, `.btn-primary`, `var(--primary)` (cyan #0096C7). Aucun emerald.

## Fichiers créés / modifiés

| Fichier | Rôle |
|---|---|
| `app/manifest.ts` *(créé)* | Manifest PWA natif Next (nom, icônes, `theme_color` cyan, `display: standalone`, `orientation: portrait`). |
| `app/offline/page.tsx` *(créé)* | Page de repli servie par le SW quand une navigation échoue hors-ligne. |
| `app/layout.tsx` *(modifié)* | Monte `<PwaProvider/>`, ajoute `themeColor` cyan, `appleWebApp`, liens d'icônes. |
| `public/sw.js` *(créé)* | Service worker custom : stratégies de cache + background sync. |
| `public/icons/icon.svg` *(créé)* | Icône `any` (fond cyan arrondi + avion blanc du logo). |
| `public/icons/icon-maskable.svg` *(créé)* | Icône `maskable` (fond cyan plein-bord). |
| `src/components/pwa/PwaProvider.tsx` *(créé)* | Agrège registrar + bannière + invite, rejoue la file au retour online. |
| `src/components/pwa/ServiceWorkerRegistrar.tsx` *(créé)* | Enregistre `/sw.js`, gère les mises à jour, écoute les messages SW. |
| `src/components/pwa/OfflineBanner.tsx` *(créé)* | Bannière « Mode hors-ligne » + confirmation de reconnexion. |
| `src/components/pwa/InstallPrompt.tsx` *(créé)* | Invite d'installation (`beforeinstallprompt`), dismissable 14 j. |
| `src/components/pwa/useOnlineStatus.ts` *(créé)* | Hook état réseau. |
| `src/lib/pwa/sync-queue.ts` *(créé)* | File IndexedDB des mutations offline + rejeu. |

## Librairie SW choisie : **service worker manuel (zéro dépendance)**

`next-pwa` / `@ducanh2912/next-pwa` **écartés**, raisons :

1. **Turbopack** — Next 16 compile `next build` avec Turbopack par défaut. `next-pwa` repose sur
   un plugin **webpack** (`workbox-webpack-plugin`) qui ne s'exécute pas sous Turbopack →
   le SW serait **silencieusement absent** du bundle prod.
2. **`output: "standalone"`** — copie `public/` verbatim dans l'image runtime (cf. `docker/spa-prod/Dockerfile`
   ligne 60). Un `public/sw.js` statique est donc servi à `/sw.js` (scope `/`) sans config.
3. **Zéro dépendance** — pas de churn de version, pas de souci avec le volume `tri-spa-node_modules`,
   bundle inchangé.
4. **Contrôle total** des stratégies (network-first borné, cache-first borné LRU).

## Stratégies de cache (`public/sw.js`)

| Cible | Stratégie | Cache | Borne |
|---|---|---|---|
| App shell (`/offline`, manifest, icônes) | précache à l'`install` | `triply-shell-v1` | — |
| Navigations (voyage actif, day-of view…) | **network-first** → cache → page `/offline` | `triply-pages-v1` | 40 |
| API GET `/api/v1/(voyages\|trips\|journees\|etapes\|recap)` | **network-first** → cache | `triply-api-v1` | 60 |
| Assets statiques (`/_next/static`, polices, icônes, images) | **stale-while-revalidate** | `triply-static-v1` | 80 |
| Tuiles/styles/sprites Mapbox (`*.mapbox.com`) | **cache-first** | `triply-mapbox-v1` | 250 |
| `events.mapbox.com` (télémétrie) | ignoré | — | — |
| Cross-origin tiers | non interceptés | — | — |

- Mutations (POST/PUT/PATCH/DELETE) : **non interceptées** par le SW → mises en file côté app.
- Invalidation : bump `CACHE_VERSION` dans `sw.js` ; l'`activate` purge les anciens caches `triply-*`.

## Install prompt & bannière offline

- **Install** : capture `beforeinstallprompt`, carte cyan `.triply-card` + `.btn-primary`, masquée
  si déjà en mode standalone ; « Ignorer » mémorise 14 j (`localStorage` `triply-install-dismissed`).
- **Offline** : `OfflineBanner` écoute `online`/`offline`, barre cyan en haut, confirme la reconnexion 3 s.

## File de sync offline (`sync-queue.ts`)

Implémentée et auto-cohérente, mais **non câblée dans les flux d'édition** (domaine d'un autre agent).
Pour l'activer côté édition (hors périmètre de cet agent) :

```ts
import { enqueueMutation } from '@/src/lib/pwa/sync-queue';
// dans un handler d'edit, si le fetch échoue pour cause réseau :
await enqueueMutation({ url, method: 'PATCH', headers, body: JSON.stringify(payload) });
```

Rejeu automatique : event `online` (PwaProvider) + Background Sync (`triply-sync`) qui réveille
les clients via le message `TRIPLY_REPLAY_SYNC`. Items 5xx/429/réseau conservés, 4xx définitifs purgés.

## Tester l'offline

> Le SW ne s'enregistre **pas en `next dev`** de façon fiable ; tester sur un **build prod**.

1. Build + start local :
   ```bash
   cd frontend
   npm ci
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx npm run build
   npm run start      # http://localhost:3000
   ```
2. Chrome DevTools → **Application** :
   - **Manifest** : nom, `theme_color` #0096C7, `display: standalone`, icônes présentes.
   - **Service Workers** : `/sw.js` `activated`.
   - **Cache Storage** : caches `triply-*` se remplissent en naviguant.
3. Ouvrir un voyage + la day-of view, charger la carte (tuiles Mapbox).
4. DevTools → **Network → Offline** (ou couper le Wi-Fi). Recharger :
   - bannière cyan « Mode hors-ligne »,
   - voyage déjà visité + carte servis depuis le cache,
   - page jamais visitée → `/offline`.
5. Repasser online → bannière de reconnexion, rejeu de la file.
6. Installabilité : barre d'install Chrome / « Ajouter à l'écran d'accueil » mobile.

## Implications build prod (`docker/spa-prod/Dockerfile`)

- **Aucune modification du Dockerfile requise** : `public/` (donc `sw.js` + `icons/`) est déjà copié
  ligne 60. `app/manifest.ts` est rendu par `server.js` standalone.
- Pas de nouvelle dépendance npm → `npm ci` (stage deps) inchangé.
- `theme_color`/icônes sont statiques → indépendants des `ARG NEXT_PUBLIC_*` build-time.
- Si un jour Turbopack venait à poser souci, **ne pas** migrer vers next-pwa (cf. supra) : le SW manuel
  est volontairement indépendant du compilateur.

## Limitation connue / suivi

- **Icônes en SVG** (`sizes: "any"`) : brand-exactes (avion du logo, cyan), acceptées par Chrome/Android.
  Pour une compatibilité maximale (anciens iOS, splash screens), rasteriser en PNG 192/512 + maskable
  depuis `public/icons/icon-maskable.svg` et les ajouter au manifest. Non fait ici faute d'outillage
  raster dans le worktree (node_modules non monté).
- **Vérif lint/tsc/build non exécutée localement** : `node_modules` absent du worktree (Docker monte le
  tree principal). Code écrit auto-cohérent ; lancer la vérif via la procédure « Tester l'offline » ci-dessus.
