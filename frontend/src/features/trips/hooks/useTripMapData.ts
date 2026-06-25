'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RouteMapSegment } from '../../../components/Map/Map';
import type { ActivityDayBucket } from '../../../lib/activities-client';
import {
    defaultProfileForDistance,
    fetchMapboxLegRoute,
    haversineKm,
    straightLineGeometry,
} from '../../../lib/mapbox-directions';
import { dayColor, ORIGIN_COLOR } from '../trip-map-constants';

interface OriginCoords {
    lat: number;
    lng: number;
    cityName?: string;
    iataCode?: string;
}

interface UseTripMapDataOptions {
    activitiesByDay: ActivityDayBucket[];
    originCoords: OriginCoords | null;
    selectedMapDayIds: string[];
    mapRouteMode: 'full' | 'localOnly';
    mapboxToken: string;
}

export function useTripMapData({
    activitiesByDay,
    originCoords,
    selectedMapDayIds,
    mapRouteMode,
    mapboxToken,
}: UseTripMapDataOptions) {
    const [routeSegments, setRouteSegments] = useState<RouteMapSegment[]>([]);
    const [legDurationsSecByDay, setLegDurationsSecByDay] = useState<Record<string, number[]>>({});
    const [routesLoading, setRoutesLoading] = useState(false);

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
                title: `${originCoords.cityName ?? 'Départ'}${originCoords.iataCode ? ` (${originCoords.iataCode})` : ''}`,
                coordinates: { latitude: originCoords.lat, longitude: originCoords.lng },
                type: 'itinerary-activity',
                color: ORIGIN_COLOR,
                order: 0,
            });
        }

        mapDaysFiltered.forEach((day) => {
            const color = dayColor(day.index);
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
    }, [mapDaysFiltered, originCoords]);

    const routeBuildIdRef = useRef(0);

    useEffect(() => {
        const buildId = ++routeBuildIdRef.current;

        async function buildRoutes() {
            if (!mapboxToken) {
                if (buildId === routeBuildIdRef.current) {
                    setRouteSegments([]);
                    setLegDurationsSecByDay({});
                    setRoutesLoading(false);
                }
                return;
            }

            setRoutesLoading(true);
            const segments: RouteMapSegment[] = [];
            const durationsByDay: Record<string, number[]> = {};

            // Intentionally do not draw a flight polyline from origin city
            // to destination activities (ex: Paris -> Rome).

            for (const day of mapDaysFiltered) {
                const points = day.activities
                    .filter(
                        (a) =>
                            a.attributes.lat != null &&
                            a.attributes.lng != null &&
                            Number.isFinite(a.attributes.lat) &&
                            Number.isFinite(a.attributes.lng),
                    )
                    .map((a) => ({
                        id: a.id,
                        lng: a.attributes.lng as number,
                        lat: a.attributes.lat as number,
                    }));

                if (points.length < 2) continue;

                const color = dayColor(day.index);
                const dayLegDurations: number[] = [];

                for (let i = 0; i < points.length - 1; i++) {
                    if (buildId !== routeBuildIdRef.current) return;

                    const a = points[i];
                    const b = points[i + 1];
                    const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
                    const profile = defaultProfileForDistance(dist);
                    const leg = await fetchMapboxLegRoute(mapboxToken, profile, a, b);
                    dayLegDurations.push(leg.duration);
                    segments.push({
                        id: `day-${day.day_id}-leg-${i}`,
                        profile,
                        geometry: leg.geometry ?? straightLineGeometry(a, b),
                        durationSec: leg.duration,
                        color,
                        label: `Jour ${day.index}`,
                    });
                }
                durationsByDay[day.day_id] = dayLegDurations;
            }

            if (buildId === routeBuildIdRef.current) {
                setRouteSegments(segments);
                setLegDurationsSecByDay(durationsByDay);
                setRoutesLoading(false);
            }
        }

        void buildRoutes();

        return () => {
            routeBuildIdRef.current += 1;
        };
    }, [mapDaysFiltered, mapRouteMode, mapboxToken]);

    return {
        mapDaysFiltered,
        mapLocations,
        routeSegments,
        legDurationsSecByDay,
        routesLoading,
    };
}
