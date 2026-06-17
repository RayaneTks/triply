'use client';

import { useEffect } from 'react';
import { replayQueue } from '../../lib/pwa/sync-queue';

// Enregistre /sw.js, gère la prise de contrôle après mise à jour, et déclenche le rejeu
// de la file de sync quand le SW signale un retour réseau (background sync).
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      // Un nouveau SW a pris le contrôle : on recharge une seule fois pour servir la version à jour.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIPLY_REPLAY_SYNC') {
        void replayQueue();
      }
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Si une mise à jour est trouvée, on l'active dès qu'elle est installée.
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      } catch {
        /* Enregistrement impossible (ex. http non-localhost) : l'app reste fonctionnelle online. */
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.addEventListener('message', onMessage);

    // On enregistre après le load pour ne pas concurrencer le rendu initial.
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  return null;
}
