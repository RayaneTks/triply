'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { RouteMapSegment } from '@/src/components/Map/Map';
import type { LocationPoint } from '@/src/utils/locations';
import {
    getDayActivityLabel,
    poiStableKeyForLeg,
    parseLngLatPointsFromRouteDepsKey,
    fetchMapboxLegRoute,
    mergeRouteLineStrings,
    type GeoLineString
} from '@/src/utils/trip-planning';
import type { DayActivityPoi } from '@/src/features/trip-creation/TripCreationWizard';
import type { ActivityRouteProfile } from '@/src/features/trip-creation/TripCreationWizard';

interface UseTripMapProps {
    mapboxToken: string;
    selectedDay: number;
    wizardView: 'plan' | 'activity';
    dayActivitiesByDay: Record<number, DayActivityPoi[]>;
    legTransportByDay: Record<number, ActivityRouteProfile[]>;
    initialLocations?: LocationPoint[];
}

export function useTripMap({
    mapboxToken,
    selectedDay,
    wizardView,
    dayActivitiesByDay,
    legTransportByDay,
    initialLocations = []
}: UseTripMapProps) {
    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/standard');
    const [mapConfig, setMapConfig] = useState<{ lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' }>({ lightPreset: 'day' });
    const [mapPitch, setMapPitch] = useState<number>(0);
    const [mapLocations, setMapLocations] = useState<LocationPoint[]>(initialLocations);
    const [selectedRouteType, setSelectedRouteType] = useState<'driving' | 'walking' | 'cycling' | null>(null);
    const [dayRoutes, setDayRoutes] = useState<
        Partial<
            Record<
                'driving' | 'walking' | 'cycling',
                {
                    geometry: GeoLineString;
                    duration: number;
                    legs: Array<{ duration: number; distance: number; geometry?: GeoLineString }>;
                }
            >
        >
    >({});
    const [mapDisplaySegments, setMapDisplaySegments] = useState<RouteMapSegment[]>([]);

    const dayActivitiesByDayForMapRef = useRef(dayActivitiesByDay);
    const legTransportByDayForMapRef = useRef(legTransportByDay);

    // Met à jour les "refs latest" en dehors du render.
    useEffect(() => {
        dayActivitiesByDayForMapRef.current = dayActivitiesByDay;
        legTransportByDayForMapRef.current = legTransportByDay;
    }, [dayActivitiesByDay, legTransportByDay]);

    /** Étapes du jour sur la carte */
    const mapLocationsWithDayActivities = useMemo(() => {
        if (wizardView !== 'activity') return mapLocations;
        const acts = dayActivitiesByDay[selectedDay] ?? [];
        if (acts.length === 0) return mapLocations;
        const activityMarkers: LocationPoint[] = acts.map((p, i) => ({
            id: `itinerary-${selectedDay}-${poiStableKeyForLeg(p)}`,
            title: `Vers l'étape ${i + 1} · ${getDayActivityLabel(p)}`,
            coordinates: { latitude: p.lngLat.lat, longitude: p.lngLat.lng },
            type: 'itinerary-activity',
        }));
        return [...mapLocations, ...activityMarkers];
    }, [mapLocations, wizardView, dayActivitiesByDay, selectedDay]);

    // Clé stable pour le useEffect des routes
    const routeDepsKey = useMemo(() => {
        const activities = dayActivitiesByDay[selectedDay] ?? [];
        if (activities.length < 2) return '';
        return `${selectedDay}:${activities.map((p) => `${p.lngLat.lng},${p.lngLat.lat}`).join(';')}`;
    }, [dayActivitiesByDay, selectedDay]);

    // Directions par tronçon (A→B) pour chaque profil
    useEffect(() => {
        if (!routeDepsKey || !mapboxToken) {
            void Promise.resolve().then(() => setDayRoutes({}));
            return;
        }
        const points = parseLngLatPointsFromRouteDepsKey(routeDepsKey);
        if (!points) {
            void Promise.resolve().then(() => setDayRoutes({}));
            return;
        }
        const profiles = ['driving', 'walking', 'cycling'] as const;
        let cancelled = false;

        void Promise.all(
            profiles.map(async (profile) => {
                const rawLegs = await Promise.all(
                    points.slice(0, -1).map((_, i) =>
                        fetchMapboxLegRoute(mapboxToken, profile, points[i], points[i + 1])
                    )
                );
                if (cancelled) return null;
                const legs = rawLegs.map((l) => ({
                    duration: l.duration,
                    distance: l.distance,
                    ...(l.geometry ? { geometry: l.geometry } : {}),
                }));
                const legGeoms = rawLegs.map((l) => l.geometry).filter(Boolean) as GeoLineString[];
                const merged = mergeRouteLineStrings(legGeoms);
                const totalDuration = legs.reduce((s, l) => s + l.duration, 0);
                const hasUsefulData = totalDuration > 0 || merged != null;
                if (!hasUsefulData) return { profile, skip: true as const };

                const geometry: GeoLineString =
                    merged ??
                    ({
                        type: 'LineString',
                        coordinates: [
                            [points[0].lng, points[0].lat],
                            [points[points.length - 1].lng, points[points.length - 1].lat],
                        ],
                    } as GeoLineString);

                return { profile, geometry, duration: totalDuration, legs, skip: false as const };
            })
        ).then((results) => {
            if (cancelled) return;
            const next: Partial<
                Record<
                    'driving' | 'walking' | 'cycling',
                    {
                        geometry: GeoLineString;
                        duration: number;
                        legs: Array<{ duration: number; distance: number; geometry?: GeoLineString }>;
                    }
                >
            > = {};
            for (const r of results) {
                if (!r || r.skip) continue;
                next[r.profile] = { geometry: r.geometry, duration: r.duration, legs: r.legs };
            }
            setDayRoutes(next);
        });
        return () => {
            cancelled = true;
        };
    }, [routeDepsKey, mapboxToken]);

    /** Signature des POI du jour */
    const selectedDayActivityCoordsKey = useMemo(() => {
        const list = dayActivitiesByDay[selectedDay] ?? [];
        if (list.length < 2) return '';
        return list.map((p) => `${p.lngLat.lng},${p.lngLat.lat}`).join(';');
    }, [dayActivitiesByDay, selectedDay]);

    const selectedDayLegModesKey = useMemo(
        () => JSON.stringify(legTransportByDay[selectedDay] ?? []),
        [legTransportByDay, selectedDay]
    );

    // Tracé carte par tronçon
    useEffect(() => {
        if (!mapboxToken || !selectedDayActivityCoordsKey) {
            void Promise.resolve().then(() => setMapDisplaySegments([]));
            return;
        }
        const activities = dayActivitiesByDayForMapRef.current[selectedDay] ?? [];
        const modes = legTransportByDayForMapRef.current[selectedDay] ?? [];
        if (activities.length < 2) {
            void Promise.resolve().then(() => setMapDisplaySegments([]));
            return;
        }

        let cancelled = false;
        const tasks = activities.slice(0, -1).map((_, i) => {
            const a = activities[i].lngLat;
            const b = activities[i + 1].lngLat;
            const profile = (modes[i] ?? 'driving') as ActivityRouteProfile;
            const coordStr = `${a.lng},${a.lat};${b.lng},${b.lat}`;
            const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
            return fetch(url)
                .then((res) => res.json())
                .then((data) => {
                    if (cancelled) return null;
                    const route = data.routes?.[0];
                    const geom = route?.geometry;
                    const duration = typeof route?.duration === 'number' ? route.duration : 0;
                    if (
                        geom &&
                        geom.type === 'LineString' &&
                        Array.isArray(geom.coordinates) &&
                        geom.coordinates.length >= 2
                    ) {
                        return {
                            id: String(i),
                            profile,
                            geometry: geom as GeoLineString,
                            durationSec: duration,
                        } satisfies RouteMapSegment;
                    }
                    return null;
                })
                .catch(() => null);
        });

        void Promise.all(tasks).then((results) => {
            if (cancelled) return;
            const next = results.filter((r): r is RouteMapSegment => r != null);
            setMapDisplaySegments(next);
        });

        return () => {
            cancelled = true;
        };
    }, [mapboxToken, selectedDay, selectedDayActivityCoordsKey, selectedDayLegModesKey]);

    return {
        mapStyle,
        setMapStyle,
        mapConfig,
        setMapConfig,
        mapPitch,
        setMapPitch,
        mapLocations,
        setMapLocations,
        selectedRouteType,
        setSelectedRouteType,
        dayRoutes,
        mapDisplaySegments,
        mapLocationsWithDayActivities
    };
}
