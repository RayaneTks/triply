'use client';

import Link from 'next/link';
import { Lock, PenLine, Sparkles, ArrowLeft } from 'lucide-react';

export function PlannerManualUpsell() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-card p-8 shadow-lg dark:border-amber-900/50 dark:from-amber-950/40 dark:to-card">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-center text-center">
          <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-2 ring-amber-200/80 dark:bg-amber-950/80 dark:text-amber-200 dark:ring-amber-800/60">
            <Lock className="h-7 w-7" aria-hidden />
          </span>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Offre Voyageur
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Mode manuel réservé aux abonnés
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-light-muted sm:text-base">
            Décrivez votre voyage librement et organisez vos étapes sans le parcours guidé. Cette
            fonctionnalité est incluse à partir de l&apos;offre{' '}
            <span className="font-semibold text-foreground">Voyageur</span> (l&apos;offre Pilote
            inclut également tout le contenu Voyageur).
          </p>
          <ul className="mt-8 w-full space-y-3 text-left text-sm text-foreground">
            <li className="flex gap-3 rounded-xl border border-light-border/60 bg-background/60 px-4 py-3 dark:bg-background/30">
              <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="font-semibold">Saisie libre</span> — brief, étapes et ajustements
                comme vous le souhaitez.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-light-border/60 bg-background/60 px-4 py-3 dark:bg-background/30">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="font-semibold">Même qualité Triply</span> — cartes, transports et
                cohérence du voyage conservés.
              </span>
            </li>
          </ul>
          <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tarifs"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-md transition hover:bg-brand-hover sm:flex-initial sm:min-w-[200px]"
            >
              Voir les offres
            </Link>
            <Link
              href="/planifier"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-light-border bg-card px-6 text-sm font-bold text-foreground transition hover:bg-light-bg sm:flex-initial"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Autres modes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
