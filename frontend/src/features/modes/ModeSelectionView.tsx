'use client';

import React from "react";
import Link from "next/link";
import { Compass, Edit3, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAuthSession } from "../../hooks/useAuthSession";
import { hasPlannerPaidSubscription } from "../../lib/subscription-access";

export function ModeSelectionView() {
  const { currentUser } = useAuthSession();
  const manualUnlocked = hasPlannerPaidSubscription(currentUser?.subscription_tier);
  const showManualLock = Boolean(currentUser) && !manualUnlocked;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-display font-bold text-center mb-4">Comment souhaitez-vous planifier ?</h1>
      <p className="text-light-muted text-center mb-16 text-lg">Choisissez l'approche qui vous convient le mieux.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -5 }}>
          <Link 
            href="/planifier/wizard"
            className="flex flex-col p-8 triply-card border-2 border-transparent hover:border-brand/30 h-full group"
          >
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Compass size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Parcours guidé</h2>
            <p className="text-light-muted leading-relaxed mb-8">
              Laissez-vous porter par notre assistant. Répondez à quelques questions et obtenez un itinéraire complet optimisé.
            </p>
            <span className="mt-auto text-brand font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
              Choisir ce mode <Edit3 size={16} />
            </span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -5 }}>
          <Link
            href="/planifier/manuel"
            className={cn(
              'group flex h-full flex-col border-2 p-8 triply-card transition-colors',
              showManualLock
                ? 'border-amber-200/90 hover:border-amber-300 dark:border-amber-900/60 dark:hover:border-amber-800/80'
                : 'border-transparent hover:border-brand/30',
            )}
          >
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {showManualLock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/90 bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Abonnement requis
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-light-border bg-light-bg/80 px-2.5 py-1 text-xs font-semibold text-light-muted dark:bg-card">
                  {currentUser ? 'Inclus dans votre offre' : 'Offre Voyageur'}
                </span>
              )}
            </div>
            <div
              className={cn(
                'mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                showManualLock
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                  : 'bg-light-bg text-light-muted',
              )}
            >
              {showManualLock ? <Lock size={30} aria-hidden /> : <Edit3 size={32} />}
            </div>
            <h2 className="mb-4 text-2xl font-bold">Mode manuel</h2>
            <p className="mb-8 leading-relaxed text-light-muted">
              Pour ceux qui savent déjà ce qu&apos;ils veulent. Décrivez votre projet en quelques
              lignes ou saisissez vos étapes librement.
            </p>
            <span
              className={cn(
                'mt-auto flex items-center gap-2 font-bold transition-all group-hover:gap-3',
                showManualLock
                  ? 'text-amber-900 dark:text-amber-100'
                  : 'text-light-muted group-hover:text-brand',
              )}
            >
              {showManualLock ? 'Comment débloquer ce mode' : 'Édition libre'}
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
