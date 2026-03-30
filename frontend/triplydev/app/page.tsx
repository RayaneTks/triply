'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';
import { LandingHub } from '@/src/components/LandingHub/LandingHub';
import { Header } from '@/src/components/Header/Header';

// --- Chargement Dynamique des composants lourds ---
const WorldMap = dynamic(() => import('@/src/components/Map/Map').then(m => m.WorldMap), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#020617] animate-pulse" />
});
const TripCreationWizard = dynamic(() => import('@/src/features/trip-creation/TripCreationWizard').then(m => m.TripCreationWizard), { ssr: false });
const Assistant = dynamic(() => import('@/src/components/Assistant/Assistant'), { ssr: false });
const TuPreferes = dynamic(() => import('@/src/components/TuPreferes/TuPreferes').then(m => m.TuPreferes), { ssr: false });

const FlightSearchModal = dynamic(() => import('@/src/components/FlightSearchModal/FlightSearchModal').then(m => m.FlightSearchModal), { ssr: false });
const HotelSearchModal = dynamic(() => import('@/src/components/HotelSearchModal/HotelSearchModal').then(m => m.HotelSearchModal), { ssr: false });

import { mergeCityCenterWithHotels, spreadOverlappingPoints, type LocationPoint } from '@/src/utils/locations';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { AmadeusResponse } from '@/src/components/FlightResults/FlightResults';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { AmadeusHotelResponse } from '@/src/components/HotelResults/HotelResults';
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
import { useTripConfiguration } from '@/src/features/trip-creation/useTripConfiguration';
import { generateFlightRequest } from '@/utils/amadeus';
import { createTrip, validateTripApi } from '@/src/lib/trips-client';
import { useTripMap } from '@/src/hooks/useTripMap';
import { LoginWithMapBackground } from '@/src/components/LoginWithMapBackground/LoginWithMapBackground';
import {
    getDayActivityLabel,
    resolveDestinationLabels,
} from '@/src/utils/trip-planning';
import { buildManualFlightOffer, buildManualHotelOffer } from '@/src/features/trip-creation/manual-trip-offers';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';
import type { DayActivityPoi, ActivityRouteProfile } from '@/src/features/trip-creation/TripCreationWizard';

export default function Home() {
    const router = useRouter();
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const isDesktop = useMediaQuery(MEDIA_MIN_LG);

    // --- Etats de Navigation ---
    const [showLandingHub, setShowLandingHub] = useState(true);
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);

    // --- Etats Applicatifs ---
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showTuPreferes, setShowTuPreferes] = useState(false);
    const tripConfig = useTripConfiguration();
    const [selectedDay, setSelectedDay] = useState(1);
    const [wizardView, setWizardView] = useState<'plan' | 'activity'>('plan');
    const [planningMode, setPlanningModeState] = useState<PlanningMode | null>(null);
    const [dayActivitiesByDay, setDayActivitiesByDay] = useState<Record<number, DayActivityPoi[]>>({});
    const [legTransportByDay, setLegTransportByDay] = useState<Record<number, ActivityRouteProfile[]>>({});

    // --- Hook Carte ---
    const {
        mapStyle, setMapStyle,
        mapConfig, setMapConfig,
        mapPitch, setMapPitch,
        mapLocations, setMapLocations,
        selectedRouteType, setSelectedRouteType,
        dayRoutes,
        mapDisplaySegments,
        mapLocationsWithDayActivities
    } = useTripMap({
        mapboxToken: MAPBOX_TOKEN,
        selectedDay,
        wizardView,
        dayActivitiesByDay,
        legTransportByDay
    });

    // --- Modal States ---
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [validateTripModalOpen, setValidateTripModalOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    // Sélections (vol / hôtel) pour le wizard.
    // Note: les modals ne sont pas encore câblés ici pour la sélection réelle,
    // mais on doit fournir les props au `TripCreationWizard` pour que TypeScript compile.
    const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
    const [selectedFlightCarrierName, setSelectedFlightCarrierName] = useState<string>('');
    const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);

    // --- Sync Auth ---
    useEffect(() => {
        const syncAuth = async () => {
            const session = getStoredSession();
            if (!session?.token) return;
            try {
                const user = await me(session.token);
                saveSession({ token: session.token, user });
                setCurrentUser(user);
                setIsConnected(true);
                setIsSidebarCollapsed(true);
            } catch {
                clearSession();
                setIsConnected(false);
                setCurrentUser(null);
            }
        };
        void syncAuth();
    }, []);

    // --- Handlers ---
    const handleStartPlanning = (mode: 'ai' | 'manual') => {
        if (mode === 'ai') {
            handlePlanningModeChange('full_ai');
            setIsAssistantOpen(true);
        } else {
            handlePlanningModeChange('manual');
        }
        setShowLandingHub(false);
    };

    const handleExploreMap = () => {
        setShowLandingHub(false);
        setWizardView('activity');
    };

    const handlePlanningModeChange = (mode: PlanningMode) => {
        const uid = currentUser?.id || getStoredSession()?.user?.id;
        setPlanningModeState(mode);
        if (uid) savePlanningMode(mode, String(uid));
    };

    const handleLogout = async () => {
        const session = getStoredSession();
        if (session?.token) {
            try { await logout(session.token); } catch { /* ignore */ }
        }
        setIsMobileSidebarOpen(false);
        clearSession();
        setIsConnected(false);
        setCurrentUser(null);
        setCurrentView('home');
        setShowLandingHub(true);
    };

    const onFlightCardClick = () => setIsFlightModalOpen(true);
    const onRemoveFlight = () => {
        setSelectedFlight(null);
        setSelectedFlightCarrierName('');
    };
    const onHotelCardClick = () => setIsHotelModalOpen(true);
    const onRemoveHotel = () => {
        setSelectedHotel(null);
    };

    if (currentView === 'login') {
        return <LoginWithMapBackground 
            mapboxToken={MAPBOX_TOKEN} 
            onLoginSuccess={(user) => { 
                setIsConnected(true); 
                setCurrentUser(user);
                setCurrentView('home'); 
            }} 
            onBack={() => setCurrentView('home')} 
        />;
    }

    if (showLandingHub) {
        return <LandingHub 
            onStartPlanning={handleStartPlanning}
            onQuickSearch={(type) => { 
                setIsFlightModalOpen(type === 'flight'); 
                setIsHotelModalOpen(type === 'hotel'); 
                setShowLandingHub(false); 
            }}
            onExploreMap={handleExploreMap}
        />;
    }

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#020617] text-slate-100 lg:flex-row">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => { setIsMobileSidebarOpen(false); setCurrentView('login'); }}
                onLogoutClick={handleLogout}
                mobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <Header 
                    user={currentUser}
                    isConnected={isConnected}
                    onLoginClick={() => { setIsMobileSidebarOpen(false); setCurrentView('login'); }}
                    onLogoutClick={handleLogout}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                <main className="relative mt-16 flex flex-1 flex-col overflow-hidden lg:flex-row">
                    <AnimatePresence mode="wait">
                        {isConfigPanelOpen && (
                            <motion.div
                                initial={{ x: -300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                className={`relative z-40 flex w-full flex-col border-r border-white/10 bg-[#020617]/80 backdrop-blur-xl lg:w-96 ${isDesktop ? '' : 'absolute inset-0'}`}
                            >
                                <TripCreationWizard
                                    activeView={wizardView}
                                    onActiveViewChange={setWizardView}
                                    state={tripConfig}
                                    isConnected={isConnected}
                                    onLoginClick={() => setCurrentView('login')}
                                    planningMode={planningMode}
                                    onPlanningModeChange={handlePlanningModeChange}
                                    selectedDay={selectedDay}
                                    onSelectedDayChange={setSelectedDay}
                                    dayActivities={dayActivitiesByDay[selectedDay] ?? []}
                                    onOpenFlightSearch={() => setIsFlightModalOpen(true)}
                                    onCloseFlightSearch={() => setIsFlightModalOpen(false)}
                                    onFlightCardClick={onFlightCardClick}
                                    onRemoveFlight={onRemoveFlight}
                                    onOpenHotelSearch={() => setIsHotelModalOpen(true)}
                                    onCloseHotelSearch={() => setIsHotelModalOpen(false)}
                                    onHotelCardClick={onHotelCardClick}
                                    onRemoveHotel={onRemoveHotel}
                                    isFlightModalOpen={isFlightModalOpen}
                                    isHotelModalOpen={isHotelModalOpen}
                                    selectedFlight={selectedFlight}
                                    selectedFlightCarrierName={selectedFlightCarrierName}
                                    selectedHotel={selectedHotel}
                                    onOpenValidateTrip={() => setValidateTripModalOpen(true)}
                                    showPanelClose={!isDesktop}
                                    onClosePanel={() => setIsConfigPanelOpen(false)}
                                    planFormStep={0}
                                    onPlanFormStepChange={() => {}}
                                    planFormMaxVisited={0}
                                    onPlanFormMaxVisitedChange={() => {}}
                                    multiSelectOptions={[]}
                                    dietaryMultiSelectOptions={[]}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex-1 min-h-0">
                        <WorldMap
                            accessToken={MAPBOX_TOKEN}
                            initialLatitude={46.6}
                            initialLongitude={1.8}
                            initialZoom={5}
                            mapStyle={mapStyle}
                            mapConfig={mapConfig}
                            pitch={mapPitch}
                            locations={mapLocationsWithDayActivities}
                            routeSegments={mapDisplaySegments}
                        />
                        
                        {!isDesktop && !isConfigPanelOpen && (
                            <button
                                type="button"
                                onClick={() => setIsConfigPanelOpen(true)}
                                className="absolute left-4 top-4 z-30 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 shadow-lg backdrop-blur-sm hover:bg-white/10 active:scale-[0.98]"
                            >
                                Configurer le voyage
                            </button>
                        )}

                        <div
                            className={isDesktop
                                ? 'absolute bottom-6 right-6 z-30 flex flex-col items-end gap-4'
                                : 'fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 right-4 z-30 flex flex-col items-stretch gap-3'}
                        >
                            {isAssistantOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: 24 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={isDesktop
                                        ? 'h-[600px] w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/90 shadow-2xl backdrop-blur-2xl'
                                        : 'h-[80vh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#020617]/95 shadow-2xl backdrop-blur-2xl'}
                                >
                                    <Assistant 
                                        chatOwnerId={currentUser?.id ?? null}
                                        destination={tripConfig.arrivalCityName}
                                    />
                                </motion.div>
                            )}
                            <button 
                                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                                    isAssistantOpen 
                                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
                                    : "bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 hover:bg-cyan-400"
                                }`}
                            >
                                {isDesktop ? (isAssistantOpen ? "Fermer l'Assistant" : "Besoin d'aide ?") : (isAssistantOpen ? "Fermer" : "Besoin d'aide")}
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <TuPreferes visible={showTuPreferes} onSkip={() => setShowTuPreferes(false)} onComplete={() => setShowTuPreferes(false)} />
        </div>
    );
}
