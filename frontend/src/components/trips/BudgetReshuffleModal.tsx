'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Sparkles,
    TrendingDown,
    Wallet,
    X,
} from 'lucide-react';

import {
    swapKindEmoji,
    swapKindLabel,
    tripBudgetClient,
    type BudgetReshufflePayload,
    type BudgetSwap,
} from '../../lib/trip-budget-client';
import { cn } from '../../lib/utils';

interface BudgetReshuffleModalProps {
    open: boolean;
    onClose: () => void;
    tripId: string;
    /** Current total budget (EUR) — used to scale the slider range. */
    currentBudgetEur: number;
}

export function BudgetReshuffleModal({ open, onClose, tripId, currentBudgetEur }: BudgetReshuffleModalProps) {
    const maxSlider = useMemo(() => Math.max(100, Math.round(currentBudgetEur || 1000)), [currentBudgetEur]);
    const initialTarget = useMemo(() => Math.max(50, Math.round(maxSlider * 0.15)), [maxSlider]);

    const [savingsTarget, setSavingsTarget] = useState(initialTarget);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BudgetReshufflePayload | null>(null);

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const fresh = await tripBudgetClient.reshuffle(tripId, savingsTarget);
            setResult(fresh);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur réseau.');
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setResult(null);
        setError(null);
    }

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Réduire le budget"
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
                    className="relative triply-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    <header className="flex items-start justify-between gap-4 p-6 border-b border-light-border">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                                    color: 'var(--primary)',
                                }}
                            >
                                <TrendingDown size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-light-foreground">
                                    Alléger le budget
                                </h2>
                                <p className="text-sm text-light-muted mt-1">
                                    Triply classe vos dépenses par impact et propose des alternatives pour atteindre votre objectif.
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

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {!result && (
                            <>
                                <div className="bg-light-bg border border-light-border rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="savings-slider"
                                            className="text-xs uppercase tracking-widest text-light-muted font-bold flex items-center gap-2"
                                        >
                                            <Wallet size={11} /> Économies visées
                                        </label>
                                        <span className="text-2xl font-display font-bold text-brand">
                                            −{savingsTarget.toLocaleString('fr-FR')} €
                                        </span>
                                    </div>
                                    <input
                                        id="savings-slider"
                                        type="range"
                                        min={50}
                                        max={maxSlider}
                                        step={25}
                                        value={savingsTarget}
                                        onChange={(e) => setSavingsTarget(Number(e.target.value))}
                                        className="w-full accent-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
                                    />
                                    <div className="flex justify-between text-[11px] text-light-muted">
                                        <span>50 €</span>
                                        <span>{maxSlider.toLocaleString('fr-FR')} €</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                                        <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                                        <p className="text-sm text-error">{error}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {result && !loading && (
                            <div className="space-y-4">
                                <ResultSummary result={result} />
                                {result.swaps.length === 0 ? (
                                    <p className="text-sm text-light-muted text-center py-8">
                                        Aucune dépense à alléger dans ce voyage pour l’instant.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {result.swaps.map((s) => (
                                            <SwapRow key={s.id} swap={s} />
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <Loader2 size={32} className="animate-spin text-brand" />
                                <p className="text-sm font-bold text-light-foreground">Recherche d’économies en cours…</p>
                            </div>
                        )}
                    </div>

                    <footer className="flex items-center justify-between gap-3 p-6 border-t border-light-border bg-light-bg/30">
                        {result ? (
                            <>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                >
                                    Ajuster la cible
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Terminé
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-xs text-light-muted">
                                    Estimations indicatives — chaque suggestion reste à confirmer dans le détail.
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void run()}
                                    disabled={loading}
                                    className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> Proposer des économies
                                </button>
                            </>
                        )}
                    </footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function ResultSummary({ result }: { result: BudgetReshufflePayload }) {
    const pct = result.total_cost_eur > 0 ? (result.total_savings_eur / result.total_cost_eur) * 100 : 0;

    return (
        <div
            className={cn(
                'rounded-2xl border p-4',
                result.target_met
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50',
            )}
        >
            <div className="flex items-center gap-2 mb-2">
                {result.target_met ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                    <AlertTriangle size={16} className="text-amber-600" />
                )}
                <p className="text-sm font-bold text-light-foreground">
                    {result.target_met
                        ? `Cible atteinte : ${result.total_savings_eur.toLocaleString('fr-FR')} € économisés`
                        : `Maximum possible : ${result.total_savings_eur.toLocaleString('fr-FR')} € économisés`}
                </p>
            </div>
            <p className="text-xs text-light-muted">
                Sur un total de {result.total_cost_eur.toLocaleString('fr-FR')} € planifiés — soit{' '}
                <strong>{pct.toFixed(0)}%</strong>.
            </p>
        </div>
    );
}

function SwapRow({ swap }: { swap: BudgetSwap }) {
    return (
        <li
            className={cn(
                'flex items-start gap-3 rounded-xl p-3 border transition-colors',
                swap.recommended
                    ? 'border-brand/40 bg-brand/5'
                    : 'border-light-border bg-light-bg opacity-70',
            )}
        >
            <span className="text-xl leading-none shrink-0" aria-hidden="true">
                {swapKindEmoji(swap.kind)}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-light-foreground truncate">{swap.title}</p>
                <p className="text-xs text-light-muted mt-0.5 leading-relaxed">{swap.description}</p>
                <p className="text-[11px] text-light-muted/80 mt-1 uppercase tracking-wider">
                    {swapKindLabel(swap.kind)} · impact {{ low: 'faible', medium: 'moyen', high: 'fort' }[swap.impact_level]}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-display font-bold text-brand">
                    −{swap.savings_eur.toLocaleString('fr-FR')} €
                </p>
                <p className="text-[11px] text-light-muted">
                    {swap.current_cost_eur.toLocaleString('fr-FR')} € → {swap.proposed_cost_eur.toLocaleString('fr-FR')} €
                </p>
            </div>
        </li>
    );
}
