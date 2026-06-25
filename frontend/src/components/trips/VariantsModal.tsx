'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CheckCircle2,
    Clock,
    Columns2,
    GitBranch,
    Loader2,
    RotateCcw,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';

import { tripsClient, type TripApi } from '../../lib/trips-client';
import {
    diffVariant,
    getDayActivities,
    getForkableDays,
    mergeVariantIntoSnapshot,
    moveActivity,
    removeActivity,
    restoreActivity,
    toVariantActivities,
    type VariantActivity,
} from '../../lib/trip-variants';
import { cn } from '../../lib/utils';

interface VariantsModalProps {
    open: boolean;
    onClose: () => void;
    tripId: string;
    /** Snapshot courant — source du fork et cible du merge. */
    trip: TripApi;
    /** Jour pré-sélectionné (sinon l'utilisateur choisit). */
    initialDay?: number;
    onApplied: () => void;
}

type Step = 'pick' | 'compare' | 'applying' | 'done' | 'error';

function formatDuration(hours?: number): string | null {
    if (typeof hours !== 'number' || hours <= 0) return null;
    if (Number.isInteger(hours)) return `${hours}h`;
    return `${hours.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}h`;
}

export function VariantsModal({ open, onClose, tripId, trip, initialDay, onApplied }: VariantsModalProps) {
    const forkableDays = useMemo(() => getForkableDays(trip.plan_snapshot), [trip.plan_snapshot]);

    // Le parent remonte la modale à chaque ouverture, donc on initialise paresseusement
    // (évite tout setState synchrone dans un effet — cf. react-hooks/set-state-in-effect).
    const presetDay = useMemo(
        () => (initialDay && forkableDays.some((d) => d.dayNumber === initialDay) ? initialDay : null),
        [initialDay, forkableDays],
    );
    const presetVariant = useMemo(
        () => (presetDay != null ? toVariantActivities(getDayActivities(trip.plan_snapshot, presetDay)) : []),
        [presetDay, trip.plan_snapshot],
    );

    const [step, setStep] = useState<Step>(presetDay != null ? 'compare' : 'pick');
    const [dayNumber, setDayNumber] = useState<number | null>(presetDay);
    const [original, setOriginal] = useState<VariantActivity[]>(presetVariant);
    const [variant, setVariant] = useState<VariantActivity[]>(presetVariant);
    const [error, setError] = useState<string | null>(null);

    // Fermeture sur Échap.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    function startFork(day: number) {
        const base = toVariantActivities(getDayActivities(trip.plan_snapshot, day));
        setDayNumber(day);
        setOriginal(base);
        setVariant(base);
        setStep('compare');
    }

    const diff = useMemo(() => diffVariant(original, variant), [original, variant]);
    const removedItems = useMemo(
        () => original.filter((a) => diff.removedKeys.has(a.key)),
        [original, diff],
    );

    async function applyVariant() {
        if (dayNumber == null || !diff.changed) return;
        setStep('applying');
        setError(null);
        try {
            const merged = mergeVariantIntoSnapshot(trip.plan_snapshot, dayNumber, variant);
            await tripsClient.update(tripId, { plan_snapshot: merged });
            setStep('done');
            onApplied();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l’application de la variante.");
            setStep('error');
        }
    }

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Comparer des variantes de journée"
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                <button
                    type="button"
                    aria-label="Fermer"
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative triply-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <header className="flex items-start justify-between gap-4 p-6 border-b border-light-border">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                                    color: 'var(--primary, #0096c7)',
                                }}
                            >
                                <GitBranch size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-light-foreground">
                                    Variantes A/B d’une journée
                                </h2>
                                <p className="text-sm text-light-muted mt-1">
                                    Forkez une journée, réorganisez la variante, comparez côte à côte et fusionnez la
                                    gagnante.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fermer"
                            className="text-light-muted hover:text-light-foreground transition-colors p-2 rounded-lg hover:bg-light-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <X size={20} />
                        </button>
                    </header>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {step === 'pick' && (
                                <motion.div
                                    key="pick"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <p className="text-xs uppercase tracking-widest text-light-muted font-bold mb-4">
                                        Choisissez la journée à forker
                                    </p>
                                    {forkableDays.length === 0 ? (
                                        <p className="text-sm text-light-muted">
                                            Aucune journée avec des activités à comparer pour le moment.
                                        </p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {forkableDays.map((d) => (
                                                <button
                                                    key={d.dayNumber}
                                                    type="button"
                                                    onClick={() => startFork(d.dayNumber)}
                                                    className="text-left rounded-2xl p-4 border border-light-border bg-light-bg hover:border-brand/40 hover:bg-brand/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="font-bold text-light-foreground">
                                                                Jour {d.dayNumber}
                                                            </p>
                                                            <p className="text-xs text-light-muted mt-0.5 truncate max-w-[12rem]">
                                                                {d.title || 'Programme du jour'}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-bold text-brand bg-brand/5 px-2 py-1 rounded-full shrink-0">
                                                            {d.activityCount} étape{d.activityCount > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 'compare' && dayNumber != null && (
                                <motion.div
                                    key="compare"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-5"
                                >
                                    <div className="bg-brand/5 border border-brand/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs uppercase tracking-widest text-brand font-bold flex items-center gap-2">
                                            <Columns2 size={12} /> Jour {dayNumber} — comparaison A vs B
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-light-muted">
                                            <span>
                                                <strong className="text-brand">{diff.movedKeys.size}</strong> déplacée
                                                {diff.movedKeys.size > 1 ? 's' : ''}
                                            </span>
                                            <span>
                                                <strong className="text-brand">{diff.removedKeys.size}</strong> retirée
                                                {diff.removedKeys.size > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Colonne A — version actuelle (lecture seule). */}
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider text-light-muted/80 font-bold mb-2">
                                                Version actuelle (A)
                                            </p>
                                            <ol className="space-y-2">
                                                {original.map((a, i) => {
                                                    const isRemoved = diff.removedKeys.has(a.key);
                                                    const duration = formatDuration(a.durationHours);
                                                    return (
                                                        <li
                                                            key={a.key}
                                                            className={cn(
                                                                'flex items-start gap-3 rounded-xl p-3 border bg-light-bg border-light-border',
                                                                isRemoved && 'opacity-50',
                                                            )}
                                                        >
                                                            <span className="text-xs font-bold text-light-muted shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p
                                                                    className={cn(
                                                                        'text-sm font-bold text-light-foreground',
                                                                        isRemoved && 'line-through',
                                                                    )}
                                                                >
                                                                    {a.title}
                                                                </p>
                                                                {duration && (
                                                                    <p className="text-xs text-light-muted mt-0.5 flex items-center gap-1">
                                                                        <Clock size={11} /> {duration}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {isRemoved && (
                                                                <span className="text-[11px] font-bold text-light-muted shrink-0">
                                                                    retirée
                                                                </span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        </div>

                                        {/* Colonne B — variante éditable. */}
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider text-brand font-bold mb-2 flex items-center gap-2">
                                                <Sparkles size={11} /> Votre variante (B)
                                            </p>
                                            <ol className="space-y-2">
                                                {variant.map((a, i) => {
                                                    const isMoved = diff.movedKeys.has(a.key);
                                                    const duration = formatDuration(a.durationHours);
                                                    return (
                                                        <li
                                                            key={a.key}
                                                            className={cn(
                                                                'flex items-start gap-2 rounded-xl p-3 border transition-colors',
                                                                isMoved
                                                                    ? 'border-brand bg-brand/5'
                                                                    : 'border-light-border bg-light-bg',
                                                            )}
                                                        >
                                                            <span className="text-xs font-bold text-brand/70 shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-light-foreground">
                                                                    {a.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {duration && (
                                                                        <p className="text-xs text-light-muted flex items-center gap-1">
                                                                            <Clock size={11} /> {duration}
                                                                        </p>
                                                                    )}
                                                                    {isMoved && (
                                                                        <span className="text-[11px] font-bold text-brand">
                                                                            déplacée
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVariant((v) => moveActivity(v, a.key, 'up'))}
                                                                    disabled={i === 0}
                                                                    aria-label={`Monter ${a.title}`}
                                                                    className="p-1.5 rounded-lg text-light-muted hover:text-brand hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                                >
                                                                    <ArrowUp size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVariant((v) => moveActivity(v, a.key, 'down'))}
                                                                    disabled={i === variant.length - 1}
                                                                    aria-label={`Descendre ${a.title}`}
                                                                    className="p-1.5 rounded-lg text-light-muted hover:text-brand hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                                >
                                                                    <ArrowDown size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVariant((v) => removeActivity(v, a.key))}
                                                                    aria-label={`Retirer ${a.title}`}
                                                                    className="p-1.5 rounded-lg text-light-muted hover:text-error hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ol>

                                            {variant.length === 0 && (
                                                <p className="text-xs text-light-muted mt-2">
                                                    Variante vide — restaurez au moins une étape ci-dessous.
                                                </p>
                                            )}

                                            {removedItems.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-[11px] uppercase tracking-wider text-light-muted/80 font-bold mb-2">
                                                        Étapes retirées
                                                    </p>
                                                    <div className="space-y-2">
                                                        {removedItems.map((a) => (
                                                            <div
                                                                key={a.key}
                                                                className="flex items-center gap-3 rounded-xl p-2.5 border border-dashed border-light-border bg-light-bg/50"
                                                            >
                                                                <span className="text-sm text-light-muted flex-1 truncate line-through">
                                                                    {a.title}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setVariant((v) => restoreActivity(original, v, a.key))
                                                                    }
                                                                    className="text-xs font-bold text-brand flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
                                                                >
                                                                    <RotateCcw size={12} /> Restaurer
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'applying' && (
                                <motion.div
                                    key="applying"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                                >
                                    <Loader2 size={36} className="animate-spin text-brand" />
                                    <p className="text-base font-bold text-light-foreground">Fusion de la variante…</p>
                                    <p className="text-sm text-light-muted max-w-md">
                                        Mise à jour de votre journée avec la version choisie.
                                    </p>
                                </motion.div>
                            )}

                            {step === 'done' && (
                                <motion.div
                                    key="done"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                                >
                                    <CheckCircle2 size={48} className="text-brand" />
                                    <p className="text-lg font-bold text-light-foreground font-display">
                                        Variante appliquée
                                    </p>
                                    <p className="text-sm text-light-muted max-w-md">
                                        Le jour {dayNumber} a été mis à jour avec votre variante.
                                    </p>
                                </motion.div>
                            )}

                            {step === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                                        <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-error text-sm">Un souci est survenu</p>
                                            <p className="text-sm text-light-muted mt-1">{error}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {(step === 'compare' || step === 'error') && (
                        <footer className="flex items-center justify-between gap-3 p-6 border-t border-light-border bg-light-bg/30">
                            <div className="flex items-center gap-2">
                                {step === 'compare' && forkableDays.length > 1 && initialDay == null && (
                                    <button
                                        type="button"
                                        onClick={() => setStep('pick')}
                                        className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                    >
                                        <ArrowLeft size={14} /> Changer de jour
                                    </button>
                                )}
                                {step === 'compare' && diff.changed && (
                                    <button
                                        type="button"
                                        onClick={() => setVariant(original)}
                                        className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                    >
                                        <RotateCcw size={14} /> Réinitialiser B
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {step === 'compare' && (
                                    <>
                                        {!diff.changed && (
                                            <span className="text-xs text-light-muted hidden sm:inline">
                                                Modifiez la variante B pour pouvoir la choisir.
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={applyVariant}
                                            disabled={!diff.changed || variant.length === 0}
                                            className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 size={14} /> Choisir la variante B
                                        </button>
                                    </>
                                )}
                                {step === 'error' && (
                                    <button
                                        type="button"
                                        onClick={() => setStep('compare')}
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                    >
                                        Réessayer
                                    </button>
                                )}
                            </div>
                        </footer>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
