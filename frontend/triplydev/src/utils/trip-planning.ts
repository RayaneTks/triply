import type { DayActivityPoi } from '@/src/features/trip-creation/TripCreationWizard';
import type { ActivityRouteProfile } from '@/src/features/trip-creation/TripCreationWizard';

/** LineString GeoJSON. */
export type GeoLineString = { type: 'LineString'; coordinates: number[][] };

export function getDayActivityLabel(p: {
    properties?: Record<string, unknown> | null;
    layer?: { id?: string };
}): string {
    const n = p.properties?.name ?? p.properties?.name_en ?? p.layer?.id ?? 'Lieu';
    return String(n);
}

export async function fetchGeocodeFirst(keyword: string): Promise<{ lat: number; lng: number; name: string } | null> {
    const q = keyword.trim();
    if (q.length < 2) return null;
    try {
        const res = await fetch(`/api/places/search?keyword=${encodeURIComponent(q)}`);
        const data: unknown = await res.json();
        const list = Array.isArray(data) ? data : [];
        const first = list[0] as
            | { geoCode?: { latitude?: number; longitude?: number }; name?: string }
            | undefined;
        const geo = first?.geoCode;
        const latN = geo?.latitude != null ? Number(geo.latitude) : NaN;
        const lngN = geo?.longitude != null ? Number(geo.longitude) : NaN;
        if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;
        return { lat: latN, lng: lngN, name: String(first?.name || q) };
    } catch {
        return null;
    }
}

export type PlaceSearchItem = {
    iataCode?: string;
    subType?: 'CITY' | 'AIRPORT' | string;
    name?: string;
    address?: {
        cityName?: string;
    };
};

export async function resolveDestinationLabels(params: {
    iataCode?: string;
    selectedName?: string;
}): Promise<{ cityName: string; airportName?: string; iataCode?: string }> {
    const iata = (params.iataCode || '').trim().toUpperCase();
    const selectedName = (params.selectedName || '').trim();

    let cityName = selectedName;
    let airportName: string | undefined;

    if (iata.length >= 3) {
        try {
            const res = await fetch(`/api/places/search?keyword=${encodeURIComponent(iata)}`);
            const data: unknown = await res.json();
            const list = Array.isArray(data) ? data : [];
            const items = list as PlaceSearchItem[];

            const exact = items.filter((it) => (it.iataCode || '').toUpperCase() === iata);
            const cityItem = exact.find((it) => it.subType === 'CITY') ?? exact.find((it) => !!it.address?.cityName);
            const airportItem = exact.find((it) => it.subType === 'AIRPORT');

            const cityFromApi = (cityItem?.address?.cityName || cityItem?.name || airportItem?.address?.cityName || '').trim();
            const airportFromApi = (airportItem?.name || '').trim();

            if (cityFromApi) cityName = cityFromApi;
            if (airportFromApi) airportName = airportFromApi;
        } catch {
            // Fallback silencieux
        }
    }

    if (!cityName) {
        cityName = iata || 'Destination';
    }

    if (!airportName && selectedName && selectedName.toLowerCase() !== cityName.toLowerCase()) {
        airportName = selectedName;
    }

    return { cityName, airportName, iataCode: iata || undefined };
}

export function poiStableKeyForLeg(p: DayActivityPoi) {
    return p._dragId ?? `${p.lngLat.lng.toFixed(6)},${p.lngLat.lat.toFixed(6)}`;
}

export function legPairKey(from: DayActivityPoi, to: DayActivityPoi) {
    return `${poiStableKeyForLeg(from)}→${poiStableKeyForLeg(to)}`;
}

export function buildLegTransportModesForActivities(
    ordered: DayActivityPoi[],
    prevOrdered: DayActivityPoi[] | undefined,
    prevModes: ActivityRouteProfile[] | undefined,
    defaultForNewLeg: ActivityRouteProfile
): ActivityRouteProfile[] {
    const n = ordered.length;
    if (n < 2) return [];
    const oldPairToMode = new Map<string, ActivityRouteProfile>();
    if (prevOrdered && prevOrdered.length >= 2) {
        for (let i = 0; i < prevOrdered.length - 1; i++) {
            oldPairToMode.set(
                legPairKey(prevOrdered[i], prevOrdered[i + 1]),
                prevModes?.[i] ?? defaultForNewLeg
            );
        }
    }
    const out: ActivityRouteProfile[] = [];
    for (let i = 0; i < n - 1; i++) {
        out.push(oldPairToMode.get(legPairKey(ordered[i], ordered[i + 1])) ?? defaultForNewLeg);
    }
    return out;
}

export function activityListSignature(list: DayActivityPoi[]) {
    return list.map(poiStableKeyForLeg).join('|');
}

export function coordsNearlyEqual(a: { lng: number; lat: number }, b: { lng: number; lat: number }): boolean {
    return Math.abs(a.lng - b.lng) < 1e-6 && Math.abs(a.lat - b.lat) < 1e-6;
}

export function mergeRouteLineStrings(geoms: GeoLineString[]): GeoLineString | null {
    const valid = geoms.filter((g) => Array.isArray(g?.coordinates) && g.coordinates.length >= 2);
    if (valid.length === 0) return null;
    if (valid.length === 1) return valid[0];
    const coordinates: number[][] = [...valid[0].coordinates];
    for (let i = 1; i < valid.length; i++) {
        const next = valid[i].coordinates;
        const firstNext = next[0];
        const last = coordinates[coordinates.length - 1];
        if (last[0] !== firstNext[0] || last[1] !== firstNext[1]) {
            coordinates.push(...next);
        } else {
            coordinates.push(...next.slice(1));
        }
    }
    return coordinates.length >= 2 ? { type: 'LineString', coordinates } : null;
}

export function parseLngLatPointsFromRouteDepsKey(routeDepsKey: string): { lng: number; lat: number }[] | null {
    const idx = routeDepsKey.indexOf(':');
    if (idx < 0) return null;
    const part = routeDepsKey.slice(idx + 1).trim();
    if (!part) return null;
    const pts: { lng: number; lat: number }[] = [];
    for (const seg of part.split(';')) {
        const bits = seg.split(',');
        if (bits.length < 2) return null;
        const lng = Number(bits[0]);
        const lat = Number(bits[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        pts.push({ lng, lat });
    }
    return pts.length >= 2 ? pts : null;
}

export type MapboxLegRouteResult = { duration: number; distance: number; geometry?: GeoLineString };

export async function fetchMapboxLegRoute(
    accessToken: string,
    profile: 'driving' | 'walking' | 'cycling',
    a: { lng: number; lat: number },
    b: { lng: number; lat: number }
): Promise<MapboxLegRouteResult> {
    if (coordsNearlyEqual(a, b)) {
        return {
            duration: 0,
            distance: 0,
            geometry: { type: 'LineString', coordinates: [[a.lng, a.lat], [b.lng, b.lat]] },
        };
    }
    const coordStr = `${a.lng},${a.lat};${b.lng},${b.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?geometries=geojson&overview=full&access_token=${accessToken}`;
    try {
        const res = await fetch(url);
        const data = (await res.json()) as {
            routes?: Array<{ duration?: number; distance?: number; geometry?: GeoLineString }>;
        };
        const route = data.routes?.[0];
        const geom = route?.geometry;
        return {
            duration: typeof route?.duration === 'number' ? route.duration : 0,
            distance: typeof route?.distance === 'number' ? route.distance : 0,
            ...(geom &&
            geom.type === 'LineString' &&
            Array.isArray(geom.coordinates) &&
            geom.coordinates.length >= 2
                ? { geometry: geom as GeoLineString }
                : {}),
        };
    } catch {
        return { duration: 0, distance: 0 };
    }
}
