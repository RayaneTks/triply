export type RouteProfile = 'driving' | 'walking' | 'cycling';

export interface MapboxLegRouteResult {
    duration: number;
    distance: number;
    geometry?: GeoJSON.LineString;
}

export function coordsNearlyEqual(
    a: { lng: number; lat: number },
    b: { lng: number; lat: number },
    epsilon = 1e-6,
): boolean {
    return Math.abs(a.lng - b.lng) < epsilon && Math.abs(a.lat - b.lat) < epsilon;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function defaultProfileForDistance(distanceKm: number): RouteProfile {
    return distanceKm < 2 ? 'walking' : 'driving';
}

export function straightLineGeometry(
    a: { lng: number; lat: number },
    b: { lng: number; lat: number },
): GeoJSON.LineString {
    return {
        type: 'LineString',
        coordinates: [
            [a.lng, a.lat],
            [b.lng, b.lat],
        ],
    };
}

export async function fetchMapboxLegRoute(
    accessToken: string,
    profile: RouteProfile,
    a: { lng: number; lat: number },
    b: { lng: number; lat: number },
): Promise<MapboxLegRouteResult> {
    if (coordsNearlyEqual(a, b)) {
        return {
            duration: 0,
            distance: 0,
            geometry: straightLineGeometry(a, b),
        };
    }

    const coordStr = `${a.lng},${a.lat};${b.lng},${b.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?geometries=geojson&overview=full&access_token=${accessToken}`;

    try {
        const res = await fetch(url);
        const data = (await res.json()) as {
            routes?: Array<{ duration?: number; distance?: number; geometry?: GeoJSON.LineString }>;
        };
        const route = data.routes?.[0];
        const geom = route?.geometry;
        if (geom?.type === 'LineString' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
            return {
                duration: typeof route?.duration === 'number' ? route.duration : 0,
                distance: typeof route?.distance === 'number' ? route.distance : 0,
                geometry: geom,
            };
        }
    } catch {
        /* fallback below */
    }

    const distanceKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const speedKmh = profile === 'walking' ? 5 : profile === 'cycling' ? 15 : 35;

    return {
        duration: Math.max(60, Math.round((distanceKm / speedKmh) * 3600)),
        distance: distanceKm * 1000,
        geometry: straightLineGeometry(a, b),
    };
}
