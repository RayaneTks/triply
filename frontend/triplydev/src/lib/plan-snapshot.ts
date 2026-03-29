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
}

export function googleMapsDirectionsEmbedUrl(
    waypoints: Array<{ lat: number; lng: number }>,
    apiKey: string | undefined
): string | null {
    if (!apiKey?.trim() || waypoints.length < 2) return null;
    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
    const dest = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
    const middle = waypoints.slice(1, -1);
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
    if (waypoints.length < 2) return null;
    const parts = waypoints.map((w) => `${w.lat},${w.lng}`);
    return `https://www.google.com/maps/dir/${parts.map(encodeURIComponent).join('/')}`;
}
