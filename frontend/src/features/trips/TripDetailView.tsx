'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
    Sparkles,
    Trash2,
    Users,
    Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { PageHeader } from '../../components/ui/PageHeader';
import { ActivitiesSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { WorldMap } from '../../components/Map/Map';
import { LocalTransportsSection } from '../../components/trips/LocalTransportsSection';
import { FlightsSection } from '../../components/trips/FlightsSection';
import { HotelsSection } from '../../components/trips/HotelsSection';
import { ReplanModal, type CurrentActivityForReplan } from '../../components/trips/ReplanModal';
import { FreeTimeWidget } from '../../components/trips/FreeTimeWidget';
import { BudgetReshuffleModal } from '../../components/trips/BudgetReshuffleModal';
import { DayTimeline } from './DayTimeline';
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
import { useAuthSession } from '../../hooks/useAuthSession';
import { AuthRequiredCard } from '../../components/auth/AuthRequiredCard';

export function TripDetailView() {
    const { tripId } = useParams<{ tripId: string }>();
    const router = useRouter();
    const { isConnected, isLoading: authLoading } = useAuthSession();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'itinerary' | 'flights' | 'hotels' | 'map' | 'docs'>('itinerary');
    const [isLoading, setIsLoading] = useState(true);
    const [apiTrip, setApiTrip] = useState<TripApi | null | undefined>(undefined);
    const [storedOnly, setStoredOnly] = useState<ReturnType<typeof getStoredTrip>>(undefined);

    const [activitiesByDay, setActivitiesByDay] = useState<ActivityDayBucket[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);
    /** Jours affichés sur la carte (vide = tous). */
    const [selectedMapDayIds, setSelectedMapDayIds] = useState<string[]>([]);
    const [mapRouteMode, setMapRouteMode] = useState<'full' | 'localOnly'>('full');

    const [pendingCityDelete, setPendingCityDelete] = useState<string | null>(null);
    const [deletingCity, setDeletingCity] = useState(false);
    const [replanOpen, setReplanOpen] = useState(false);
    const [budgetOpen, setBudgetOpen] = useState(false);
    const [duplicating, setDuplicating] = useState(false);

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
        setSelectedMapDayIds([]);
        setMapRouteMode('full');
    }, [tripId]);

    const trip: TripDetailDisplay | null = useMemo(() => {
        if (apiTrip) return tripDetailFromApi(apiTrip);
        if (storedOnly) return tripDetailFromStored(storedOnly);
        return null;
    }, [apiTrip, storedOnly]);

    const currentActivitiesForReplan: CurrentActivityForReplan[] = useMemo(() => {
        const out: CurrentActivityForReplan[] = [];
        for (const bucket of activitiesByDay) {
            const dayNumber = (bucket.index ?? 0) + 1;
            for (const activity of bucket.activities) {
                const { lat, lng, title } = activity.attributes;
                if (
                    typeof lat === 'number' &&
                    Number.isFinite(lat) &&
                    typeof lng === 'number' &&
                    Number.isFinite(lng) &&
                    title.trim() !== ''
                ) {
                    out.push({
                        id: activity.id,
                        day: dayNumber,
                        title,
                        lat,
                        lng,
                    });
                }
            }
        }
        return out;
    }, [activitiesByDay]);

    // Palette pour différencier visuellement les jours sur la carte (cycle).
    const DAY_PALETTE = useMemo(
        () => ['#06b6d4', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', '#facc15', '#0ea5e9', '#f43f5e'],
        [],
    );

    const originCoords = useMemo(() => {
        const o = apiTrip?.plan_snapshot?.origin;
        if (!o || typeof o.lat !== 'number' || typeof o.lng !== 'number') return null;
        if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null;
        return { lat: o.lat, lng: o.lng, cityName: o.cityName, iataCode: o.iataCode };
    }, [apiTrip]);

    const ORIGIN_COLOR = '#0f172a';

    const mapDaysFiltered = useMemo(() => {
        if (selectedMapDayIds.length === 0) return activitiesByDay;
        const allowed = new Set(selectedMapDayIds);
        return activitiesByDay.filter((d) => allowed.has(d.day_id));
    }, [activitiesByDay, selectedMapDayIds]);

    const mapLocations = useMemo(() => {
        const items: {
            id: string;
            title: string;
            coordinates: { latitude: number; longitude: number };
            type: string;
            color?: string;
            order?: number;
        }[] = [];

        if (originCoords) {
            items.push({
                id: 'origin',
                title: `${originCoords.cityName}${originCoords.iataCode ? ` (${originCoords.iataCode})` : ''}`,
                coordinates: { latitude: originCoords.lat, longitude: originCoords.lng },
                type: 'itinerary-activity',
                color: ORIGIN_COLOR,
                order: 0,
            });
        }

        mapDaysFiltered.forEach((day) => {
            const color = DAY_PALETTE[(day.index - 1 + DAY_PALETTE.length) % DAY_PALETTE.length];
            day.activities.forEach((act, idx) => {
                const lat = act.attributes.lat;
                const lng = act.attributes.lng;
                if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
                items.push({
                    id: act.id,
                    title: act.attributes.title || `Activité ${idx + 1}`,
                    coordinates: { latitude: lat, longitude: lng },
                    type: 'itinerary-activity',
                    color,
                    order: idx + 1,
                });
            });
        });
        return items;
    }, [mapDaysFiltered, DAY_PALETTE, originCoords]);

    const mapRouteSegments = useMemo(() => {
        const segments: Array<{
            id: string;
            profile: 'walking' | 'driving';
            geometry: GeoJSON.LineString;
            durationSec: number;
            color: string;
            label: string;
        }> = [];

        // First leg: depart city → premier point géolocalisé de l'itinéraire.
        if (mapRouteMode === 'full' && originCoords) {
            const firstActivity = mapDaysFiltered
                .flatMap((d) => d.activities)
                .find((a) => a.attributes.lat != null && a.attributes.lng != null);
            if (firstActivity && firstActivity.attributes.lat != null && firstActivity.attributes.lng != null) {
                segments.push({
                    id: 'leg-arrival',
                    profile: 'driving',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [originCoords.lng, originCoords.lat],
                            [firstActivity.attributes.lng, firstActivity.attributes.lat],
                        ],
                    },
                    durationSec: 0,
                    color: ORIGIN_COLOR,
                    label: `Départ${originCoords.iataCode ? ` (${originCoords.iataCode})` : ''}`,
                });
            }
        }

        mapDaysFiltered.forEach((day) => {
            const coords = day.activities
                .map((a) => (a.attributes.lat != null && a.attributes.lng != null
                    ? [a.attributes.lng, a.attributes.lat] as [number, number]
                    : null))
                .filter((c): c is [number, number] => c !== null);
            if (coords.length < 2) return;
            segments.push({
                id: `day-${day.day_id}`,
                profile: 'walking',
                geometry: { type: 'LineString', coordinates: coords },
                durationSec: 0,
                color: DAY_PALETTE[(day.index - 1 + DAY_PALETTE.length) % DAY_PALETTE.length],
                label: `Jour ${day.index}`,
            });
        });
        return segments;
    }, [mapDaysFiltered, DAY_PALETTE, originCoords, mapRouteMode]);

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

    const restoreActivity = async (activityId: string) => {
        if (!tripId) return;
        try {
            await activitiesClient.restore(tripId, activityId);
            await reloadActivities();
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Restauration impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
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
            toast({
                variant: 'info',
                title: 'Activité supprimée',
                duration: 5000,
                action: { label: 'Annuler', onClick: () => void restoreActivity(activityId) },
            });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Suppression impossible',
                description: err instanceof Error ? err.message : undefined,
            });
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
            toast({
                variant: 'error',
                title: 'Suppression de la ville impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setDeletingCity(false);
        }
    };

    if (authLoading || isLoading) {
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

    if (!isConnected) {
        return (
            <AuthRequiredCard
                title="Connexion requise"
                description="Le détail d’un voyage est disponible uniquement pour les comptes connectés."
            />
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
    const canReplan = Boolean(apiTrip) && currentActivitiesForReplan.length > 0;

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
                    <div className="flex flex-wrap gap-3">
                        {canReplan && (
                            <button
                                type="button"
                                onClick={() => setReplanOpen(true)}
                                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                            >
                                <Sparkles size={14} /> Quelque chose a changé ?
                            </button>
                        )}
                        {apiTrip && (
                            <button
                                type="button"
                                onClick={() => setBudgetOpen(true)}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                            >
                                <Wallet size={14} /> Alléger le budget
                            </button>
                        )}
                        {apiTrip && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (duplicating) return;
                                    setDuplicating(true);
                                    try {
                                        const copy = await tripsClient.duplicate(apiTrip.id);
                                        router.push(`/voyages/${copy.id}`);
                                    } catch (err) {
                                        toast({
                                            variant: 'error',
                                            title: 'Duplication impossible',
                                            description: err instanceof Error ? err.message : undefined,
                                        });
                                    } finally {
                                        setDuplicating(false);
                                    }
                                }}
                                disabled={duplicating}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-60"
                            >
                                <Copy size={14} /> {duplicating ? 'Duplication…' : 'Dupliquer'}
                            </button>
                        )}
                        <Link
                            href={`/recap-voyage?tripId=${tripId}`}
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                        >
                            <FileText size={14} /> Récap
                        </Link>
                        <button
                            type="button"
                            aria-disabled="true"
                            title="Archivage bientôt disponible"
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 text-red-600 opacity-60 cursor-not-allowed"
                            onClick={(e) => e.preventDefault()}
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
                    { label: 'Budget restant (estim.)', val: `${trip.remainingBudget}€`, icon: Sparkles, color: 'text-brand' },
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

                                {activitiesLoading && <ActivitiesSkeleton count={3} />}

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
                                        .map((day) => {
                                            const dayNumber = (day.index ?? 0) + 1;
                                            return (
                                                <div key={day.day_id} className="space-y-4">
                                                    <DayTimeline
                                                        tripId={tripId ?? ''}
                                                        day={day}
                                                        onLikedChange={(activityId, state) =>
                                                            setActivityLiked(activityId, state)
                                                        }
                                                        onDelete={handleDeleteActivity}
                                                    />
                                                    {apiTrip && (
                                                        <FreeTimeWidget
                                                            trip={apiTrip}
                                                            day={dayNumber}
                                                            onInserted={async () => {
                                                                try {
                                                                    const fresh = await tripsClient.get(apiTrip.id);
                                                                    if (fresh) setApiTrip(fresh);
                                                                } catch {
                                                                    /* ignore */
                                                                }
                                                                void reloadActivities();
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })
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
                                                                            ? 'bg-brand/10 text-brand'
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
                                defaultOriginCity={apiTrip?.plan_snapshot?.origin?.cityName}
                                defaultOriginIata={
                                    apiTrip?.plan_snapshot?.origin?.iataCode
                                    ?? apiTrip?.plan_snapshot?.flightSummary?.originIata
                                }
                            />
                        )}

                        {activeTab === 'hotels' && tripId && (
                            <HotelsSection
                                tripId={tripId}
                                destination={trip.destination}
                                defaultDestinationCityCode={
                                    apiTrip?.plan_snapshot?.destinationSummary?.iataCode
                                    ?? apiTrip?.plan_snapshot?.hotelSummary?.cityCode
                                    ?? undefined
                                }
                                startDate={apiTrip?.start_date}
                                endDate={apiTrip?.end_date}
                                travelers={apiTrip?.travelers_count}
                                budgetTotal={apiTrip?.budget_total}
                            />
                        )}

                        {activeTab === 'map' && (
                            <div className="space-y-4">
                                {activitiesByDay.some((d) =>
                                    d.activities.some(
                                        (a) =>
                                            a.attributes.lat != null &&
                                            a.attributes.lng != null &&
                                            Number.isFinite(a.attributes.lat) &&
                                            Number.isFinite(a.attributes.lng),
                                    ),
                                ) && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-light-muted">
                                            Afficher
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMapDayIds([])}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                                selectedMapDayIds.length === 0
                                                    ? 'border-brand bg-brand/10 text-brand'
                                                    : 'border-light-border bg-card text-light-muted hover:text-light-foreground',
                                            )}
                                        >
                                            Tous les jours
                                        </button>
                                        {activitiesByDay
                                            .filter((d) =>
                                                d.activities.some(
                                                    (a) =>
                                                        a.attributes.lat != null &&
                                                        a.attributes.lng != null &&
                                                        Number.isFinite(a.attributes.lat) &&
                                                        Number.isFinite(a.attributes.lng),
                                                ),
                                            )
                                            .map((day) => {
                                                const on = selectedMapDayIds.includes(day.day_id);
                                                return (
                                                    <button
                                                        key={day.day_id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMapDayIds((prev) => {
                                                                if (prev.includes(day.day_id)) {
                                                                    const next = prev.filter((id) => id !== day.day_id);
                                                                    return next;
                                                                }
                                                                return [...prev, day.day_id];
                                                            });
                                                        }}
                                                        className={cn(
                                                            'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                                            on
                                                                ? 'border-brand bg-brand/10 text-brand'
                                                                : 'border-light-border bg-card text-light-muted hover:text-light-foreground',
                                                        )}
                                                    >
                                                        Jour {day.index}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-light-muted">
                                        Trajets
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setMapRouteMode('full')}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                            mapRouteMode === 'full'
                                                ? 'border-brand bg-brand/10 text-brand'
                                                : 'border-light-border bg-card text-light-muted hover:text-light-foreground',
                                        )}
                                    >
                                        Trajet complet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMapRouteMode('localOnly')}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                            mapRouteMode === 'localOnly'
                                                ? 'border-brand bg-brand/10 text-brand'
                                                : 'border-light-border bg-card text-light-muted hover:text-light-foreground',
                                        )}
                                    >
                                        Sur place uniquement
                                    </button>
                                </div>
                                <div className="aspect-video lg:aspect-auto lg:h-[600px] w-full bg-light-bg rounded-[40px] overflow-hidden border border-light-border relative">
                                    <WorldMap
                                        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
                                        locations={mapLocations}
                                        routeSegments={mapRouteSegments}
                                        mapStyle="mapbox://styles/mapbox/light-v11"
                                    />
                                    {mapLocations.length === 0 && (
                                        <div className="absolute top-4 left-4 z-10 max-w-xs rounded-2xl bg-white/95 px-4 py-3 shadow-lg border border-slate-200 text-xs text-slate-700 font-bold">
                                            Aucune activité géolocalisée. Ajoutez des activités pour visualiser l’itinéraire sur la carte.
                                        </div>
                                    )}
                                </div>
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
                                        Rangez ici vos confirmations, billets et notes de voyage. Le téléversement de documents arrive bientôt.
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
                                { t: 'Billets & réservations', d: 'Bientôt disponible', icon: ExternalLink },
                                { t: 'Hébergement', d: 'Bientôt disponible', icon: ExternalLink },
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

            {apiTrip && budgetOpen && (
                <BudgetReshuffleModal
                    open={budgetOpen}
                    onClose={() => setBudgetOpen(false)}
                    tripId={apiTrip.id}
                    currentBudgetEur={apiTrip.budget_total ?? 0}
                />
            )}

            {apiTrip && replanOpen && (
                <ReplanModal
                    open={replanOpen}
                    onClose={() => setReplanOpen(false)}
                    tripId={apiTrip.id}
                    trip={apiTrip}
                    currentActivities={currentActivitiesForReplan}
                    onApplied={async () => {
                        try {
                            const fresh = await tripsClient.get(apiTrip.id);
                            if (fresh) setApiTrip(fresh);
                        } catch {
                            /* ignore — modal already closes */
                        }
                        void reloadActivities();
                    }}
                />
            )}
        </div>
    );
}
