'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    Archive,
    ArrowLeft,
    Bot,
    Calendar,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    Map as MapIcon,
    MapPin,
    RotateCcw,
    Sparkles,
    Trash2,
    Users,
    Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader } from '../../components/ui/PageHeader';
import { WorldMap } from '../../components/Map/Map';
import { LikeButtons } from '../../components/activities/LikeButtons';
import { NearbyRestaurants } from '../../components/activities/NearbyRestaurants';
import { LocalTransportsSection } from '../../components/trips/LocalTransportsSection';
import { FlightsSection } from '../../components/trips/FlightsSection';
import { HotelsSection } from '../../components/trips/HotelsSection';
import { cn } from '../../lib/utils';
import { getStoredTrip } from '../../lib/local-trips-store';
import { ErrorState } from '../../components/ui/ErrorState';
import { authClient } from '../../lib/auth-client';
import { tripsClient, type TripApi } from '../../lib/trips-client';
import {
    activitiesClient,
    type ActivityDayBucket,
    type ActivityResource,
    type LikedState,
} from '../../lib/activities-client';
import { citiesClient } from '../../lib/cities-client';
import { tripDetailFromApi, tripDetailFromStored, type TripDetailDisplay } from '../../lib/trip-view-adapter';

interface UndoneActivity {
    id: string;
    tripId: string;
    timer: number;
}

export function TripDetailView() {
    const { tripId } = useParams<{ tripId: string }>();
    const [activeTab, setActiveTab] = useState<'itinerary' | 'flights' | 'hotels' | 'map' | 'docs'>('itinerary');
    const [isLoading, setIsLoading] = useState(true);
    const [apiTrip, setApiTrip] = useState<TripApi | null | undefined>(undefined);
    const [storedOnly, setStoredOnly] = useState<ReturnType<typeof getStoredTrip>>(undefined);

    const [activitiesByDay, setActivitiesByDay] = useState<ActivityDayBucket[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);

    const [pendingCityDelete, setPendingCityDelete] = useState<string | null>(null);
    const [deletingCity, setDeletingCity] = useState(false);
    const [undoStack, setUndoStack] = useState<UndoneActivity[]>([]);

    const reloadActivities = useCallback(async () => {
        if (!tripId || !authClient.getToken()) return;
        setActivitiesLoading(true);
        setActivitiesError(null);
        try {
            const result = await activitiesClient.groupedByDay(tripId);
            setActivitiesByDay(result.days ?? []);
        } catch (err) {
            setActivitiesError(err instanceof Error ? err.message : 'Erreur de chargement.');
        } finally {
            setActivitiesLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        let cancelled = false;
        if (!tripId) {
            setApiTrip(null);
            setStoredOnly(undefined);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setApiTrip(undefined);
        setStoredOnly(undefined);

        (async () => {
            if (authClient.getToken()) {
                try {
                    const remote = await tripsClient.get(tripId);
                    if (cancelled) return;
                    if (remote) {
                        setApiTrip(remote);
                        setStoredOnly(undefined);
                        setIsLoading(false);
                        void reloadActivities();
                        return;
                    }
                } catch {
                    // Fall through to stored
                }
            }
            const local = getStoredTrip(tripId);
            if (!cancelled) {
                setApiTrip(null);
                setStoredOnly(local);
                setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tripId, reloadActivities]);

    useEffect(() => {
        // Cleanup pending undo timers on unmount
        return () => {
            undoStack.forEach((u) => window.clearTimeout(u.timer));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const trip: TripDetailDisplay | null = useMemo(() => {
        if (apiTrip) return tripDetailFromApi(apiTrip);
        if (storedOnly) return tripDetailFromStored(storedOnly);
        return null;
    }, [apiTrip, storedOnly]);

    const cityGroups = useMemo(() => {
        const groups = new globalThis.Map<string, ActivityResource[]>();
        for (const bucket of activitiesByDay) {
            for (const activity of bucket.activities) {
                const city = activity.attributes.city?.trim() || 'Sans ville';
                if (!groups.has(city)) groups.set(city, []);
                groups.get(city)!.push(activity);
            }
        }
        return groups;
    }, [activitiesByDay]);

    const setActivityLiked = (activityId: string, liked: LikedState) => {
        setActivitiesByDay((current) =>
            current.map((day) => ({
                ...day,
                activities: day.activities.map((a) =>
                    a.id === activityId
                        ? { ...a, attributes: { ...a.attributes, liked_state: liked } }
                        : a,
                ),
            })),
        );
    };

    const handleDeleteActivity = async (activity: ActivityResource) => {
        if (!tripId) return;
        const activityId = activity.id;
        try {
            await activitiesClient.delete(tripId, activityId);
            setActivitiesByDay((current) =>
                current.map((day) => ({
                    ...day,
                    activities: day.activities.filter((a) => a.id !== activityId),
                })),
            );
            const timer = window.setTimeout(() => {
                setUndoStack((stack) => stack.filter((u) => u.id !== activityId));
            }, 5000);
            setUndoStack((stack) => [...stack, { id: activityId, tripId, timer }]);
        } catch (err) {
            setActivitiesError(err instanceof Error ? err.message : 'Suppression impossible.');
        }
    };

    const handleRestoreActivity = async (activityId: string) => {
        if (!tripId) return;
        const entry = undoStack.find((u) => u.id === activityId);
        if (entry) {
            window.clearTimeout(entry.timer);
        }
        setUndoStack((stack) => stack.filter((u) => u.id !== activityId));
        try {
            await activitiesClient.restore(tripId, activityId);
            await reloadActivities();
        } catch (err) {
            setActivitiesError(err instanceof Error ? err.message : 'Restauration impossible.');
        }
    };

    const handleDeleteCity = async () => {
        if (!tripId || !pendingCityDelete) return;
        setDeletingCity(true);
        try {
            await citiesClient.deleteCity(tripId, pendingCityDelete);
            setPendingCityDelete(null);
            await reloadActivities();
        } catch (err) {
            setActivitiesError(err instanceof Error ? err.message : 'Suppression de la ville impossible.');
        } finally {
            setDeletingCity(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 space-y-12 animate-pulse">
                <div className="h-10 bg-slate-200 w-1/4 rounded-lg" />
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-100 rounded-[32px]" />
                        ))}
                    </div>
                    <div className="h-96 bg-slate-100 rounded-[32px]" />
                </div>
            </div>
        );
    }

    if (!tripId || !trip) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <ErrorState
                    title="Voyage introuvable"
                    description="Aucun voyage avec cet identifiant sur le serveur (si vous êtes connecté) ni en brouillon local sur cet appareil."
                    primaryAction={{ label: 'Mes voyages', to: '/voyages' }}
                    secondaryAction={{ label: 'Planifier', to: '/planifier' }}
                />
            </div>
        );
    }

    const hasRealActivities = activitiesByDay.some((d) => d.activities.length > 0);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <Link
                href="/voyages"
                className="inline-flex items-center gap-2 text-light-muted hover:text-brand font-bold text-xs uppercase mb-8 transition-colors"
            >
                <ArrowLeft size={14} /> Retour à mes voyages
            </Link>

            <PageHeader
                title={`Voyage — ${trip.destination}`}
                subtitle={`${trip.dates} • ${trip.travelers} voyageur${trip.travelers > 1 ? 's' : ''}`}
                actions={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                        >
                            <Copy size={14} /> Dupliquer
                        </button>
                        <Link
                            href={`/recap-voyage?tripId=${tripId}`}
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                        >
                            <FileText size={14} /> Récap
                        </Link>
                        <button
                            type="button"
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50"
                        >
                            <Archive size={14} /> Archiver
                        </button>
                    </div>
                }
            />

            <p className="text-sm text-light-muted font-bold mb-10 max-w-2xl">{trip.fullLabel}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'Budget total', val: `${trip.budget}€`, icon: Wallet, color: 'text-brand' },
                    { label: 'Budget restant (estim.)', val: `${trip.remainingBudget}€`, icon: Sparkles, color: 'text-emerald-600' },
                    { label: 'Statut', val: trip.statusLabel, icon: Clock, color: 'text-amber-600' },
                    { label: 'Destination', val: trip.destination, icon: MapPin, color: 'text-brand' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-light-border p-6 rounded-3xl space-y-1">
                        <p className="text-xs font-bold text-light-muted uppercase tracking-widest flex items-center gap-2">
                            <stat.icon size={12} className={stat.color} /> {stat.label}
                        </p>
                        <p className={cn('text-xl font-display font-bold', stat.color)}>{stat.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <nav className="flex flex-wrap gap-2 p-1.5 bg-light-bg rounded-2xl w-fit border border-light-border">
                        {[
                            { id: 'itinerary' as const, label: 'Jour par jour' },
                            { id: 'flights' as const, label: 'Vols' },
                            { id: 'hotels' as const, label: 'Hôtels' },
                            { id: 'map' as const, label: 'Carte interactive' },
                            { id: 'docs' as const, label: 'Notes & docs' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'px-6 py-2 rounded-xl text-sm font-bold transition-all',
                                    activeTab === tab.id
                                        ? 'bg-card text-brand shadow-sm'
                                        : 'text-light-muted hover:text-light-foreground',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <section>
                        {activeTab === 'itinerary' && (
                            <div className="space-y-8">
                                {activitiesError && (
                                    <p className="text-sm text-error" role="alert">
                                        {activitiesError}
                                    </p>
                                )}

                                {activitiesLoading && (
                                    <p className="text-sm text-light-muted">Chargement des activités…</p>
                                )}

                                {hasRealActivities && cityGroups.size > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-light-muted">
                                            Villes du voyage
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(cityGroups.entries()).map(([city, items]) => (
                                                <div
                                                    key={city}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 text-brand border border-brand/20 text-sm font-bold"
                                                >
                                                    <MapPin size={12} />
                                                    <span>{city}</span>
                                                    <span className="text-xs opacity-70">{items.length}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingCityDelete(city)}
                                                        className="ml-1 text-light-muted hover:text-error"
                                                        aria-label={`Supprimer la ville ${city}`}
                                                        title="Supprimer cette ville du voyage"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasRealActivities ? (
                                    activitiesByDay
                                        .filter((day) => day.activities.length > 0)
                                        .map((day) => (
                                            <div key={day.day_id} className="triply-card p-6 space-y-4">
                                                <header className="flex items-center justify-between border-b border-light-border pb-4">
                                                    <div>
                                                        <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded">
                                                            JOUR {String(day.index).padStart(2, '0')}
                                                        </span>
                                                        {day.date && (
                                                            <span className="ml-3 text-xs text-light-muted font-bold">
                                                                {new Date(day.date).toLocaleDateString('fr-FR', {
                                                                    weekday: 'long',
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-light-muted font-bold">
                                                        {day.activities.length} activité{day.activities.length > 1 ? 's' : ''}
                                                    </span>
                                                </header>
                                                <ul className="space-y-3">
                                                    {day.activities.map((activity) => (
                                                        <li
                                                            key={activity.id}
                                                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-light-bg/50 border border-light-border"
                                                        >
                                                            <div className="space-y-1 flex-1">
                                                                <p className="font-bold text-light-foreground">
                                                                    {activity.attributes.title}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-3 text-xs text-light-muted font-medium">
                                                                    {activity.attributes.city && (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <MapPin size={10} />
                                                                            {activity.attributes.city}
                                                                            {activity.attributes.country
                                                                                ? `, ${activity.attributes.country}`
                                                                                : ''}
                                                                        </span>
                                                                    )}
                                                                    {activity.attributes.duration && (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Clock size={10} />
                                                                            {activity.attributes.duration}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <NearbyRestaurants
                                                                    activityId={activity.id}
                                                                    activityTitle={activity.attributes.title}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <LikeButtons
                                                                    tripId={tripId}
                                                                    activityId={activity.id}
                                                                    initialState={activity.attributes.liked_state}
                                                                    onChange={(state) => setActivityLiked(activity.id, state)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteActivity(activity)}
                                                                    aria-label="Supprimer cette activité"
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-error hover:bg-red-50 transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                ) : (
                                    !activitiesLoading && (
                                        <div className="space-y-6">
                                            {trip.days.map((day) => (
                                                <div key={day.id} className="triply-card p-8 group relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-2 h-full bg-brand/10 transition-colors group-hover:bg-brand" />
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="space-y-4">
                                                            <span className="text-xs font-bold text-brand bg-brand/5 px-2 py-1 rounded">
                                                                JOUR 0{day.id}
                                                            </span>
                                                            <h3 className="text-2xl font-bold">{day.title}</h3>
                                                            <div className="flex items-center gap-6 text-sm text-light-muted">
                                                                <span className="flex items-center gap-2">
                                                                    <Clock size={14} /> 09:00 – 18:30
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'px-3 py-0.5 rounded-full text-xs font-bold uppercase',
                                                                        day.status === 'Cadré'
                                                                            ? 'bg-emerald-50 text-emerald-600'
                                                                            : 'bg-amber-50 text-amber-600',
                                                                    )}
                                                                >
                                                                    {day.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="text-light-border group-hover:text-brand group-hover:translate-x-2 transition-all shrink-0" />
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-xs text-light-muted font-bold">
                                                Aucune activité côté serveur pour ce voyage. Une fois des activités
                                                ajoutées, vous pourrez les liker, les supprimer ou regrouper les villes.
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {activeTab === 'flights' && tripId && (
                            <FlightsSection
                                tripId={tripId}
                                destination={trip.destination}
                                startDate={apiTrip?.start_date}
                                endDate={apiTrip?.end_date}
                                travelers={apiTrip?.travelers_count}
                                budgetTotal={apiTrip?.budget_total}
                            />
                        )}

                        {activeTab === 'hotels' && tripId && (
                            <HotelsSection
                                tripId={tripId}
                                destination={trip.destination}
                                startDate={apiTrip?.start_date}
                                endDate={apiTrip?.end_date}
                                travelers={apiTrip?.travelers_count}
                                budgetTotal={apiTrip?.budget_total}
                            />
                        )}

                        {activeTab === 'map' && (
                            <div className="aspect-video lg:aspect-auto lg:h-[600px] w-full bg-light-bg rounded-[40px] overflow-hidden border border-light-border">
                                <WorldMap accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''} />
                            </div>
                        )}

                        {activeTab === 'docs' && (
                            <div className="space-y-6">
                                {tripId && <LocalTransportsSection tripId={tripId} />}
                                <div className="triply-card p-8 lg:p-10 space-y-6">
                                    <div className="flex items-center gap-3 text-light-muted">
                                        <FileText size={22} className="text-brand" />
                                        <h3 className="text-lg font-bold text-light-foreground">Notes & documents</h3>
                                    </div>
                                    <p className="text-sm text-light-muted font-bold leading-relaxed">
                                        Zone réservée aux PDF de réservation, confirmations et notes libres. Branchement
                                        stockage / pièces jointes prévu côté API.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="triply-card p-8 border-2 border-brand/20 bg-brand/5 space-y-6"
                    >
                        <header className="flex items-center gap-3 text-brand">
                            <Bot size={24} />
                            <h3 className="font-bold">Copilote</h3>
                        </header>
                        <p className="text-sm text-brand leading-relaxed">
                            Suggestion : likez les activités que vous avez préférées pour aider Triply à affiner vos
                            prochaines recommandations.
                        </p>
                    </motion.div>

                    <div className="p-8 bg-card border border-light-border rounded-[32px] space-y-6">
                        <h4 className="font-bold flex items-center gap-2">
                            <MapIcon size={18} className="text-light-muted" /> Ressources
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { t: 'Billets & réservations', d: 'À connecter à l’API', icon: ExternalLink },
                                { t: 'Hébergement', d: 'Placeholder', icon: ExternalLink },
                            ].map((res, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between p-4 bg-light-bg rounded-xl group hover:bg-card border border-transparent hover:border-light-border transition-all"
                                >
                                    <div>
                                        <p className="text-sm font-bold">{res.t}</p>
                                        <p className="text-xs text-light-muted">{res.d}</p>
                                    </div>
                                    <res.icon size={14} className="text-light-muted group-hover:text-brand" />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-light-muted">
                        <Calendar size={14} />
                        <span>{trip.dates}</span>
                        <Users size={14} className="ml-2" />
                        <span>{trip.travelers}</span>
                    </div>
                </aside>
            </div>

            {/* Undo toasts pour activités supprimées */}
            <AnimatePresence>
                {undoStack.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
                        {undoStack.map((u) => (
                            <motion.div
                                key={u.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-light-foreground text-white px-5 py-3 rounded-full text-sm font-bold flex items-center gap-3 shadow-xl"
                            >
                                Activité supprimée
                                <button
                                    type="button"
                                    onClick={() => void handleRestoreActivity(u.id)}
                                    className="flex items-center gap-1 text-brand hover:underline"
                                >
                                    <RotateCcw size={14} /> Annuler
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Modale suppression ville */}
            {pendingCityDelete && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}
                    onClick={() => (deletingCity ? undefined : setPendingCityDelete(null))}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-md w-full bg-card rounded-[32px] p-8 space-y-6 shadow-2xl border border-light-border"
                    >
                        <div className="w-14 h-14 bg-red-50 text-error rounded-2xl flex items-center justify-center">
                            <Trash2 size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-display font-bold">Supprimer cette ville ?</h3>
                            <p className="text-sm text-light-muted leading-relaxed">
                                Toutes les activités enregistrées à <strong>{pendingCityDelete}</strong> seront
                                supprimées de votre itinéraire. Cette action est irréversible.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleDeleteCity}
                                disabled={deletingCity}
                                className="bg-error text-white font-bold py-3 rounded-2xl shadow-lg shadow-error/20 disabled:opacity-60"
                            >
                                {deletingCity ? 'Suppression…' : 'Supprimer cette ville'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingCityDelete(null)}
                                disabled={deletingCity}
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
