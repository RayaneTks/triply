'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Slide } from '@/src/components/PowerPoint/Slide';
import { WorldMap } from '@/src/components/Map/Map';
import { SlideDefinition } from '@/src/components/PowerPoint/types';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { PoiReviewsModal } from '@/src/components/PoiReviewsModal/PoiReviewsModal';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { Button } from '@/src/components/Button/Button';
import {Login} from "@/src/components/Login/Login";
import Assistant from "@/src/components/Assistant/Assistant";

interface Coordinates {
    latitude: number;
    longitude: number;
}
interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
}

// Données de démonstration pour les slides
const getMockSlides = (
    travelerCount: number,
    budget: string,
    activityTime: string,
    arrivalDate: string,
    departureDate: string,
    arrivalTime: string,
    departureTime: string,
    selectedOptions: string[],
    departureCity: string,
    arrivalCity: string,
    travelDays: number,
    setTravelerCount: (count: number) => void,
    setBudget: (budget: string) => void,
    setActivityTime: (time: string) => void,
    setArrivalDate: (date: string) => void,
    setDepartureDate: (date: string) => void,
    setArrivalTime: (time: string) => void,
    setDepartureTime: (time: string) => void,
    setSelectedOptions: (options: string[]) => void,
    setDepartureCity: (city: string) => void,
    setArrivalCity: (city: string) => void,
    setTravelDays: (days: number) => void,
    multiSelectOptions: string[],
    mapboxToken: string
): SlideDefinition[] => [
    { 
        id: '1', 
        title: 'Paramètres de voyage', 
        content: (
            <div 
                className="flex flex-col h-full p-8 overflow-y-auto slide-content-scroll"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style>{`
                    .slide-content-scroll::-webkit-scrollbar {
                        display: none !important;
                    }
                `}</style>
                <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground, #ededed)' }}>Configurez votre voyage</h1>
                
                <div className="space-y-4 max-w-2xl">
                    {/* Ville de départ / Ville d'arrivée / Nombre de jours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CityAutocomplete
                            value={departureCity}
                            onChange={setDepartureCity}
                            label="Ville de départ"
                            placeholder="Ex. Paris, Lyon..."
                            mapboxToken={mapboxToken}
                            containerStyle={{ color: 'var(--foreground, #ededed)' }}
                        />
                        <CityAutocomplete
                            value={arrivalCity}
                            onChange={setArrivalCity}
                            label="Ville d'arrivée"
                            placeholder="Ex. Marseille, Bordeaux..."
                            mapboxToken={mapboxToken}
                            containerStyle={{ color: 'var(--foreground, #ededed)' }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Nombre de jours de voyage
                        </label>
                        <div
                            className="rounded-lg border py-2.5 px-4 w-full"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            <input
                                type="number"
                                min={1}
                                value={travelDays === 0 ? '' : travelDays}
                                onChange={(e) => setTravelDays(Math.max(1, parseInt(e.target.value, 10) || 0))}
                                placeholder="Ex. 3"
                                className="w-full bg-transparent focus:outline-none"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            />
                        </div>
                    </div>

                    {/* Nombre de voyageurs */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Nombre de voyageurs
                        </label>
                        <TravelerCounter
                            count={travelerCount}
                            onChange={setTravelerCount}
                            className="w-full"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            }}
                        />
                    </div>

                    {/* Budget maximum */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Budget maximum (€)
                        </label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full"
                             style={{ 
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                             }}>
                            <span className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>€</span>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0"
                                className="flex-grow bg-transparent focus:outline-none"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            />
                        </div>
                    </div>

                    {/* Temps par jour d'activité */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Temps par jour d'activité (heures)
                        </label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full"
                             style={{ 
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                             }}>
                            <input
                                type="number"
                                value={activityTime}
                                onChange={(e) => setActivityTime(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="24"
                                className="flex-grow bg-transparent focus:outline-none"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            />
                            <span className="ml-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>h</span>
                        </div>
                    </div>

                    {/* Date et heure d'arrivée/départ */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Date d'arrivée / Départ
                        </label>
                        <DateRangePicker
                            startDate={arrivalDate}
                            endDate={departureDate}
                            onDatesChange={(start, end) => {
                                setArrivalDate(start);
                                setDepartureDate(end);
                            }}
                            className="w-full mb-2"
                            containerStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            }}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <div className="flex-1 min-w-0">
                                <TimePicker
                                    value={arrivalTime}
                                    onChange={setArrivalTime}
                                    label="Heure d'arrivée"
                                    containerStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <TimePicker
                                    value={departureTime}
                                    onChange={setDepartureTime}
                                    label="Heure de départ"
                                    containerStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MultiSelect */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Préférences
                        </label>
                        <MultiSelect
                            options={multiSelectOptions}
                            selectedValues={selectedOptions}
                            onChange={setSelectedOptions}
                            placeholder="Sélectionner des préférences..."
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        )
    },
    { 
        id: '2', 
        title: 'Architecture', 
        content: (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground, #ededed)' }}>Architecture</h1>
                <p className="text-lg max-w-md text-center" style={{ color: 'var(--foreground, #ededed)' }}>
                    Vue d'ensemble de l'architecture du système.
          </p>
        </div>
        )
    },
];

export default function Home() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [message, setMessage] = useState('');

    const [mapLocations, setMapLocations] = useState<any[]>([]);
    
    // États pour la première slide
    const [travelerCount, setTravelerCount] = useState(1);
    const [budget, setBudget] = useState('');
    const [activityTime, setActivityTime] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [departureCity, setDepartureCity] = useState('');
    const [arrivalCity, setArrivalCity] = useState('');
    const [travelDays, setTravelDays] = useState<number>(3);

    const [isConnected, setIsConnected] = useState(false);
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');

    const [selectedPoi, setSelectedPoi] = useState<MapboxPoiFeature | null>(null);

    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/standard');
    const [mapConfig, setMapConfig] = useState<{ lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' }>({ lightPreset: 'day' });
    const [mapPitch, setMapPitch] = useState<number>(0);
    const [mapViewMenuOpen, setMapViewMenuOpen] = useState(false);
    const mapViewMenuRef = useRef<HTMLDivElement>(null);

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

    // POI hover + modal avis Google : état affiché (conservé pour permettre de déplacer la souris vers la modal)
    const [displayPoi, setDisplayPoi] = useState<{
        feature: MapboxPoiFeature;
        lngLat: { lng: number; lat: number };
        point: { x: number; y: number };
    } | null>(null);
    const [poiReviews, setPoiReviews] = useState<{
        name: string;
        rating: number | null;
        reviews: { author_name: string; rating: number; text: string; relative_time_description: string }[];
        url: string | null;
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

    const multiSelectOptions = [
        'Petit déjeuner inclus',
        'Proche du centre ville',
        'Spa/piscine',
        'Plage',
        'Équipement',
        'Retour positif',
        'Hôtel de luxe',
        'Animaux domestiques',
        'Réservé aux adultes',
        'LGBTQIA+ friendly'
    ];

    const handleSubmitMessage = () => {
        if (message.trim()) {
            // TODO: Implémenter la logique d'envoi du message
            console.log('Message envoyé:', message);
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmitMessage();
        }
    };

    const handleLoginClick = () => {
        setCurrentView('login');
    };

    const handleLogoutClick = () => {
        // plus tard : signOut()
        setIsConnected(false);
        setCurrentView('home');
    };

    const handleLoginSuccess = () => {
        setIsConnected(true);
        setCurrentView('home');
    };

    const handleBackToHome = () => {
        setCurrentView('home');
    };

    // Token Mapbox (utilisé pour les slides et la carte)
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVuY2FuZ2F1YmVydCIsImEiOiJjbWs1em50ZjgwaHc3M2VxczYweWR2djBwIn0.pwM2awFdHHSRsQeYiTtkXA';

    // Générer les slides avec les états actuels
    const mockSlides = getMockSlides(
        travelerCount,
        budget,
        activityTime,
        arrivalDate,
        departureDate,
        arrivalTime,
        departureTime,
        selectedOptions,
        departureCity,
        arrivalCity,
        travelDays,
        setTravelerCount,
        setBudget,
        setActivityTime,
        setArrivalDate,
        setDepartureDate,
        setArrivalTime,
        setDepartureTime,
        setSelectedOptions,
        setDepartureCity,
        setArrivalCity,
        setTravelDays,
        multiSelectOptions,
        MAPBOX_TOKEN
    );

    const handleNext = () => {
        if (currentSlideIndex < mockSlides.length - 1) {
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

    const handleJumpTo = (index: number) => {
        const direction = index > currentSlideIndex ? 1 : -1;
        setSlideDirection(direction);
        setCurrentSlideIndex(index);
    };

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            {/* Sidebar à gauche */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            {/* Contenu principal */}
            <div className="flex-1 flex overflow-hidden min-w-0 relative">
                {currentView === 'login' && (
                    <Login
                        onLoginSuccess={handleLoginSuccess}
                        onBack={handleBackToHome}
                    />
                )}

                {currentView === 'home' && (
                    <>
                {/* Map en arrière-plan (prend tout l'espace avec centre décalé) */}
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

                    {/* Bouton Changer de vue (dark/light/satellite/2D/3D) en bas à droite */}
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
                                        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            Style
                                        </span>
                                    </div>
                                    {[
                                        { id: 'dark', label: 'Sombre', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'night' as const } },
                                        { id: 'light', label: 'Clair', style: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'day' as const } },
                                        { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/standard-satellite', config: { lightPreset: 'day' as const } },
                                    ].map(({ id, label, style, config }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                setMapStyle(style);
                                                setMapConfig(config);
                                                setMapPitch(0);
                                                setMapViewMenuOpen(false);
                                            }}
                                            className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
                                            style={{ color: 'var(--foreground, #ededed)' }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                    <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            Projection
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMapPitch(0);
                                            setMapViewMenuOpen(false);
                                        }}
                                        className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
                                        style={{ color: 'var(--foreground, #ededed)' }}
                                    >
                                        Vue 2D
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMapPitch(60);
                                            setMapViewMenuOpen(false);
                                        }}
                                        className="w-full text-left py-3 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
                                        style={{ color: 'var(--foreground, #ededed)' }}
                                    >
                                        Vue 3D
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Div mère contenant LLM et Slide - positionnée en overlay sur la map */}
                        <div className="absolute left-0 top-0 bottom-0 w-1/3 flex flex-col overflow-hidden gap-4 p-4 z-10">
                            <Assistant onUpdateLocations={setMapLocations} />

                            {/* Slide en dessous du LLM */}
                            <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                                <AnimatePresence mode="wait" custom={slideDirection}>
                                    <Slide
                                        key={currentSlideIndex}
                                        direction={slideDirection}
                                        onNext={handleNext}
                                        onPrev={handlePrev}
                                        canNext={currentSlideIndex < mockSlides.length - 1}
                                        canPrev={currentSlideIndex > 0}
                                    >
                                        {mockSlides[currentSlideIndex]?.content}
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
