/** Snapshot d’itinéraire persisté côté backend (`plan_snapshot` sur `voyages`). */
export interface PlanSnapshotActivity {
    title: string;
    lng: number;
    lat: number;
    layerId?: string;
    durationHours?: number;
}

export interface PlanSnapshotDay {
    dayIndex: number;
    activities: PlanSnapshotActivity[];
}

export interface PlanSnapshot {
    days: PlanSnapshotDay[];
    /** Budget total déclaré au wizard (EUR), persisté pour budget_total et affichage. */
    trip_budget_eur?: number;
    planningMode?: string;
    flightSummary?: {
        carrier?: string;
        price?: string;
        currency?: string;
        originIata?: string;
        destinationIata?: string;
        outboundAt?: string;
        returnAt?: string;
        bookingUrl?: string;
    };
    hotelSummary?: {
        name?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        cityCode?: string;
        cityName?: string;
        totalPrice?: string;
        currency?: string;
        checkInDate?: string;
        checkOutDate?: string;
        bookingUrl?: string;
    };
    destinationSummary?: {
        cityName?: string;
        airportName?: string;
        iataCode?: string;
    };
    /**
     * Origin (departure) city captured during the wizard. Persisted in plan_snapshot
     * so downstream views (flight search modal, recap) can prefill it without a
     * follow-up lookup.
     */
    origin?: {
        cityName: string;
        iataCode: string;
        airportName?: string;
        countryName?: string;
        lat?: number;
        lng?: number;
    };
    /** Besoins déclarés au wizard — pour signaler les sélections manquantes côté fiche voyage. */
    plannerNeeds?: {
        flights?: boolean;
        hotels?: boolean;
        activities?: boolean;
        restaurants?: boolean;
    };
    /** Préférences affinant la sélection automatique vol/hôtel. */
    plannerPreferences?: {
        flightNonStop?: boolean;
        flightTravelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
        hotelMinStars?: 1 | 2 | 3 | 4 | 5;
    };
}

const sanitizeWaypoints = (waypoints: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> =>
    waypoints.filter(
        (w) =>
            typeof w?.lat === 'number' &&
            Number.isFinite(w.lat) &&
            typeof w?.lng === 'number' &&
            Number.isFinite(w.lng)
    );

export function googleMapsDirectionsEmbedUrl(
    waypoints: Array<{ lat: number; lng: number }>,
    apiKey: string | undefined
): string | null {
    const points = sanitizeWaypoints(waypoints);
    if (!apiKey?.trim() || points.length < 2) return null;
    const origin = `${points[0].lat},${points[0].lng}`;
    const dest = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    const middle = points.slice(1, -1);
    const params = new URLSearchParams({
        key: apiKey.trim(),
        origin,
        destination: dest,
        mode: 'driving',
    });
    if (middle.length > 0) {
        params.set('waypoints', middle.map((w) => `${w.lat},${w.lng}`).join('|'));
    }
    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

/** Lien ouvrable sans clé API (fallback). */
export function googleMapsDirectionsLink(waypoints: Array<{ lat: number; lng: number }>): string | null {
    const points = sanitizeWaypoints(waypoints);
    if (points.length < 2) return null;
    const parts = points.map((w) => `${w.lat},${w.lng}`);
    return `https://www.google.com/maps/dir/${parts.map(encodeURIComponent).join('/')}`;
}

/** URL iframe Google Maps sans cle API (fallback). */
export function googleMapsDirectionsIframeFallbackUrl(
    waypoints: Array<{ lat: number; lng: number }>
): string | null {
    const points = sanitizeWaypoints(waypoints);
    if (points.length < 2) return null;
    const origin = `${points[0].lat},${points[0].lng}`;
    const destinationPath = points.slice(1).map((w) => `${w.lat},${w.lng}`).join('+to:');
    const params = new URLSearchParams({
        output: 'embed',
        f: 'd',
        saddr: origin,
        daddr: destinationPath,
    });
    return `https://maps.google.com/maps?${params.toString()}`;
}

/**
 * Genere une carte statique Mapbox (style "flat") avec des marqueurs.
 * Utilisee comme fallback visuel lorsque Google Maps Embed n'est pas configure.
 */
export function mapboxStaticWaypointsMapUrl(
    waypoints: Array<{ lat: number; lng: number }>,
    mapboxToken: string | undefined
): string | null {
    const points = sanitizeWaypoints(waypoints);
    const token = mapboxToken?.trim();
    if (!token || points.length < 2) return null;

    const markers = points
        .map((w, index) => {
            const marker = index === 0 ? 'a' : index === points.length - 1 ? 'b' : 's';
            return `pin-${marker}+00BCD4(${w.lng},${w.lat})`;
        })
        .join(',');

    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers}/auto/900x420?padding=40,40,40,40&access_token=${encodeURIComponent(token)}`;
}
