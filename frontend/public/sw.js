/*
 * Triply — Service Worker custom (sans dépendance, compatible Next 16 standalone + Turbopack).
 *
 * Pourquoi un SW manuel plutôt que next-pwa / @ducanh2912/next-pwa ?
 *  - Next 16 compile `next build` avec Turbopack par défaut ; next-pwa repose sur un plugin
 *    webpack (workbox-webpack-plugin) qui ne s'exécute PAS sous Turbopack → le SW serait
 *    silencieusement absent du build prod.
 *  - `output: "standalone"` copie le dossier `public/` verbatim dans l'image runtime, donc ce
 *    fichier est servi tel quel à `/sw.js` (scope racine) sans config build supplémentaire.
 *  - Zéro dépendance npm → pas de problème de volume node_modules ni de churn de version.
 *
 * Bump CACHE_VERSION pour invalider tous les caches lors d'un déploiement cassant.
 */

const CACHE_VERSION = 'v2';
const CACHE = {
  shell: `triply-shell-${CACHE_VERSION}`,
  pages: `triply-pages-${CACHE_VERSION}`,
  static: `triply-static-${CACHE_VERSION}`,
  api: `triply-api-${CACHE_VERSION}`,
  mapbox: `triply-mapbox-${CACHE_VERSION}`,
};

const OFFLINE_URL = '/offline';

// App shell minimal précaché à l'installation (offline-first).
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

// Bornes LRU (nombre max d'entrées) par cache runtime.
const MAX_ENTRIES = {
  pages: 40,
  static: 80,
  api: 60,
  mapbox: 250, // tuiles de la ville active — borné pour éviter la croissance illimitée
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // FIFO : supprime les plus anciennes entrées en tête.
  for (let i = 0; i < keys.length - maxEntries; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function putInCache(cacheName, request, response, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    if (maxEntries) {
      // Pas d'await bloquant : on laisse le trim s'exécuter en tâche de fond.
      trimCache(cacheName, maxEntries);
    }
  } catch {
    /* quota dépassé ou réponse non cacheable : on ignore silencieusement */
  }
}

function isHtmlRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|otf|ttf|png|jpe?g|svg|gif|webp|avif|ico)$/i.test(url.pathname)
  );
}

// Routes Next.js dynamiques (optimiseur d'images, flight data…) : laisser le navigateur gérer.
function isNextRuntime(url) {
  return (
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  );
}

// Voyage actif + day-of view : les GET de l'API voyages doivent rester lisibles hors-ligne.
function isCacheableApi(url) {
  return /^\/api\/v1\/(voyages|trips|journees|etapes|recap)/.test(url.pathname);
}

function isMapbox(url) {
  return /(?:^|\.)mapbox\.com$/.test(url.hostname);
}

// ---------------------------------------------------------------------------
// Stratégies
// ---------------------------------------------------------------------------

// Network-first : on tente le réseau, on met en cache la réussite, on retombe sur le cache.
async function networkFirst(request, cacheName, maxEntries, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      putInCache(cacheName, request, response.clone(), maxEntries);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}

// Cache-first : sert le cache, sinon réseau puis met en cache (tuiles Mapbox, assets statiques).
async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    putInCache(cacheName, request, response.clone(), maxEntries);
  }
  return response;
}

// Stale-while-revalidate : sert le cache immédiatement, rafraîchit en arrière-plan.
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        putInCache(cacheName, request, response.clone(), maxEntries);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.shell);
      await cache.addAll(PRECACHE_URLS).catch(() => {
        // Si une URL échoue (build non encore prêt), on n'empêche pas l'install.
      });
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const valid = new Set(Object.values(CACHE));
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('triply-') && !valid.has(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Fetch routing
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ne gère que les GET ; les mutations (POST/PUT/PATCH/DELETE) passent au réseau
  // et sont mises en file côté app (sync-queue) si hors-ligne.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Tuiles / styles / sprites / glyphs Mapbox de la ville active : cache-first borné.
  if (isMapbox(url)) {
    // events.mapbox.com = télémétrie : on laisse filer sans cacher.
    if (url.hostname.startsWith('events.')) return;
    event.respondWith(cacheFirst(request, CACHE.mapbox, MAX_ENTRIES.mapbox));
    return;
  }

  // Tout le reste : on ne touche pas au cross-origin (CDN tiers, analytics, etc.).
  if (url.origin !== self.location.origin) return;

  // Runtime Next (images optimisées, RSC, HMR) : pas d'interception.
  if (isNextRuntime(url)) return;

  // API dynamique (auth, intégrations, recherche Amadeus…) : pas d'interception SW.
  if (url.pathname.startsWith('/api/') && !isCacheableApi(url)) return;

  // Navigations (pages voyage actif, day-of view…) : network-first → cache → page offline.
  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request, CACHE.pages, MAX_ENTRIES.pages, OFFLINE_URL));
    return;
  }

  // API GET voyages/itinéraire : network-first puis fallback cache (lecture hors-ligne).
  if (isCacheableApi(url)) {
    event.respondWith(networkFirst(request, CACHE.api, MAX_ENTRIES.api));
    return;
  }

  // Assets statiques Next + polices + icônes : stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE.static, MAX_ENTRIES.static));
    return;
  }

  // Défaut : réseau avec repli cache (toujours une Response valide pour respondWith).
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
      }
    })(),
  );
});

// ---------------------------------------------------------------------------
// Background Sync (optionnel) — rejoue la file d'edits offline au retour réseau.
// La file vit côté app (IndexedDB). Le SW se contente de réveiller les clients.
// ---------------------------------------------------------------------------

self.addEventListener('sync', (event) => {
  if (event.tag === 'triply-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'TRIPLY_REPLAY_SYNC' }));
      }),
    );
  }
});
