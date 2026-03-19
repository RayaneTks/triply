/**
 * Utilitaires pour l'optimisation du positionnement des points (hôtels) sur la carte.
 * - Dispersion des points qui se chevauchent (jitter/spread)
 * - Fusion intelligente centre ville + hôtels
 */

export interface LocationPoint {
    id: string;
    title: string;
    coordinates: { latitude: number; longitude: number };
    type?: string;
}

/** Distance minimale en degrés (~11m à l'équateur) pour considérer 2 points comme distincts */
const OVERLAP_THRESHOLD_DEG = 0.0001;

/** Offset de dispersion en degrés (~50m) */
const SPREAD_OFFSET_DEG = 0.0005;

/**
 * Calcule la distance en degrés entre deux points (approximation Haversine simplifiée).
 * Suffisant pour des comparaisons locales.
 */
function distanceDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = lat2 - lat1;
    const dLng = (lng2 - lng1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Disperse les points qui se chevauchent en les répartissant en cercle autour de leur barycentre.
 * Préserve les points city-center (pas de modification).
 * Déterministe : même entrée = même sortie.
 */
export function spreadOverlappingPoints<T extends LocationPoint>(locations: T[]): T[] {
    if (locations.length <= 1) return locations;

    const hotels = locations.filter((l) => l.type !== 'city-center');
    const nonHotels = locations.filter((l) => l.type === 'city-center');

    if (hotels.length <= 1) return locations;

    // Grouper les hôtels par "cellule" (coordonnées arrondies)
    const cellKey = (lat: number, lng: number) =>
        `${Math.round(lat / OVERLAP_THRESHOLD_DEG)}_${Math.round(lng / OVERLAP_THRESHOLD_DEG)}`;

    const groups = new Map<string, T[]>();
    for (const h of hotels) {
        const key = cellKey(h.coordinates.latitude, h.coordinates.longitude);
        const existing = groups.get(key) ?? [];
        groups.set(key, [...existing, h]);
    }

    const result: T[] = [...nonHotels];

    for (const group of groups.values()) {
        if (group.length === 1) {
            result.push(group[0]);
            continue;
        }

        // Barycentre du groupe
        const avgLat = group.reduce((s, p) => s + p.coordinates.latitude, 0) / group.length;
        const avgLng = group.reduce((s, p) => s + p.coordinates.longitude, 0) / group.length;

        // Répartir en cercle autour du barycentre
        const angleStep = (2 * Math.PI) / group.length;
        group.forEach((p, i) => {
            const angle = i * angleStep;
            const offsetLat = Math.cos(angle) * SPREAD_OFFSET_DEG;
            const offsetLng = Math.sin(angle) * SPREAD_OFFSET_DEG;
            result.push({
                ...p,
                coordinates: {
                    latitude: avgLat + offsetLat,
                    longitude: avgLng + offsetLng,
                },
            });
        });
    }

    return result;
}

/**
 * Fusionne le centre ville (si présent) avec les hôtels.
 * Évite les doublons par id.
 */
export function mergeCityCenterWithHotels(
    cityCenter: LocationPoint | null,
    hotels: LocationPoint[]
): LocationPoint[] {
    const seen = new Set<string>();
    const result: LocationPoint[] = [];

    if (cityCenter) {
        result.push(cityCenter);
        seen.add(cityCenter.id);
    }

    for (const h of hotels) {
        if (!seen.has(h.id)) {
            seen.add(h.id);
            result.push({ ...h, type: h.type || 'hotel' });
        }
    }

    return result;
}
