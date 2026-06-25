'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';

// Page de repli servie par le Service Worker quand une navigation échoue hors-ligne
// et qu'aucune version en cache n'existe. Charte cyan (--primary), aucun emerald.
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="triply-card w-full max-w-md p-8 text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
        >
          <WifiOff size={30} className="text-brand" aria-hidden />
        </div>

        <h1 className="font-display text-2xl font-bold">Vous êtes hors-ligne</h1>
        <p className="mt-3 text-sm leading-relaxed text-light-muted">
          Cette page n’a pas encore été enregistrée pour une consultation hors-ligne.
          Vos voyages déjà ouverts restent accessibles depuis l’onglet&nbsp;Voyages.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} aria-hidden />
            Réessayer
          </button>
          <Link
            href="/voyages"
            className="text-sm font-semibold text-brand hover:underline"
          >
            Voir mes voyages enregistrés
          </Link>
        </div>
      </div>
    </div>
  );
}
