'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Slide } from '@/src/components/PowerPoint/Slide';
import { WorldMap } from '@/src/components/Map/Map';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { PoiReviewsModal } from '@/src/components/PoiReviewsModal/PoiReviewsModal';
import { Button } from '@/src/components/Button/Button';
import { Login } from "@/src/components/Login/Login";
import Assistant from "@/src/components/Assistant/Assistant";
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import { FlightSearchModal } from '@/src/components/FlightSearchModal/FlightSearchModal';
import { FlightDetailModal } from '@/src/components/FlightDetailModal/FlightDetailModal';
import { HotelSearchModal } from '@/src/components/HotelSearchModal/HotelSearchModal';
import { HotelDetailModal } from '@/src/components/HotelDetailModal/HotelDetailModal';
import { generateFlightRequest } from '@/utils/amadeus';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

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
    onLoginSuccess: () => void;
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
    const [mapLocations, setMapLocations] = useState<any[]>([]);

    // AUTO-COLLAPSE SIDEBAR IF CONNECTED
    useEffect(() => {
        if (isConnected) {
            setIsSidebarCollapsed(true);
        }
    }, [isConnected]);

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

    // --- GESTION SELECTION AEROPORT (NOUVEAU) ---
    const handleAirportSelect = (iata: string, name: string) => {
        console.log(`Aéroport sélectionné: ${name} (${iata})`);

        // Logique intelligente pour remplir les champs
        if (!departureCity) {
            setDepartureCity(iata);
        } else if (!arrivalCity) {
            // Évite de mettre la même ville en départ et arrivée
            if (departureCity !== iata) {
                setArrivalCity(iata);
            }
        } else {
            // Si les deux sont pleins, on remplace l'arrivée (comportement standard)
            if (departureCity !== iata) {
                setArrivalCity(iata);
            }
        }
    };
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [selectedFlightOffer, setSelectedFlightOffer] = useState<FlightOffer | null>(null);
    const [selectedFlightCarrierName, setSelectedFlightCarrierName] = useState('');
    const [isFlightDetailModalOpen, setIsFlightDetailModalOpen] = useState(false);

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
            if (mapViewMenuRef.current && !mapViewMenuRef.current.contains(e.target as Node)) {
                setMapViewMenuOpen(false);
            }
        };
        if (mapViewMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [mapViewMenuOpen]);

    const [displayPoi, setDisplayPoi] = useState<{
        feature: MapboxPoiFeature;
        lngLat: { lng: number; lat: number };
        point: { x: number; y: number };
    } | null>(null);
    const [poiReviews, setPoiReviews] = useState<{
        name: string; rating: number | null; reviews: any[]; url: string | null;
    } | null>(null);
    const [poiReviewsLoading, setPoiReviewsLoading] = useState(false);
    const [isPointerInModal, setIsPointerInModal] = useState(false);
    const isPointerInModalRef = useRef(false);
    const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastFetchIdRef = useRef(0);

    isPointerInModalRef.current = isPointerInModal;

    const scheduleHide = useCallback(() => {
        if (hideDebounceRef.current) clearTimeout(hideDebounceRef.current);
        hideDebounceRef.current = setTimeout(() => {
            hideDebounceRef.current = null;
            if (!isPointerInModalRef.current) {
                setDisplayPoi(null);
                setPoiReviews(null);
                setPoiReviewsLoading(false);
            }
        }, 300);
    }, []);

    const cancelHide = useCallback(() => {
        if (hideDebounceRef.current) {
            clearTimeout(hideDebounceRef.current);
            hideDebounceRef.current = null;
        }
    }, []);

    const handlePoiHover = useCallback(
        (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }, point: { x: number; y: number }) => {
            cancelHide();
            const poi = { feature, lngLat, point };
            setDisplayPoi(poi);

            if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
            const name = String(
                feature.properties?.name ?? feature.properties?.name_en ?? feature.layer?.id ?? 'Lieu'
            ).trim();
            if (!name) return;

            fetchDebounceRef.current = setTimeout(() => {
                fetchDebounceRef.current = null;
                const fetchId = ++lastFetchIdRef.current;
                setPoiReviewsLoading(true);
                setPoiReviews(null);
                fetch(`/api/place-reviews?name=${encodeURIComponent(name)}&lat=${lngLat.lat}&lng=${lngLat.lng}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (fetchId !== lastFetchIdRef.current) return;
                        setPoiReviews({
                            name: data.name ?? name,
                            rating: data.rating ?? null,
                            reviews: data.reviews ?? [],
                            url: data.url ?? null,
                        });
                    })
                    .catch(() => {
                        if (fetchId !== lastFetchIdRef.current) return;
                        setPoiReviews({ name, rating: null, reviews: [], url: null });
                    })
                    .finally(() => {
                        if (fetchId !== lastFetchIdRef.current) return;
                        setPoiReviewsLoading(false);
                    });
            }, 400);
        },
        [cancelHide]
    );

    const handlePoiLeave = useCallback(() => {
        if (fetchDebounceRef.current) {
            clearTimeout(fetchDebounceRef.current);
            fetchDebounceRef.current = null;
        }
        scheduleHide();
    }, [scheduleHide]);

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
    const handleLogoutClick = () => { setIsConnected(false); setCurrentView('home'); };
    const handleLoginSuccess = () => { setIsConnected(true); setCurrentView('home'); };
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
                                padding={{ left: 400, top: 0, bottom: 0, right: 0 }}
                                onPoiClick={handlePoiClick}
                                onPoiHover={handlePoiHover}
                                onPoiLeave={handlePoiLeave}
                                locations={mapLocations}
                                // AJOUT DU PROP
                                onAirportSelect={handleAirportSelect}
                            />
                            <PoiReviewsModal
                                visible={!!displayPoi && (!!poiReviews || poiReviewsLoading)}
                                name={poiReviews?.name ?? (displayPoi ? String(displayPoi.feature.properties?.name ?? displayPoi.feature.properties?.name_en ?? displayPoi.feature.layer?.id ?? 'Lieu') : '')}
                                rating={poiReviews?.rating ?? null}
                                reviews={poiReviews?.reviews ?? []}
                                url={poiReviews?.url ?? null}
                                position={displayPoi?.point ?? { x: 0, y: 0 }}
                                loading={poiReviewsLoading}
                                leftPanelWidth={400}
                                onMouseEnter={() => {
                                    setIsPointerInModal(true);
                                    cancelHide();
                                }}
                                onMouseLeave={() => {
                                    setIsPointerInModal(false);
                                    scheduleHide();
                                }}
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

                            <div className="absolute bottom-4 right-4 z-20" ref={mapViewMenuRef}>
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
                        </div>

                        <div className="absolute left-0 top-0 bottom-0 w-1/3 flex flex-col overflow-hidden gap-4 p-4 z-10">
                            <Assistant onUpdateLocations={setMapLocations} />

                            <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
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
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}