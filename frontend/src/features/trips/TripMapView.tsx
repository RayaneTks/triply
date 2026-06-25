'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarRange, Check, MapPin, RefreshCw, Sparkles } from 'lucide-react';

import { WorldMap, type MapboxPoiFeature } from '../../components/Map/Map';
import { useToast } from '../../components/ui/Toast';
import { ErrorState } from '../../components/ui/ErrorState';
import { AuthRequiredCard } from '../../components/auth/AuthRequiredCard';
import { authClient } from '../../lib/auth-client';
import { tripsClient, type TripApi } from '../../lib/trips-client';
import {
    activitiesClient,
    type ActivityDayBucket,
    type ActivityResource,
    type LikedState,
} from '../../lib/activities-client';
import { tripDetailFromApi, type TripDetailDisplay } from '../../lib/trip-view-adapter';
import { useAuthSession } from '../../hooks/useAuthSession';
import { InteractiveDayTimeline } from './InteractiveDayTimeline';
import { MapDayFilters } from './components/MapDayFilters';
import {
    MapControls3D,
    mapConfigForStyle,
    mapStyleUrl,
    type MapVisualStyle,
} from './components/MapControls3D';
import { useTripMapData } from './hooks/useTripMapData';
import { computeDayTimeBudgets } from './trip-time-utils';
import {
    regenerateSingleActivity,
    suggestActivitiesForAllDays,
    suggestActivitiesForDay,
} from '../../lib/trip-map-assistant';
import type { SuggestedActivity } from '../../lib/integrations/assistant';

export function TripMapView() {
    const { tripId } = useParams<{ tripId: string }>();
    const router = useRouter();
    const { isConnected, isLoading: authLoading } = useAuthSession();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [apiTrip, setApiTrip] = useState<TripApi | null | undefined>(undefined);
    const [activitiesByDay, setActivitiesByDay] = useState<ActivityDayBucket[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [validating, setValidating] = useState(false);

    const [selectedMapDayIds, setSelectedMapDayIds] = useState<string[]>([]);
    const [mapRouteMode, setMapRouteMode] = useState<'full' | 'localOnly'>('full');
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

    const [pitch, setPitch] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [mapVisualStyle, setMapVisualStyle] = useState<MapVisualStyle>('light');

    const [regeneratingActivityId, setRegeneratingActivityId] = useState<string | null>(null);
    const [regeneratingDayId, setRegeneratingDayId] = useState<string | null>(null);
    const [regeneratingAll, setRegeneratingAll] = useState(false);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

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
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        (async () => {
            if (authClient.getToken()) {
                try {
                    const remote = await tripsClient.get(tripId);
                    if (cancelled) return;
                    if (remote) {
                        setApiTrip(remote);
                        setIsLoading(false);
                        void reloadActivities();
                        return;
                    }
                } catch {
                    /* fall through */
                }
            }
            if (!cancelled) {
                setApiTrip(null);
                setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tripId, reloadActivities]);

    useEffect(() => {
        if (activitiesByDay.length > 0 && !selectedDayId) {
            setSelectedDayId(activitiesByDay[0].day_id);
        }
    }, [activitiesByDay, selectedDayId]);

    const trip: TripDetailDisplay | null = useMemo(
        () => (apiTrip ? tripDetailFromApi(apiTrip) : null),
        [apiTrip],
    );

    const originCoords = useMemo(() => {
        const o = apiTrip?.plan_snapshot?.origin;
        if (!o || typeof o.lat !== 'number' || typeof o.lng !== 'number') return null;
        if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null;
        return { lat: o.lat, lng: o.lng, cityName: o.cityName, iataCode: o.iataCode };
    }, [apiTrip]);

    const maxHoursPerDay = useMemo(() => {
        const snapshot = apiTrip?.plan_snapshot;
        const numeric = snapshot?.maxActivityHoursPerDay;
        if (typeof numeric === 'number' && Number.isFinite(numeric) && numeric > 0) return numeric;
        const raw = snapshot?.activityTime;
        if (typeof raw === 'string') {
            const n = parseFloat(raw.replace(',', '.'));
            if (Number.isFinite(n) && n > 0) return n;
        }
        return 10;
    }, [apiTrip]);

    const { mapLocations, routeSegments, legDurationsSecByDay } = useTripMapData({
        activitiesByDay,
        originCoords,
        selectedMapDayIds,
        mapRouteMode,
        mapboxToken,
    });

    const timeBudgets = useMemo(
        () => computeDayTimeBudgets(activitiesByDay, legDurationsSecByDay, maxHoursPerDay),
        [activitiesByDay, legDurationsSecByDay, maxHoursPerDay],
    );

    const timeBudgetByDayId = useMemo(
        () => Object.fromEntries(timeBudgets.map((b) => [b.dayId, b])),
        [timeBudgets],
    );

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
        try {
            await activitiesClient.delete(tripId, activity.id);
            setActivitiesByDay((current) =>
                current.map((day) => ({
                    ...day,
                    activities: day.activities.filter((a) => a.id !== activity.id),
                })),
            );
            setIsDirty(true);
            toast({ variant: 'info', title: 'Activité supprimée' });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Suppression impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    const handleReorder = async (dayId: string, activityIds: string[]) => {
        if (!tripId) return;
        setActivitiesByDay((current) =>
            current.map((day) => {
                if (day.day_id !== dayId) return day;
                const byId = Object.fromEntries(day.activities.map((a) => [a.id, a]));
                return {
                    ...day,
                    activities: activityIds.map((id) => byId[id]).filter(Boolean),
                };
            }),
        );
        try {
            await activitiesClient.reorder(tripId, activityIds);
            setIsDirty(true);
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Réordonnancement impossible',
                description: err instanceof Error ? err.message : undefined,
            });
            void reloadActivities();
        }
    };

    const applySuggestedToDay = async (day: ActivityDayBucket, suggestions: SuggestedActivity[]) => {
        if (!tripId || suggestions.length === 0) return;

        for (const activity of day.activities) {
            await activitiesClient.delete(tripId, activity.id);
        }

        for (const suggestion of suggestions) {
            await activitiesClient.create(tripId, {
                source: 'ai',
                title: suggestion.title,
                day_id: day.day_id,
                lat: suggestion.lat,
                lng: suggestion.lng,
                estimated_duration_minutes: Math.round((suggestion.durationHours ?? 2) * 60),
            });
        }
        await reloadActivities();
        setIsDirty(true);
    };

    const handleRegenerateActivity = async (activity: ActivityResource, day: ActivityDayBucket) => {
        if (!tripId || !trip) return;
        const lat = activity.attributes.lat ?? 0;
        const lng = activity.attributes.lng ?? 0;
        setRegeneratingActivityId(activity.id);
        try {
            const res = await regenerateSingleActivity({
                title: activity.attributes.title,
                lat,
                lng,
                dayIndex: day.index,
                destinationContext: trip.destination,
            });
            if (!res.replacement) {
                toast({ variant: 'info', title: 'Aucune alternative proposée' });
                return;
            }
            await activitiesClient.update(tripId, activity.id, {
                title: res.replacement.title,
                lat: res.replacement.lat,
                lng: res.replacement.lng,
                estimated_duration_minutes: Math.round((res.replacement.durationHours ?? 2) * 60),
            });
            await reloadActivities();
            setIsDirty(true);
            toast({ variant: 'success', title: 'Activité régénérée' });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Régénération impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setRegeneratingActivityId(null);
        }
    };

    const handleRegenerateDay = async (day: ActivityDayBucket) => {
        if (!tripId || !trip || !apiTrip) return;
        setRegeneratingDayId(day.day_id);
        try {
            const suggestions = await suggestActivitiesForDay({
                destinationContext: trip.destination,
                dayIndex: day.index,
                travelDays: apiTrip.travel_days ?? activitiesByDay.length,
                currentTitles: day.activities.map((a) => a.attributes.title),
                maxActivityHoursPerDay: maxHoursPerDay,
            });
            if (suggestions.length === 0) {
                toast({ variant: 'info', title: 'Aucune suggestion pour ce jour' });
                return;
            }
            await applySuggestedToDay(day, suggestions);
            setIsDirty(true);
            toast({ variant: 'success', title: `Jour ${day.index} régénéré` });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Régénération du jour impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setRegeneratingDayId(null);
        }
    };

    const handleRegenerateAllDays = async () => {
        if (!tripId || !trip || !apiTrip) return;
        setRegeneratingAll(true);
        try {
            const suggestions = await suggestActivitiesForAllDays({
                destinationContext: trip.destination,
                travelDays: apiTrip.travel_days ?? activitiesByDay.length,
                activitiesByDay: activitiesByDay.map((d) => ({
                    index: d.index,
                    titles: d.activities.map((a) => a.attributes.title),
                })),
                maxActivityHoursPerDay: maxHoursPerDay,
            });
            if (suggestions.length === 0) {
                toast({ variant: 'info', title: 'Aucune suggestion reçue' });
                return;
            }

            for (const day of activitiesByDay) {
                const daySuggestions = suggestions.filter((s) => s.day === day.index);
                if (daySuggestions.length === 0) continue;
                await applySuggestedToDay(day, daySuggestions);
            }
            toast({ variant: 'success', title: 'Itinéraire régénéré' });
            setIsDirty(true);
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Régénération globale impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setRegeneratingAll(false);
        }
    };

    const handlePoiClick = useCallback(
        async (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }) => {
            if (!tripId || !selectedDayId) {
                toast({ variant: 'info', title: 'Sélectionnez un jour dans le panneau de droite' });
                return;
            }
            const name =
                (typeof feature.properties?.name === 'string' && feature.properties.name) ||
                (typeof feature.properties?.name_en === 'string' && feature.properties.name_en) ||
                'Lieu';
            const layerId = feature.layer?.id;

            const day = activitiesByDay.find((d) => d.day_id === selectedDayId);
            const exists = day?.activities.some(
                (a) =>
                    a.attributes.title === name &&
                    a.attributes.lat != null &&
                    Math.abs(a.attributes.lat - lngLat.lat) < 0.0001 &&
                    a.attributes.lng != null &&
                    Math.abs(a.attributes.lng - lngLat.lng) < 0.0001,
            );
            if (exists) {
                toast({ variant: 'info', title: 'Ce lieu est déjà dans le jour sélectionné' });
                return;
            }

            try {
                await activitiesClient.create(tripId, {
                    source: 'place',
                    title: name,
                    day_id: selectedDayId,
                    lat: lngLat.lat,
                    lng: lngLat.lng,
                    layer_id: layerId,
                    estimated_duration_minutes: 120,
                });
                await reloadActivities();
                setIsDirty(true);
                toast({ variant: 'success', title: `${name} ajouté au jour` });
            } catch (err) {
                toast({
                    variant: 'error',
                    title: 'Ajout impossible',
                    description: err instanceof Error ? err.message : undefined,
                });
            }
        },
        [activitiesByDay, reloadActivities, selectedDayId, toast, tripId],
    );

    const handleValidate = async () => {
        if (!tripId) return;
        setValidating(true);
        try {
            for (const day of activitiesByDay) {
                if (day.activities.length > 0) {
                    await activitiesClient.reorder(
                        tripId,
                        day.activities.map((activity) => activity.id),
                    );
                }
            }
            await tripsClient.validate(tripId);
            setIsDirty(false);
            toast({
                variant: 'success',
                title: 'Itinéraire enregistré',
                description: 'Vos modifications sont sauvegardées.',
            });
            router.push(`/voyages/${tripId}`);
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Enregistrement impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setValidating(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] animate-pulse bg-light-bg flex items-center justify-center">
                <p className="text-sm font-bold text-light-muted">Chargement de la carte…</p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <AuthRequiredCard
                title="Connectez-vous pour la carte interactive"
                description="La carte interactive est réservée aux comptes connectés."
            />
        );
    }

    if (!tripId || !trip || !apiTrip) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <ErrorState
                    title="Voyage introuvable"
                    description="Ce voyage n'existe pas ou n'est pas accessible."
                    primaryAction={{ label: 'Mes voyages', to: '/voyages' }}
                />
            </div>
        );
    }

    const totalActivities = activitiesByDay.reduce((s, d) => s + d.activities.length, 0);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] min-h-[600px]">
            <header className="shrink-0 border-b border-light-border bg-card px-4 py-3 lg:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <Link
                            href={`/voyages/${tripId}`}
                            className="inline-flex items-center gap-2 text-light-muted hover:text-brand font-bold text-xs uppercase transition-colors"
                        >
                            <ArrowLeft size={14} /> Jour par jour
                        </Link>
                        <h1 className="text-lg font-display font-bold text-light-foreground truncate">
                            Carte — {trip.destination}
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-1 text-xs font-bold">
                            <CalendarRange size={12} />
                            {activitiesByDay.length} jours
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-1 text-xs font-bold">
                            <Sparkles size={12} />
                            {totalActivities} activités
                        </span>
                        <button
                            type="button"
                            onClick={() => void handleRegenerateAllDays()}
                            disabled={regeneratingAll}
                            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
                        >
                            <RefreshCw size={12} className={regeneratingAll ? 'animate-spin' : ''} />
                            Régénérer tous les jours
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
                {/* Carte — gauche */}
                <div className="relative flex-1 min-h-[45vh] lg:min-h-0 lg:w-[70%] border-b lg:border-b-0 lg:border-r border-light-border">
                    <WorldMap
                        accessToken={mapboxToken}
                        locations={mapLocations}
                        routeSegments={routeSegments}
                        mapStyle={mapStyleUrl(mapVisualStyle)}
                        mapConfig={mapConfigForStyle(mapVisualStyle)}
                        pitch={pitch}
                        bearing={bearing}
                        height="100%"
                        onPoiClick={(feature, lngLat) => void handlePoiClick(feature, lngLat)}
                    />
                    <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
                        <div className="pointer-events-auto">
                            <MapDayFilters
                                activitiesByDay={activitiesByDay}
                                selectedMapDayIds={selectedMapDayIds}
                                onSelectedMapDayIdsChange={setSelectedMapDayIds}
                                mapRouteMode={mapRouteMode}
                                onMapRouteModeChange={setMapRouteMode}
                                mapStyle={mapVisualStyle}
                            />
                        </div>
                        <div className="pointer-events-auto">
                            <MapControls3D
                                pitch={pitch}
                                bearing={bearing}
                                mapStyle={mapVisualStyle}
                                onPitchChange={setPitch}
                                onBearingChange={setBearing}
                                onMapStyleChange={setMapVisualStyle}
                            />
                        </div>
                    </div>
                    {mapLocations.length === 0 && !activitiesLoading && (
                        <div className="absolute bottom-6 left-4 z-10 max-w-xs rounded-2xl bg-slate-900/90 px-4 py-3 shadow-lg border border-white/10 text-xs text-white font-bold">
                            Cliquez sur un POI de la carte ou régénérez des activités pour peupler l&apos;itinéraire.
                        </div>
                    )}
                    {selectedDayId && (
                        <div className="absolute bottom-4 right-4 z-10 rounded-full bg-slate-900/90 border border-white/15 px-4 py-2 text-xs font-bold text-white flex items-center gap-2">
                            <MapPin size={12} className="text-brand" />
                            POI → Jour{' '}
                            {activitiesByDay.find((d) => d.day_id === selectedDayId)?.index ?? '?'}
                        </div>
                    )}
                </div>

                {/* Récap — droite */}
                <aside className="lg:w-[30%] overflow-y-auto bg-light-bg/30 p-4 lg:p-6 space-y-4">
                    {activitiesError && (
                        <p className="text-sm text-error font-bold" role="alert">
                            {activitiesError}
                        </p>
                    )}
                    {activitiesLoading && activitiesByDay.length === 0 ? (
                        <p className="text-sm text-light-muted font-bold">Chargement des activités…</p>
                    ) : (
                        activitiesByDay.map((day) => (
                            <InteractiveDayTimeline
                                key={day.day_id}
                                tripId={tripId}
                                day={day}
                                selected={selectedDayId === day.day_id}
                                onSelect={() => {
                                    setSelectedDayId(day.day_id);
                                    setSelectedMapDayIds((prev) =>
                                        prev.length === 1 && prev[0] === day.day_id ? [] : [day.day_id],
                                    );
                                }}
                                timeBudget={timeBudgetByDayId[day.day_id]}
                                onLikedChange={(activityId, liked) => {
                                    setActivityLiked(activityId, liked);
                                    setIsDirty(true);
                                }}
                                onDelete={handleDeleteActivity}
                                onReorder={(ids) => void handleReorder(day.day_id, ids)}
                                onRegenerateActivity={(a) => void handleRegenerateActivity(a, day)}
                                onRegenerateDay={() => void handleRegenerateDay(day)}
                                regeneratingActivityId={regeneratingActivityId}
                                regeneratingDay={regeneratingDayId === day.day_id}
                            />
                        ))
                    )}
                    {activitiesByDay.length > 0 && (
                        <div className="sticky bottom-0 pt-3 pb-1 -mx-1 px-1 bg-gradient-to-t from-light-bg via-light-bg/95 to-transparent">
                            {isDirty && !validating && (
                                <p className="text-[11px] text-amber-700 font-bold text-center mb-2" role="status">
                                    Modifications en attente de validation
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => void handleValidate()}
                                disabled={validating || activitiesLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                <Check size={16} />
                                {validating ? 'Enregistrement…' : "Valider l'itinéraire"}
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
