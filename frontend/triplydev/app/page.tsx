'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { WorldMap } from '@/src/components/Map/Map';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { Button } from '@/src/components/Button/Button';
import { Login } from "@/src/components/Login/Login";
import { TuPreferes } from "@/src/components/TuPreferes/TuPreferes";
import Assistant from "@/src/components/Assistant/Assistant";
import { TripCreationWizard, getEstimatedDurationHours } from '@/src/features/trip-creation/TripCreationWizard';
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
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVuY2FuZ2F1YmVydCIsImEiOiJjbWs1em50ZjgwaHc3M2VxczYweWR2djBwIn0.pwM2awFdHHSRsQeYiTtkXA';

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
                clearSession();
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
    type DayActivityPoi = MapboxPoiFeature & { lngLat: { lng: number; lat: number }; _dragId?: string };
    const [dayActivitiesByDay, setDayActivitiesByDay] = useState<Record<number, DayActivityPoi[]>>({});
    const [selectedDay, setSelectedDay] = useState(1);
    const [dayRoutes, setDayRoutes] = useState<Partial<Record<'driving' | 'walking' | 'cycling', { geometry: GeoJSON.LineString; duration: number }>>>({});
    const [selectedRouteType, setSelectedRouteType] = useState<'driving' | 'walking' | 'cycling' | null>(null);
    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/standard');
    const [mapConfig, setMapConfig] = useState<{ lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' }>({ lightPreset: 'day' });
    const [mapPitch, setMapPitch] = useState<number>(0);
    const [mapViewMenuOpen, setMapViewMenuOpen] = useState(false);
    const mapViewMenuRef = useRef<HTMLDivElement>(null);
    const [hotelFilterMenuOpen, setHotelFilterMenuOpen] = useState(false);
    const hotelFilterMenuRef = useRef<HTMLDivElement>(null);
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
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [hotelModalBudget, setHotelModalBudget] = useState('');
    const [selectedHotelOffer, setSelectedHotelOffer] = useState<HotelOffer | null>(null);
    const [isHotelDetailModalOpen, setIsHotelDetailModalOpen] = useState(false);
    const [hotelApiResponse, setHotelApiResponse] = useState<(AmadeusHotelResponse | { error?: string; details?: string }) | null>(null);
    const [isLoadingHotel, setIsLoadingHotel] = useState(false);
    const [hotelSelectedOptions, setHotelSelectedOptions] = useState<string[]>([]);

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
                tripConfig.setArrivalTime(dt.slice(11, 16));
            }
        }
        if (lastOutboundSeg?.arrival) {
            tripConfig.setArrivalCity(lastOutboundSeg.arrival.iataCode || '');
            if (returnItin && firstReturnSeg?.departure?.at) {
                tripConfig.setReturnDate(firstReturnSeg.departure.at.slice(0, 10));
                tripConfig.setDepartureTime(firstReturnSeg.departure.at.slice(11, 16));
            } else if (returnItin && lastReturnSeg?.arrival?.at) {
                tripConfig.setDepartureTime(lastReturnSeg.arrival.at.slice(11, 16));
            } else if (lastOutboundSeg.arrival.at) {
                tripConfig.setDepartureTime(lastOutboundSeg.arrival.at.slice(11, 16));
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
            tripConfig.arrivalTime,
            tripConfig.departureTime
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

    const handleGenerateTrip = useCallback(() => {
        const destination = tripConfig.arrivalCityName || tripConfig.arrivalCity;
        if (!destination) return;
        setIsAssistantOpen(true);
        console.log('[Triply] Generate trip:', {
            from: tripConfig.departureCity,
            to: destination,
            dates: `${tripConfig.outboundDate} - ${tripConfig.returnDate}`,
            travelers: tripConfig.travelerCount,
            budget: tripConfig.budget,
            flight: selectedFlightOffer ? 'selected' : 'none',
            hotel: selectedHotelOffer ? 'selected' : 'none',
        });
    }, [tripConfig, selectedFlightOffer, selectedHotelOffer]);

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

    const travelDays = tripConfig.travelDays || 1;
    const dayActivities = dayActivitiesByDay[selectedDay] ?? [];

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
            return { ...prev, [selectedDay]: [...prevDay, { ...feature, lngLat, _dragId }] };
        });
    };

    const handleRemoveDayActivity = (index: number) => {
        setDayActivitiesByDay((prev) => ({
            ...prev,
            [selectedDay]: (prev[selectedDay] ?? []).filter((_, i) => i !== index),
        }));
    };

    const handleReorderDayActivities = (reordered: DayActivityPoi[]) => {
        setDayActivitiesByDay((prev) => ({ ...prev, [selectedDay]: reordered }));
    };

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
                fetch(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`)
                    .then((res) => res.json())
                    .then((data) => {
                        const geom = data.routes?.[0]?.geometry;
                        const duration = data.routes?.[0]?.duration ?? 0;
                        return { profile, geometry: geom?.type === 'LineString' ? geom : null, duration };
                    })
                    .catch(() => ({ profile, geometry: null, duration: 0 }))
            )
        ).then((results) => {
            if (cancelled) return;
            const next: Partial<Record<'driving' | 'walking' | 'cycling', { geometry: GeoJSON.LineString; duration: number }>> = {};
            results.forEach(({ profile, geometry, duration }) => {
                if (geometry) next[profile] = { geometry, duration };
            });
            setDayRoutes(next);
        });
        return () => { cancelled = true; };
    }, [routeDepsKey, MAPBOX_TOKEN]);

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

        clearSession();
        setIsConnected(false);
        setCurrentView('home');
    };

    const handleLoginSuccess = (_user: AuthUser, isNewUser?: boolean) => {
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
                    <LoginWithMapBackground
                        mapboxToken={MAPBOX_TOKEN}
                        onLoginSuccess={handleLoginSuccess}
                        onBack={handleBackToHome}
                    />
                )}

                {currentView === 'home' && (
                    <>
                        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
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
                                routeData={
                                    selectedRouteType && dayRoutes[selectedRouteType]
                                        ? { [selectedRouteType]: dayRoutes[selectedRouteType]! }
                                        : {}
                                }
                            />
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
                                arrivalTime={tripConfig.arrivalTime}
                                setArrivalTime={tripConfig.setArrivalTime}
                                departureTime={tripConfig.departureTime}
                                setDepartureTime={tripConfig.setDepartureTime}
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
                            {isConfigPanelOpen && (
                                <div
                                    className="absolute top-4 right-4 z-20 flex flex-col gap-1 rounded-xl border border-white/15 bg-slate-900/95 px-4 py-2.5 shadow-lg backdrop-blur-sm"
                                    style={{ minWidth: 180 }}
                                >
                                    <div className="flex items-center justify-between gap-3 text-[12px]">
                                        <span className="font-medium text-slate-300">Activités du jour</span>
                                        <span className="tabular-nums text-cyan-400">
                                            {dayActivities.reduce((acc, p) => acc + getEstimatedDurationHours(p.layer?.id), 0).toFixed(1)}h
                                            <span className="text-slate-500"> / </span>
                                            <span className="text-slate-200">
                                                {Math.max(0, parseFloat(String(tripConfig.activityTime || 0)) || 0)}h
                                            </span>
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                                            style={{
                                                width: (() => {
                                                    const maxH = parseFloat(String(tripConfig.activityTime || 0)) || 0;
                                                    const currentH = dayActivities.reduce(
                                                        (acc, p) => acc + getEstimatedDurationHours(p.layer?.id),
                                                        0
                                                    );
                                                    if (maxH <= 0) return '0%';
                                                    return `${Math.min(100, (currentH / maxH) * 100)}%`;
                                                })(),
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

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
                                                    onUpdateLocations={handleAssistantUpdate}
                                                    destination={tripConfig.arrivalCityName || tripConfig.arrivalCity}
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
                                            state={tripConfig}
                                            multiSelectOptions={multiSelectOptions}
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
                                            onRemoveDayActivity={handleRemoveDayActivity}
                                            onReorderDayActivities={handleReorderDayActivities}
                                            dayRoutes={dayRoutes}
                                            selectedRouteType={selectedRouteType}
                                            onSelectRouteType={setSelectedRouteType}
                                            onComplete={handleGenerateTrip}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            <TuPreferes
                visible={showTuPreferes}
                onComplete={() => setShowTuPreferes(false)}
                onSkip={() => setShowTuPreferes(false)}
            />
        </div>
    );
}
