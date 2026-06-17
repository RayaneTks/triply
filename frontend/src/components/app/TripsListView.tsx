'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    Calendar,
    ChevronRight,
    Cloud,
    HardDrive,
    Inbox,
    MapPin,
    MoreVertical,
    Plus,
    Trash2,
    Wallet,
} from 'lucide-react';

import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { TripListSkeleton } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { listStoredTrips, type StoredTrip } from '../../lib/local-trips-store';
import { formatTripDateRange } from '../../lib/format-trip-dates';
import { authClient } from '../../lib/auth-client';
import { tripsClient } from '../../lib/trips-client';
import { tripApiToStoredTripForList } from '../../lib/trip-view-adapter';
import { useAuthSession } from '../../hooks/useAuthSession';
import { AuthRequiredCard } from '../auth/AuthRequiredCard';

interface TripListItem extends StoredTrip {
    /** Source de la donnée pour décider si on appelle l'API ou le localStorage à la suppression. */
    source: 'api' | 'local';
}

const LOCAL_STORAGE_KEY = 'triply_saved_trips_v1';

function deleteLocalTrip(id: string): void {
    if (typeof window === 'undefined') return;
    try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as StoredTrip[];
        if (!Array.isArray(parsed)) return;
        const filtered = parsed.filter((t) => t.id !== id);
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
        // Ignore : best effort de nettoyage.
    }
}

export function TripsListView() {
    const router = useRouter();
    const pathname = usePathname();
    const { isConnected, isLoading: authLoading } = useAuthSession();
    const { toast } = useToast();
    const [trips, setTrips] = useState<TripListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const load = async () => {
        if (authClient.getToken()) {
            try {
                const items = await tripsClient.list();
                return items.map<TripListItem>((t) => ({
                    ...tripApiToStoredTripForList(t),
                    source: 'api',
                }));
            } catch {
                return listStoredTrips().map<TripListItem>((t) => ({ ...t, source: 'local' }));
            }
        }
        return listStoredTrips().map<TripListItem>((t) => ({ ...t, source: 'local' }));
    };

    useEffect(() => {
        let cancelled = false;
        // Resynchronisation au changement de route : spinner avant rechargement de la liste.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);

        const t = window.setTimeout(async () => {
            const items = await load();
            if (!cancelled) {
                setTrips(items);
                setIsLoading(false);
            }
        }, 150);

        const onAuth = async () => {
            const items = await load();
            if (!cancelled) setTrips(items);
        };
        window.addEventListener('triply-auth-changed', onAuth);

        return () => {
            cancelled = true;
            window.clearTimeout(t);
            window.removeEventListener('triply-auth-changed', onAuth);
        };
         
    }, [pathname]);

    useEffect(() => {
        if (!openMenuId) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, [openMenuId]);

    const reinsertTrip = (trip: TripListItem, index: number) => {
        setTrips((current) => {
            if (current.some((t) => t.id === trip.id)) return current;
            const next = [...current];
            next.splice(Math.min(index, next.length), 0, trip);
            return next;
        });
    };

    const commitDelete = async (trip: TripListItem, index: number) => {
        try {
            if (trip.source === 'api') {
                await tripsClient.delete(trip.id);
            } else {
                deleteLocalTrip(trip.id);
            }
        } catch (err) {
            // Échec de la suppression réelle → on réaffiche le voyage et on alerte.
            reinsertTrip(trip, index);
            toast({
                variant: 'error',
                title: 'Suppression impossible',
                description: err instanceof Error ? err.message : 'Réessayez dans un instant.',
                duration: 0,
            });
        }
    };

    /**
     * Suppression optimiste : on retire la carte immédiatement et on laisse 5s
     * pour annuler via le toast. La suppression réelle (API ou localStorage)
     * n'est déclenchée qu'à l'expiration du toast (rollback si "Annuler").
     */
    const handleRequestDelete = (trip: TripListItem) => {
        setOpenMenuId(null);
        const index = trips.findIndex((t) => t.id === trip.id);
        setTrips((current) => current.filter((t) => t.id !== trip.id));

        let undone = false;
        toast({
            variant: 'info',
            title: 'Voyage supprimé',
            description: trip.destination,
            duration: 5000,
            action: {
                label: 'Annuler',
                onClick: () => {
                    undone = true;
                    reinsertTrip(trip, index);
                },
            },
            onDismiss: (reason) => {
                if (reason === 'action' || undone) return;
                void commitDelete(trip, index);
            },
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20 space-y-12">
                <div className="space-y-3">
                    <div className="h-10 w-1/3 animate-pulse rounded-lg bg-light-border/70" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-light-border/50" />
                </div>
                <TripListSkeleton count={3} />
            </div>
        );
    }

    if (!isConnected) {
        return (
            <AuthRequiredCard
                title="Connectez-vous pour accéder à vos voyages"
                description="Votre espace voyages est réservé aux comptes connectés. Connectez-vous ou créez un compte pour retrouver et gérer vos itinéraires."
            />
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
            <PageHeader
                title="Mes voyages"
                subtitle="Retrouvez vos itinéraires prêts et vos voyages en préparation."
                actions={
                    <button
                        type="button"
                        onClick={() => router.push('/planifier')}
                        className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                    >
                        <Plus size={16} /> Nouveau voyage
                    </button>
                }
            />

            {trips.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title="Aucun voyage pour l’instant"
                    description="Créez votre premier voyage : Triply vous aide à le préparer de A à Z, jour par jour."
                    action={<Link href="/planifier" className="btn-primary">Créer un voyage</Link>}
                />
            ) : (
                <div className="grid gap-6 mt-12">
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            className="triply-card p-8 group flex flex-col md:flex-row md:items-center justify-between gap-6 relative"
                        >
                            <div
                                role="link"
                                tabIndex={0}
                                onClick={() => router.push(`/voyages/${trip.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/voyages/${trip.id}`);
                                    }
                                }}
                                className="flex gap-8 items-center cursor-pointer flex-1"
                            >
                                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <MapPin size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">
                                        {trip.destination}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-light-muted">
                                        <span className="flex items-center gap-2">
                                            <Calendar size={14} />{' '}
                                            {formatTripDateRange(trip.startDate, trip.endDate)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Wallet size={14} /> {trip.budget.toLocaleString('fr-FR')} €
                                        </span>
                                        <span
                                            className={
                                                trip.status === 'planned'
                                                    ? 'px-3 py-0.5 bg-brand/10 text-brand rounded-full text-xs uppercase border border-brand/30'
                                                    : 'px-3 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs uppercase border border-amber-100'
                                            }
                                        >
                                            {trip.status === 'planned' ? 'Enregistré' : 'Brouillon'}
                                        </span>
                                        {trip.source === 'api' ? (
                                            <span
                                                className="flex items-center gap-1.5 px-3 py-0.5 bg-brand/5 text-brand rounded-full text-xs border border-brand/20"
                                                title="Synchronisé sur votre compte Triply"
                                            >
                                                <Cloud size={13} /> Cloud
                                            </span>
                                        ) : (
                                            <span
                                                className="flex items-center gap-1.5 px-3 py-0.5 bg-light-bg text-light-muted rounded-full text-xs border border-light-border"
                                                title="Stocké uniquement sur cet appareil (brouillon local non synchronisé)"
                                            >
                                                <HardDrive size={13} /> Local
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 relative">
                                <span className="text-sm font-bold text-brand md:opacity-0 group-hover:opacity-100 transition-all hidden md:flex items-center gap-1">
                                    Ouvrir <ChevronRight size={16} />
                                </span>
                                <button
                                    type="button"
                                    aria-label="Menu du voyage"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === trip.id ? null : trip.id);
                                    }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-light-muted hover:bg-light-bg hover:text-light-foreground transition-colors"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {openMenuId === trip.id && (
                                    <div
                                        ref={menuRef}
                                        className="absolute top-12 right-0 z-30 w-56 bg-card border border-light-border rounded-2xl shadow-xl py-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleRequestDelete(trip)}
                                            className="w-full px-4 py-3 text-left text-sm font-bold text-error hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Supprimer ce voyage
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
