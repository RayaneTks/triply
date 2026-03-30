'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Download, FolderClock, MapPin, Sparkles, UserRound, Wallet } from 'lucide-react';
import { Logo } from '../Logo/Logo';

export type LandingGuidanceMode = 'guided' | 'autonomous';

interface LandingHubProps {
    stage: 'hero' | 'guidance';
    hasDraft?: boolean;
    draftSummary?: {
        destination: string;
        travelDates: string;
        budget: string;
    } | null;
    onPrimaryAction: () => void;
    onSelectGuidance: (mode: LandingGuidanceMode) => void;
    onResumeDraft?: () => void;
    onLoginClick?: () => void;
    onViewTrips?: () => void;
    isConnected?: boolean;
    canInstall?: boolean;
    isStandalone?: boolean;
    platformHint?: 'ios' | 'android' | 'desktop' | 'unknown';
    onInstall?: () => void;
}

function ActionCard({
    title,
    description,
    onClick,
    icon,
    tone = 'light',
}: {
    title: string;
    description: string;
    onClick: () => void;
    icon: React.ReactNode;
    tone?: 'light' | 'dark';
}) {
    return (
        <motion.button
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={`rounded-[1.75rem] border p-5 text-left transition-all ${
                tone === 'dark'
                    ? 'border-white/10 bg-[var(--app-surface-dark)] text-white shadow-[var(--shadow-lg)]'
                    : 'border-[var(--app-border)] bg-white text-[color:var(--foreground)] shadow-[var(--shadow-sm)]'
            }`}
        >
            <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                    tone === 'dark'
                        ? 'bg-white/10 text-white'
                        : 'bg-[var(--app-brand-soft)] text-[color:var(--primary)]'
                }`}
            >
                {icon}
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${tone === 'dark' ? 'text-slate-300' : 'text-[color:var(--app-muted)]'}`}>
                {description}
            </p>
        </motion.button>
    );
}

function QuickTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-white/90 p-4 shadow-[var(--shadow-sm)]">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                {icon}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{value}</p>
        </div>
    );
}

export function LandingHub({
    stage,
    hasDraft = false,
    draftSummary,
    onPrimaryAction,
    onSelectGuidance,
    onResumeDraft,
    onLoginClick,
    onViewTrips,
    isConnected = false,
    canInstall = false,
    isStandalone = false,
    platformHint = 'unknown',
    onInstall,
}: LandingHubProps) {
    const showIosInstallHint = !isStandalone && platformHint === 'ios';

    return (
        <div className="space-y-4">
            <section className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--shadow-md)] md:p-8">
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(0,150,199,0.16),transparent_58%),radial-gradient(circle_at_top_right,rgba(245,165,36,0.14),transparent_48%)]" />

                <div className="relative z-10 flex flex-col gap-6">
                    <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#0b1f33]/12 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0b1f33]">
                            <Logo size="small" tone="dark" width={28} height={28} />
                        </span>
                        <span>Triply</span>
                    </div>

                    <div className="max-w-3xl">
                        <h2 className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl lg:text-6xl">
                            Vols, hotels, activites. Tout au meme endroit.
                        </h2>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--app-muted)] sm:text-lg">
                            Choisissez une destination, vos dates et votre budget. Triply garde le reste en ordre.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <QuickTile icon={<MapPin size={18} />} label="Destination" value={draftSummary?.destination ?? 'Ou partez-vous ?'} />
                        <QuickTile icon={<CalendarDays size={18} />} label="Dates" value={draftSummary?.travelDates ?? 'Choisir mes dates'} />
                        <QuickTile icon={<Wallet size={18} />} label="Budget" value={draftSummary?.budget ?? 'Definir mon budget'} />
                        <QuickTile icon={<UserRound size={18} />} label="Voyageurs" value="1 ou plusieurs" />
                    </div>

                    {stage === 'hero' ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <button
                                type="button"
                                onClick={onPrimaryAction}
                                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[1.35rem] bg-[var(--primary)] px-5 py-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                            >
                                <Sparkles size={18} />
                                Creer mon voyage
                            </button>
                            {hasDraft && onResumeDraft ? (
                                <button
                                    type="button"
                                    onClick={onResumeDraft}
                                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[1.35rem] border border-[var(--app-border)] bg-white px-5 py-4 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--app-brand-soft)]"
                                >
                                    <FolderClock size={18} />
                                    Reprendre
                                </button>
                            ) : null}
                            {onViewTrips ? (
                                <button
                                    type="button"
                                    onClick={onViewTrips}
                                    className="inline-flex min-h-13 items-center justify-center rounded-[1.35rem] border border-[var(--app-border)] bg-white/88 px-5 py-4 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-white"
                                >
                                    Mes voyages
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <ActionCard
                                title="Triply m aide"
                                description="Triply propose et organise avec vous."
                                onClick={() => onSelectGuidance('guided')}
                                icon={<Sparkles size={22} />}
                                tone="dark"
                            />
                            <ActionCard
                                title="Je fais mes choix"
                                description="Vous avancez a votre rythme."
                                onClick={() => onSelectGuidance('autonomous')}
                                icon={<UserRound size={22} />}
                            />
                        </div>
                    )}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                {hasDraft && draftSummary ? (
                    <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/86 p-5 shadow-[var(--shadow-sm)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Brouillon</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Reprendre votre voyage</h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <QuickTile icon={<MapPin size={16} />} label="Destination" value={draftSummary.destination} />
                            <QuickTile icon={<CalendarDays size={16} />} label="Dates" value={draftSummary.travelDates} />
                            <QuickTile icon={<Wallet size={16} />} label="Budget" value={draftSummary.budget} />
                        </div>
                        {onResumeDraft ? (
                            <button
                                type="button"
                                onClick={onResumeDraft}
                                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                            >
                                Continuer
                            </button>
                        ) : null}
                    </article>
                ) : (
                    <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/86 p-5 shadow-[var(--shadow-sm)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Triply</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Tout au meme endroit</h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <QuickTile icon={<MapPin size={16} />} label="Vols" value="Comparer vite" />
                            <QuickTile icon={<CalendarDays size={16} />} label="Hotels" value="Garder les dates" />
                            <QuickTile icon={<Wallet size={16} />} label="Budget" value="Suivre les depenses" />
                        </div>
                    </article>
                )}

                <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/86 p-5 shadow-[var(--shadow-sm)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Mobile</p>
                    <h3 className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                        {canInstall || showIosInstallHint ? 'Ajouter Triply a l ecran d accueil' : isConnected ? 'Gardez Triply sous la main' : 'Retrouvez vos voyages'}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--app-muted)]">
                        {canInstall
                            ? "Ajoutez Triply a l ecran d accueil."
                            : showIosInstallHint
                              ? "Sur iPhone, utilisez Partager puis Ajouter a l ecran d accueil."
                              : isConnected
                                ? 'Vos voyages restent synchronises.'
                                : 'Connectez-vous pour reprendre plus tard.'}
                    </p>
                    <button
                        type="button"
                        onClick={canInstall ? onInstall : onLoginClick}
                        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-brand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-white"
                    >
                        <Download size={16} />
                        <span>
                            {canInstall || showIosInstallHint
                                ? 'Voir comment'
                                : isConnected
                                  ? 'Continuer'
                                  : 'Se connecter'}
                        </span>
                    </button>
                </article>
            </section>
        </div>
    );
}
