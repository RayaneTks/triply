'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { WorldMap, type RouteMapSegment } from '@/src/components/Map/Map';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { Button } from '@/src/components/Button/Button';
import { Login } from "@/src/components/Login/Login";
import {
    TuPreferes,
    PREFERENCES_STORAGE_KEY,
    preferencesPayloadToAssistantTags,
} from "@/src/components/TuPreferes/TuPreferes";
import Assistant, { type AssistantHandle, type SuggestedActivityPin } from '@/src/components/Assistant/Assistant';
import {
    TripCreationWizard,
    getActivityDurationHours,
    type ActivityRouteProfile,
    type DayActivityPoi,
} from '@/src/features/trip-creation/TripCreationWizard';
import { useTripConfiguration } from '@/src/features/trip-creation/useTripConfiguration';
import { generateFlightRequest } from '@/utils/amadeus';
const FlightSearchModal = dynamic(
    () => import('@/src/components/FlightSearchModal/FlightSearchModal').then((m) => m.FlightSearchModal),
    { ssr: false }
);
const FlightDetailModal = dynamic(
    () => import('@/src/components/FlightDetailModal/FlightDetailModal').then((m) => m.FlightDetailModal),
    { ssr: false }
);
const HotelSearchModal = dynamic(
    () => import('@/src/components/HotelSearchModal/HotelSearchModal').then((m) => m.HotelSearchModal),
    { ssr: false }
);
const HotelDetailModal = dynamic(
    () => import('@/src/components/HotelDetailModal/HotelDetailModal').then((m) => m.HotelDetailModal),
    { ssr: false }
);
import { mergeCityCenterWithHotels, spreadOverlappingPoints, type LocationPoint } from '@/src/utils/locations';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { AmadeusResponse } from '@/src/components/FlightResults/FlightResults';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { AmadeusHotelResponse } from '@/src/components/HotelResults/HotelResults';
import type { FlightRequestPayload } from '@/utils/amadeus';
import { clearSession, fetchPreferences, getStoredSession, logout, me, saveSession, updatePreferences, type AuthUser } from '@/src/lib/auth-client';
import {
    loadStoredPlanningMode,
    savePlanningMode,
    clearPlanningModeStorage,
    type PlanningMode,
} from '@/src/features/trip-creation/planning-mode';
import {
    applyTripConfigPartial,
    loadTripConfigDraft,
    saveTripConfigDraft,
} from '@/src/features/trip-creation/trip-config-draft';
import { clampPlanFormStep } from '@/src/features/trip-creation/plan-form-wizard';
import type { TripConfigurationState } from '@/src/features/trip-creation/useTripConfiguration';
import { createTrip, validateTripApi } from '@/src/lib/trips-client';
import type { PlanSnapshot } from '@/src/lib/plan-snapshot';
import {
    buildStep1FormSnapshotForAssistant,
    type AssistantStep1FormPatch,
} from '@/src/features/trip-creation/step1-form-patch';
import { requestActivityRegeneration } from '@/src/lib/assistant-regenerate';
import { buildManualFlightOffer, buildManualHotelOffer } from '@/src/features/trip-creation/manual-trip-offers';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';

/** Segment / carte en alerte dépassement temps jour */
const ACTIVITY_TIME_ALERT_COLOR = '#ef4444';

/** LineString GeoJSON (évite `GeoJSON.LineString` en .tsx et les erreurs de namespace). */
type GeoLineString = { type: 'LineString'; coordinates: number[][] };

/** Couleurs par activité sur la barre de temps (contraste sur fond sombre) */
const ACTIVITY_TIMELINE_COLORS = [
    '#22d3ee',
    '#a78bfa',
    '#fbbf24',
    '#34d399',
    '#fb7185',
    '#60a5fa',
    '#f472b6',
    '#2dd4bf',
    '#f97316',
    '#4ade80',
];

/** Barre de progression : trajets entre POIs (aligné modes carte / wizard). */
const LEG_TRAVEL_TIMELINE_COLORS: Record<ActivityRouteProfile, string> = {
    driving: '#f97316',
    walking: '#22d3ee',
    cycling: '#84cc16',
};

const LEG_PROFILE_SHORT_LABELS: Record<ActivityRouteProfile, string> = {
    driving: 'Voiture',
    walking: 'À pied',
    cycling: 'Vélo',
};

/** Durées de trajet (h) par tronçon selon `dayRoutes` et le mode choisi pour chaque leg. */
function travelHoursBetweenActivities(
    routes: Partial<
        Record<
            ActivityRouteProfile,
            {
                legs?: Array<{ duration: number; distance: number; geometry?: GeoLineString }>;
            }
        >
    >,
    modes: ActivityRouteProfile[],
    legCount: number,
): number[] {
    const out: number[] = [];
    for (let i = 0; i < legCount; i++) {
        const profile = modes[i] ?? 'driving';
        const durSec = routes[profile]?.legs?.[i]?.duration ?? 0;
        out.push(durSec > 0 ? durSec / 3600 : 0);
    }
    return out;
}

function getDayActivityLabel(p: {
    properties?: Record<string, unknown> | null;
    layer?: { id?: string };
}): string {
    const n = p.properties?.name ?? p.properties?.name_en ?? p.layer?.id ?? 'Lieu';
    return String(n);
}

async function fetchGeocodeFirst(keyword: string): Promise<{ lat: number; lng: number; name: string } | null> {
    const q = keyword.trim();
    if (q.length < 2) return null;
    try {
        const res = await fetch(
            `/api/places/search?${new URLSearchParams({ keyword: q, subType: 'CITY,AIRPORT' }).toString()}`,
        );
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

type PlaceSearchItem = {
    iataCode?: string;
    subType?: 'CITY' | 'AIRPORT' | string;
    name?: string;
    address?: {
        cityName?: string;
    };
};

async function resolveDestinationLabels(params: {
    iataCode?: string;
    selectedName?: string;
}): Promise<{ cityName: string; airportName?: string; iataCode?: string }> {
    const iata = (params.iataCode || '').trim().toUpperCase();
    const selectedName = (params.selectedName || '').trim();

    let cityName = selectedName;
    let airportName: string | undefined;

    if (iata.length >= 3) {
        try {
            const res = await fetch(
                `/api/places/search?${new URLSearchParams({ keyword: iata, subType: 'CITY,AIRPORT' }).toString()}`,
            );
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
            // Fallback silencieux: on garde les données locales.
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

function poiStableKeyForLeg(p: DayActivityPoi) {
    return p._dragId ?? `${p.lngLat.lng.toFixed(6)},${p.lngLat.lat.toFixed(6)}`;
}

function legPairKey(from: DayActivityPoi, to: DayActivityPoi) {
    return `${poiStableKeyForLeg(from)}→${poiStableKeyForLeg(to)}`;
}

/** Recalcule les modes par tronçon quand la liste d’activités change (ajout / suppression / réordonnancement). */
function buildLegTransportModesForActivities(
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

function activityListSignature(list: DayActivityPoi[]) {
    return list.map(poiStableKeyForLeg).join('|');
}

function coordsNearlyEqual(a: { lng: number; lat: number }, b: { lng: number; lat: number }): boolean {
    return Math.abs(a.lng - b.lng) < 1e-6 && Math.abs(a.lat - b.lat) < 1e-6;
}

/** Fusionne des LineString successifs (évite le doublon au point de jonction). */
function mergeRouteLineStrings(geoms: GeoLineString[]): GeoLineString | null {
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

/** Points du jour courant à partir de la clé `selectedDay:lng,lat;...` (voir routeDepsKey). */
function parseLngLatPointsFromRouteDepsKey(routeDepsKey: string): { lng: number; lat: number }[] | null {
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

type MapboxLegRouteResult = { duration: number; distance: number; geometry?: GeoLineString };

async function fetchMapboxLegRoute(
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

function LoginWithMapBackground({
                                    mapboxToken,
                                    onLoginSuccess,
                                    onBack,
                                }: {
    mapboxToken: string;
    onLoginSuccess: (user: AuthUser, isNewUser?: boolean) => void;
    onBack: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [padding, setPadding] = useState({ left: 600, top: 400, right: 0, bottom: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            setPadding({ left: width * 0.55, top: height * 0.5, right: 0, bottom: 0 });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 z-0" style={{ backgroundColor: 'var(--background, #222222)' }}>
                <WorldMap
                    accessToken={mapboxToken}
                    initialLatitude={20}
                    initialLongitude={0}
                    initialZoom={1.2}
                    mapStyle="mapbox://styles/mapbox/standard"
                    mapConfig={{ lightPreset: 'night' }}
                    pitch={60}
                    interactive={false}
                    autoRotateSpeed={6}
                    padding={padding}
                    height="100%"
                    width="100%"
                    className="h-full w-full"
                />
            </div>
            <div className="absolute inset-0 z-10">
                <Login onLoginSuccess={onLoginSuccess} onBack={onBack} />
            </div>
        </div>
    );
}

export default function Home() {
    const router = useRouter();
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const hasMapboxToken = MAPBOX_TOKEN.trim().length > 0;

    // Etats Globaux
    // (slides system removed - single panel now)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');
    const [showTuPreferes, setShowTuPreferes] = useState(false);
    const [mapLocations, setMapLocations] = useState<LocationPoint[]>([]);
    const [, setIsLoadingHotels] = useState(false);

    // AUTO-COLLAPSE SIDEBAR IF CONNECTED
    useEffect(() => {
        if (isConnected) {
            setIsSidebarCollapsed(true);
        }
    }, [isConnected]);

    useEffect(() => {
        const syncAuth = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                setIsConnected(false);
                return;
            }

            try {
                const user = await me(session.token);
                saveSession({ token: session.token, user });

                try {
                    const prefs = await fetchPreferences(session.token);
                    if (prefs.planning_mode === 'full_ai' || prefs.planning_mode === 'semi_ai' || prefs.planning_mode === 'manual') {
                        savePlanningMode(prefs.planning_mode, user.id);
                    }
                } catch {
                    // Fallback silencieux: on garde le mode local en session si l'API profil échoue.
                }

                setIsConnected(true);
            } catch {
                const uid = getStoredSession()?.user?.id;
                clearSession();
                clearPlanningModeStorage(uid);
                setIsConnected(false);
            }
        };

        void syncAuth();
    }, []);

    // Etats Formulaire Voyage (centralisés dans un hook dédié)
    const tripConfig = useTripConfiguration();
    const [isLoading, setIsLoading] = useState(false);
    const [, setLastRequestPayload] = useState<FlightRequestPayload | null>(null);
    const [apiResponse, setApiResponse] = useState<(AmadeusResponse | { error?: string; details?: string }) | null>(null);

    // Etats Mapbox
    const [, setSelectedPoi] = useState<MapboxPoiFeature | null>(null);
    const [dayActivitiesByDay, setDayActivitiesByDay] = useState<Record<number, DayActivityPoi[]>>({});
    const [legTransportByDay, setLegTransportByDay] = useState<Record<number, ActivityRouteProfile[]>>({});
    const dayActivitiesByDayForMapRef = useRef(dayActivitiesByDay);
    const legTransportByDayForMapRef = useRef(legTransportByDay);
    dayActivitiesByDayForMapRef.current = dayActivitiesByDay;
    legTransportByDayForMapRef.current = legTransportByDay;
    const prevActivitiesByDayRef = useRef<Record<number, DayActivityPoi[]>>({});
    const selectedRouteTypeRef = useRef<'driving' | 'walking' | 'cycling' | null>(null);
    const [selectedDay, setSelectedDay] = useState(1);
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
    const [selectedRouteType, setSelectedRouteType] = useState<'driving' | 'walking' | 'cycling' | null>(null);
    selectedRouteTypeRef.current = selectedRouteType;
    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/standard');
    const [mapConfig, setMapConfig] = useState<{ lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' }>({ lightPreset: 'day' });
    const [mapPitch, setMapPitch] = useState<number>(0);
    const [mapViewMenuOpen, setMapViewMenuOpen] = useState(false);
    const mapViewMenuRef = useRef<HTMLDivElement>(null);
    const [hotelFilterMenuOpen, setHotelFilterMenuOpen] = useState(false);
    const hotelFilterMenuRef = useRef<HTMLDivElement>(null);
    const [activityHoursByDay, setActivityHoursByDay] = useState<Record<number, number>>({});
    /** `_dragId` de la dernière activité ajoutée pour ce jour (pour alerte dépassement) */
    const [lastAddedActivityDragIdByDay, setLastAddedActivityDragIdByDay] = useState<Record<number, string | undefined>>({});
    const [activityHoursEditOpen, setActivityHoursEditOpen] = useState(false);
    const activityHoursEditRef = useRef<HTMLDivElement>(null);
    const [hotelStarsFilter, setHotelStarsFilter] = useState<number[] | null>(null); // null = tous, [2,3,4] = filtré
    const lastSearchRef = useRef<{ lat: number; lng: number; cityCenter: LocationPoint | null } | null>(null);

    // --- GESTION SELECTION AEROPORT (NOUVEAU) ---
    const handleAirportSelect = (iata: string, name: string, lat: number, lng: number) => {
        console.log(`Aéroport sélectionné: ${name} (${iata}) @ ${lat}, ${lng}`);

        // 1. Si pas de départ, c'est le départ
        if (!tripConfig.departureCity) {
            tripConfig.setDepartureCity(iata);
        }
        // 2. Sinon, c'est l'arrivée
        else {
            if (tripConfig.departureCity !== iata) {
                tripConfig.setArrivalCity(iata);
                tripConfig.setArrivalCityName(name);

                // --- CORRECTION MAJEURE ---
                // Au lieu d'attendre que l'utilisateur ouvre la modal,
                // on lance directement la recherche d'hôtels autour de ces coordonnées (GPS).
                // Cela contourne le problème du code IATA non reconnu par Amadeus.

                const airportLocationObj = {
                    id: `airport-${iata}`,
                    title: name,
                    coordinates: { latitude: lat, longitude: lng },
                    type: 'city-center', // On le traite comme un centre pour l'affichage
                    zoom: 12
                };

                // On lance la recherche (utilise /api/hotels/search?lat=...&lng=...)
                searchHotelsAtLocation(lat, lng, airportLocationObj, hotelStarsFilter);
            }
        }
    };

    const searchHotelsAtLocation = useCallback(async (lat: number, lng: number, cityCenter: LocationPoint | null, ratingsFilter?: number[] | null) => {
        lastSearchRef.current = { lat, lng, cityCenter };
        const ratingsParam = ratingsFilter && ratingsFilter.length > 0 ? ratingsFilter.join(',') : undefined;
        console.log("🏨 Recherche d'hôtels demandée pour :", lat, lng, ratingsParam || 'tous');
        setIsLoadingHotels(true);

        try {
            const url = new URL('/api/hotels/search', window.location.origin);
            url.searchParams.set('lat', String(lat));
            url.searchParams.set('lng', String(lng));
            if (ratingsParam) url.searchParams.set('ratings', ratingsParam);

            const res = await fetch(url.toString());
            const data = await res.json();

            if (data.locations && data.locations.length > 0) {
                const merged = mergeCityCenterWithHotels(cityCenter, data.locations);
                const spread = spreadOverlappingPoints(merged);
                setMapLocations(spread);
            } else if (cityCenter) {
                setMapLocations([cityCenter]);
            }
        } catch (error) {
            console.error("Erreur chargement hôtels:", error);
            if (cityCenter) setMapLocations([cityCenter]);
        } finally {
            setIsLoadingHotels(false);
        }
    }, []);

    const handleAssistantUpdate = useCallback((locations: LocationPoint[]) => {
        const cityCenter = locations.find((l) => l.type === 'city-center') ?? locations[0] ?? null;

        // Affichage immédiat du centre ville (rafraîchissement fluide)
        if (cityCenter) {
            setMapLocations([cityCenter]);
        } else {
            setMapLocations(locations);
        }

        if (locations.length > 0 && locations[0]?.coordinates) {
            const { latitude, longitude } = locations[0].coordinates;
            searchHotelsAtLocation(latitude, longitude, cityCenter, hotelStarsFilter);
        }
    }, [searchHotelsAtLocation, hotelStarsFilter]);

    const applyHotelFilter = useCallback((stars: number[] | null) => {
        setHotelStarsFilter(stars);
        setHotelFilterMenuOpen(false);
        const last = lastSearchRef.current;
        if (last) {
            searchHotelsAtLocation(last.lat, last.lng, last.cityCenter, stars);
        }
    }, [searchHotelsAtLocation]);

    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [selectedFlightOffer, setSelectedFlightOffer] = useState<FlightOffer | null>(null);
    const [selectedFlightCarrierName, setSelectedFlightCarrierName] = useState('');
    const [flightModalBudget, setFlightModalBudget] = useState('');
    const [isFlightDetailModalOpen, setIsFlightDetailModalOpen] = useState(false);

    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    /** Après ouverture du panneau : lance suggestActivities une fois le composant Assistant monté */
    const [pendingAssistantSuggestion, setPendingAssistantSuggestion] = useState<'day' | 'all' | null>(null);
    const [assistantRequestLoading, setAssistantRequestLoading] = useState(false);
    const [regeneratingActivity, setRegeneratingActivity] = useState<{ day: number; index: number } | null>(null);
    const assistantRef = useRef<AssistantHandle>(null);
    const [planningMode, setPlanningModeState] = useState<PlanningMode | null>(null);
    useEffect(() => {
        if (!isConnected) {
            setPlanningModeState(null);
            return;
        }
        const uid = getStoredSession()?.user?.id ?? null;
        setPlanningModeState(loadStoredPlanningMode(uid));
    }, [isConnected]);
    const handlePlanningModeChange = useCallback((mode: PlanningMode) => {
        const uid = getStoredSession()?.user?.id;
        if (uid == null || uid === '') return;
        setPlanningModeState(mode);
        savePlanningMode(mode, uid);

        const session = getStoredSession();
        if (session?.token) {
            void updatePreferences(session.token, { planning_mode: mode }).catch(() => {
                // On ne bloque pas l'UX en cas d'échec réseau, le mode reste au moins en session locale.
            });
        }

        if (mode === 'full_ai') {
            setIsAssistantOpen(true);
        } else if (mode === 'manual') {
            setIsAssistantOpen(false);
        }
    }, []);

    useEffect(() => {
        if (planningMode === 'manual') setIsAssistantOpen(false);
    }, [planningMode]);
    const [geocodeAppendPending, setGeocodeAppendPending] = useState(false);
    /** Évite de re-seeder l’aéroport d’arrivée sur le jour 1 pour le même vol. */
    const day1OutboundAirportSeededForFlightRef = useRef<string | null>(null);
    const [validateTripModalOpen, setValidateTripModalOpen] = useState(false);
    const [validateTripSubmitting, setValidateTripSubmitting] = useState(false);
    const [validateTripError, setValidateTripError] = useState('');
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
    const isLgUp = useMediaQuery(MEDIA_MIN_LG);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const itineraryInitRef = useRef(false);
    useLayoutEffect(() => {
        if (itineraryInitRef.current) return;
        itineraryInitRef.current = true;
        if (typeof window !== 'undefined' && !window.matchMedia(MEDIA_MIN_LG).matches) {
            setIsConfigPanelOpen(false);
        }
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (showTuPreferes) return;
            if (validateTripModalOpen) {
                setValidateTripModalOpen(false);
                return;
            }
            if (mapViewMenuOpen) {
                setMapViewMenuOpen(false);
                return;
            }
            if (hotelFilterMenuOpen) {
                setHotelFilterMenuOpen(false);
                return;
            }
            if (isAssistantOpen) {
                setIsAssistantOpen(false);
                return;
            }
            if (isConfigPanelOpen) {
                setIsConfigPanelOpen(false);
                return;
            }
            if (isMobileNavOpen) {
                setIsMobileNavOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [
        showTuPreferes,
        validateTripModalOpen,
        mapViewMenuOpen,
        hotelFilterMenuOpen,
        isAssistantOpen,
        isConfigPanelOpen,
        isMobileNavOpen,
    ]);

    const [wizardView, setWizardView] = useState<'plan' | 'activity'>('plan');
    const [planFormStep, setPlanFormStep] = useState(0);
    const [planFormMaxVisited, setPlanFormMaxVisited] = useState(0);

    const tripDraftHydratedRef = useRef(false);
    const allowTripDraftSaveRef = useRef(false);

    useLayoutEffect(() => {
        if (tripDraftHydratedRef.current) return;
        tripDraftHydratedRef.current = true;
        const uid = getStoredSession()?.user?.id ?? null;
        const draft = loadTripConfigDraft(uid);
        if (draft) {
            if (Object.keys(draft.trip).length > 0) {
                applyTripConfigPartial(draft.trip, tripConfig);
            }
            if (draft.wizardView === 'plan' || draft.wizardView === 'activity') {
                setWizardView(draft.wizardView);
            }
            if (draft.selectedDay != null && draft.selectedDay >= 1) {
                setSelectedDay(draft.selectedDay);
            }
            let pfStep = 0;
            let pfMax = 0;
            if (draft.planFormStep != null) {
                pfStep = clampPlanFormStep(draft.planFormStep);
            }
            if (draft.planFormMaxVisited != null) {
                pfMax = clampPlanFormStep(draft.planFormMaxVisited);
            } else {
                pfMax = pfStep;
            }
            pfMax = Math.max(pfMax, pfStep);
            setPlanFormStep(pfStep);
            setPlanFormMaxVisited(pfMax);
        }
        allowTripDraftSaveRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- hydratation unique au montage ; les setters du hook sont stables
    }, []);

    useEffect(() => {
        if (!allowTripDraftSaveRef.current) return;
        const uid = getStoredSession()?.user?.id ?? null;
        const t = window.setTimeout(() => {
            const trip: TripConfigurationState = {
                departureCity: tripConfig.departureCity,
                arrivalCity: tripConfig.arrivalCity,
                arrivalCityName: tripConfig.arrivalCityName,
                travelDays: tripConfig.travelDays,
                travelerCount: tripConfig.travelerCount,
                budget: tripConfig.budget,
                activityTime: tripConfig.activityTime,
                outboundDate: tripConfig.outboundDate,
                returnDate: tripConfig.returnDate,
                outboundDepartureTime: tripConfig.outboundDepartureTime,
                outboundArrivalTime: tripConfig.outboundArrivalTime,
                returnDepartureTime: tripConfig.returnDepartureTime,
                returnArrivalTime: tripConfig.returnArrivalTime,
                selectedOptions: tripConfig.selectedOptions,
                dietarySelections: tripConfig.dietarySelections,
                manualFlightEntry: tripConfig.manualFlightEntry,
                manualFlightAirline: tripConfig.manualFlightAirline,
                manualFlightNumber: tripConfig.manualFlightNumber,
                manualFlightNumberReturn: tripConfig.manualFlightNumberReturn,
                manualHotelEntry: tripConfig.manualHotelEntry,
                manualHotelName: tripConfig.manualHotelName,
                manualHotelAddress: tripConfig.manualHotelAddress,
                manualHotelCheckIn: tripConfig.manualHotelCheckIn,
                manualHotelCheckOut: tripConfig.manualHotelCheckOut,
            };
            saveTripConfigDraft(uid, { trip, wizardView, selectedDay, planFormStep, planFormMaxVisited });
        }, 200);
        return () => window.clearTimeout(t);
    }, [
        tripConfig.departureCity,
        tripConfig.arrivalCity,
        tripConfig.arrivalCityName,
        tripConfig.travelDays,
        tripConfig.travelerCount,
        tripConfig.budget,
        tripConfig.activityTime,
        tripConfig.outboundDate,
        tripConfig.returnDate,
        tripConfig.outboundDepartureTime,
        tripConfig.outboundArrivalTime,
        tripConfig.returnDepartureTime,
        tripConfig.returnArrivalTime,
        tripConfig.selectedOptions,
        tripConfig.dietarySelections,
        tripConfig.manualFlightEntry,
        tripConfig.manualFlightAirline,
        tripConfig.manualFlightNumber,
        tripConfig.manualFlightNumberReturn,
        tripConfig.manualHotelEntry,
        tripConfig.manualHotelName,
        tripConfig.manualHotelAddress,
        tripConfig.manualHotelCheckIn,
        tripConfig.manualHotelCheckOut,
        wizardView,
        selectedDay,
        planFormStep,
        planFormMaxVisited,
    ]);

    const handleBackToPlanningModeSelection = useCallback(() => {
        const uid = getStoredSession()?.user?.id ?? null;
        clearPlanningModeStorage(uid);
        setPlanningModeState(null);
        setWizardView('plan');
        setPlanFormStep(0);
        setPlanFormMaxVisited(0);
        setIsAssistantOpen(false);
    }, []);

    /** Dernières coordonnées connues pour le code IATA d’arrivée (sélection autocomplete) */
    const [destinationGeo, setDestinationGeo] = useState<{ lat: number; lng: number; iataCode: string } | null>(null);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [hotelModalBudget, setHotelModalBudget] = useState('');
    const [selectedHotelOffer, setSelectedHotelOffer] = useState<HotelOffer | null>(null);
    const [isHotelDetailModalOpen, setIsHotelDetailModalOpen] = useState(false);
    const [hotelApiResponse, setHotelApiResponse] = useState<(AmadeusHotelResponse | { error?: string; details?: string }) | null>(null);
    const [isLoadingHotel, setIsLoadingHotel] = useState(false);
    const [hotelMealRegime, setHotelMealRegime] = useState('');

    const syncFormFromFlight = useCallback((offer: FlightOffer) => {
        const outbound = offer.itineraries?.[0];
        const returnItin = offer.itineraries?.[1];
        const firstSeg = outbound?.segments?.[0];
        const lastOutboundSeg = outbound?.segments?.[outbound?.segments?.length ? outbound.segments.length - 1 : 0];
        const firstReturnSeg = returnItin?.segments?.[0];
        const lastReturnSeg = returnItin?.segments?.[returnItin?.segments?.length ? returnItin.segments.length - 1 : 0];

        if (firstSeg?.departure) {
            tripConfig.setDepartureCity(firstSeg.departure.iataCode || '');
            const dt = firstSeg.departure.at;
            if (dt) {
                tripConfig.setOutboundDate(dt.slice(0, 10));
                tripConfig.setOutboundDepartureTime(dt.slice(11, 16));
            }
        }
        if (lastOutboundSeg?.arrival?.at) {
            tripConfig.setOutboundArrivalTime(lastOutboundSeg.arrival.at.slice(11, 16));
        }
        if (lastOutboundSeg?.arrival) {
            tripConfig.setArrivalCity(lastOutboundSeg.arrival.iataCode || '');
            if (returnItin && firstReturnSeg?.departure?.at) {
                tripConfig.setReturnDate(firstReturnSeg.departure.at.slice(0, 10));
                tripConfig.setReturnDepartureTime(firstReturnSeg.departure.at.slice(11, 16));
            }
            if (returnItin && lastReturnSeg?.arrival?.at) {
                tripConfig.setReturnArrivalTime(lastReturnSeg.arrival.at.slice(11, 16));
            }
        }
        if (offer.travelerPricings?.length) {
            tripConfig.setTravelerCount(offer.travelerPricings.length);
        }
    }, [tripConfig]);

    const handleFlightSelect = (offer: FlightOffer, carrierName: string) => {
        tripConfig.setManualFlightEntry(false);
        setSelectedFlightOffer(offer);
        setSelectedFlightCarrierName(carrierName);
        setIsFlightModalOpen(false);
        syncFormFromFlight(offer);
    };

    useEffect(() => {
        if (selectedFlightOffer) syncFormFromFlight(selectedFlightOffer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when selected flight changes
    }, [selectedFlightOffer]);

    const handleHotelSelect = (offer: HotelOffer) => {
        tripConfig.setManualHotelEntry(false);
        setSelectedHotelOffer(offer);
        setIsHotelModalOpen(false);
        tripConfig.setArrivalCity(offer.cityCode);
        tripConfig.setOutboundDate(offer.checkInDate);
        tripConfig.setReturnDate(offer.checkOutDate);
        if (offer.guests?.adults) tripConfig.setTravelerCount(offer.guests.adults);
    };

    const prevManualFlightRef = useRef(false);
    useEffect(() => {
        if (tripConfig.manualFlightEntry && !prevManualFlightRef.current) {
            setSelectedFlightOffer(null);
            setSelectedFlightCarrierName('');
            setIsFlightDetailModalOpen(false);
        }
        prevManualFlightRef.current = tripConfig.manualFlightEntry;
    }, [tripConfig.manualFlightEntry]);

    const prevManualHotelRef = useRef(false);
    useEffect(() => {
        if (tripConfig.manualHotelEntry && !prevManualHotelRef.current) {
            setSelectedHotelOffer(null);
            setIsHotelDetailModalOpen(false);
        }
        prevManualHotelRef.current = tripConfig.manualHotelEntry;
    }, [tripConfig.manualHotelEntry]);

    const effectiveFlightOffer = useMemo(
        () =>
            tripConfig.manualFlightEntry
                ? buildManualFlightOffer({
                      manualFlightEntry: true,
                      departureCity: tripConfig.departureCity,
                      arrivalCity: tripConfig.arrivalCity,
                      outboundDate: tripConfig.outboundDate,
                      returnDate: tripConfig.returnDate,
                      outboundDepartureTime: tripConfig.outboundDepartureTime,
                      outboundArrivalTime: tripConfig.outboundArrivalTime,
                      returnDepartureTime: tripConfig.returnDepartureTime,
                      returnArrivalTime: tripConfig.returnArrivalTime,
                      manualFlightAirline: tripConfig.manualFlightAirline,
                      manualFlightNumber: tripConfig.manualFlightNumber,
                      manualFlightNumberReturn: tripConfig.manualFlightNumberReturn,
                  })
                : selectedFlightOffer,
        [
            tripConfig.manualFlightEntry,
            tripConfig.departureCity,
            tripConfig.arrivalCity,
            tripConfig.outboundDate,
            tripConfig.returnDate,
            tripConfig.outboundDepartureTime,
            tripConfig.outboundArrivalTime,
            tripConfig.returnDepartureTime,
            tripConfig.returnArrivalTime,
            tripConfig.manualFlightAirline,
            tripConfig.manualFlightNumber,
            tripConfig.manualFlightNumberReturn,
            selectedFlightOffer,
        ]
    );

    const effectiveFlightCarrierName = tripConfig.manualFlightEntry
        ? tripConfig.manualFlightAirline
        : selectedFlightCarrierName;

    /** IATA du dernier segment du vol aller = aéroport d’arrivée à la destination */
    const outboundFlightArrivalIata = useMemo(() => {
        const segs = effectiveFlightOffer?.itineraries?.[0]?.segments;
        if (!Array.isArray(segs) || segs.length === 0) return '';
        const last = segs[segs.length - 1];
        const c = last?.arrival?.iataCode?.trim().toUpperCase();
        return c && c.length >= 2 ? c : '';
    }, [effectiveFlightOffer]);

    const effectiveHotelOffer = useMemo(
        () =>
            tripConfig.manualHotelEntry
                ? buildManualHotelOffer({
                      manualHotelEntry: true,
                      manualHotelName: tripConfig.manualHotelName,
                      manualHotelAddress: tripConfig.manualHotelAddress,
                      manualHotelCheckIn: tripConfig.manualHotelCheckIn,
                      manualHotelCheckOut: tripConfig.manualHotelCheckOut,
                      arrivalCity: tripConfig.arrivalCity,
                  })
                : selectedHotelOffer,
        [
            tripConfig.manualHotelEntry,
            tripConfig.manualHotelName,
            tripConfig.manualHotelAddress,
            tripConfig.manualHotelCheckIn,
            tripConfig.manualHotelCheckOut,
            tripConfig.arrivalCity,
            selectedHotelOffer,
        ]
    );

    // Gestion de la recherche de vol
    const handleFlightSearch = async (options?: { autoSelect?: boolean }) => {
        setIsLoading(true);

        const effectiveFlightBudget = (flightModalBudget || tripConfig.budget || '').trim();

        const payload = generateFlightRequest(
            tripConfig.departureCity,
            tripConfig.arrivalCity,
            tripConfig.outboundDate,
            tripConfig.returnDate,
            tripConfig.travelerCount,
            effectiveFlightBudget,
            tripConfig.outboundDepartureTime,
            tripConfig.returnDepartureTime
        );

        setLastRequestPayload(payload);

        try {
            console.log("Envoi de la requête...", payload);
            const res = await fetch('/api/flights/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // 4. On sauvegarde la réponse (affichée dans la modal)
            setApiResponse(data);

            if (options?.autoSelect && data && typeof data === 'object' && 'data' in data) {
                const response = data as AmadeusResponse;
                const offers = Array.isArray(response.data) ? response.data : [];

                if (offers.length > 0) {
                    const getOfferPrice = (offer: FlightOffer): number => {
                        const raw = offer.price?.grandTotal ?? offer.price?.total ?? '';
                        const n = Number.parseFloat(raw);
                        return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
                    };

                    const bestOffer = offers.reduce((best, current) =>
                        getOfferPrice(current) < getOfferPrice(best) ? current : best,
                    offers[0]);

                    const carrierCode = bestOffer.validatingAirlineCodes?.[0] ?? '';
                    const carrierName = response.dictionaries?.carriers?.[carrierCode] || carrierCode || 'Compagnie';

                    handleFlightSelect(bestOffer, carrierName);
                }
            }

        } catch (error) {
            console.error("Erreur critique:", error);
            setApiResponse({ error: "Erreur lors de l'appel API", details: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleHotelSearch = async (options?: { autoSelect?: boolean }) => {
        const city = tripConfig.arrivalCity || tripConfig.departureCity;
        if (!city) {
            setHotelApiResponse({ error: 'Veuillez sélectionner une ville de destination.' });
            return;
        }
        const effectiveHotelBudget = (hotelModalBudget || tripConfig.budget || '').trim();
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const checkIn = tripConfig.outboundDate || today;
        const checkOut = tripConfig.returnDate || tomorrow;

        setIsLoadingHotel(true);
        try {
            const res = await fetch('/api/hotels/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cityCode: city,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    adults: tripConfig.travelerCount,
                    roomQuantity: 1,
                    maxPrice: effectiveHotelBudget ? parseInt(effectiveHotelBudget, 10) : undefined,
                    preferences: tripConfig.selectedOptions,
                    ...(hotelMealRegime.trim() ? { boardType: hotelMealRegime.trim() } : {}),
                }),
            });
            const data = await res.json();
            setHotelApiResponse(data);

            if (options?.autoSelect && data && typeof data === 'object' && 'data' in data) {
                const response = data as AmadeusHotelResponse;
                const items = Array.isArray(response.data) ? response.data : [];
                let bestOffer: HotelOffer | null = null;
                let bestPrice = Number.POSITIVE_INFINITY;

                for (const item of items) {
                    const hotel = item.hotel;
                    const offers = item.offers || [];

                    for (const off of offers) {
                        const lines = Array.isArray(hotel?.address?.lines)
                            ? hotel.address.lines.filter((line): line is string => typeof line === 'string' && line.trim() !== '')
                            : [];
                        const cityFromAddress = typeof hotel?.address?.cityName === 'string' ? hotel.address.cityName.trim() : '';
                        const zipFromAddress = typeof hotel?.address?.postalCode === 'string' ? hotel.address.postalCode.trim() : '';
                        const countryFromAddress = typeof hotel?.address?.countryCode === 'string' ? hotel.address.countryCode.trim() : '';
                        const cityBlock = [zipFromAddress, cityFromAddress].filter(Boolean).join(' ');
                        const mergedAddress = [...lines, cityBlock, countryFromAddress].filter(Boolean).join(', ');

                        const offer: HotelOffer = {
                            id: off.id || `${hotel?.hotelId}-${off.checkInDate}-${off.checkOutDate}`,
                            hotelId: hotel?.hotelId || '',
                            hotelName: hotel?.name || 'Hotel',
                            hotelAddress: (hotel?.formattedAddress || mergedAddress || '').trim() || undefined,
                            hotelLatitude: typeof hotel?.latitude === 'number' ? hotel.latitude : undefined,
                            hotelLongitude: typeof hotel?.longitude === 'number' ? hotel.longitude : undefined,
                            cityCode: hotel?.cityCode || city,
                            checkInDate: off.checkInDate || checkIn,
                            checkOutDate: off.checkOutDate || checkOut,
                            roomCategory: off.room?.typeEstimated?.category,
                            roomDescription: off.room?.description?.text,
                            price: {
                                total: off.price?.total || '0',
                                currency: off.price?.currency || 'EUR',
                                base: off.price?.base,
                            },
                            guests: off.guests ? { adults: off.guests.adults || tripConfig.travelerCount } : undefined,
                        };

                        const price = Number.parseFloat(offer.price.total);
                        const score = Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;

                        if (bestOffer === null || score < bestPrice) {
                            bestOffer = offer;
                            bestPrice = score;
                        }
                    }
                }

                if (bestOffer) {
                    handleHotelSelect(bestOffer);
                }
            }
        } catch (error) {
            console.error('Erreur recherche hôtels:', error);
            setHotelApiResponse({ error: "Erreur lors de l'appel API", details: String(error) });
        } finally {
            setIsLoadingHotel(false);
        }
    };

    const multiSelectOptions = [
        'Petit déjeuner inclus', 'Proche du centre ville', 'Spa/piscine',
        'Plage', 'Équipement', 'Retour positif', 'Hôtel de luxe',
        'Animaux domestiques', 'Réservé aux adultes', 'LGBTQIA+ friendly'
    ];

    const dietaryMultiSelectOptions = [
        'Végétarien',
        'Végan',
        'Sans gluten',
        'Sans lactose',
        'Halal',
        'Casher',
        'Pesco-végétarien',
        'Flexitarien',
        'Sans porc',
        'Faible en FODMAP',
    ];

    const handleDestinationGeoSelect = useCallback(
        (payload: { latitude: number; longitude: number; iataCode: string; name: string }) => {
            setDestinationGeo({
                lat: payload.latitude,
                lng: payload.longitude,
                iataCode: payload.iataCode,
            });
        },
        []
    );

    const focusMapOnDestination = useCallback(async () => {
        const iata = tripConfig.arrivalCity.trim();
        const displayTitle = (tripConfig.arrivalCityName || tripConfig.arrivalCity || 'Destination').trim();
        if (!iata && !displayTitle) {
            console.warn("Triply: pas de destination pour centrer la carte.");
            return;
        }

        let latitude: number;
        let longitude: number;

        if (destinationGeo && destinationGeo.iataCode === iata) {
            latitude = destinationGeo.lat;
            longitude = destinationGeo.lng;
        } else {
            const keyword = (tripConfig.arrivalCityName || tripConfig.arrivalCity).trim();
            if (keyword.length < 2) {
                console.warn('Triply: mot-clé destination trop court pour la géolocalisation.');
                return;
            }
            try {
                const res = await fetch(
                    `/api/places/search?${new URLSearchParams({ keyword, subType: 'CITY,AIRPORT' }).toString()}`,
                );
                const data: unknown = await res.json();
                const list = Array.isArray(data) ? data : [];
                const first = list[0] as
                    | { geoCode?: { latitude?: number; longitude?: number }; iataCode?: string }
                    | undefined;
                const geo = first?.geoCode;
                const latN = geo?.latitude != null ? Number(geo.latitude) : NaN;
                const lngN = geo?.longitude != null ? Number(geo.longitude) : NaN;
                if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
                    console.warn('Triply: aucune coordonnée trouvée pour la destination.');
                    return;
                }
                latitude = latN;
                longitude = lngN;
                if (first?.iataCode) {
                    setDestinationGeo({ lat: latitude, lng: longitude, iataCode: first.iataCode });
                }
            } catch (e) {
                console.warn('Triply: échec géolocalisation destination', e);
                return;
            }
        }

        const point: LocationPoint = {
            id: 'city-center',
            title: displayTitle || iata,
            coordinates: { latitude, longitude },
            type: 'city-center',
            zoom: 11,
        };
        setMapLocations([point]);
    }, [destinationGeo, tripConfig.arrivalCity, tripConfig.arrivalCityName]);

    const handleValidateChoices = useCallback(() => {
        void focusMapOnDestination();
    }, [focusMapOnDestination]);

    const handleGenerateTrip = () => {
        const destination = tripConfig.arrivalCityName || tripConfig.arrivalCity;
        const hasDates = !!tripConfig.outboundDate && !!tripConfig.returnDate;
        if (!destination || !hasDates) return;

        void focusMapOnDestination();

        // Au clic sur "Générer mon itinéraire de base", lancer les recherches automatiques.
        if (tripConfig.departureCity && tripConfig.arrivalCity) {
            void handleFlightSearch({ autoSelect: true });
        }
        if (tripConfig.arrivalCity || tripConfig.departureCity) {
            void handleHotelSearch({ autoSelect: true });
        }

        setWizardView('activity');
        // Modes IA : ouvrir l’assistant et enchaîner comme « Suggestions IA pour tout le séjour ».
        // Avant : semi_ai ne ouvrait pas le panneau ; full_ai ouvrait sans lancer de requête LLM.
        if (planningMode === 'manual' || planningMode == null) {
            setIsAssistantOpen(false);
        } else {
            setIsAssistantOpen(true);
            setPendingAssistantSuggestion('all');
        }
    };

    const appendSyntheticPoiToDay = useCallback(
        (day: number, name: string, lat: number, lng: number, layerId: string) => {
            setDayActivitiesByDay((prev) => {
                const prevDay = prev[day] ?? [];
                const key = `${name}-${lng.toFixed(5)}-${lat.toFixed(5)}`;
                const exists = prevDay.some((p) => {
                    const t = getDayActivityLabel(p);
                    return `${t}-${p.lngLat.lng.toFixed(5)}-${p.lngLat.lat.toFixed(5)}` === key;
                });
                if (exists) return prev;
                const _dragId = `syn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                setLastAddedActivityDragIdByDay((m) => ({ ...m, [day]: _dragId }));
                const poi: DayActivityPoi = {
                    layer: { id: layerId },
                    properties: { name, name_en: name },
                    lngLat: { lng, lat },
                    _dragId,
                };
                return { ...prev, [day]: [...prevDay, poi] };
            });
        },
        []
    );

    const appendSyntheticPoi = useCallback(
        (name: string, lat: number, lng: number, layerId: string) => {
            appendSyntheticPoiToDay(selectedDay, name, lat, lng, layerId);
        },
        [appendSyntheticPoiToDay, selectedDay]
    );

    const handleAppendHotelToDay = useCallback(async () => {
        if (!effectiveHotelOffer) return;
        setGeocodeAppendPending(true);
        try {
            const kw = `${effectiveHotelOffer.hotelName} ${effectiveHotelOffer.cityCode}`;
            const g = await fetchGeocodeFirst(kw);
            if (!g) {
                window.alert("Impossible de localiser l'hôtel. Essayez une recherche plus précise.");
                return;
            }
            appendSyntheticPoi(g.name || effectiveHotelOffer.hotelName, g.lat, g.lng, 'hotel');
        } finally {
            setGeocodeAppendPending(false);
        }
    }, [appendSyntheticPoi, effectiveHotelOffer]);

    const handleAppendAirportOutbound = useCallback(async () => {
        if (!effectiveFlightOffer) return;
        const segs = effectiveFlightOffer.itineraries?.[0]?.segments;
        const last = Array.isArray(segs) && segs.length > 0 ? segs[segs.length - 1] : undefined;
        const iata = last?.arrival?.iataCode?.trim().toUpperCase();
        if (!iata) return;
        setGeocodeAppendPending(true);
        try {
            const g = await fetchGeocodeFirst(iata);
            if (!g) {
                window.alert("Impossible de localiser l'aéroport.");
                return;
            }
            appendSyntheticPoi(`Aéroport ${iata}`, g.lat, g.lng, 'airport');
        } finally {
            setGeocodeAppendPending(false);
        }
    }, [appendSyntheticPoi, effectiveFlightOffer]);

    const handleAppendAirportReturn = useCallback(async () => {
        if (!effectiveFlightOffer) return;
        const ret = effectiveFlightOffer.itineraries?.[1];
        const fs = ret?.segments?.[0];
        const iata = fs?.departure?.iataCode;
        if (!iata) return;
        setGeocodeAppendPending(true);
        try {
            const g = await fetchGeocodeFirst(iata);
            if (!g) {
                window.alert("Impossible de localiser l'aéroport.");
                return;
            }
            appendSyntheticPoi(`Aéroport ${iata} (retour)`, g.lat, g.lng, 'airport');
        } finally {
            setGeocodeAppendPending(false);
        }
    }, [appendSyntheticPoi, effectiveFlightOffer]);

    useEffect(() => {
        if (!effectiveFlightOffer) {
            day1OutboundAirportSeededForFlightRef.current = null;
        }
    }, [effectiveFlightOffer]);

    useEffect(() => {
        if (wizardView !== 'activity' || !effectiveFlightOffer || !outboundFlightArrivalIata) return;
        const seedKey = `${effectiveFlightOffer.id}-${outboundFlightArrivalIata}`;
        if (day1OutboundAirportSeededForFlightRef.current === seedKey) return;

        const label = `Aéroport ${outboundFlightArrivalIata}`;
        const day1 = dayActivitiesByDay[1] ?? [];
        if (day1.some((p) => getDayActivityLabel(p) === label)) {
            day1OutboundAirportSeededForFlightRef.current = seedKey;
            return;
        }

        let cancelled = false;
        void (async () => {
            const g = await fetchGeocodeFirst(outboundFlightArrivalIata);
            if (cancelled || !g) return;
            appendSyntheticPoiToDay(1, label, g.lat, g.lng, 'airport');
            day1OutboundAirportSeededForFlightRef.current = seedKey;
        })();

        return () => {
            cancelled = true;
        };
    }, [
        wizardView,
        effectiveFlightOffer,
        outboundFlightArrivalIata,
        dayActivitiesByDay,
        appendSyntheticPoiToDay,
    ]);

    const addAssistantSuggestionsToDay = useCallback((day: number, items: SuggestedActivityPin[]) => {
        setDayActivitiesByDay((prev) => {
            const list = prev[day] ?? [];
            const next = [...list];
            for (const it of items) {
                const title = it.title.trim();
                if (!title) continue;
                const key = `${title}-${it.lng.toFixed(5)}-${it.lat.toFixed(5)}`;
                const exists = next.some((p) => {
                    const t = getDayActivityLabel(p);
                    return `${t}-${p.lngLat.lng.toFixed(5)}-${p.lngLat.lat.toFixed(5)}` === key;
                });
                if (exists) continue;
                const _dragId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                setLastAddedActivityDragIdByDay((m) => ({ ...m, [day]: _dragId }));
                const dh = it.durationHours;
                const durationHours =
                    dh != null && Number.isFinite(dh) && dh > 0 ? Math.min(24, Math.max(0.25, dh)) : undefined;
                next.push({
                    layer: { id: 'poi' },
                    properties: { name: title, name_en: title },
                    lngLat: { lng: it.lng, lat: it.lat },
                    _dragId,
                    ...(durationHours != null ? { durationHours } : {}),
                });
            }
            return { ...prev, [day]: next };
        });
    }, []);

    const handleSuggestedActivitiesFromAssistant = useCallback(
        (items: SuggestedActivityPin[]) => {
            addAssistantSuggestionsToDay(selectedDay, items);
        },
        [addAssistantSuggestionsToDay, selectedDay]
    );

    const handleSuggestedActivitiesForSpecificDay = useCallback(
        (day: number, items: SuggestedActivityPin[]) => {
            addAssistantSuggestionsToDay(day, items);
        },
        [addAssistantSuggestionsToDay]
    );

    const buildPlanSnapshot = useCallback((): PlanSnapshot => {
        const days: PlanSnapshot['days'] = [];
        const td = tripConfig.travelDays || 1;
        for (let d = 1; d <= td; d++) {
            const list = dayActivitiesByDay[d] ?? [];
            days.push({
                dayIndex: d,
                activities: list.map((p) => ({
                    title: getDayActivityLabel(p),
                    lng: p.lngLat.lng,
                    lat: p.lngLat.lat,
                    layerId: p.layer?.id,
                    durationHours: getActivityDurationHours(p),
                })),
            });
        }
        return {
            days,
            planningMode: planningMode ?? undefined,
            flightSummary: effectiveFlightOffer
                ? {
                      carrier: effectiveFlightCarrierName || undefined,
                      price: effectiveFlightOffer.price?.grandTotal,
                      currency: effectiveFlightOffer.price?.currency,
                  }
                : undefined,
            hotelSummary: effectiveHotelOffer
                ? {
                      name: effectiveHotelOffer.hotelName,
                                            address: effectiveHotelOffer.hotelAddress,
                      latitude: effectiveHotelOffer.hotelLatitude,
                      longitude: effectiveHotelOffer.hotelLongitude,
                      cityCode: effectiveHotelOffer.cityCode,
                      cityName: tripConfig.arrivalCityName || undefined,
                                            totalPrice: effectiveHotelOffer.price?.total,
                                            currency: effectiveHotelOffer.price?.currency,
                  }
                : undefined,
        };
    }, [
        dayActivitiesByDay,
        tripConfig.travelDays,
        tripConfig.arrivalCityName,
        planningMode,
        effectiveFlightOffer,
        effectiveFlightCarrierName,
        effectiveHotelOffer,
    ]);

    const hasAnyPlannedActivity = useMemo(
        () => Object.values(dayActivitiesByDay).some((list) => list.length > 0),
        [dayActivitiesByDay]
    );

    const assistantPlanningContext = useMemo(() => {
        const perDay = activityHoursByDay[selectedDay];
        const fromForm = parseFloat(String(tripConfig.activityTime || 0));
        const maxActivityHoursPerDay =
            perDay != null && perDay > 0
                ? perDay
                : Number.isFinite(fromForm) && fromForm > 0
                  ? fromForm
                                    : 6;
        const td = tripConfig.travelDays || 1;
        return {
            maxActivityHoursPerDay,
            selectedDay,
            travelDays: td,
            planningMode: planningMode ?? 'semi_ai',
            currentDayActivityTitles: (dayActivitiesByDay[selectedDay] ?? []).map((p) => getDayActivityLabel(p)),
        };
    }, [
            activityHoursByDay,
            selectedDay,
            tripConfig.travelDays,
            tripConfig.activityTime,
            planningMode,
            dayActivitiesByDay,
        ]);

    const assistantStep1Snapshot = useMemo(() => {
        const base = buildStep1FormSnapshotForAssistant(tripConfig);
        const extra: Record<string, unknown> = { ...base };
        if (effectiveFlightOffer) {
            const it0 = effectiveFlightOffer.itineraries?.[0];
            const segs = it0?.segments ?? [];
            const first = segs[0];
            const last = segs.length ? segs[segs.length - 1] : undefined;
            extra.selectedFlightPlanning = {
                carrier: effectiveFlightCarrierName || undefined,
                outboundFrom: first?.departure?.iataCode,
                outboundTo: last?.arrival?.iataCode,
                price: effectiveFlightOffer.price?.grandTotal,
                currency: effectiveFlightOffer.price?.currency,
            };
        }
        if (effectiveHotelOffer) {
            extra.selectedHotelPlanning = {
                name: effectiveHotelOffer.hotelName,
                address: effectiveHotelOffer.hotelAddress,
                cityCode: effectiveHotelOffer.cityCode,
                checkIn: effectiveHotelOffer.checkInDate,
                checkOut: effectiveHotelOffer.checkOutDate,
            };
        }
        return extra;
    }, [tripConfig, effectiveFlightOffer, effectiveFlightCarrierName, effectiveHotelOffer]);

    const handleApplyAssistantStep1Patch = useCallback(
        (patch: AssistantStep1FormPatch) => {
            if (patch.departureCity != null) tripConfig.setDepartureCity(patch.departureCity);
            if (patch.arrivalCity != null) tripConfig.setArrivalCity(patch.arrivalCity);
            if (patch.arrivalCityName != null) tripConfig.setArrivalCityName(patch.arrivalCityName);
            if (patch.travelerCount != null) tripConfig.setTravelerCount(patch.travelerCount);
            if (patch.budget != null) tripConfig.setBudget(patch.budget);
            if (patch.activityTime != null) tripConfig.setActivityTime(patch.activityTime);
            if (patch.outboundDepartureTime != null) tripConfig.setOutboundDepartureTime(patch.outboundDepartureTime);
            if (patch.outboundArrivalTime != null) tripConfig.setOutboundArrivalTime(patch.outboundArrivalTime);
            if (patch.returnDepartureTime != null) tripConfig.setReturnDepartureTime(patch.returnDepartureTime);
            if (patch.returnArrivalTime != null) tripConfig.setReturnArrivalTime(patch.returnArrivalTime);
            if (patch.outboundDate != null) tripConfig.setOutboundDate(patch.outboundDate);
            if (patch.returnDate != null) {
                const outAfter = patch.outboundDate ?? tripConfig.outboundDate;
                if (!outAfter || patch.returnDate >= outAfter) tripConfig.setReturnDate(patch.returnDate);
            }
            if (patch.travelDays != null) tripConfig.setTravelDays(patch.travelDays);
            if (patch.selectedOptions != null) tripConfig.setSelectedOptions(patch.selectedOptions);
            if (patch.dietarySelections != null) tripConfig.setDietarySelections(patch.dietarySelections);

            const geoQuery =
                (patch.arrivalCityName || patch.arrivalCity || tripConfig.arrivalCityName || tripConfig.arrivalCity || '')
                    .trim();
            const iataForGeo = (patch.arrivalCity ?? tripConfig.arrivalCity).trim().toUpperCase();
            if (geoQuery.length >= 2) {
                void (async () => {
                    const geo = await fetchGeocodeFirst(geoQuery);
                    if (!geo) return;
                    const iata =
                        iataForGeo.length === 3 && /^[A-Z]{3}$/.test(iataForGeo) ? iataForGeo : '';
                    setDestinationGeo({ lat: geo.lat, lng: geo.lng, iataCode: iata });
                })();
            }
        },
        [tripConfig]
    );

    const handleRequestAiDaySuggestions = useCallback(() => {
        setIsAssistantOpen(true);
        setPendingAssistantSuggestion('day');
    }, []);

    const handleDayActivityDurationChange = useCallback((day: number, activityIndex: number, hours: number | null) => {
        setDayActivitiesByDay((prev) => {
            const list = [...(prev[day] ?? [])];
            const poi = list[activityIndex];
            if (!poi) return prev;
            const next: DayActivityPoi = { ...poi };
            if (hours == null || !Number.isFinite(hours)) {
                delete next.durationHours;
            } else {
                next.durationHours = Math.min(24, Math.max(0.25, hours));
            }
            list[activityIndex] = next;
            return { ...prev, [day]: list };
        });
    }, []);

    const handleRegenerateDayActivity = useCallback(
        async (day: number, activityIndex: number) => {
            const session = getStoredSession();
            if (!session?.token) return;
            const list = dayActivitiesByDay[day];
            const poi = list?.[activityIndex];
            if (!poi) return;
            const title = getDayActivityLabel(poi);
            setRegeneratingActivity({ day, index: activityIndex });
            try {
                const { replacement, reply } = await requestActivityRegeneration(session.token, {
                    title,
                    lat: poi.lngLat.lat,
                    lng: poi.lngLat.lng,
                    dayIndex: day,
                    destinationContext: tripConfig.arrivalCityName || tripConfig.arrivalCity || '',
                });
                if (!replacement) {
                    window.alert(reply?.trim() || "L'IA n'a pas pu proposer d'alternative.");
                    return;
                }
                setDayActivitiesByDay((prev) => {
                    const L = [...(prev[day] ?? [])];
                    const cur = L[activityIndex];
                    if (!cur) return prev;
                    const dragId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    L[activityIndex] = {
                        ...cur,
                        lngLat: { lng: replacement.lng, lat: replacement.lat },
                        properties: {
                            ...cur.properties,
                            name: replacement.title,
                            name_en: replacement.title,
                        },
                        layer: cur.layer ?? { id: 'poi' },
                        durationHours: replacement.durationHours,
                        _dragId: dragId,
                    };
                    return { ...prev, [day]: L };
                });
            } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Régénération impossible.');
            } finally {
                setRegeneratingActivity(null);
            }
        },
        [dayActivitiesByDay, tripConfig.arrivalCity, tripConfig.arrivalCityName]
    );

    const handleRequestAiAllDaysSuggestions = useCallback(() => {
        setIsAssistantOpen(true);
        setPendingAssistantSuggestion('all');
    }, []);

    useLayoutEffect(() => {
        if (!isAssistantOpen || pendingAssistantSuggestion == null || !isConnected) return;
        if (pendingAssistantSuggestion === 'day') {
            assistantRef.current?.suggestActivitiesForDay();
        } else {
            void assistantRef.current?.suggestActivitiesForAllDays();
        }
        setPendingAssistantSuggestion(null);
    }, [isAssistantOpen, pendingAssistantSuggestion, isConnected]);

    const handleConfirmValidateTrip = useCallback(async () => {
        const session = getStoredSession();
        if (!session?.token) {
            setValidateTripError('Connectez-vous pour enregistrer le voyage.');
            return;
        }
        setValidateTripSubmitting(true);
        setValidateTripError('');
        try {
            const destinationInfo = await resolveDestinationLabels({
                iataCode: tripConfig.arrivalCity,
                selectedName: tripConfig.arrivalCityName,
            });
            const snapshot = buildPlanSnapshot();
            const withDestinationSummary: PlanSnapshot = {
                ...snapshot,
                destinationSummary: destinationInfo,
            };

            const titleBase =
                destinationInfo.airportName && destinationInfo.airportName.toLowerCase() !== destinationInfo.cityName.toLowerCase()
                    ? `${destinationInfo.cityName} (${destinationInfo.airportName})`
                    : destinationInfo.cityName;
            const title = `${titleBase} · ${tripConfig.outboundDate || ''}`.trim();

            const created = await createTrip(session.token, {
                title: title || 'Mon voyage',
                destination: destinationInfo.cityName || 'Destination',
                start_date: tripConfig.outboundDate || undefined,
                end_date: tripConfig.returnDate || undefined,
                travelers_count: tripConfig.travelerCount,
                plan_snapshot: withDestinationSummary,
            });
            await validateTripApi(session.token, created.id);
            setValidateTripModalOpen(false);
            router.push(`/voyages/${created.id}?validated=1`);
        } catch (e) {
            setValidateTripError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
        } finally {
            setValidateTripSubmitting(false);
        }
    }, [buildPlanSnapshot, router, tripConfig]);

    // --- Logique Map (POI, Hover, Click) ---

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (mapViewMenuOpen && mapViewMenuRef.current && !mapViewMenuRef.current.contains(target)) {
                setMapViewMenuOpen(false);
            }
            if (hotelFilterMenuOpen && hotelFilterMenuRef.current && !hotelFilterMenuRef.current.contains(target)) {
                setHotelFilterMenuOpen(false);
            }
        };
        if (mapViewMenuOpen || hotelFilterMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [mapViewMenuOpen, hotelFilterMenuOpen]);

    useEffect(() => {
        const handleActivityHoursClickOutside = (e: MouseEvent) => {
            if (activityHoursEditRef.current && !activityHoursEditRef.current.contains(e.target as Node)) {
                setActivityHoursEditOpen(false);
            }
        };
        if (activityHoursEditOpen) {
            document.addEventListener('mousedown', handleActivityHoursClickOutside);
            return () => document.removeEventListener('mousedown', handleActivityHoursClickOutside);
        }
    }, [activityHoursEditOpen]);

    const travelDays = tripConfig.travelDays || 1;
    const dayActivities = dayActivitiesByDay[selectedDay] ?? [];

    /** Étapes du jour sur la carte (libellés alignés sur le panneau « Vers l’étape N »), coordonnées exactes du POI */
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

    /** Dernière activité ajoutée en alerte si activités + trajets dépassent le max du jour */
    const activityTimeAlertDragId = useMemo(() => {
        const list = dayActivitiesByDay[selectedDay] ?? [];
        const modes = legTransportByDay[selectedDay] ?? [];
        const maxH =
            activityHoursByDay[selectedDay] ??
            Math.max(0, parseFloat(String(tripConfig.activityTime || 0)) || 0);
        if (maxH <= 0) return null;
        const activityH = list.reduce((acc, p) => acc + getActivityDurationHours(p), 0);
        const travelHs = travelHoursBetweenActivities(dayRoutes, modes, Math.max(0, list.length - 1));
        const travelH = travelHs.reduce((a, h) => a + h, 0);
        const currentH = activityH + travelH;
        if (currentH <= maxH) return null;
        const lid = lastAddedActivityDragIdByDay[selectedDay];
        if (!lid || !list.some((p) => p._dragId === lid)) return null;
        return lid;
    }, [
        selectedDay,
        dayActivitiesByDay,
        activityHoursByDay,
        tripConfig.activityTime,
        lastAddedActivityDragIdByDay,
        legTransportByDay,
        dayRoutes,
    ]);

    useEffect(() => {
        if (selectedDay > travelDays) setSelectedDay(Math.max(1, travelDays));
    }, [travelDays, selectedDay]);

    const handlePoiClick = (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }) => {
        setSelectedPoi(feature);
        const name = feature.properties?.name ?? feature.properties?.name_en ?? feature.layer?.id ?? 'Lieu';
        console.log('POI cliqué:', { name, feature, lngLat });

        setDayActivitiesByDay((prev) => {
            const prevDay = prev[selectedDay] ?? [];
            const key = `${name}-${lngLat.lng.toFixed(5)}-${lngLat.lat.toFixed(5)}`;
            const exists = prevDay.some(
                (p) =>
                    `${(p.properties?.name ?? p.properties?.name_en ?? p.layer?.id ?? '')}-${p.lngLat.lng.toFixed(5)}-${p.lngLat.lat.toFixed(5)}` === key
            );
            if (exists) return prev;
            const _dragId = `poi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setLastAddedActivityDragIdByDay((m) => ({ ...m, [selectedDay]: _dragId }));
            return { ...prev, [selectedDay]: [...prevDay, { ...feature, lngLat, _dragId }] };
        });
    };

    const handleRemoveDayActivity = (index: number) => {
        setDayActivitiesByDay((prev) => {
            const list = prev[selectedDay] ?? [];
            const removed = list[index];
            if (removed?._dragId) {
                setLastAddedActivityDragIdByDay((m) =>
                    m[selectedDay] === removed._dragId ? { ...m, [selectedDay]: undefined } : m
                );
            }
            return {
                ...prev,
                [selectedDay]: list.filter((_, i) => i !== index),
            };
        });
    };

    const handleReorderDayActivities = (reordered: DayActivityPoi[]) => {
        setDayActivitiesByDay((prev) => ({ ...prev, [selectedDay]: reordered }));
    };

    const handleLegTransportChange = useCallback((legIndex: number, mode: ActivityRouteProfile) => {
        setLegTransportByDay((prev) => {
            const list = [...(prev[selectedDay] ?? [])];
            if (legIndex < 0 || legIndex >= list.length) return prev;
            list[legIndex] = mode;
            return { ...prev, [selectedDay]: list };
        });
    }, [selectedDay]);

    /** Modes de transport par tronçon : mis à jour quand la liste ou l’ordre des activités change. */
    useEffect(() => {
        const prevSnap = prevActivitiesByDayRef.current;
        const dayKeys = Object.keys(dayActivitiesByDay);
        const prevDayKeys = Object.keys(prevSnap);
        let sameStructure =
            dayKeys.length === prevDayKeys.length &&
            dayKeys.every((k) => prevDayKeys.includes(k));
        if (sameStructure) {
            for (const dayStr of dayKeys) {
                const day = Number(dayStr);
                const ordered = dayActivitiesByDay[day] ?? [];
                const prevList = prevSnap[day] ?? [];
                if (activityListSignature(ordered) !== activityListSignature(prevList)) {
                    sameStructure = false;
                    break;
                }
            }
        }
        if (sameStructure) return;

        setLegTransportByDay((prevLegModes) => {
            const next: Record<number, ActivityRouteProfile[]> = {};
            for (const dayStr of Object.keys(dayActivitiesByDay)) {
                const day = Number(dayStr);
                const ordered = dayActivitiesByDay[day] ?? [];
                next[day] = buildLegTransportModesForActivities(
                    ordered,
                    prevSnap[day],
                    prevLegModes[day],
                    selectedRouteTypeRef.current ?? 'driving'
                );
            }
            return next;
        });
        const snap: Record<number, DayActivityPoi[]> = {};
        for (const dayStr of Object.keys(dayActivitiesByDay)) {
            const day = Number(dayStr);
            snap[day] = [...(dayActivitiesByDay[day] ?? [])];
        }
        prevActivitiesByDayRef.current = snap;
    }, [dayActivitiesByDay]);

    // Clé stable pour le useEffect des routes (évite changement de taille du tableau de deps)
    const routeDepsKey = useMemo(() => {
        const activities = dayActivitiesByDay[selectedDay] ?? [];
        if (activities.length < 2) return '';
        return `${selectedDay}:${activities.map((p) => `${p.lngLat.lng},${p.lngLat.lat}`).join(';')}`;
    }, [dayActivitiesByDay, selectedDay]);

    // Directions par tronçon (A→B) pour chaque profil : un leg raté n’invalide plus tout l’itinéraire
    // (contrairement à une seule requête multi-waypoints).
    useEffect(() => {
        if (!routeDepsKey || !MAPBOX_TOKEN) {
            setDayRoutes({});
            return;
        }
        const points = parseLngLatPointsFromRouteDepsKey(routeDepsKey);
        if (!points) {
            setDayRoutes({});
            return;
        }
        const profiles = ['driving', 'walking', 'cycling'] as const;
        let cancelled = false;

        void Promise.all(
            profiles.map(async (profile) => {
                const rawLegs = await Promise.all(
                    points.slice(0, -1).map((_, i) =>
                        fetchMapboxLegRoute(MAPBOX_TOKEN, profile, points[i], points[i + 1])
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
    }, [routeDepsKey, MAPBOX_TOKEN]);

    /** Signature des POI du jour (évite des refetch inutiles quand un autre jour change). */
    const selectedDayActivityCoordsKey = useMemo(() => {
        const list = dayActivitiesByDay[selectedDay] ?? [];
        if (list.length < 2) return '';
        return list.map((p) => `${p.lngLat.lng},${p.lngLat.lat}`).join(';');
    }, [dayActivitiesByDay, selectedDay]);

    const selectedDayLegModesKey = useMemo(
        () => JSON.stringify(legTransportByDay[selectedDay] ?? []),
        [legTransportByDay, selectedDay]
    );

    /**
     * Tracé carte : une requête Directions par tronçon (A→B) avec le profil choisi dans le wizard.
     * (Les durées du panneau viennent du même modèle par tronçon via `dayRoutes`.)
     */
    const [mapDisplaySegments, setMapDisplaySegments] = useState<RouteMapSegment[]>([]);

    useEffect(() => {
        if (!MAPBOX_TOKEN || !selectedDayActivityCoordsKey) {
            setMapDisplaySegments([]);
            return;
        }
        const activities = dayActivitiesByDayForMapRef.current[selectedDay] ?? [];
        const modes = legTransportByDayForMapRef.current[selectedDay] ?? [];
        if (activities.length < 2) {
            setMapDisplaySegments([]);
            return;
        }

        let cancelled = false;
        const tasks = activities.slice(0, -1).map((_, i) => {
            const a = activities[i].lngLat;
            const b = activities[i + 1].lngLat;
            const profile = (modes[i] ?? 'driving') as ActivityRouteProfile;
            const coordStr = `${a.lng},${a.lat};${b.lng},${b.lat}`;
            const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
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
    }, [MAPBOX_TOKEN, selectedDay, selectedDayActivityCoordsKey, selectedDayLegModesKey]);

    const handleLoginClick = () => setCurrentView('login');
    const handleLogoutClick = async () => {
        const session = getStoredSession();
        if (session?.token) {
            try {
                await logout(session.token);
            } catch {
                // no-op
            }
        }

        const uid = session?.user?.id;
        clearSession();
        clearPlanningModeStorage(uid);
        setIsConnected(false);
        setCurrentView('home');
    };

    const handleLoginSuccess = (_user: AuthUser, isNewUser?: boolean) => {
        if (isNewUser) {
            clearPlanningModeStorage(_user.id);
            setPlanningModeState(null);
        }
        setIsConnected(true);
        setCurrentView('home');
        if (isNewUser) setShowTuPreferes(true);
    };
    const handleBackToHome = () => setCurrentView('home');

    return (
        <div
            className="flex h-dvh min-h-dvh w-full overflow-hidden flex-col text-slate-100 lg:flex-row"
            style={{ backgroundColor: 'var(--background, #222222)' }}
        >
            <div className="relative z-0 hidden h-full shrink-0 lg:flex">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isConnected={isConnected}
                    onLoginClick={handleLoginClick}
                    onLogoutClick={handleLogoutClick}
                />
            </div>

            {isMobileNavOpen && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-[60] cursor-default bg-black/50 lg:hidden"
                        aria-label="Fermer le menu"
                        onClick={() => setIsMobileNavOpen(false)}
                    />
                    <div
                        className="fixed inset-y-0 left-0 z-[70] flex h-dvh max-h-dvh pt-[env(safe-area-inset-top)] lg:hidden"
                        style={{ backgroundColor: 'var(--background, #222222)' }}
                    >
                        <Sidebar
                            isCollapsed={isSidebarCollapsed}
                            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            useExternalBackdrop
                            isConnected={isConnected}
                            onLoginClick={handleLoginClick}
                            onLogoutClick={handleLogoutClick}
                        />
                    </div>
                </>
            )}

            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
                {currentView === 'login' && (
                    hasMapboxToken ? (
                        <LoginWithMapBackground
                            mapboxToken={MAPBOX_TOKEN}
                            onLoginSuccess={handleLoginSuccess}
                            onBack={handleBackToHome}
                        />
                    ) : (
                        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
                            <div className="max-w-md rounded-2xl border border-amber-400/40 bg-amber-950/20 p-6 text-amber-100">
                                <h2 className="mb-2 text-lg font-semibold">Configuration Mapbox manquante</h2>
                                <p className="text-sm text-amber-200/90">Renseignez NEXT_PUBLIC_MAPBOX_TOKEN pour activer la carte et l&apos;écran de connexion enrichi.</p>
                            </div>
                        </div>
                    )
                )}

                {currentView === 'home' && (
                    <>
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
                            {isConfigPanelOpen && (
                                <>
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-[40] cursor-default bg-black/50 lg:hidden"
                                        aria-label="Fermer le plan de voyage"
                                        onClick={() => setIsConfigPanelOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ x: -24, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                                        className="pointer-events-auto fixed bottom-0 left-0 top-0 z-50 flex w-[min(100%,420px)] max-w-[420px] flex-col border-r border-white/15 shadow-2xl lg:relative lg:z-auto lg:h-full lg:w-[min(26rem,34vw)] lg:max-w-md lg:shrink-0 xl:max-w-lg"
                                        style={{ backgroundColor: 'var(--background, #222222)' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setIsConfigPanelOpen(false)}
                                            className="absolute right-2 top-2 z-30 hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/10 lg:flex"
                                            aria-label="Replier le panneau itinéraire"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden p-2 sm:p-3 lg:pt-11">
                                            <div
                                                className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-md lg:rounded-2xl"
                                                style={{ backgroundColor: 'var(--background, #222222)' }}
                                            >
                                                <TripCreationWizard
                                                    activeView={wizardView}
                                                    onActiveViewChange={setWizardView}
                                                    planFormStep={planFormStep}
                                                    onPlanFormStepChange={setPlanFormStep}
                                                    planFormMaxVisited={planFormMaxVisited}
                                                    onPlanFormMaxVisitedChange={setPlanFormMaxVisited}
                                                    showPanelClose
                                                    onClosePanel={() => setIsConfigPanelOpen(false)}
                                                    state={tripConfig}
                                                    multiSelectOptions={multiSelectOptions}
                                                    dietaryMultiSelectOptions={dietaryMultiSelectOptions}
                                                    selectedFlight={effectiveFlightOffer}
                                                    selectedFlightCarrierName={effectiveFlightCarrierName}
                                                    selectedHotel={effectiveHotelOffer}
                                                    isFlightModalOpen={isFlightModalOpen}
                                                    isHotelModalOpen={isHotelModalOpen}
                                                    onOpenFlightSearch={() => setIsFlightModalOpen(true)}
                                                    onCloseFlightSearch={() => setIsFlightModalOpen(false)}
                                                    onOpenHotelSearch={() => setIsHotelModalOpen(true)}
                                                    onCloseHotelSearch={() => setIsHotelModalOpen(false)}
                                                    onFlightCardClick={() => setIsFlightDetailModalOpen(true)}
                                                    onRemoveFlight={() => {
                                                        setSelectedFlightOffer(null);
                                                        setSelectedFlightCarrierName('');
                                                        tripConfig.setManualFlightEntry(false);
                                                        tripConfig.setManualFlightAirline('');
                                                        tripConfig.setManualFlightNumber('');
                                                        tripConfig.setManualFlightNumberReturn('');
                                                        setIsFlightDetailModalOpen(false);
                                                    }}
                                                    onHotelCardClick={() => setIsHotelDetailModalOpen(true)}
                                                    onRemoveHotel={() => {
                                                        setSelectedHotelOffer(null);
                                                        tripConfig.setManualHotelEntry(false);
                                                        tripConfig.setManualHotelName('');
                                                        tripConfig.setManualHotelAddress('');
                                                        tripConfig.setManualHotelCheckIn('');
                                                        tripConfig.setManualHotelCheckOut('');
                                                        setIsHotelDetailModalOpen(false);
                                                    }}
                                                    selectedDay={selectedDay}
                                                    onSelectedDayChange={setSelectedDay}
                                                    travelDays={travelDays}
                                                    dayActivities={dayActivities}
                                                    activityTimeAlertDragId={activityTimeAlertDragId}
                                                    onRemoveDayActivity={handleRemoveDayActivity}
                                                    onReorderDayActivities={handleReorderDayActivities}
                                                    dayRoutes={dayRoutes}
                                                    selectedRouteType={selectedRouteType}
                                                    onSelectRouteType={setSelectedRouteType}
                                                    legTransportModes={legTransportByDay[selectedDay] ?? []}
                                                    onLegTransportChange={handleLegTransportChange}
                                                    onComplete={handleGenerateTrip}
                                                    onValidateChoices={handleValidateChoices}
                                                    onDestinationGeoSelect={handleDestinationGeoSelect}
                                                    planningMode={planningMode}
                                                    onPlanningModeChange={handlePlanningModeChange}
                                                    onBackToPlanningMode={handleBackToPlanningModeSelection}
                                                    isConnected={isConnected}
                                                    onLoginClick={handleLoginClick}
                                                    onAppendHotelToDay={handleAppendHotelToDay}
                                                    onAppendAirportOutbound={handleAppendAirportOutbound}
                                                    onAppendAirportReturn={handleAppendAirportReturn}
                                                    canAppendReturnAirport={Boolean(effectiveFlightOffer?.itineraries?.[1])}
                                                    onRequestAiDaySuggestions={handleRequestAiDaySuggestions}
                                                    onRequestAiAllDaysSuggestions={handleRequestAiAllDaysSuggestions}
                                                    showAiSuggestionButton={
                                                        planningMode === 'full_ai' || planningMode === 'semi_ai'
                                                    }
                                                    aiSuggestionsLoading={assistantRequestLoading}
                                                    aiAllDaysSuggestionsLoading={assistantRequestLoading}
                                                    onOpenValidateTrip={() => {
                                                        setValidateTripError('');
                                                        setValidateTripModalOpen(true);
                                                    }}
                                                    validateTripDisabled={!hasAnyPlannedActivity}
                                                    geocodeAppendPending={geocodeAppendPending}
                                                    onDayActivityDurationChange={(idx, h) =>
                                                        handleDayActivityDurationChange(selectedDay, idx, h)
                                                    }
                                                    onRegenerateDayActivity={
                                                        planningMode === 'full_ai' || planningMode === 'semi_ai'
                                                            ? (idx) => void handleRegenerateDayActivity(selectedDay, idx)
                                                            : undefined
                                                    }
                                                    regeneratingActivity={regeneratingActivity}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}

                            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
                                <div className="relative min-h-0 min-w-0 flex-1">
                                    <div
                                        className="absolute inset-0 overflow-hidden max-lg:pb-[calc(4.25rem+env(safe-area-inset-bottom))]"
                                        style={{ backgroundColor: 'var(--background, #222222)' }}
                                    >
                            {hasMapboxToken ? (
                            <WorldMap
                                accessToken={MAPBOX_TOKEN}
                                initialLatitude={46.6034}
                                initialLongitude={1.8883}
                                initialZoom={5}
                                mapStyle={mapStyle}
                                mapConfig={mapConfig}
                                pitch={mapPitch}
                                height="100%"
                                width="100%"
                                className="h-full w-full"
                                padding={{
                                    left: 16,
                                    top: 24,
                                    bottom: isLgUp ? 72 : 96,
                                    right: 16,
                                }}
                                onPoiClick={handlePoiClick}
                                locations={mapLocationsWithDayActivities}
                                onAirportSelect={handleAirportSelect}
                                routeSegments={mapDisplaySegments}
                                routeData={
                                    mapDisplaySegments.length > 0
                                        ? {}
                                        : selectedRouteType && dayRoutes[selectedRouteType]
                                          ? { [selectedRouteType]: dayRoutes[selectedRouteType]! }
                                          : {}
                                }
                            />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                    <div className="max-w-lg rounded-2xl border border-amber-400/40 bg-amber-950/20 p-6 text-amber-100">
                                        <h2 className="mb-2 text-lg font-semibold">Carte indisponible</h2>
                                        <p className="text-sm text-amber-200/90">Ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans votre environnement pour utiliser la planification cartographique.</p>
                                    </div>
                                </div>
                            )}
                            <FlightSearchModal
                                visible={isFlightModalOpen}
                                onClose={() => {
                                    setIsFlightModalOpen(false);
                                }}
                                departureCity={tripConfig.departureCity}
                                setDepartureCity={tripConfig.setDepartureCity}
                                arrivalCity={tripConfig.arrivalCity}
                                setArrivalCity={tripConfig.setArrivalCity}
                                arrivalDate={tripConfig.outboundDate}
                                setArrivalDate={tripConfig.setOutboundDate}
                                departureDate={tripConfig.returnDate}
                                setDepartureDate={tripConfig.setReturnDate}
                                outboundDepartureTime={tripConfig.outboundDepartureTime}
                                setOutboundDepartureTime={tripConfig.setOutboundDepartureTime}
                                outboundArrivalTime={tripConfig.outboundArrivalTime}
                                setOutboundArrivalTime={tripConfig.setOutboundArrivalTime}
                                returnDepartureTime={tripConfig.returnDepartureTime}
                                setReturnDepartureTime={tripConfig.setReturnDepartureTime}
                                returnArrivalTime={tripConfig.returnArrivalTime}
                                setReturnArrivalTime={tripConfig.setReturnArrivalTime}
                                travelerCount={tripConfig.travelerCount}
                                setTravelerCount={tripConfig.setTravelerCount}
                                budget={flightModalBudget}
                                setBudget={setFlightModalBudget}
                                onSearch={handleFlightSearch}
                                onNewSearch={() => setApiResponse(null)}
                                onSelectOffer={handleFlightSelect}
                                isLoading={isLoading}
                                apiResponse={apiResponse}
                            />

                            <FlightDetailModal
                                visible={isFlightDetailModalOpen}
                                onClose={() => setIsFlightDetailModalOpen(false)}
                                offer={effectiveFlightOffer}
                                carrierName={effectiveFlightCarrierName}
                            />

                            <HotelSearchModal
                                visible={isHotelModalOpen}
                                onClose={() => setIsHotelModalOpen(false)}
                                cityCode={tripConfig.arrivalCity}
                                setCityCode={tripConfig.setArrivalCity}
                                arrivalDate={tripConfig.outboundDate}
                                setArrivalDate={tripConfig.setOutboundDate}
                                departureDate={tripConfig.returnDate}
                                setDepartureDate={tripConfig.setReturnDate}
                                travelerCount={tripConfig.travelerCount}
                                setTravelerCount={tripConfig.setTravelerCount}
                                budget={hotelModalBudget}
                                setBudget={setHotelModalBudget}
                                mealRegime={hotelMealRegime}
                                setMealRegime={setHotelMealRegime}
                                selectedOptions={tripConfig.selectedOptions}
                                setSelectedOptions={tripConfig.setSelectedOptions}
                                multiSelectOptions={multiSelectOptions}
                                onSearch={handleHotelSearch}
                                onNewSearch={() => setHotelApiResponse(null)}
                                onSelectOffer={handleHotelSelect}
                                isLoading={isLoadingHotel}
                                apiResponse={hotelApiResponse}
                            />

                            <HotelDetailModal
                                visible={isHotelDetailModalOpen}
                                onClose={() => setIsHotelDetailModalOpen(false)}
                                offer={effectiveHotelOffer}
                            />

                            {/* Barre de progression Activité / jour - haut droite */}
                            {isConfigPanelOpen && (() => {
                                const maxH =
                                    activityHoursByDay[selectedDay] ??
                                    Math.max(0, parseFloat(String(tripConfig.activityTime || 0)) || 0);
                                const legModes = legTransportByDay[selectedDay] ?? [];
                                const travelHs = travelHoursBetweenActivities(
                                    dayRoutes,
                                    legModes,
                                    Math.max(0, dayActivities.length - 1),
                                );
                                type TimelineSeg = {
                                    key: string;
                                    label: string;
                                    hours: number;
                                    color: string;
                                    isAlert: boolean;
                                    kind: 'activity' | 'travel';
                                };
                                const timelineSegments: TimelineSeg[] = [];
                                dayActivities.forEach((p, i) => {
                                    const key = p._dragId ?? `${p.lngLat.lng}-${p.lngLat.lat}-${i}`;
                                    const isAlert = activityTimeAlertDragId != null && key === activityTimeAlertDragId;
                                    timelineSegments.push({
                                        key: `act-${key}`,
                                        label: getDayActivityLabel(p),
                                        hours: getActivityDurationHours(p),
                                        color: isAlert
                                            ? ACTIVITY_TIME_ALERT_COLOR
                                            : ACTIVITY_TIMELINE_COLORS[i % ACTIVITY_TIMELINE_COLORS.length],
                                        isAlert,
                                        kind: 'activity',
                                    });
                                    if (i < dayActivities.length - 1) {
                                        const profile = legModes[i] ?? 'driving';
                                        const th = travelHs[i] ?? 0;
                                        timelineSegments.push({
                                            key: `travel-${selectedDay}-${i}`,
                                            label: `Trajet (${LEG_PROFILE_SHORT_LABELS[profile]})`,
                                            hours: th,
                                            color: LEG_TRAVEL_TIMELINE_COLORS[profile],
                                            isAlert: false,
                                            kind: 'travel',
                                        });
                                    }
                                });
                                const currentH = timelineSegments.reduce((acc, s) => acc + s.hours, 0);
                                return (
                                <div
                                    ref={activityHoursEditRef}
                                    className="absolute left-4 right-auto top-4 z-20 flex max-lg:max-w-[min(92vw,20rem)] w-[min(92vw,380px)] min-w-0 flex-col gap-2 rounded-xl border border-white/15 px-4 py-3 shadow-lg backdrop-blur-sm lg:right-4 lg:left-auto sm:min-w-[280px]"
                                    style={{ backgroundColor: 'var(--background, #222222)' }}
                                >
                                    <div className="flex items-center justify-between gap-2 text-[12px]">
                                        <span className="font-medium text-slate-300">Activités du jour</span>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <span className="tabular-nums text-cyan-400">
                                                {currentH.toFixed(1)}h
                                                <span className="text-slate-500"> / </span>
                                                <span className="text-slate-200">{maxH || 0}h</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setActivityHoursEditOpen((o) => !o)}
                                                className="rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-cyan-400"
                                                title="Modifier les heures max pour ce jour"
                                                aria-label="Modifier les heures max"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    {activityHoursEditOpen && (
                                        <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                                            <label className="shrink-0 text-[11px] text-slate-500">Max jour {selectedDay} :</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={24}
                                                step={0.5}
                                                defaultValue={activityHoursByDay[selectedDay] ?? (parseFloat(String(tripConfig.activityTime || 0)) || 0)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const v = parseFloat((e.target as HTMLInputElement).value);
                                                        if (!isNaN(v) && v >= 0) {
                                                            setActivityHoursByDay((prev) => ({ ...prev, [selectedDay]: v }));
                                                            setActivityHoursEditOpen(false);
                                                        }
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const v = parseFloat(e.target.value);
                                                    if (!isNaN(v) && v >= 0) {
                                                        setActivityHoursByDay((prev) => ({ ...prev, [selectedDay]: v }));
                                                    }
                                                    setActivityHoursEditOpen(false);
                                                }}
                                                className="w-16 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500/60"
                                            />
                                            <span className="text-[11px] text-slate-500">h</span>
                                        </div>
                                    )}
                                    <div
                                        className="flex h-3.5 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5"
                                        role="img"
                                        aria-label={`Temps planifié ${currentH.toFixed(1)} heures (activités et trajets) sur ${maxH || 0} heures max`}
                                    >
                                        {maxH > 0 && timelineSegments.length > 0 ? (
                                            timelineSegments.map((seg) => {
                                                const pct = Math.max(0, (seg.hours / maxH) * 100);
                                                const travelTitle =
                                                    seg.kind === 'travel'
                                                        ? seg.hours > 0
                                                            ? `${seg.label} — ${seg.hours.toFixed(2)} h`
                                                            : `${seg.label} — durée en chargement ou indisponible`
                                                        : '';
                                                const activityTitle =
                                                    seg.kind === 'activity'
                                                        ? seg.isAlert
                                                            ? `${seg.label} — ${seg.hours.toFixed(1)} h (dépasse le temps max du jour)`
                                                            : `${seg.label} — ${seg.hours.toFixed(1)} h`
                                                        : '';
                                                return (
                                                    <div
                                                        key={seg.key}
                                                        title={seg.kind === 'travel' ? travelTitle : activityTitle}
                                                        className={`h-full shrink-0 transition-all duration-300 first:rounded-l-full last:rounded-r-full ${seg.isAlert ? 'animate-pulse ring-2 ring-red-400/90 ring-inset' : ''} ${seg.kind === 'travel' ? 'opacity-95' : ''}`}
                                                        style={{
                                                            width: `${pct}%`,
                                                            minWidth: seg.hours > 0 ? 4 : seg.kind === 'travel' ? 2 : 0,
                                                            backgroundColor: seg.color,
                                                            boxShadow: seg.isAlert
                                                                ? 'inset 0 0 12px rgba(254,202,202,0.35)'
                                                                : 'inset 0 1px 0 rgba(255,255,255,0.12)',
                                                            backgroundImage:
                                                                seg.kind === 'travel'
                                                                    ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 5px)'
                                                                    : undefined,
                                                        }}
                                                    />
                                                );
                                            })
                                        ) : null}
                                    </div>
                                    {timelineSegments.some((s) => s.isAlert) && (
                                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-400" role="alert">
                                            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-400" aria-hidden />
                                            Dernière activité ajoutée : dépassement du temps max du jour (activités + trajets)
                                        </p>
                                    )}
                                    {timelineSegments.length > 0 && (
                                        <div className="flex max-h-24 flex-wrap gap-x-3 gap-y-1.5 overflow-y-auto text-[10px] leading-tight">
                                            {timelineSegments.map((seg) => (
                                                <span
                                                    key={seg.key}
                                                    className={`flex max-w-44 items-center gap-1.5 ${seg.isAlert ? 'text-red-300' : seg.kind === 'travel' ? 'text-slate-500' : 'text-slate-400'}`}
                                                    title={
                                                        seg.kind === 'travel'
                                                            ? seg.hours > 0
                                                                ? `${seg.label} — ${seg.hours.toFixed(2)} h`
                                                                : `${seg.label} — en attente du calcul d’itinéraire`
                                                            : seg.isAlert
                                                              ? `${seg.label} — ${seg.hours.toFixed(1)} h (alerte)`
                                                              : `${seg.label} — ${seg.hours.toFixed(1)} h`
                                                    }
                                                >
                                                    <span
                                                        className={`h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ${seg.isAlert ? 'ring-red-400/60' : 'ring-white/20'}`}
                                                        style={{ backgroundColor: seg.color }}
                                                        aria-hidden
                                                    />
                                                    <span
                                                        className={`min-w-0 truncate font-medium ${seg.isAlert ? 'text-red-200' : 'text-slate-300'}`}
                                                    >
                                                        {seg.label}
                                                    </span>
                                                    <span
                                                        className={`shrink-0 tabular-nums ${seg.isAlert ? 'text-red-400' : 'text-slate-500'}`}
                                                    >
                                                        {seg.hours.toFixed(1)}h
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                );
                            })()}

                            {/* Bouton ouvrir config - bas gauche, uniquement quand panneau ferme */}
                            {!isConfigPanelOpen && (
                                <button
                                    type="button"
                                    onClick={() => setIsConfigPanelOpen(true)}
                                    className="absolute bottom-4 left-4 z-20 hidden items-center gap-2 rounded-full border border-white/15 bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 lg:flex"
                                    title="Configurer votre voyage"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                    <span className="text-sm font-medium">Configurer votre voyage</span>
                                </button>
                            )}

                            {/* Boutons Assistant + Filtre + Vue - ancres en bas a droite */}
                            <div
                                className="absolute bottom-4 right-4 z-20 flex max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-lg:right-3 items-center gap-2"
                                ref={mapViewMenuRef}
                            >
                                {planningMode != null && planningMode !== 'manual' && (
                                <button
                                    type="button"
                                    onClick={() => setIsAssistantOpen((o) => !o)}
                                    className="hidden h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 lg:flex"
                                    title="Triply Assistant"
                                    aria-label="Ouvrir l'assistant"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </button>
                                )}
                                <div className="relative" ref={hotelFilterMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setHotelFilterMenuOpen((o) => !o)}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-background shadow-md transition-colors hover:bg-[#333333] ${hotelStarsFilter && hotelStarsFilter.length > 0 ? 'ring-2 ring-cyan-500/80' : ''}`}
                                        title="Filtrer les hôtels"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-100">
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {hotelFilterMenuOpen && (
                                                <div
                                                className="absolute bottom-full right-0 mb-3 min-w-[12.5rem] overflow-hidden rounded-xl border border-white/15 bg-background shadow-2xl"
                                            >
                                                <div className="border-b border-white/10 px-3 py-2">
                                                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Étoiles</span>
                                                </div>
                                                <div className="py-2">
                                                    {[
                                                        { label: 'Tous', value: null },
                                                        { label: '2, 3, 4 étoiles', value: [2, 3, 4] },
                                                        { label: '4 et 5 étoiles', value: [4, 5] },
                                                        { label: '5 étoiles uniquement', value: [5] },
                                                    ].map(({ label, value }) => {
                                                        const isActive = value === null
                                                            ? !hotelStarsFilter || hotelStarsFilter.length === 0
                                                            : hotelStarsFilter?.length === value.length && value.every((s) => hotelStarsFilter?.includes(s));
                                                        return (
                                                            <button
                                                                key={label}
                                                                type="button"
                                                                onClick={() => applyHotelFilter(value)}
                                                                className={`flex w-full items-center gap-2 py-2.5 px-4 text-left text-sm font-medium transition-colors hover:bg-white/10 ${isActive ? 'text-cyan-400' : 'text-slate-100'}`}
                                                            >
                                                                {isActive && <span className="text-cyan-400">●</span>}
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <Button
                                    label="Changer de vue"
                                    onClick={() => setMapViewMenuOpen((o) => !o)}
                                    variant="dark"
                                    tone="tone1"
                                />
                                <AnimatePresence>
                                    {mapViewMenuOpen && (
                                        <div
                                            className="absolute right-0 bottom-full mb-3 min-w-44 overflow-hidden rounded-xl"
                                            style={{
                                                backgroundColor: 'var(--background, #222222)',
                                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                                boxShadow: '0 12px 40px rgba(15, 23, 42, 0.9)',
                                            }}
                                        >
                                                <div className="border-b border-white/10 px-3 py-2">
                                                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Style</span>
                                            </div>
                                            {[
                                                { id: 'dark', label: 'Sombre', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'night' as const } },
                                                { id: 'light', label: 'Clair', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'day' as const } },
                                                { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/standard-satellite', config: { lightPreset: 'day' as const } },
                                            ].map(({ id, label, style, config }) => (
                                                <button
                                                    key={id} type="button"
                                                    onClick={() => { setMapStyle(style); setMapConfig(config); setMapPitch(0); setMapViewMenuOpen(false); }}
                                                    className="w-full py-3 px-4 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                            <div className="border-t border-white/10" />
                                            <button type="button" onClick={() => { setMapPitch(0); setMapViewMenuOpen(false); }} className="w-full py-3 px-4 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10">Vue 2D</button>
                                            <button type="button" onClick={() => { setMapPitch(60); setMapViewMenuOpen(false); }} className="w-full py-3 px-4 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10">Vue 3D</button>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                                </div>

                            <AnimatePresence>
                                {planningMode != null && planningMode !== 'manual' && isAssistantOpen && (
                                    <motion.div
                                        key="assistant-shell"
                                        initial={{ opacity: 0, y: 88, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 88, scale: 0.98 }}
                                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                                        className="flex min-h-0 w-full flex-col overflow-hidden border-white/15 bg-[var(--background,#222222)] max-xl:fixed max-xl:left-4 max-xl:right-4 max-xl:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-xl:z-[80] max-xl:h-[min(80vh,640px)] max-xl:max-h-[80vh] max-xl:rounded-2xl max-xl:border max-xl:shadow-2xl xl:static xl:z-auto xl:h-full xl:max-h-none xl:w-[min(24rem,28vw)] xl:max-w-md xl:shrink-0 xl:rounded-none xl:border xl:border-l xl:border-y-0 xl:border-r-0 xl:shadow-none"
                                        style={{ backgroundColor: 'var(--background, #222222)' }}
                                    >
                                        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 xl:hidden">
                                            <div className="min-w-0 pr-2">
                                                <h3 className="text-sm font-semibold text-slate-100">Triply Assistant</h3>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Posez vos questions voyage, nous structurons la réponse.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsAssistantOpen(false)}
                                                className="shrink-0 rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                                aria-label="Fermer"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-100">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="hidden border-b border-white/10 px-4 py-2 xl:flex xl:items-center xl:justify-between">
                                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assistant</h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsAssistantOpen(false)}
                                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                                                aria-label="Replier l&apos;assistant"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                            {isConnected ? (
                                                <Assistant
                                                    ref={assistantRef}
                                                    chatOwnerId={getStoredSession()?.user?.id ?? null}
                                                    onUpdateLocations={handleAssistantUpdate}
                                                    destination={tripConfig.arrivalCityName || tripConfig.arrivalCity}
                                                    planningContext={assistantPlanningContext}
                                                    onSuggestedActivities={handleSuggestedActivitiesFromAssistant}
                                                    onSuggestedActivitiesForDay={handleSuggestedActivitiesForSpecificDay}
                                                    onLoadingChange={setAssistantRequestLoading}
                                                    step1FormSnapshot={assistantStep1Snapshot}
                                                    step1HotelOptionLabels={multiSelectOptions}
                                                    step1DietaryLabels={dietaryMultiSelectOptions}
                                                    onApplyStep1Form={handleApplyAssistantStep1Patch}
                                                />
                                            ) : (
                                                <div className="overflow-y-auto p-6">
                                                    <p className="mb-4 text-sm text-slate-200">
                                                        Vous devez être connecté pour utiliser la discussion avec le LLM.
                                                    </p>
                                                    <Button label="Se connecter" onClick={handleLoginClick} variant="dark" tone="tone1" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        </div>

                        <nav
                            className="fixed bottom-0 left-0 right-0 z-[55] flex items-stretch justify-around gap-1 border-t border-white/10 bg-slate-950/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--background,#222222) 92%, transparent)' }}
                            aria-label="Navigation planification"
                        >
                            <button
                                type="button"
                                onClick={() => setIsMobileNavOpen(true)}
                                className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-slate-100"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Menu
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsConfigPanelOpen(true)}
                                className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-slate-100"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Plan
                            </button>
                            {planningMode != null && planningMode !== 'manual' ? (
                                <button
                                    type="button"
                                    onClick={() => setIsAssistantOpen((o) => !o)}
                                    className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-slate-100"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Assistant
                                </button>
                            ) : (
                                <span className="min-w-0 flex-1" aria-hidden />
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setValidateTripError('');
                                    setValidateTripModalOpen(true);
                                }}
                                disabled={!hasAnyPlannedActivity}
                                className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Valider
                            </button>
                        </nav>
                    </>
                )}
            </div>

            <AnimatePresence>
                {validateTripModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="validate-trip-title"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl border border-white/15 p-6 shadow-2xl"
                            style={{ backgroundColor: 'var(--background, #222222)' }}
                        >
                            <h2 id="validate-trip-title" className="text-lg font-semibold text-slate-100">
                                Confirmer votre voyage
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Votre itinéraire sera enregistré dans Mes voyages. Vous pourrez le consulter avec les
                                trajets et activités par jour.
                            </p>
                            {!hasAnyPlannedActivity && (
                                <p className="mt-3 text-sm text-amber-400">
                                    Aucune activité sur la carte : ajoutez au moins un lieu pour valider.
                                </p>
                            )}
                            {validateTripError && (
                                <p className="mt-3 text-sm text-red-400">{validateTripError}</p>
                            )}
                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setValidateTripModalOpen(false)}
                                    disabled={validateTripSubmitting}
                                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleConfirmValidateTrip()}
                                    disabled={validateTripSubmitting || !hasAnyPlannedActivity}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {validateTripSubmitting ? 'Enregistrement…' : 'Confirmer et enregistrer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TuPreferes
                visible={showTuPreferes}
                onComplete={(prefs) => {
                    try {
                        window.localStorage.setItem(
                            PREFERENCES_STORAGE_KEY,
                            JSON.stringify(preferencesPayloadToAssistantTags(prefs)),
                        );
                    } catch {
                        /* ignore */
                    }
                    setShowTuPreferes(false);
                }}
                onSkip={() => setShowTuPreferes(false)}
            />
        </div>
    );
}
