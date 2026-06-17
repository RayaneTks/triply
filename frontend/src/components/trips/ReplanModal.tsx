'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Lock,
    RefreshCcw,
    Sparkles,
    X,
} from 'lucide-react';

import {
    REPLAN_REASON_LABELS,
    tripReplanClient,
    type ReplanPreview,
    type ReplanReason,
    type ReplannedActivity,
} from '../../lib/trip-replan-client';
import type { PlanSnapshot, PlanSnapshotActivity, PlanSnapshotDay } from '../../lib/plan-snapshot';
import { tripsClient, type TripApi } from '../../lib/trips-client';
import { cn } from '../../lib/utils';

export interface CurrentActivityForReplan {
    /** Stable id used for lock selection. Falls back to "dX-aY". */
    id: string;
    day: number;
    title: string;
    lat: number;
    lng: number;
    durationHours?: number;
}

interface ReplanModalProps {
    open: boolean;
    onClose: () => void;
    tripId: string;
    /** Current snapshot — used to merge the replan preview back in on apply. */
    trip: TripApi;
    /** Flat list of activities the user can lock to preserve. */
    currentActivities: CurrentActivityForReplan[];
    onApplied: () => void;
}

type Step = 'reason' | 'details' | 'loading' | 'preview' | 'applying' | 'done' | 'error';

const REASON_ORDER: ReplanReason[] = [
    'flight_delay',
    'weather',
    'health',
    'over_budget',
    'time_lost',
    'other',
];

export function ReplanModal({
    open,
    onClose,
    tripId,
    trip,
    currentActivities,
    onApplied,
}: ReplanModalProps) {
    const [step, setStep] = useState<Step>('reason');
    const [reason, setReason] = useState<ReplanReason | null>(null);
    const [details, setDetails] = useState('');
    const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
    const [preview, setPreview] = useState<ReplanPreview | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Close on Escape.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const activitiesByDay = useMemo(() => {
        const map = new Map<number, CurrentActivityForReplan[]>();
        for (const a of currentActivities) {
            const list = map.get(a.day) ?? [];
            list.push(a);
            map.set(a.day, list);
        }
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }, [currentActivities]);

    const previewByDay = useMemo(() => {
        if (!preview) return [] as Array<[number, ReplannedActivity[]]>;
        const map = new Map<number, ReplannedActivity[]>();
        for (const a of preview.replannedActivities) {
            const list = map.get(a.day) ?? [];
            list.push(a);
            map.set(a.day, list);
        }
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }, [preview]);

    function toggleLock(id: string) {
        setLockedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function submit() {
        if (!reason) return;
        setStep('loading');
        setError(null);
        try {
            const result = await tripReplanClient.requestReplan(tripId, {
                reason,
                details: details.trim() || undefined,
                locked_activity_ids: [...lockedIds],
            });
            if (!result.replannedActivities || result.replannedActivities.length === 0) {
                setError("L’IA n’a pas pu proposer un nouveau programme. Affinez votre description et réessayez.");
                setStep('error');
                return;
            }
            setPreview(result);
            setStep('preview');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur réseau.';
            setError(message);
            setStep('error');
        }
    }

    async function apply() {
        if (!preview) return;
        setStep('applying');
        setError(null);
        try {
            const mergedSnapshot = mergePreviewIntoSnapshot(trip, preview);
            await tripsClient.update(tripId, { plan_snapshot: mergedSnapshot });
            setStep('done');
            onApplied();
            // Auto-close after brief success state.
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Échec de l’application du nouveau plan.";
            setError(message);
            setStep('error');
        }
    }

    if (!open) return null;

    const reasonMeta = reason ? REPLAN_REASON_LABELS[reason] : null;

    return (
        <AnimatePresence>
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Replanifier votre voyage"
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                {/* Backdrop */}
                <button
                    type="button"
                    aria-label="Fermer"
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Sheet */}
                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative triply-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <header className="flex items-start justify-between gap-4 p-6 border-b border-light-border">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                                style={{
                                    backgroundColor: 'rgba(0, 150, 199, 0.15)',
                                    color: 'var(--primary, #0096c7)',
                                }}
                            >
                                <RefreshCcw size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-light-foreground">
                                    Quelque chose a changé ?
                                </h2>
                                <p className="text-sm text-light-muted mt-1">
                                    Triply réécrit les jours impactés en gardant vos coups de cœur intacts.
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
                            {step === 'reason' && (
                                <motion.div
                                    key="reason"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <p className="text-xs uppercase tracking-widest text-light-muted font-bold mb-4">
                                        Étape 1 / 3 — Que s’est-il passé ?
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {REASON_ORDER.map((r) => {
                                            const meta = REPLAN_REASON_LABELS[r];
                                            const selected = reason === r;
                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setReason(r)}
                                                    className={cn(
                                                        'text-left rounded-2xl p-4 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                                        selected
                                                            ? 'border-brand bg-brand/10 shadow-brand/20 shadow-md'
                                                            : 'border-light-border bg-light-bg hover:border-brand/40 hover:bg-brand/5',
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl leading-none" aria-hidden="true">
                                                            {meta.emoji}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className={cn('font-bold', selected ? 'text-brand' : 'text-light-foreground')}>
                                                                {meta.label}
                                                            </p>
                                                            <p className="text-xs text-light-muted mt-1 leading-relaxed">
                                                                {meta.hint}
                                                            </p>
                                                        </div>
                                                        {selected && (
                                                            <CheckCircle2 size={18} className="text-brand shrink-0" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'details' && reasonMeta && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-light-muted font-bold mb-2">
                                            Étape 2 / 3 — Précisez et verrouillez
                                        </p>
                                        <p className="text-sm text-light-muted">
                                            {reasonMeta.emoji} {reasonMeta.label} — {reasonMeta.hint}
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="replan-details"
                                            className="block text-xs uppercase tracking-widest text-light-muted font-bold mb-2"
                                        >
                                            Détails (optionnel)
                                        </label>
                                        <textarea
                                            id="replan-details"
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            placeholder="Ex: Vol retardé de 5h, on arrive demain matin. On veut garder le Colisée."
                                            rows={3}
                                            className="w-full bg-light-bg border border-light-border rounded-2xl p-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors resize-none text-light-foreground placeholder:text-light-muted/60"
                                            maxLength={1000}
                                        />
                                    </div>

                                    {activitiesByDay.length > 0 && (
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-light-muted font-bold mb-3 flex items-center gap-2">
                                                <Lock size={12} /> Étapes à préserver{' '}
                                                <span className="text-light-muted/60">
                                                    ({lockedIds.size} verrouillée{lockedIds.size > 1 ? 's' : ''})
                                                </span>
                                            </p>
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                                {activitiesByDay.map(([dayNum, acts]) => (
                                                    <div key={dayNum}>
                                                        <p className="text-[11px] uppercase tracking-wider text-light-muted/80 font-bold mb-1">
                                                            Jour {dayNum}
                                                        </p>
                                                        <div className="space-y-1">
                                                            {acts.map((a) => {
                                                                const isLocked = lockedIds.has(a.id);
                                                                return (
                                                                    <label
                                                                        key={a.id}
                                                                        className={cn(
                                                                            'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors',
                                                                            isLocked
                                                                                ? 'border-brand bg-brand/5'
                                                                                : 'border-light-border bg-light-bg hover:border-brand/40',
                                                                        )}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isLocked}
                                                                            onChange={() => toggleLock(a.id)}
                                                                            className="sr-only"
                                                                        />
                                                                        <span
                                                                            className={cn(
                                                                                'w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors',
                                                                                isLocked
                                                                                    ? 'bg-brand border-brand'
                                                                                    : 'border-light-border',
                                                                            )}
                                                                            aria-hidden="true"
                                                                        >
                                                                            {isLocked && <CheckCircle2 size={12} className="text-white" />}
                                                                        </span>
                                                                        <span className="text-sm text-light-foreground flex-1">
                                                                            {a.title}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {(step === 'loading' || step === 'applying') && (
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                                >
                                    <Loader2 size={36} className="animate-spin text-brand" />
                                    <p className="text-base font-bold text-light-foreground">
                                        {step === 'loading'
                                            ? 'L’IA recompose votre voyage…'
                                            : 'Application du nouveau plan…'}
                                    </p>
                                    <p className="text-sm text-light-muted max-w-md">
                                        {step === 'loading'
                                            ? 'Préservation de vos étapes verrouillées, optimisation des transits, équilibrage des journées.'
                                            : 'Synchronisation avec votre voyage.'}
                                    </p>
                                </motion.div>
                            )}

                            {step === 'preview' && preview && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-brand/5 border border-brand/30 rounded-2xl p-4">
                                        <p className="text-xs uppercase tracking-widest text-brand font-bold mb-2 flex items-center gap-2">
                                            <Sparkles size={12} /> Étape 3 / 3 — Nouveau programme proposé
                                        </p>
                                        {preview.reply && (
                                            <p className="text-sm text-light-foreground leading-relaxed">{preview.reply}</p>
                                        )}
                                        {preview.summary && (
                                            <pre className="text-xs text-light-muted mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                                                {preview.summary}
                                            </pre>
                                        )}
                                        <div className="flex gap-4 mt-3 text-xs text-light-muted">
                                            <span>
                                                <strong className="text-brand">{preview.affectedDays.length}</strong> jour
                                                {preview.affectedDays.length > 1 ? 's' : ''} modifié
                                                {preview.affectedDays.length > 1 ? 's' : ''}
                                            </span>
                                            {preview.lockedCount > 0 && (
                                                <span>
                                                    <Lock size={11} className="inline mr-1" />
                                                    <strong>{preview.lockedCount}</strong> étape
                                                    {preview.lockedCount > 1 ? 's' : ''} préservée
                                                    {preview.lockedCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {previewByDay.map(([dayNum, acts]) => (
                                            <div key={dayNum}>
                                                <p className="text-xs uppercase tracking-widest text-light-muted font-bold mb-2">
                                                    Jour {dayNum}
                                                </p>
                                                <ol className="space-y-2">
                                                    {acts.map((a, i) => (
                                                        <li
                                                            key={`${dayNum}-${i}`}
                                                            className="flex items-start gap-3 bg-light-bg border border-light-border rounded-xl p-3"
                                                        >
                                                            <span className="text-xs font-bold text-brand/70 shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-light-foreground">
                                                                    {a.title}
                                                                </p>
                                                                {typeof a.durationHours === 'number' && a.durationHours > 0 && (
                                                                    <p className="text-xs text-light-muted mt-0.5">
                                                                        ~{a.durationHours}h
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {a.locked && (
                                                                <span
                                                                    className="text-xs text-brand flex items-center gap-1"
                                                                    title="Étape préservée"
                                                                >
                                                                    <Lock size={11} /> verrouillée
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        ))}
                                    </div>
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
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                    <p className="text-lg font-bold text-light-foreground font-display">
                                        Voyage replanifié
                                    </p>
                                    <p className="text-sm text-light-muted max-w-md">
                                        Votre itinéraire a été mis à jour avec succès.
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
                    {step !== 'loading' && step !== 'applying' && step !== 'done' && (
                        <footer className="flex items-center justify-between gap-3 p-6 border-t border-light-border bg-light-bg/30">
                            <div className="flex items-center gap-2">
                                {(step === 'details' || step === 'preview' || step === 'error') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (step === 'preview') setStep('details');
                                            else if (step === 'details') setStep('reason');
                                            else setStep(reason ? 'details' : 'reason');
                                        }}
                                        className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                    >
                                        <ArrowLeft size={14} /> Retour
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {step === 'reason' && (
                                    <button
                                        type="button"
                                        onClick={() => setStep('details')}
                                        disabled={!reason}
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                    >
                                        Suivant
                                    </button>
                                )}
                                {step === 'details' && (
                                    <button
                                        type="button"
                                        onClick={submit}
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                    >
                                        <Sparkles size={14} /> Lancer le replan
                                    </button>
                                )}
                                {step === 'preview' && (
                                    <button
                                        type="button"
                                        onClick={apply}
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} /> Appliquer
                                    </button>
                                )}
                                {step === 'error' && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(reason ? 'details' : 'reason')}
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

/**
 * Merge the AI's replanned activities into the trip's plan_snapshot.
 * Replaces activities on affected days; keeps untouched days intact.
 */
function mergePreviewIntoSnapshot(trip: TripApi, preview: ReplanPreview): PlanSnapshot {
    const snapshot: PlanSnapshot = trip.plan_snapshot ?? { days: [] };
    const days: PlanSnapshotDay[] = Array.isArray(snapshot.days) ? [...snapshot.days] : [];

    // Group replanned by day.
    const replannedByDay = new Map<number, ReplannedActivity[]>();
    for (const a of preview.replannedActivities) {
        const list = replannedByDay.get(a.day) ?? [];
        list.push(a);
        replannedByDay.set(a.day, list);
    }

    const affected = new Set(preview.affectedDays);

    const updatedDays: PlanSnapshotDay[] = days.map((day, idx) => {
        const dayNumber = day.dayIndex >= 1 ? day.dayIndex : idx + 1;
        if (!affected.has(dayNumber)) return day;
        const replan = replannedByDay.get(dayNumber);
        if (!replan) return day;
        const activities: PlanSnapshotActivity[] = replan.map((a) => ({
            title: a.title,
            lat: a.lat,
            lng: a.lng,
            durationHours: a.durationHours,
        }));
        return { ...day, activities };
    });

    return { ...snapshot, days: updatedDays };
}
