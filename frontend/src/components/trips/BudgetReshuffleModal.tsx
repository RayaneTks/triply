'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Save, Wallet, X } from 'lucide-react';

import { activitiesClient, type ActivityDayBucket } from '../../lib/activities-client';

interface BudgetReshuffleModalProps {
    open: boolean;
    onClose: () => void;
    tripId: string;
    currentBudgetEur: number;
    budgetAllocation: Array<{ key: string; label: string; amountEur: number }>;
    totalAllocatedEur: number;
    activitiesByDay: ActivityDayBucket[];
    onSaved: () => void;
}

export function BudgetReshuffleModal({
    open,
    onClose,
    tripId,
    currentBudgetEur,
    budgetAllocation,
    totalAllocatedEur,
    activitiesByDay,
    onSaved,
}: BudgetReshuffleModalProps) {
    const [draftCosts, setDraftCosts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const allActivities = useMemo(
        () =>
            activitiesByDay.flatMap((day) =>
                day.activities.map((activity) => ({
                    id: activity.id,
                    dayIndex: day.index,
                    dayDate: day.date,
                    title: activity.attributes.title,
                    currentCost: activity.attributes.cost,
                })),
            ),
        [activitiesByDay],
    );

    useEffect(() => {
        const next: Record<string, string> = {};
        for (const activity of allActivities) {
            next[activity.id] = typeof activity.currentCost === 'number' ? String(activity.currentCost) : '';
        }
        setDraftCosts(next);
        setError(null);
        setSuccess(null);
    }, [allActivities, open]);

    const changedActivities = useMemo(
        () =>
            allActivities.filter((activity) => {
                const initial = typeof activity.currentCost === 'number' ? String(activity.currentCost) : '';
                return (draftCosts[activity.id] ?? '') !== initial;
            }),
        [allActivities, draftCosts],
    );

    const plannedActivitiesTotal = useMemo(
        () =>
            allActivities.reduce((sum, activity) => {
                const raw = draftCosts[activity.id] ?? '';
                const value = Number.parseFloat(raw);
                return Number.isFinite(value) && value >= 0 ? sum + value : sum;
            }, 0),
        [allActivities, draftCosts],
    );

    const remainingBudget = Math.max(0, currentBudgetEur - plannedActivitiesTotal);

    function resetDraft() {
        const next: Record<string, string> = {};
        for (const activity of allActivities) {
            next[activity.id] = typeof activity.currentCost === 'number' ? String(activity.currentCost) : '';
        }
        setDraftCosts(next);
        setError(null);
        setSuccess(null);
    }

    async function saveChanges() {
        if (changedActivities.length === 0 || saving) return;
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await Promise.all(
                changedActivities.map((activity) => {
                    const raw = (draftCosts[activity.id] ?? '').trim();
                    const parsed = Number.parseFloat(raw);
                    const normalizedCost = raw === '' || !Number.isFinite(parsed) ? null : Math.max(0, parsed);
                    return activitiesClient.update(tripId, activity.id, { cost: normalizedCost });
                }),
            );
            setSuccess('Budget des activités mis à jour.');
            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sauvegarde impossible pour le moment.');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Gestion du budget"
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
                    className="relative triply-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    <header className="flex items-start justify-between gap-4 p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                                    color: 'var(--primary)',
                                }}
                            >
                                <Wallet size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-light-foreground">Budget du voyage</h2>
                                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                    Ajustez le coût réel de chaque activité puis enregistrez.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fermer"
                            className="transition-colors p-2 rounded-lg"
                            style={{ color: 'var(--muted-foreground)' }}
                        >
                            <X size={20} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <BudgetAllocationSummary
                            budgetAllocation={budgetAllocation}
                            currentBudgetEur={currentBudgetEur}
                            totalAllocatedEur={totalAllocatedEur}
                        />

                        <section
                            className="border rounded-2xl p-4 space-y-3"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs uppercase tracking-widest text-light-muted font-bold">
                                    Activités budgétées
                                </p>
                                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                    {plannedActivitiesTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € planifiés
                                </p>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                Reste estimé: {remainingBudget.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                            </p>

                            {allActivities.length === 0 ? (
                                <p className="text-sm text-light-muted">Aucune activité à budgéter pour ce voyage.</p>
                            ) : (
                                <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                    {allActivities.map((activity) => (
                                        <li
                                            key={activity.id}
                                            className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-xl border p-3"
                                            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                                                    {activity.title}
                                                </p>
                                                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                                    Jour {activity.dayIndex + 1}
                                                    {activity.dayDate ? ` · ${activity.dayDate}` : ''}
                                                </p>
                                            </div>
                                            <label className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                                €
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={draftCosts[activity.id] ?? ''}
                                                    onChange={(e) =>
                                                        setDraftCosts((prev) => ({ ...prev, [activity.id]: e.target.value }))
                                                    }
                                                    className="w-24 rounded-lg border px-2 py-1 text-sm"
                                                    style={{
                                                        background: 'var(--surface)',
                                                        borderColor: 'var(--border)',
                                                        color: 'var(--foreground)',
                                                    }}
                                                />
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {error && (
                            <div className="text-sm text-error bg-red-50 border border-red-200 rounded-2xl p-3">{error}</div>
                        )}
                        {success && (
                            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                                {success}
                            </div>
                        )}
                        {saving && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <Loader2 size={30} className="animate-spin text-brand" />
                                <p className="text-sm font-bold text-light-foreground">Enregistrement des budgets…</p>
                            </div>
                        )}
                    </div>

                    <footer
                        className="flex items-center justify-between gap-3 p-6 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    >
                        <button type="button" onClick={resetDraft} className="btn-secondary py-2 px-4 text-xs" disabled={saving}>
                            Réinitialiser
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                {changedActivities.length} modification(s)
                            </span>
                            <button
                                type="button"
                                onClick={() => void saveChanges()}
                                disabled={saving || changedActivities.length === 0}
                                className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={14} /> Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary py-2 px-5 text-sm flex items-center gap-2"
                            >
                                <CheckCircle2 size={14} /> Fermer
                            </button>
                        </div>
                    </footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function BudgetAllocationSummary({
    budgetAllocation,
    currentBudgetEur,
    totalAllocatedEur,
}: {
    budgetAllocation: Array<{ key: string; label: string; amountEur: number }>;
    currentBudgetEur: number;
    totalAllocatedEur: number;
}) {
    const safeTotal = Math.max(0, currentBudgetEur);
    const overBudget = totalAllocatedEur > safeTotal;

    return (
        <section
            className="border rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-widest text-light-muted font-bold">Répartition actuelle du budget</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {Math.round(Math.max(0, totalAllocatedEur)).toLocaleString('fr-FR')} € alloués /{' '}
                    {Math.round(safeTotal).toLocaleString('fr-FR')} €
                </p>
            </div>

            <ul className="space-y-2">
                {budgetAllocation.map((item) => {
                    const amount = Math.max(0, item.amountEur);
                    const pct = safeTotal > 0 ? (amount / safeTotal) * 100 : 0;
                    return (
                        <li key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                                    {item.label}
                                </span>
                                <span style={{ color: 'var(--muted-foreground)' }}>
                                    {Math.round(amount).toLocaleString('fr-FR')} € ({pct.toFixed(0)}%)
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full border overflow-hidden"
                                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                            >
                                <div className="h-full bg-[var(--primary)]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                            </div>
                        </li>
                    );
                })}
            </ul>

            {overBudget && <p className="text-xs text-error">Allocation supérieure au budget total.</p>}
        </section>
    );
}
