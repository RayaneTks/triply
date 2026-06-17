'use client';

import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Bloc de chargement neutre, theme-aware (tokens light/dark) au lieu d'un
 * spinner nu. S'appuie sur `animate-pulse` et les tokens `light-bg` /
 * `light-border` pour rester cohérent avec la charte en mode clair et sombre.
 */
export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-light-border/70', className)} />;
}

/** Carte voyage fantôme — calquée sur la vraie carte de TripsListView. */
export function TripCardSkeleton() {
    return (
        <div className="triply-card flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-8">
                <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    );
}

export function TripListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-6" aria-busy="true" aria-label="Chargement de vos voyages">
            {Array.from({ length: count }, (_, i) => (
                <TripCardSkeleton key={i} />
            ))}
        </div>
    );
}

/** Panneau profil fantôme (header + grille de champs). */
export function ProfilePanelSkeleton() {
    return (
        <div className="space-y-10" aria-busy="true" aria-label="Chargement de votre profil">
            <div className="flex flex-col items-center gap-8 border-b border-light-border pb-10 md:flex-row">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-7 w-48" />
                    <div className="flex flex-wrap gap-3">
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Liste d'activités fantôme pour l'onglet itinéraire. */
export function ActivitiesSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Chargement de l'itinéraire">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="triply-card space-y-4 p-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ))}
        </div>
    );
}
