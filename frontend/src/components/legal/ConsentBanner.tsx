'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { getStoredConsent, saveConsent, type ConsentChoices } from '../../lib/consent-client';

/**
 * Bandeau de consentement cookies (RGPD). S'affiche tant qu'aucun choix
 * (version courante) n'est stocké localement. Persiste localStorage + best-effort
 * backend via saveConsent(). Cookies fonctionnels = toujours actifs (strictement
 * nécessaires : session, préférences d'affichage).
 */
export function ConsentBanner() {
    const [visible, setVisible] = useState(false);
    const [customizing, setCustomizing] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Décision côté client uniquement (localStorage) → pas de mismatch SSR.
        if (!getStoredConsent()) setVisible(true);
    }, []);

    const commit = useCallback(async (choices: ConsentChoices) => {
        setSaving(true);
        try {
            await saveConsent(choices);
        } finally {
            setSaving(false);
            setVisible(false);
        }
    }, []);

    const acceptAll = useCallback(() => commit({ analytics: true, marketing: true, functional: true }), [commit]);
    const refuseAll = useCallback(() => commit({ analytics: false, marketing: false, functional: true }), [commit]);
    const saveCustom = useCallback(
        () => commit({ analytics, marketing, functional: true }),
        [commit, analytics, marketing],
    );

    useEffect(() => {
        if (!visible) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) void refuseAll();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visible, saving, refuseAll]);

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-modal="false"
            aria-label="Consentement aux cookies"
            className="fixed inset-x-0 bottom-0 z-[10040] px-4 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
            <div className="triply-card mx-auto w-full max-w-3xl overflow-hidden p-5 shadow-2xl sm:p-6">
                <div className="flex items-start gap-4">
                    <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand sm:flex">
                        <Cookie size={20} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-light-foreground">Cookies & confidentialité</p>
                            <p className="text-xs leading-relaxed text-light-muted">
                                Triply utilise des cookies nécessaires au fonctionnement (session, préférences) et,
                                avec votre accord, des cookies de mesure d&apos;audience pour améliorer l&apos;app.{' '}
                                <Link href="/legal/confidentialite" className="font-bold text-brand hover:underline">
                                    En savoir plus
                                </Link>
                                .
                            </p>
                        </div>

                        {customizing && (
                            <div className="space-y-2 rounded-2xl border border-light-border bg-light-bg/50 p-3">
                                <label className="flex cursor-not-allowed items-center justify-between gap-3 text-xs font-bold text-light-muted">
                                    <span>Nécessaires <span className="font-medium">(toujours actifs)</span></span>
                                    <input type="checkbox" checked disabled className="h-4 w-4 accent-[var(--primary)]" />
                                </label>
                                <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-bold text-light-foreground">
                                    <span>Mesure d&apos;audience</span>
                                    <input
                                        type="checkbox"
                                        checked={analytics}
                                        onChange={(e) => setAnalytics(e.target.checked)}
                                        className="h-4 w-4 accent-[var(--primary)]"
                                    />
                                </label>
                                <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-bold text-light-foreground">
                                    <span>Marketing</span>
                                    <input
                                        type="checkbox"
                                        checked={marketing}
                                        onChange={(e) => setMarketing(e.target.checked)}
                                        className="h-4 w-4 accent-[var(--primary)]"
                                    />
                                </label>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={acceptAll}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                                Tout accepter
                            </button>
                            {customizing ? (
                                <button
                                    type="button"
                                    onClick={saveCustom}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl border border-light-border bg-card px-4 py-2 text-sm font-bold text-light-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
                                >
                                    Enregistrer mes choix
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setCustomizing(true)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl border border-light-border bg-card px-4 py-2 text-sm font-bold text-light-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
                                >
                                    Personnaliser
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={refuseAll}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-light-muted transition-colors hover:text-light-foreground disabled:opacity-60"
                            >
                                Refuser
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Refuser et fermer"
                        onClick={refuseAll}
                        disabled={saving}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-light-muted transition-colors hover:bg-light-bg hover:text-light-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
