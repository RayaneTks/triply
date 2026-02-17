'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Slide } from '@/src/components/PowerPoint/Slide';
import { WorldMap } from '@/src/components/Map/Map';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { Button } from '@/src/components/Button/Button';
import { Login } from "@/src/components/Login/Login";
import { TuPreferes } from "@/src/components/TuPreferes/TuPreferes";
import Assistant from "@/src/components/Assistant/Assistant";
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import { FlightSearchModal } from '@/src/components/FlightSearchModal/FlightSearchModal';
import { FlightDetailModal } from '@/src/components/FlightDetailModal/FlightDetailModal';
import { HotelSearchModal } from '@/src/components/HotelSearchModal/HotelSearchModal';
import { HotelDetailModal } from '@/src/components/HotelDetailModal/HotelDetailModal';
import { generateFlightRequest } from '@/utils/amadeus';
import { mergeCityCenterWithHotels, spreadOverlappingPoints } from '@/src/utils/locations';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import { clearSession, getStoredSession, logout, me, saveSession, type AuthUser } from '@/src/lib/auth-client';

// Interface pour la définition des slides
interface SlideDefinition {
    id: string;
    title: string;
    content: React.ReactNode;
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
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVuY2FuZ2F1YmVydCIsImEiOiJjbWs1em50ZjgwaHc3M2VxczYweWR2djBwIn0.pwM2awFdHHSRsQeYiTtkXA';

    // Etats Globaux
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');
    const [showTuPreferes, setShowTuPreferes] = useState(false);
    const [mapLocations, setMapLocations] = useState<any[]>([]);
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

    // Etats Formulaire Voyage
    const [travelerCount, setTravelerCount] = useState(1);
    const [budget, setBudget] = useState('');
    const [activityTime, setActivityTime] = useState('');
    const [outboundDate, setOutboundDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [departureCity, setDepartureCity] = useState('');
    const [arrivalCity, setArrivalCity] = useState('');
    const [arrivalCityName, setArrivalCityName] = useState('');
    const [travelDays, setTravelDays] = useState<number>(3);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRequestPayload, setLastRequestPayload] = useState<any>(null);
    const [apiResponse, setApiResponse] = useState<any>(null);

    // Etats Mapbox
    const [selectedPoi, setSelectedPoi] = useState<MapboxPoiFeature | null>(null);
    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/standard');
    const [mapConfig, setMapConfig] = useState<{ lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' }>({ lightPreset: 'day' });
    const [mapPitch, setMapPitch] = useState<number>(0);
    const [mapViewMenuOpen, setMapViewMenuOpen] = useState(false);
    const mapViewMenuRef = useRef<HTMLDivElement>(null);
    const [hotelFilterMenuOpen, setHotelFilterMenuOpen] = useState(false);
    const hotelFilterMenuRef = useRef<HTMLDivElement>(null);
    const [hotelStarsFilter, setHotelStarsFilter] = useState<number[] | null>(null); // null = tous, [2,3,4] = filtré
    const lastSearchRef = useRef<{ lat: number; lng: number; cityCenter: any } | null>(null);

    // --- GESTION SELECTION AEROPORT (NOUVEAU) ---
    const handleAirportSelect = (iata: string, name: string, lat: number, lng: number) => {
        console.log(`Aéroport sélectionné: ${name} (${iata}) @ ${lat}, ${lng}`);

        // 1. Si pas de départ, c'est le départ
        if (!departureCity) {
            setDepartureCity(iata);
        }
        // 2. Sinon, c'est l'arrivée
        else {
            if (departureCity !== iata) {
                setArrivalCity(iata);
                setArrivalCityName(name);

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

    const searchHotelsAtLocation = useCallback(async (lat: number, lng: number, cityCenter: any, ratingsFilter?: number[] | null) => {
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

    const handleAssistantUpdate = useCallback((locations: any[]) => {
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
    const [isFlightDetailModalOpen, setIsFlightDetailModalOpen] = useState(false);

    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [selectedHotelOffer, setSelectedHotelOffer] = useState<HotelOffer | null>(null);
    const [isHotelDetailModalOpen, setIsHotelDetailModalOpen] = useState(false);
    const [hotelApiResponse, setHotelApiResponse] = useState<any>(null);
    const [isLoadingHotel, setIsLoadingHotel] = useState(false);
    const [hotelSelectedOptions, setHotelSelectedOptions] = useState<string[]>([]);

    const handleFlightSelect = (offer: FlightOffer, carrierName: string) => {
        setSelectedFlightOffer(offer);
        setSelectedFlightCarrierName(carrierName);
        setIsFlightModalOpen(false);

        const outbound = offer.itineraries?.[0];
        const returnItin = offer.itineraries?.[1];
        const firstSeg = outbound?.segments?.[0];
        const lastOutboundSeg = outbound?.segments?.[outbound?.segments?.length ? outbound.segments.length - 1 : 0];
        const firstReturnSeg = returnItin?.segments?.[0];
        const lastReturnSeg = returnItin?.segments?.[returnItin?.segments?.length ? returnItin.segments.length - 1 : 0];

        if (firstSeg?.departure) {
            setDepartureCity(firstSeg.departure.iataCode || '');
            const dt = firstSeg.departure.at;
            if (dt) {
                setOutboundDate(dt.slice(0, 10));
                setArrivalTime(dt.slice(11, 16));
            }
        }
        if (lastOutboundSeg?.arrival) {
            setArrivalCity(lastOutboundSeg.arrival.iataCode || '');
            if (returnItin && firstReturnSeg?.departure?.at) {
                setReturnDate(firstReturnSeg.departure.at.slice(0, 10));
                setDepartureTime(firstReturnSeg.departure.at.slice(11, 16));
            } else if (lastOutboundSeg.arrival.at) {
                setDepartureTime(lastOutboundSeg.arrival.at.slice(11, 16));
            }
        }
        if (offer.price?.grandTotal) {
            setBudget(offer.price.grandTotal);
        }
        if (offer.travelerPricings?.length) {
            setTravelerCount(offer.travelerPricings.length);
        }
    };

    const handleHotelSelect = (offer: HotelOffer) => {
        setSelectedHotelOffer(offer);
        setIsHotelModalOpen(false);
        setArrivalCity(offer.cityCode);
        setOutboundDate(offer.checkInDate);
        setReturnDate(offer.checkOutDate);
        if (offer.price?.total) setBudget(offer.price.total);
        if (offer.guests?.adults) setTravelerCount(offer.guests.adults);
    };

    // Gestion de la recherche de vol
    const handleFlightSearch = async () => {
        setIsLoading(true);

        const payload = generateFlightRequest(
            departureCity,
            arrivalCity,
            outboundDate,
            returnDate,
            travelerCount,
            budget,
            arrivalTime,
            departureTime
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
        const city = arrivalCity || departureCity;
        if (!city) {
            setHotelApiResponse({ error: 'Veuillez sélectionner une ville de destination.' });
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const checkIn = outboundDate || today;
        const checkOut = returnDate || tomorrow;

        setIsLoadingHotel(true);
        try {
            const res = await fetch('/api/hotels/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cityCode: city,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    adults: travelerCount,
                    roomQuantity: 1,
                    maxPrice: budget ? parseInt(budget, 10) : undefined,
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

    const slides: SlideDefinition[] = useMemo(() => [
        {
            id: 'trip-config',
            title: 'Paramètres de voyage',
            content: (
                <TripConfigurationForm
                    departureCity={departureCity} setDepartureCity={setDepartureCity}
                    arrivalCity={arrivalCity} setArrivalCity={setArrivalCity}
                    setArrivalCityName={setArrivalCityName}
                    travelDays={travelDays} setTravelDays={setTravelDays}
                    travelerCount={travelerCount} setTravelerCount={setTravelerCount}
                    budget={budget} setBudget={setBudget}
                    activityTime={activityTime} setActivityTime={setActivityTime}
                    arrivalDate={outboundDate}
                    setArrivalDate={setOutboundDate}
                    departureDate={returnDate}
                    setDepartureDate={setReturnDate}
                    arrivalTime={arrivalTime} setArrivalTime={setArrivalTime}
                    departureTime={departureTime} setDepartureTime={setDepartureTime}
                    selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions}
                    multiSelectOptions={multiSelectOptions}
                    onOpenFlightSearch={() => setIsFlightModalOpen(true)}
                    onCloseFlightSearch={() => setIsFlightModalOpen(false)}
                    flightSearchChecked={isFlightModalOpen}
                    selectedFlight={selectedFlightOffer}
                    selectedFlightCarrierName={selectedFlightCarrierName}
                    onFlightCardClick={() => setIsFlightDetailModalOpen(true)}
                    onRemoveFlight={() => {
                        setSelectedFlightOffer(null);
                        setSelectedFlightCarrierName('');
                        setIsFlightDetailModalOpen(false);
                    }}
                    onOpenHotelSearch={() => setIsHotelModalOpen(true)}
                    onCloseHotelSearch={() => setIsHotelModalOpen(false)}
                    hotelSearchChecked={isHotelModalOpen}
                    selectedHotel={selectedHotelOffer}
                    onHotelCardClick={() => setIsHotelDetailModalOpen(true)}
                    onRemoveHotel={() => {
                        setSelectedHotelOffer(null);
                        setIsHotelDetailModalOpen(false);
                    }}
                />
            )
        },
    ], [
        departureCity, arrivalCity, travelDays, travelerCount, budget, activityTime,
        outboundDate, returnDate, arrivalTime, departureTime, selectedOptions,
        isFlightModalOpen,
        selectedFlightOffer,
        selectedFlightCarrierName,
        isHotelModalOpen,
        selectedHotelOffer,
    ]);

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

    const handlePoiClick = (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }) => {
        setSelectedPoi(feature);
        const name = feature.properties?.name ?? feature.properties?.name_en ?? feature.layer?.id ?? 'Lieu';
        console.log('POI cliqué:', { name, feature, lngLat });
    };

    const handleNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            setSlideDirection(1);
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setSlideDirection(-1);
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

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
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            <div className="flex-1 flex overflow-hidden min-w-0 relative">
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
                                className="h-full"
                                padding={{ left: isConfigPanelOpen ? 400 : 0, top: 0, bottom: 0, right: 0 }}
                                onPoiClick={handlePoiClick}
                                locations={mapLocations}
                                onAirportSelect={handleAirportSelect}
                            />
                            <FlightSearchModal
                                visible={isFlightModalOpen}
                                onClose={() => {
                                    setIsFlightModalOpen(false);
                                }}
                                departureCity={departureCity}
                                setDepartureCity={setDepartureCity}
                                arrivalCity={arrivalCity}
                                setArrivalCity={setArrivalCity}
                                arrivalDate={outboundDate}
                                setArrivalDate={setOutboundDate}
                                departureDate={returnDate}
                                setDepartureDate={setReturnDate}
                                arrivalTime={arrivalTime}
                                setArrivalTime={setArrivalTime}
                                departureTime={departureTime}
                                setDepartureTime={setDepartureTime}
                                travelerCount={travelerCount}
                                setTravelerCount={setTravelerCount}
                                budget={budget}
                                setBudget={setBudget}
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
                                cityCode={arrivalCity}
                                setCityCode={setArrivalCity}
                                arrivalDate={outboundDate}
                                setArrivalDate={setOutboundDate}
                                departureDate={returnDate}
                                setDepartureDate={setReturnDate}
                                travelerCount={travelerCount}
                                setTravelerCount={setTravelerCount}
                                budget={budget}
                                setBudget={setBudget}
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

                            {/* Bouton Configurer votre voyage - bas gauche (visible uniquement quand le panneau est fermé) */}
                            {!isConfigPanelOpen && (
                                <button
                                    type="button"
                                    onClick={() => setIsConfigPanelOpen(true)}
                                    className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all hover:scale-105 shadow-lg"
                                    style={{
                                        backgroundColor: 'rgba(34, 34, 34, 0.98)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                        color: 'var(--foreground, #ededed)',
                                    }}
                                    title="Configurer votre voyage"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                    <span className="text-sm font-medium">Configurer votre voyage</span>
                                </button>
                            )}

                            {/* Bouton Assistant Triply - bas droite */}
                            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2" ref={mapViewMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsAssistantOpen((o) => !o)}
                                    className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105 shadow-lg"
                                    style={{
                                        backgroundColor: 'var(--primary, #0096c7)',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(0, 150, 199, 0.4)',
                                    }}
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
                                        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-white/10 ${hotelStarsFilter && hotelStarsFilter.length > 0 ? 'ring-2 ring-cyan-500/80' : ''}`}
                                        style={{
                                            backgroundColor: 'rgba(34, 34, 34, 0.98)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                        }}
                                        title="Filtrer les hôtels"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--foreground, #ededed)' }}>
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {hotelFilterMenuOpen && (
                                            <div
                                                className="absolute right-0 bottom-full mb-3 rounded-xl overflow-hidden min-w-[200px]"
                                                style={{
                                                    backgroundColor: 'rgba(34, 34, 34, 0.98)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                                                }}
                                            >
                                                <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Étoiles</span>
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
                                                                className="w-full text-left py-2.5 px-4 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                                                                style={{
                                                                    color: isActive ? '#0096c7' : 'var(--foreground, #ededed)',
                                                                }}
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
                                                backgroundColor: 'rgba(34, 34, 34, 0.98)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                                            }}
                                        >
                                            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Style</span>
                                            </div>
                                            {[
                                                { id: 'dark', label: 'Sombre', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'night' as const } },
                                                { id: 'light', label: 'Clair', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'day' as const } },
                                                { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/standard-satellite', config: { lightPreset: 'day' as const } },
                                            ].map(({ id, label, style, config }) => (
                                                <button
                                                    key={id} type="button"
                                                    onClick={() => { setMapStyle(style); setMapConfig(config); setMapPitch(0); setMapViewMenuOpen(false); }}
                                                    className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
                                                    style={{ color: 'var(--foreground, #ededed)' }}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                            <button type="button" onClick={() => { setMapPitch(0); setMapViewMenuOpen(false); }} className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--foreground, #ededed)' }}>Vue 2D</button>
                                            <button type="button" onClick={() => { setMapPitch(60); setMapViewMenuOpen(false); }} className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--foreground, #ededed)' }}>Vue 3D</button>
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
                                        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-md z-[9999] rounded-t-2xl overflow-hidden shadow-2xl flex flex-col"
                                        style={{
                                            height: 'min(70vh, 500px)',
                                            backgroundColor: 'var(--background, #222222)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
                                        }}
                                    >
                                        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Triply Assistant</h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsAssistantOpen(false)}
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                aria-label="Fermer"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--foreground)' }}>
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                            {isConnected ? (
                                                <Assistant
                                                    onUpdateLocations={handleAssistantUpdate}
                                                    destination={arrivalCityName || arrivalCity}
                                                />
                                            ) : (
                                                <div className="p-6 overflow-y-auto">
                                                    <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                        Connecte-toi pour utiliser la discussion avec le LLM.
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
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: '33.333%', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="absolute left-0 top-0 bottom-0 flex flex-col overflow-hidden p-4 z-10 min-w-0 shrink-0"
                                >
                                    <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                                        <div className="absolute top-3 left-3 z-10">
                                            <button
                                                type="button"
                                                onClick={() => setIsConfigPanelOpen(false)}
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                aria-label="Fermer"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--foreground)' }}>
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <AnimatePresence mode="wait" custom={slideDirection}>
                                            <Slide
                                                key={currentSlideIndex}
                                                direction={slideDirection}
                                                onNext={handleNext}
                                                onPrev={handlePrev}
                                                canNext={currentSlideIndex < slides.length - 1}
                                                canPrev={currentSlideIndex > 0}
                                            >
                                                {slides[currentSlideIndex]?.content}
                                            </Slide>
                                        </AnimatePresence>
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
