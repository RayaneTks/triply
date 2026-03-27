'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { clearSession, getStoredSession, logout, me, saveSession, type AuthUser } from '@/src/lib/auth-client';
import {
    loadStoredPlanningMode,
    savePlanningMode,
    clearPlanningModeStorage,
    type PlanningMode,
} from '@/src/features/trip-creation/planning-mode';
import { createTrip, validateTripApi } from '@/src/lib/trips-client';
import type { PlanSnapshot } from '@/src/lib/plan-snapshot';
import {
    buildStep1FormSnapshotForAssistant,
    type AssistantStep1FormPatch,
} from '@/src/features/trip-creation/step1-form-patch';
import { requestActivityRegeneration } from '@/src/lib/assistant-regenerate';

/** Segment / carte en alerte dépassement temps jour */
const ACTIVITY_TIME_ALERT_COLOR = '#ef4444';

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

/** Assemble la géométrie d’un leg Mapbox à partir des steps (un LineString par tronçon entre waypoints). */
function geometryFromLegSteps(leg: { steps?: Array<{ geometry?: GeoJSON.Geometry }> }): GeoJSON.LineString | null {
    const steps = leg.steps;
    if (!Array.isArray(steps) || steps.length === 0) return null;
    const coordinates: number[][] = [];
    for (const step of steps) {
        const g = step.geometry;
        if (
            g &&
            typeof g === 'object' &&
            'type' in g &&
            g.type === 'LineString' &&
            'coordinates' in g &&
            Array.isArray((g as GeoJSON.LineString).coordinates)
        ) {
            for (const c of (g as GeoJSON.LineString).coordinates) {
                const pt = c as number[];
                if (coordinates.length === 0) {
                    coordinates.push(pt);
                } else {
                    const last = coordinates[coordinates.length - 1];
                    if (last[0] !== pt[0] || last[1] !== pt[1]) coordinates.push(pt);
                }
            }
        }
    }
    if (coordinates.length < 2) return null;
    return { type: 'LineString', coordinates };
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
    const [isLoadingHotels, setIsLoadingHotels] = useState(false);

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
    const [lastRequestPayload, setLastRequestPayload] = useState<FlightRequestPayload | null>(null);
    const [apiResponse, setApiResponse] = useState<(AmadeusResponse | { error?: string; details?: string }) | null>(null);

    // Etats Mapbox
    const [selectedPoi, setSelectedPoi] = useState<MapboxPoiFeature | null>(null);
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
                    geometry: GeoJSON.LineString;
                    duration: number;
                    legs: Array<{ duration: number; distance: number; geometry?: GeoJSON.LineString }>;
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
    const [validateTripModalOpen, setValidateTripModalOpen] = useState(false);
    const [validateTripSubmitting, setValidateTripSubmitting] = useState(false);
    const [validateTripError, setValidateTripError] = useState('');
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
    const [wizardView, setWizardView] = useState<'plan' | 'activity'>('plan');

    const handleBackToPlanningModeSelection = useCallback(() => {
        const uid = getStoredSession()?.user?.id ?? null;
        clearPlanningModeStorage(uid);
        setPlanningModeState(null);
        setWizardView('plan');
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
    const [hotelSelectedOptions, setHotelSelectedOptions] = useState<string[]>([]);
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
        setSelectedHotelOffer(offer);
        setIsHotelModalOpen(false);
        tripConfig.setArrivalCity(offer.cityCode);
        tripConfig.setOutboundDate(offer.checkInDate);
        tripConfig.setReturnDate(offer.checkOutDate);
        if (offer.guests?.adults) tripConfig.setTravelerCount(offer.guests.adults);
    };

    // Gestion de la recherche de vol
    const handleFlightSearch = async () => {
        setIsLoading(true);

        const payload = generateFlightRequest(
            tripConfig.departureCity,
            tripConfig.arrivalCity,
            tripConfig.outboundDate,
            tripConfig.returnDate,
            tripConfig.travelerCount,
            flightModalBudget,
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

        } catch (error) {
            console.error("Erreur critique:", error);
            setApiResponse({ error: "Erreur lors de l'appel API", details: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleHotelSearch = async () => {
        const city = tripConfig.arrivalCity || tripConfig.departureCity;
        if (!city) {
            setHotelApiResponse({ error: 'Veuillez sélectionner une ville de destination.' });
            return;
        }
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
                    maxPrice: hotelModalBudget ? parseInt(hotelModalBudget, 10) : undefined,
                    preferences: hotelSelectedOptions,
                    ...(hotelMealRegime.trim() ? { boardType: hotelMealRegime.trim() } : {}),
                }),
            });
            const data = await res.json();
            setHotelApiResponse(data);
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
                const res = await fetch(`/api/places/search?keyword=${encodeURIComponent(keyword)}`);
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
        setWizardView('activity');
        if (planningMode === 'full_ai') {
            setIsAssistantOpen(true);
        } else if (planningMode === 'manual') {
            setIsAssistantOpen(false);
        }
    };

    const appendSyntheticPoi = useCallback(
        (name: string, lat: number, lng: number, layerId: string) => {
            setDayActivitiesByDay((prev) => {
                const prevDay = prev[selectedDay] ?? [];
                const key = `${name}-${lng.toFixed(5)}-${lat.toFixed(5)}`;
                const exists = prevDay.some((p) => {
                    const t = getDayActivityLabel(p);
                    return `${t}-${p.lngLat.lng.toFixed(5)}-${p.lngLat.lat.toFixed(5)}` === key;
                });
                if (exists) return prev;
                const _dragId = `syn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                setLastAddedActivityDragIdByDay((m) => ({ ...m, [selectedDay]: _dragId }));
                const poi: DayActivityPoi = {
                    layer: { id: layerId },
                    properties: { name, name_en: name },
                    lngLat: { lng, lat },
                    _dragId,
                };
                return { ...prev, [selectedDay]: [...prevDay, poi] };
            });
        },
        [selectedDay]
    );

    const handleAppendHotelToDay = useCallback(async () => {
        if (!selectedHotelOffer) return;
        setGeocodeAppendPending(true);
        try {
            const kw = `${selectedHotelOffer.hotelName} ${selectedHotelOffer.cityCode}`;
            const g = await fetchGeocodeFirst(kw);
            if (!g) {
                window.alert("Impossible de localiser l'hôtel. Essayez une recherche plus précise.");
                return;
            }
            appendSyntheticPoi(g.name || selectedHotelOffer.hotelName, g.lat, g.lng, 'hotel');
        } finally {
            setGeocodeAppendPending(false);
        }
    }, [appendSyntheticPoi, selectedHotelOffer]);

    const handleAppendAirportOutbound = useCallback(async () => {
        if (!selectedFlightOffer) return;
        const seg = selectedFlightOffer.itineraries?.[0]?.segments?.[0];
        const iata = seg?.departure?.iataCode;
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
    }, [appendSyntheticPoi, selectedFlightOffer]);

    const handleAppendAirportReturn = useCallback(async () => {
        if (!selectedFlightOffer) return;
        const ret = selectedFlightOffer.itineraries?.[1];
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
    }, [appendSyntheticPoi, selectedFlightOffer]);

    const handleSuggestedActivitiesFromAssistant = useCallback(
        (items: SuggestedActivityPin[]) => {
            setDayActivitiesByDay((prev) => {
                const list = prev[selectedDay] ?? [];
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
                    setLastAddedActivityDragIdByDay((m) => ({ ...m, [selectedDay]: _dragId }));
                    next.push({
                        layer: { id: 'poi' },
                        properties: { name: title, name_en: title },
                        lngLat: { lng: it.lng, lat: it.lat },
                        _dragId,
                    });
                }
                return { ...prev, [selectedDay]: next };
            });
        },
        [selectedDay]
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
            flightSummary: selectedFlightOffer
                ? {
                      carrier: selectedFlightCarrierName || undefined,
                      price: selectedFlightOffer.price?.grandTotal,
                      currency: selectedFlightOffer.price?.currency,
                  }
                : undefined,
            hotelSummary: selectedHotelOffer
                ? { name: selectedHotelOffer.hotelName, cityCode: selectedHotelOffer.cityCode }
                : undefined,
        };
    }, [
        dayActivitiesByDay,
        tripConfig.travelDays,
        planningMode,
        selectedFlightOffer,
        selectedFlightCarrierName,
        selectedHotelOffer,
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
                  : 8;
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

    const assistantStep1Snapshot = useMemo(
        () =>
            buildStep1FormSnapshotForAssistant({
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
            }),
        [
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
        ]
    );

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
        queueMicrotask(() => assistantRef.current?.suggestActivitiesForDay());
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

    const handleConfirmValidateTrip = useCallback(async () => {
        const session = getStoredSession();
        if (!session?.token) {
            setValidateTripError('Connectez-vous pour enregistrer le voyage.');
            return;
        }
        setValidateTripSubmitting(true);
        setValidateTripError('');
        try {
            const dest = tripConfig.arrivalCityName || tripConfig.arrivalCity;
            const snapshot = buildPlanSnapshot();
            const title = `${dest} · ${tripConfig.outboundDate || ''}`.trim();
            const created = await createTrip(session.token, {
                title: title || 'Mon voyage',
                destination: dest || 'Destination',
                start_date: tripConfig.outboundDate || undefined,
                end_date: tripConfig.returnDate || undefined,
                travelers_count: tripConfig.travelerCount,
                plan_snapshot: snapshot,
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

    /** Dernière activité ajoutée en alerte si le total du jour dépasse le max */
    const activityTimeAlertDragId = useMemo(() => {
        const list = dayActivitiesByDay[selectedDay] ?? [];
        const maxH =
            activityHoursByDay[selectedDay] ??
            Math.max(0, parseFloat(String(tripConfig.activityTime || 0)) || 0);
        if (maxH <= 0) return null;
        const currentH = list.reduce((acc, p) => acc + getActivityDurationHours(p), 0);
        if (currentH <= maxH) return null;
        const lid = lastAddedActivityDragIdByDay[selectedDay];
        if (!lid || !list.some((p) => p._dragId === lid)) return null;
        return lid;
    }, [selectedDay, dayActivitiesByDay, activityHoursByDay, tripConfig.activityTime, lastAddedActivityDragIdByDay]);

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

    // Appel Mapbox Directions API pour tracer les routes (voiture, vélo, à pied)
    useEffect(() => {
        if (!routeDepsKey || !MAPBOX_TOKEN) {
            setDayRoutes({});
            return;
        }
        const coords = routeDepsKey.split(':')[1] ?? '';
        const profiles = ['driving', 'walking', 'cycling'] as const;
        let cancelled = false;
        Promise.all(
            profiles.map((profile) =>
                fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
                )
                    .then((res) => res.json())
                    .then((data) => {
                        const route = data.routes?.[0];
                        const geom = route?.geometry;
                        const duration = route?.duration ?? 0;
                        const rawLegs = route?.legs;
                        const legs = Array.isArray(rawLegs)
                            ? rawLegs.map((leg: { duration?: number; distance?: number; steps?: Array<{ geometry?: GeoJSON.Geometry }> }) => {
                                  const legGeom = geometryFromLegSteps(leg);
                                  return {
                                      duration: typeof leg?.duration === 'number' ? leg.duration : 0,
                                      distance: typeof leg?.distance === 'number' ? leg.distance : 0,
                                      ...(legGeom ? { geometry: legGeom } : {}),
                                  };
                              })
                            : [];
                        return { profile, geometry: geom?.type === 'LineString' ? geom : null, duration, legs };
                    })
                    .catch(() => ({
                        profile,
                        geometry: null,
                        duration: 0,
                        legs: [] as Array<{ duration: number; distance: number; geometry?: GeoJSON.LineString }>,
                    }))
            )
        ).then((results) => {
            if (cancelled) return;
            const next: Partial<
                Record<
                    'driving' | 'walking' | 'cycling',
                    {
                        geometry: GeoJSON.LineString;
                        duration: number;
                        legs: Array<{ duration: number; distance: number; geometry?: GeoJSON.LineString }>;
                    }
                >
            > = {};
            results.forEach(({ profile, geometry, duration, legs }) => {
                if (geometry) next[profile] = { geometry, duration, legs };
            });
            setDayRoutes(next);
        });
        return () => { cancelled = true; };
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
     * Les legs de l’itinéraire multi-waypoints ne fournissent pas toujours de géométrie exploitable sans steps/polyline.
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
                            geometry: geom as GeoJSON.LineString,
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
        <div className="flex h-dvh overflow-hidden text-slate-100" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            <div className="relative flex min-w-0 flex-1 overflow-hidden">
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
                        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
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
                                    left: isConfigPanelOpen ? 440 : 0,
                                    top: 24,
                                    bottom: 64,
                                    right: isAssistantOpen ? 360 : 24,
                                }}
                                onPoiClick={handlePoiClick}
                                locations={mapLocations}
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
                                offer={selectedFlightOffer}
                                carrierName={selectedFlightCarrierName}
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
                                selectedOptions={hotelSelectedOptions}
                                setSelectedOptions={setHotelSelectedOptions}
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
                                offer={selectedHotelOffer}
                            />

                            {/* Barre de progression Activité / jour - haut droite */}
                            {isConfigPanelOpen && (() => {
                                const maxH =
                                    activityHoursByDay[selectedDay] ??
                                    Math.max(0, parseFloat(String(tripConfig.activityTime || 0)) || 0);
                                const activitySegments = dayActivities.map((p, i) => {
                                    const key = p._dragId ?? `${p.lngLat.lng}-${p.lngLat.lat}-${i}`;
                                    const isAlert = activityTimeAlertDragId != null && key === activityTimeAlertDragId;
                                    return {
                                        key,
                                        label: getDayActivityLabel(p),
                                        hours: getActivityDurationHours(p),
                                        color: isAlert
                                            ? ACTIVITY_TIME_ALERT_COLOR
                                            : ACTIVITY_TIMELINE_COLORS[i % ACTIVITY_TIMELINE_COLORS.length],
                                        isAlert,
                                    };
                                });
                                const currentH = activitySegments.reduce((acc, s) => acc + s.hours, 0);
                                return (
                                <div
                                    ref={activityHoursEditRef}
                                    className="absolute top-4 right-4 z-20 flex w-[min(92vw,380px)] min-w-[280px] flex-col gap-2 rounded-xl border border-white/15 px-4 py-3 shadow-lg backdrop-blur-sm sm:min-w-[320px]"
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
                                        aria-label={`Temps planifié ${currentH.toFixed(1)} heures sur ${maxH || 0} heures max`}
                                    >
                                        {maxH > 0 && activitySegments.length > 0 ? (
                                            activitySegments.map((seg) => {
                                                const pct = Math.max(0, (seg.hours / maxH) * 100);
                                                return (
                                                    <div
                                                        key={seg.key}
                                                        title={
                                                            seg.isAlert
                                                                ? `${seg.label} — ${seg.hours.toFixed(1)} h (dépasse le temps max du jour)`
                                                                : `${seg.label} — ${seg.hours.toFixed(1)} h`
                                                        }
                                                        className={`h-full shrink-0 transition-all duration-300 first:rounded-l-full last:rounded-r-full ${seg.isAlert ? 'animate-pulse ring-2 ring-red-400/90 ring-inset' : ''}`}
                                                        style={{
                                                            width: `${pct}%`,
                                                            minWidth: seg.hours > 0 ? 4 : 0,
                                                            backgroundColor: seg.color,
                                                            boxShadow: seg.isAlert
                                                                ? 'inset 0 0 12px rgba(254,202,202,0.35)'
                                                                : 'inset 0 1px 0 rgba(255,255,255,0.12)',
                                                        }}
                                                    />
                                                );
                                            })
                                        ) : null}
                                    </div>
                                    {activitySegments.some((s) => s.isAlert) && (
                                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-400" role="alert">
                                            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-400" aria-hidden />
                                            Dernière activité ajoutée : dépassement du temps max du jour
                                        </p>
                                    )}
                                    {activitySegments.length > 0 && (
                                        <div className="flex max-h-24 flex-wrap gap-x-3 gap-y-1.5 overflow-y-auto text-[10px] leading-tight">
                                            {activitySegments.map((seg) => (
                                                <span
                                                    key={seg.key}
                                                    className={`flex max-w-[11rem] items-center gap-1.5 ${seg.isAlert ? 'text-red-300' : 'text-slate-400'}`}
                                                    title={
                                                        seg.isAlert
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
                                    className="absolute bottom-4 left-4 z-20 hidden items-center gap-2 rounded-full border border-white/15 bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:flex"
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
                            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2" ref={mapViewMenuRef}>
                                {planningMode != null && planningMode !== 'manual' && (
                                <button
                                    type="button"
                                    onClick={() => setIsAssistantOpen((o) => !o)}
                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[var(--background)] shadow-md transition-colors hover:bg-[#333333] ${hotelStarsFilter && hotelStarsFilter.length > 0 ? 'ring-2 ring-cyan-500/80' : ''}`}
                                        title="Filtrer les hôtels"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-100">
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {hotelFilterMenuOpen && (
                                                <div
                                                className="absolute bottom-full right-0 mb-3 min-w-[200px] overflow-hidden rounded-xl border border-white/15 bg-[var(--background)] shadow-2xl"
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
                                            className="absolute right-0 bottom-full mb-3 rounded-xl overflow-hidden min-w-[180px]"
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

                            {/* Panneau Assistant (slide-up depuis bas droite) */}
                            <AnimatePresence>
                                {isAssistantOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                        className="fixed bottom-20 left-4 right-4 z-[9999] flex h-[min(80vh,640px)] flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl sm:left-auto sm:right-4 sm:w-full sm:max-w-lg lg:max-w-xl"
                                        style={{ backgroundColor: 'var(--background, #222222)' }}
                                    >
                                        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-100">Triply Assistant</h3>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Posez vos questions voyage, nous structurons la réponse.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsAssistantOpen(false)}
                                                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                                aria-label="Fermer"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-100">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                            {isConnected ? (
                                                <Assistant
                                                    ref={assistantRef}
                                                    onUpdateLocations={handleAssistantUpdate}
                                                    destination={tripConfig.arrivalCityName || tripConfig.arrivalCity}
                                                    planningContext={assistantPlanningContext}
                                                    onSuggestedActivities={handleSuggestedActivitiesFromAssistant}
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

                            <AnimatePresence>
                            {isConfigPanelOpen && (
                                <motion.div
                                    initial={{ x: -24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -24, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                                    className="pointer-events-auto absolute left-0 top-0 bottom-0 z-10 w-full max-w-[420px] p-2 sm:p-3"
                                >
                                    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'var(--background, #222222)' }}>
                                        <TripCreationWizard
                                            activeView={wizardView}
                                            onActiveViewChange={setWizardView}
                                            state={tripConfig}
                                            multiSelectOptions={multiSelectOptions}
                                            dietaryMultiSelectOptions={dietaryMultiSelectOptions}
                                            selectedFlight={selectedFlightOffer}
                                            selectedFlightCarrierName={selectedFlightCarrierName}
                                            selectedHotel={selectedHotelOffer}
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
                                                setIsFlightDetailModalOpen(false);
                                            }}
                                            onHotelCardClick={() => setIsHotelDetailModalOpen(true)}
                                            onRemoveHotel={() => {
                                                setSelectedHotelOffer(null);
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
                                            canAppendReturnAirport={Boolean(selectedFlightOffer?.itineraries?.[1])}
                                            onRequestAiDaySuggestions={handleRequestAiDaySuggestions}
                                            showAiSuggestionButton={
                                                planningMode === 'full_ai' || planningMode === 'semi_ai'
                                            }
                                            aiSuggestionsLoading={assistantRequestLoading}
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
                                </motion.div>
                            )}
                        </AnimatePresence>
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
