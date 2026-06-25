'use client';

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks, Sparkles, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAuthSession } from "../../hooks/useAuthSession";
import { hasPlannerPaidSubscription } from "../../lib/subscription-access";

export function ModeSelectionView() {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const manualUnlocked = hasPlannerPaidSubscription(currentUser?.subscription_tier);
  const showManualLock = Boolean(currentUser) && !manualUnlocked;

  const [pending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const go = (href: string) => {
    setPendingHref(href);
    startTransition(() => router.push(href));
  };

  const isPendingFor = (href: string) => pending && pendingHref === href;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <header className="mb-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-light-border bg-light-bg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-light-muted">
          Étape 1 · Choisissez votre mode
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold md:text-5xl">Comment voulez-vous planifier&nbsp;?</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-light-muted">
          Deux façons d’arriver au même résultat&nbsp;: un itinéraire clair, prêt à partir.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mode guidé — formulaire étape par étape */}
        <motion.button
          type="button"
          whileHover={{ y: -4 }}
          onClick={() => go('/planifier/wizard')}
          disabled={isPendingFor('/planifier/wizard')}
          className="group relative flex h-full flex-col items-start p-8 text-left triply-card border-2 border-transparent transition-colors hover:border-brand/40 disabled:opacity-70"
          aria-label="Démarrer le parcours guidé"
        >
          <span className="inline-flex items-center rounded-full border border-light-border bg-light-bg/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-light-muted dark:bg-card">
            Pas à pas
          </span>
          <div className="mt-6 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform group-hover:scale-110">
            <ListChecks size={32} />
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold">Parcours guidé</h2>
          <p className="mb-6 leading-relaxed text-light-muted">
            On vous pose les bonnes questions, dans le bon ordre. Destination, dates, budget, style&nbsp;: on remplit ensemble. Idéal pour une première fois.
          </p>
          <ul className="mb-8 space-y-2 text-sm text-light-muted">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Formulaire en 5 étapes courtes</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Suggestions visuelles à chaque étape</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Itinéraire généré à la fin</li>
          </ul>
          <span className="mt-auto inline-flex items-center gap-2 font-bold text-brand transition-all group-hover:gap-3">
            {isPendingFor('/planifier/wizard') ? (
              <><Loader2 size={16} className="animate-spin" /> Chargement…</>
            ) : (
              <>Démarrer <ArrowRight size={16} /></>
            )}
          </span>
        </motion.button>

        {/* Mode manuel / chat libre IA — le plus libre */}
        <motion.button
          type="button"
          whileHover={{ y: -4 }}
          onClick={() => {
            if (showManualLock) {
              go('/tarifs');
              return;
            }
            go('/planifier/manuel');
          }}
          disabled={isPendingFor('/planifier/manuel') || isPendingFor('/tarifs')}
          className={cn(
            'group relative flex h-full flex-col items-start p-8 text-left triply-card border-2 transition-colors disabled:opacity-70',
            showManualLock
              ? 'border-amber-200/90 hover:border-amber-300 dark:border-amber-900/60 dark:hover:border-amber-800/80'
              : 'border-transparent hover:border-brand/40',
          )}
          aria-label={showManualLock ? 'Voir les offres pour débloquer le mode chat IA' : 'Démarrer le mode chat libre'}
        >
          <div className="flex flex-wrap items-center gap-2">
            {showManualLock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/90 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                <Lock className="h-3 w-3" aria-hidden />
                Abonnement requis
              </span>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-light-border bg-light-bg/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-light-muted dark:bg-card">
                  Conversation libre
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                  <Sparkles className="h-3 w-3" aria-hidden /> IA avancée
                </span>
              </>
            )}
          </div>
          <div
            className={cn(
              'mt-6 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
              showManualLock
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                : 'bg-brand/10 text-brand',
            )}
          >
            {showManualLock ? <Lock size={30} aria-hidden /> : <Sparkles size={32} />}
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold">Conversation libre</h2>
          <p className="mb-6 leading-relaxed text-light-muted">
            Dites au copilote ce que vous voulez, en une phrase ou en détail. Il construit l’itinéraire pour vous et vous ajustez en discutant. Le mode le plus puissant.
          </p>
          <ul className="mb-8 space-y-2 text-sm text-light-muted">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Génération complète depuis un brief</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Modifications en langage naturel</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Carte, budget et journées synchronisés</li>
          </ul>
          <span
            className={cn(
              'mt-auto inline-flex items-center gap-2 font-bold transition-all group-hover:gap-3',
              showManualLock ? 'text-amber-900 dark:text-amber-100' : 'text-brand',
            )}
          >
            {isPendingFor('/planifier/manuel') || isPendingFor('/tarifs') ? (
              <><Loader2 size={16} className="animate-spin" /> Chargement…</>
            ) : showManualLock ? (
              <>Débloquer ce mode <ArrowRight size={16} /></>
            ) : (
              <>Lancer la conversation <ArrowRight size={16} /></>
            )}
          </span>
        </motion.button>
      </div>

      <p className="mt-10 text-center text-sm text-light-muted">
        Pas encore décidé&nbsp;? <Link href="/voyages" className="font-semibold text-brand underline-offset-4 hover:underline">Voir mes voyages existants</Link>
      </p>
    </div>
  );
}
