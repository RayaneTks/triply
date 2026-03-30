'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';
import { LandingHub } from '@/src/components/LandingHub/LandingHub';

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

export default function Home() {
    const router = useRouter();
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    // --- Etats de Navigation ---
    const [showLandingHub, setShowLandingHub] = useState(true);
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);

    // --- Etats Applicatifs ---
    const [isConnected, setIsConnected] = useState(false);
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

    // --- Sync Auth ---
    useEffect(() => {
        const syncAuth = async () => {
            const session = getStoredSession();
            if (!session?.token) return;
            try {
                const user = await me(session.token);
                saveSession({ token: session.token, user });
                setIsConnected(true);
                setIsSidebarCollapsed(true);
            } catch {
                clearSession();
                setIsConnected(false);
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
        const uid = getStoredSession()?.user?.id;
        setPlanningModeState(mode);
        if (uid) savePlanningMode(mode, uid);
    };

    if (currentView === 'login') {
        return <LoginWithMapBackground 
            mapboxToken={MAPBOX_TOKEN} 
            onLoginSuccess={() => { setIsConnected(true); setCurrentView('home'); }} 
            onBack={() => setCurrentView('home')} 
        />;
    }

    if (showLandingHub) {
        return <LandingHub 
            onStartPlanning={handleStartPlanning}
            onQuickSearch={(type) => { setIsFlightModalOpen(type === 'flight'); setIsHotelModalOpen(type === 'hotel'); setShowLandingHub(false); }}
            onExploreMap={handleExploreMap}
        />;
    }

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-[#020617] text-slate-100 lg:flex-row">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => setCurrentView('login')}
                onLogoutClick={() => { clearSession(); setIsConnected(false); }}
            />

            <main className="relative flex flex-1 overflow-hidden lg:flex-row">
                <AnimatePresence mode="wait">
                    {isConfigPanelOpen && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="relative z-40 flex w-full flex-col border-r border-white/10 bg-[#020617]/80 backdrop-blur-xl lg:w-96"
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
                                onOpenHotelSearch={() => setIsHotelModalOpen(true)}
                                onOpenValidateTrip={() => setValidateTripModalOpen(true)}
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

                <div className="relative flex-1">
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
                    
                    <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-4">
                        {isAssistantOpen && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="h-[600px] w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/90 shadow-2xl backdrop-blur-2xl"
                            >
                                <Assistant 
                                    chatOwnerId={getStoredSession()?.user?.id ?? null}
                                    destination={tripConfig.arrivalCityName}
                                />
                            </motion.div>
                        )}
                        <Button 
                            label={isAssistantOpen ? "Fermer l'Assistant" : "Besoin d'aide ?"} 
                            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                            variant={isAssistantOpen ? "dark" : "primary"}
                        />
                    </div>
                </div>
            </main>

            <TuPreferes visible={showTuPreferes} onSkip={() => setShowTuPreferes(false)} onComplete={() => setShowTuPreferes(false)} />
        </div>
    );
}
