'use client';

import { useEffect } from 'react';
import { ServiceWorkerRegistrar } from './ServiceWorkerRegistrar';
import { OfflineBanner } from './OfflineBanner';
import { InstallPrompt } from './InstallPrompt';
import { replayQueue } from '../../lib/pwa/sync-queue';

// Point d'entrée PWA monté globalement dans le layout racine.
// Regroupe : enregistrement du SW, bannière offline, invite d'installation,
// et rejeu de la file de sync au retour réseau.
export function PwaProvider() {
  useEffect(() => {
    const onOnline = () => void replayQueue();
    window.addEventListener('online', onOnline);
    // Tentative de rejeu au montage (cas : on rouvre l'app déjà en ligne avec une file résiduelle).
    void replayQueue();
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <>
      <ServiceWorkerRegistrar />
      <OfflineBanner />
      <InstallPrompt />
    </>
  );
}
