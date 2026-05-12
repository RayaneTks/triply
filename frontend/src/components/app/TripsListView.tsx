'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    AlertTriangle,
    Calendar,
    ChevronRight,
    Inbox,
    MapPin,
    MoreVertical,
    Plus,
    Trash2,
    Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { listStoredTrips, type StoredTrip } from '../../lib/local-trips-store';
import { formatTripDateRange } from '../../lib/format-trip-dates';
import { authClient } from '../../lib/auth-client';
import { tripsClient } from '../../lib/trips-client';
import { tripApiToStoredTripForList } from '../../lib/trip-view-adapter';

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
    const [trips, setTrips] = useState<TripListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [pendingDelete, setPendingDelete] = useState<TripListItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            if (pendingDelete.source === 'api') {
                await tripsClient.delete(pendingDelete.id);
            } else {
                deleteLocalTrip(pendingDelete.id);
            }
            setTrips((current) => current.filter((t) => t.id !== pendingDelete.id));
            setPendingDelete(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Suppression impossible.');
        } finally {
            setDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse space-y-12">
                <div className="h-12 bg-slate-200 w-1/3 rounded-lg" />
                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 bg-slate-100 rounded-[32px] w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
            <PageHeader
                title="Mes voyages"
                subtitle="Retrouvez vos itinéraires cadrés et vos brouillons de planification."
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
                    title="Le cockpit est vide"
                    description="Aucun voyage côté serveur (connecté) ou en brouillon local. Terminez le wizard ou créez un voyage depuis l’API."
                    action={<Link href="/planifier" className="btn-primary">Commencer le cadrage</Link>}
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
                                                    ? 'px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs uppercase border border-emerald-100'
                                                    : 'px-3 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs uppercase border border-amber-100'
                                            }
                                        >
                                            {trip.status === 'planned' ? 'Enregistré' : 'Brouillon'}
                                        </span>
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
                                            onClick={() => {
                                                setOpenMenuId(null);
                                                setPendingDelete(trip);
                                                setDeleteError(null);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm font-bold text-error hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Supprimer ce séjour
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pendingDelete && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
                    style={{ backgroundColor: 'var(--overlay, rgba(15,23,42,0.6))' }}
                    onClick={() => (deleting ? undefined : setPendingDelete(null))}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-md w-full bg-card rounded-[32px] p-8 space-y-6 shadow-2xl border border-light-border"
                    >
                        <div className="w-14 h-14 bg-red-50 text-error rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-display font-bold">Supprimer ce séjour ?</h3>
                            <p className="text-sm text-light-muted leading-relaxed">
                                Vous êtes sur le point de supprimer définitivement{' '}
                                <strong>{pendingDelete.destination}</strong>. Cette action est irréversible et
                                effacera l'itinéraire associé, les activités et les transports rattachés.
                            </p>
                        </div>
                        {deleteError && (
                            <p className="text-sm font-medium text-error" role="alert">
                                {deleteError}
                            </p>
                        )}
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="bg-error text-white font-bold py-3 rounded-2xl shadow-lg shadow-error/20 disabled:opacity-60"
                            >
                                {deleting ? 'Suppression…' : 'Oui, supprimer ce séjour'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                disabled={deleting}
                                className="text-light-muted font-bold py-3 rounded-2xl hover:bg-light-bg disabled:opacity-60"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
