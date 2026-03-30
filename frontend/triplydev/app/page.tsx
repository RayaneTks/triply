'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Map, MessageSquareMore, PencilLine, X } from 'lucide-react';
import { AppShell } from '@/src/components/AppShell/AppShell';
import { ContextSummaryCard } from '@/src/components/GuidedUI/ContextSummaryCard';
import { InlineStatus } from '@/src/components/GuidedUI/InlineStatus';
import { LandingHub, type LandingGuidanceMode } from '@/src/components/LandingHub/LandingHub';
import { clearSession, getStoredSession, logout, me, saveSession, type AuthUser } from '@/src/lib/auth-client';
import { applyTripConfigPartial, loadTripConfigDraft, saveTripConfigDraft, type TripConfigDraftV1 } from '@/src/features/trip-creation/trip-config-draft';
import {
    clearPlanningModeStorage,
    getPlanningModeBadge,
    getPlanningModeHeadline,
    guidanceModeToPlanningMode,
    loadStoredPlanningMode,
    savePlanningMode,
    type PlanningMode,
} from '@/src/features/trip-creation/planning-mode';
import { resolveBookingStepChoice, type BookingStepChoice } from '@/src/features/trip-creation/booking-step';
import { useTripConfiguration } from '@/src/features/trip-creation/useTripConfiguration';
import { useTripMap } from '@/src/hooks/useTripMap';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';
import { usePwaInstall } from '@/src/hooks/usePwaInstall';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { AmadeusResponse } from '@/src/components/FlightResults/FlightResults';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { AmadeusHotelResponse } from '@/src/components/HotelResults/HotelResults';
import type { DayActivityPoi, ActivityRouteProfile } from '@/src/features/trip-creation/TripCreationWizard';
import { generateFlightRequest } from '@/utils/amadeus';

const WorldMap = dynamic(() => import('@/src/components/Map/Map').then((m) => m.WorldMap), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-[2rem] bg-white/40" />,
});
const TripCreationWizard = dynamic(() => import('@/src/features/trip-creation/TripCreationWizard').then((m) => m.TripCreationWizard), { ssr: false });
const Assistant = dynamic(() => import('@/src/components/Assistant/Assistant'), { ssr: false });
const TuPreferes = dynamic(() => import('@/src/components/TuPreferes/TuPreferes').then((m) => m.TuPreferes), { ssr: false });
const LoginWithMapBackground = dynamic(() => import('@/src/components/LoginWithMapBackground/LoginWithMapBackground').then((m) => m.LoginWithMapBackground), { ssr: false });
const FlightSearchModal = dynamic(() => import('@/src/components/FlightSearchModal/FlightSearchModal').then((m) => m.FlightSearchModal), { ssr: false });
const HotelSearchModal = dynamic(() => import('@/src/components/HotelSearchModal/HotelSearchModal').then((m) => m.HotelSearchModal), { ssr: false });

function formatDateLabel(value: string): string {
    if (!value) return 'Dates flexibles';
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return 'Dates flexibles';
    return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function buildDraftSummary(draft: TripConfigDraftV1 | null) {
    if (!draft) return null;
    return {
        destination: draft.trip.arrivalCityName || draft.trip.arrivalCity || 'Destination a definir',
        travelDates: draft.trip.outboundDate ? `${formatDateLabel(draft.trip.outboundDate)} -> ${formatDateLabel(draft.trip.returnDate || '')}` : 'Dates flexibles',
        budget: draft.trip.budget ? `${draft.trip.budget} EUR max` : 'Budget a definir',
    };
}

type FeedbackNotice = {
    tone: 'success' | 'error' | 'saving' | 'info';
    message: string;
};

export default function Home() {
    const router = useRouter();
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const isDesktop = useMediaQuery(MEDIA_MIN_LG);
    const installState = usePwaInstall();
    const [entryStage, setEntryStage] = useState<'hero' | 'guidance' | 'planner'>('hero');
    const [currentView, setCurrentView] = useState<'home' | 'login'>('home');
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showTuPreferes, setShowTuPreferes] = useState(false);
    const [showMapSheet, setShowMapSheet] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [storedDraft, setStoredDraft] = useState<TripConfigDraftV1 | null>(null);
    const [storedPlanningMode, setStoredPlanningMode] = useState<PlanningMode | null>(null);
    const tripConfig = useTripConfiguration();
    const [selectedDay, setSelectedDay] = useState(1);
    const [wizardView, setWizardView] = useState<'plan' | 'activity'>('plan');
    const [planningMode, setPlanningModeState] = useState<PlanningMode | null>(null);
    const [dayActivitiesByDay] = useState<Record<number, DayActivityPoi[]>>({});
    const [legTransportByDay] = useState<Record<number, ActivityRouteProfile[]>>({});
    const [planFormStep, setPlanFormStep] = useState(0);
    const [planFormMaxVisited, setPlanFormMaxVisited] = useState(0);
    const [flightChoice, setFlightChoice] = useState<BookingStepChoice>('later');
    const [hotelChoice, setHotelChoice] = useState<BookingStepChoice>('later');
    const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
    const [selectedFlightCarrierName, setSelectedFlightCarrierName] = useState('');
    const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [flightSearchBudget, setFlightSearchBudget] = useState('');
    const [hotelSearchBudget, setHotelSearchBudget] = useState('');
    const [isFlightSearchLoading, setIsFlightSearchLoading] = useState(false);
    const [isHotelSearchLoading, setIsHotelSearchLoading] = useState(false);
    const [flightApiResponse, setFlightApiResponse] = useState<(AmadeusResponse | { error?: string; details?: string }) | null>(null);
    const [hotelApiResponse, setHotelApiResponse] = useState<(AmadeusHotelResponse | { error?: string; details?: string }) | null>(null);
    const [hotelSearchOptions, setHotelSearchOptions] = useState<string[]>([]);
    const [hotelMealRegime, setHotelMealRegime] = useState('');
    const [feedbackNotice, setFeedbackNotice] = useState<FeedbackNotice | null>(null);
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);

    const mapState = useTripMap({ mapboxToken: MAPBOX_TOKEN, selectedDay, wizardView, dayActivitiesByDay, legTransportByDay });

    useEffect(() => {
        const syncAuth = async () => {
            const session = getStoredSession();
            if (!session?.token) return;
            try {
                const user = await me(session.token);
                saveSession({ token: session.token, user });
                setCurrentUser(user);
                setIsConnected(true);
            } catch {
                clearSession();
                setIsConnected(false);
                setCurrentUser(null);
            }
        };
        void syncAuth();
    }, []);

    useEffect(() => {
        const ownerId = currentUser?.id ?? getStoredSession()?.user?.id ?? null;
        const sync = () => {
            if (ownerId == null) {
                setStoredPlanningMode(null);
                setStoredDraft(null);
                return;
            }
            setStoredPlanningMode(loadStoredPlanningMode(ownerId));
            setStoredDraft(loadTripConfigDraft(ownerId));
        };
        const timer = window.setTimeout(sync, 0);
        return () => window.clearTimeout(timer);
    }, [currentUser?.id]);

    useEffect(() => {
        if (entryStage !== 'planner') return;
        const ownerId = currentUser?.id ?? getStoredSession()?.user?.id ?? null;
        saveTripConfigDraft(ownerId, {
            wizardView,
            selectedDay,
            trip: {
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
            },
            planFormStep,
            planFormMaxVisited,
        });
        setLastDraftSavedAt(Date.now());
    }, [
        currentUser?.id,
        entryStage,
        wizardView,
        selectedDay,
        planFormStep,
        planFormMaxVisited,
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
    ]);

    useEffect(() => {
        if (!feedbackNotice) return;
        const timer = window.setTimeout(() => setFeedbackNotice(null), 4200);
        return () => window.clearTimeout(timer);
    }, [feedbackNotice]);

    const applyDraft = (draft: TripConfigDraftV1 | null, mode: PlanningMode | null) => {
        if (!draft) return;
        startTransition(() => {
            applyTripConfigPartial(draft.trip, tripConfig);
            setWizardView(draft.wizardView ?? 'plan');
            setSelectedDay(draft.selectedDay ?? 1);
            setPlanFormStep(draft.planFormStep ?? 0);
            setPlanFormMaxVisited(draft.planFormMaxVisited ?? 0);
            setPlanningModeState(mode ?? 'semi_ai');
            setFlightChoice(resolveBookingStepChoice({
                hasManualEntry: Boolean(draft.trip.manualFlightEntry || draft.trip.manualFlightAirline || draft.trip.manualFlightNumber || draft.trip.manualFlightNumberReturn),
                hasSelection: false,
            }));
            setHotelChoice(resolveBookingStepChoice({
                hasManualEntry: Boolean(draft.trip.manualHotelEntry || draft.trip.manualHotelName || draft.trip.manualHotelAddress),
                hasSelection: false,
            }));
            setSelectedFlight(null);
            setSelectedFlightCarrierName('');
            setSelectedHotel(null);
            setEntryStage('planner');
        });
    };

    const handlePlanningModeChange = (mode: PlanningMode) => {
        setPlanningModeState(mode);
        const ownerId = currentUser?.id ?? getStoredSession()?.user?.id ?? null;
        if (ownerId != null) {
            savePlanningMode(mode, ownerId);
            setStoredPlanningMode(mode);
        }
    };

    const handleChooseGuidance = (mode: LandingGuidanceMode) => {
        handlePlanningModeChange(guidanceModeToPlanningMode(mode));
        setPlanFormStep(0);
        setPlanFormMaxVisited(0);
        setWizardView('plan');
        setFlightChoice('later');
        setHotelChoice('later');
        setSelectedFlight(null);
        setSelectedFlightCarrierName('');
        setSelectedHotel(null);
        setFlightApiResponse(null);
        setHotelApiResponse(null);
        setEntryStage('planner');
        setIsAssistantOpen(mode === 'guided');
    };

    const handleLogout = async () => {
        const session = getStoredSession();
        if (session?.token) {
            try { await logout(session.token); } catch {}
        }
        clearSession();
        clearPlanningModeStorage(currentUser?.id ?? null);
        setCurrentUser(null);
        setIsConnected(false);
        setPlanningModeState(null);
        setStoredPlanningMode(null);
        setStoredDraft(null);
        setEntryStage('hero');
        setCurrentView('home');
        setIsAssistantOpen(false);
        setShowMapSheet(false);
        setFlightChoice('later');
        setHotelChoice('later');
        setSelectedFlight(null);
        setSelectedFlightCarrierName('');
        setSelectedHotel(null);
        setFeedbackNotice(null);
    };

    const handleFlightChoiceChange = (choice: BookingStepChoice) => {
        setFlightChoice(choice);
        if (choice === 'existing') {
            tripConfig.setManualFlightEntry(true);
            setSelectedFlight(null);
            setSelectedFlightCarrierName('');
            setFlightApiResponse(null);
            return;
        }

        tripConfig.setManualFlightEntry(false);
        tripConfig.setManualFlightAirline('');
        tripConfig.setManualFlightNumber('');
        tripConfig.setManualFlightNumberReturn('');
        if (choice === 'triply_search') {
            setIsFlightModalOpen(true);
            return;
        }

        setSelectedFlight(null);
        setSelectedFlightCarrierName('');
        setFlightApiResponse(null);
    };

    const handleHotelChoiceChange = (choice: BookingStepChoice) => {
        setHotelChoice(choice);
        if (choice === 'existing') {
            tripConfig.setManualHotelEntry(true);
            setSelectedHotel(null);
            setHotelApiResponse(null);
            return;
        }

        tripConfig.setManualHotelEntry(false);
        tripConfig.setManualHotelName('');
        tripConfig.setManualHotelAddress('');
        tripConfig.setManualHotelCheckIn('');
        tripConfig.setManualHotelCheckOut('');
        if (choice === 'triply_search') {
            setIsHotelModalOpen(true);
            return;
        }

        setSelectedHotel(null);
        setHotelApiResponse(null);
    };

    const handleFlightSearch = async () => {
        setIsFlightSearchLoading(true);
        setFeedbackNotice({ tone: 'saving', message: 'Triply cherche les vols les plus coherents avec votre voyage.' });

        const payload = generateFlightRequest(
            tripConfig.departureCity,
            tripConfig.arrivalCity,
            tripConfig.outboundDate,
            tripConfig.returnDate,
            tripConfig.travelerCount,
            flightSearchBudget,
            tripConfig.outboundDepartureTime,
            tripConfig.returnDepartureTime
        );

        try {
            const response = await fetch('/api/flights/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            setFlightApiResponse(data);
            if ('data' in data) {
                setFeedbackNotice({ tone: 'info', message: 'Choisissez un vol pour revenir automatiquement au parcours.' });
            } else {
                setFeedbackNotice({ tone: 'error', message: data?.error || 'Aucun vol exploitable pour le moment. Ajustez dates, budget ou destination.' });
            }
        } catch (error) {
            setFlightApiResponse({ error: "Erreur lors de l'appel API", details: String(error) });
            setFeedbackNotice({ tone: 'error', message: "La recherche de vols n'a pas abouti. Reessayez dans un instant." });
        } finally {
            setIsFlightSearchLoading(false);
        }
    };

    const handleHotelSearch = async () => {
        const city = tripConfig.arrivalCity || tripConfig.departureCity;
        if (!city) {
            setHotelApiResponse({ error: 'Veuillez selectionner une destination.' });
            setFeedbackNotice({ tone: 'error', message: 'Ajoutez une destination avant de lancer la recherche d hebergement.' });
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const checkIn = tripConfig.outboundDate || today;
        const checkOut = tripConfig.returnDate || tomorrow;

        setIsHotelSearchLoading(true);
        setFeedbackNotice({ tone: 'saving', message: 'Triply cherche des hebergements adaptes a votre periode.' });

        try {
            const response = await fetch('/api/hotels/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cityCode: city,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    adults: tripConfig.travelerCount,
                    roomQuantity: 1,
                    maxPrice: hotelSearchBudget ? Number.parseInt(hotelSearchBudget, 10) : undefined,
                    mealRegime: hotelMealRegime || undefined,
                    preferences: hotelSearchOptions,
                }),
            });
            const data = await response.json();
            setHotelApiResponse(data);
            if ('data' in data) {
                setFeedbackNotice({ tone: 'info', message: 'Choisissez un hebergement pour reprendre votre parcours.' });
            } else {
                setFeedbackNotice({ tone: 'error', message: data?.error || 'Aucun hebergement exploitable pour le moment. Ajustez budget ou dates.' });
            }
        } catch (error) {
            setHotelApiResponse({ error: "Erreur lors de l'appel API", details: String(error) });
            setFeedbackNotice({ tone: 'error', message: "La recherche d hebergement n'a pas abouti. Reessayez dans un instant." });
        } finally {
            setIsHotelSearchLoading(false);
        }
    };

    const handleFlightSelect = (offer: FlightOffer, carrierName: string) => {
        setSelectedFlight(offer);
        setSelectedFlightCarrierName(carrierName);
        setFlightChoice('triply_search');
        tripConfig.setManualFlightEntry(false);
        setIsFlightModalOpen(false);
        setPlanFormStep(3);
        setPlanFormMaxVisited((value) => Math.max(value, 3));
        setFeedbackNotice({ tone: 'success', message: 'Vol ajoute. Vous revenez au parcours avec ce choix en memoire.' });
    };

    const handleHotelSelect = (offer: HotelOffer) => {
        setSelectedHotel(offer);
        setHotelChoice('triply_search');
        tripConfig.setManualHotelEntry(false);
        tripConfig.setArrivalCity(offer.cityCode);
        tripConfig.setOutboundDate(offer.checkInDate);
        tripConfig.setReturnDate(offer.checkOutDate);
        if (offer.guests?.adults) {
            tripConfig.setTravelerCount(offer.guests.adults);
        }
        setIsHotelModalOpen(false);
        setPlanFormStep(4);
        setPlanFormMaxVisited((value) => Math.max(value, 4));
        setFeedbackNotice({ tone: 'success', message: 'Hebergement ajoute. Vous pouvez continuer sans quitter le flow.' });
    };

    const handleRemoveFlight = () => {
        setSelectedFlight(null);
        setSelectedFlightCarrierName('');
        setFlightChoice('triply_search');
        setFeedbackNotice({ tone: 'info', message: 'Vol retire. Vous pouvez relancer une recherche ou passer cette etape.' });
    };

    const handleRemoveHotel = () => {
        setSelectedHotel(null);
        setHotelChoice('triply_search');
        setFeedbackNotice({ tone: 'info', message: 'Hebergement retire. Vous pouvez en rechercher un autre ou continuer plus tard.' });
    };

    const headline = useMemo(() => getPlanningModeHeadline(planningMode), [planningMode]);
    const draftSummary = useMemo(() => buildDraftSummary(storedDraft), [storedDraft]);
    const hasMapContext = wizardView === 'activity' || mapState.mapLocationsWithDayActivities.length > 0;
    const draftStatusMessage = useMemo(() => {
        if (!lastDraftSavedAt || entryStage !== 'planner') return null;
        const seconds = Math.max(1, Math.round((Date.now() - lastDraftSavedAt) / 1000));
        return seconds <= 3 ? 'Brouillon enregistre a l instant.' : `Brouillon enregistre il y a ${seconds} secondes.`;
    }, [entryStage, lastDraftSavedAt]);
    const cards = useMemo(() => [
        { label: 'Accompagnement', value: getPlanningModeBadge(planningMode) },
        { label: 'Destination', value: tripConfig.arrivalCityName || tripConfig.arrivalCity || 'A definir' },
        { label: 'Dates', value: tripConfig.outboundDate ? `${formatDateLabel(tripConfig.outboundDate)} -> ${formatDateLabel(tripConfig.returnDate)}` : 'Dates flexibles' },
        { label: 'Budget', value: tripConfig.budget ? `${tripConfig.budget} EUR max` : 'Budget non saisi' },
    ], [planningMode, tripConfig.arrivalCity, tripConfig.arrivalCityName, tripConfig.budget, tripConfig.outboundDate, tripConfig.returnDate]);
    const searchSummaryItems = useMemo(
        () => [
            { label: 'Transport', value: selectedFlight ? `${selectedFlightCarrierName || 'Vol choisi'} confirme` : flightChoice === 'existing' ? 'Reservation deja renseignee' : flightChoice === 'triply_search' ? 'Recherche Triply active' : 'A completer plus tard' },
            { label: 'Hebergement', value: selectedHotel ? `${selectedHotel.hotelName} selectionne` : hotelChoice === 'existing' ? 'Reservation deja renseignee' : hotelChoice === 'triply_search' ? 'Recherche Triply active' : 'A completer plus tard' },
            { label: 'Etape en cours', value: wizardView === 'plan' ? 'Preparation du voyage' : 'Organisation des journees' },
            { label: 'Suite logique', value: wizardView === 'plan' ? 'Finaliser les essentiels puis demander une proposition.' : 'Verifier les trajets et valider les activites.' },
        ],
        [flightChoice, hotelChoice, selectedFlight, selectedFlightCarrierName, selectedHotel, wizardView]
    );

    const shellActions = (
        <div className="flex items-center gap-2">
            {!isDesktop && hasMapContext ? (
                <button type="button" onClick={() => setShowMapSheet(true)} aria-label="Voir la carte" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white/82 px-4 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-white">
                    <Map size={17} />
                    <span className="hidden sm:inline">Voir la carte</span>
                </button>
            ) : null}
            <button type="button" onClick={() => setIsAssistantOpen((v) => !v)} aria-label={isAssistantOpen ? 'Fermer l assistant' : 'Ouvrir l assistant'} className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-[var(--shadow-sm)] transition-colors ${isAssistantOpen ? 'border border-[var(--app-border)] bg-white/85 text-[color:var(--foreground)] hover:bg-white' : 'bg-[var(--primary)] text-white hover:bg-[var(--secondary)]'}`}>
                <MessageSquareMore size={17} />
                <span className="hidden sm:inline">{isAssistantOpen ? 'Fermer l assistant' : 'Assistant'}</span>
            </button>
        </div>
    );

    if (currentView === 'login') {
        return <LoginWithMapBackground mapboxToken={MAPBOX_TOKEN} onLoginSuccess={(user, isNewUser) => { setIsConnected(true); setCurrentUser(user); setCurrentView('home'); setShowTuPreferes(Boolean(isNewUser)); }} onBack={() => setCurrentView('home')} />;
    }

    if (entryStage !== 'planner') {
        return (
            <AppShell activeTab="planifier" title="Planifier un voyage" subtitle="Vols, hotels, activites et budget." user={currentUser} isConnected={isConnected} onLoginClick={() => setCurrentView('login')} onLogoutClick={handleLogout}>
                <LandingHub stage={entryStage} hasDraft={Boolean(storedDraft)} draftSummary={draftSummary} onPrimaryAction={() => setEntryStage('guidance')} onSelectGuidance={handleChooseGuidance} onResumeDraft={storedDraft ? () => applyDraft(storedDraft, storedPlanningMode) : undefined} onLoginClick={() => setCurrentView('login')} onViewTrips={() => router.push('/voyages')} isConnected={isConnected} canInstall={installState.canInstall} isStandalone={installState.isStandalone} platformHint={installState.platformHint} onInstall={() => void installState.promptInstall()} />
            </AppShell>
        );
    }

    return (
        <AppShell activeTab="planifier" title={tripConfig.arrivalCityName ? `Cap sur ${tripConfig.arrivalCityName}` : 'Nouveau voyage'} subtitle="Votre voyage, en un seul endroit." user={currentUser} isConnected={isConnected} onLoginClick={() => setCurrentView('login')} onLogoutClick={handleLogout} actions={shellActions}>
            <div className="space-y-5">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => <article key={card.label} className="rounded-[1.6rem] border border-[var(--app-border)] bg-white/82 p-4 shadow-[var(--shadow-sm)]"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{card.label}</p><p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{card.value}</p></article>)}
                </section>

                {feedbackNotice || draftStatusMessage ? (
                    <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {feedbackNotice ? <InlineStatus tone={feedbackNotice.tone} message={feedbackNotice.message} className="w-full sm:w-auto" /> : null}
                        {draftStatusMessage ? <InlineStatus tone="info" message={draftStatusMessage} className="w-full sm:w-auto" /> : null}
                    </section>
                ) : null}

                <section className="grid gap-4 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
                    <div className="triply-dark-panel overflow-hidden rounded-[2rem]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4 text-white">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Voyage</p>
                                <h2 className="mt-1 text-xl font-semibold">{tripConfig.arrivalCityName || headline}</h2>
                                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">Remplissez l essentiel, puis lancez votre proposition.</p>
                            </div>
                            <button type="button" onClick={() => setEntryStage('hero')} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-medium text-white transition-colors hover:bg-white/12">
                                <PencilLine size={16} />
                                Revenir a l accueil
                            </button>
                        </div>

                        <TripCreationWizard
                            activeView={wizardView}
                            onActiveViewChange={setWizardView}
                            state={tripConfig}
                            isConnected={isConnected}
                            onLoginClick={() => setCurrentView('login')}
                            planningMode={planningMode}
                            onPlanningModeChange={handlePlanningModeChange}
                            onBackToPlanningMode={() => { clearPlanningModeStorage(currentUser?.id ?? null); setPlanningModeState(null); setStoredPlanningMode(null); setEntryStage('guidance'); }}
                            selectedDay={selectedDay}
                            onSelectedDayChange={setSelectedDay}
                            travelDays={tripConfig.travelDays}
                            dayActivities={dayActivitiesByDay[selectedDay] ?? []}
                            selectedRouteType={mapState.selectedRouteType}
                            onSelectRouteType={mapState.setSelectedRouteType}
                            dayRoutes={mapState.dayRoutes}
                            legTransportModes={legTransportByDay[selectedDay] ?? []}
                            onOpenFlightSearch={() => { setPlanFormStep(3); setPlanFormMaxVisited((v) => Math.max(v, 3)); setFlightChoice('triply_search'); tripConfig.setManualFlightEntry(false); setIsFlightModalOpen(true); }}
                            onCloseFlightSearch={() => setIsFlightModalOpen(false)}
                            flightChoice={flightChoice}
                            onFlightChoiceChange={handleFlightChoiceChange}
                            onFlightCardClick={() => { setPlanFormStep(3); setPlanFormMaxVisited((v) => Math.max(v, 3)); setIsFlightModalOpen(true); }}
                            onRemoveFlight={handleRemoveFlight}
                            onOpenHotelSearch={() => { setPlanFormStep(4); setPlanFormMaxVisited((v) => Math.max(v, 4)); setHotelChoice('triply_search'); tripConfig.setManualHotelEntry(false); setIsHotelModalOpen(true); }}
                            onCloseHotelSearch={() => setIsHotelModalOpen(false)}
                            hotelChoice={hotelChoice}
                            onHotelChoiceChange={handleHotelChoiceChange}
                            onHotelCardClick={() => { setPlanFormStep(4); setPlanFormMaxVisited((v) => Math.max(v, 4)); setIsHotelModalOpen(true); }}
                            onRemoveHotel={handleRemoveHotel}
                            isFlightModalOpen={isFlightModalOpen}
                            isHotelModalOpen={isHotelModalOpen}
                            selectedFlight={selectedFlight}
                            selectedFlightCarrierName={selectedFlightCarrierName}
                            selectedHotel={selectedHotel}
                            onComplete={() => { setWizardView('activity'); setIsAssistantOpen(true); }}
                            planFormStep={planFormStep}
                            onPlanFormStepChange={setPlanFormStep}
                            planFormMaxVisited={planFormMaxVisited}
                            onPlanFormMaxVisitedChange={setPlanFormMaxVisited}
                            multiSelectOptions={[]}
                            dietaryMultiSelectOptions={[]}
                            onOpenAssistant={() => setIsAssistantOpen(true)}
                            flightStatusMessage={selectedFlight ? 'Vol choisi et associe a votre voyage.' : undefined}
                            hotelStatusMessage={selectedHotel ? 'Hebergement choisi et associe a votre voyage.' : undefined}
                        />
                    </div>

                    <aside className="space-y-4">
                        <ContextSummaryCard
                            eyebrow="Votre voyage"
                            title="Vos reperes"
                            items={searchSummaryItems}
                        />
                        {hasMapContext ? (
                            <div className="rounded-[2rem] border border-[var(--app-border)] bg-white/78 p-5 shadow-[var(--shadow-sm)]">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Carte</p>
                                        <h2 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">Lieux et trajets</h2>
                                    </div>
                                    <button type="button" onClick={() => setShowMapSheet(true)} className="rounded-full bg-[var(--app-brand-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--primary)]">Carte</button>
                                </div>
                                <div className="overflow-hidden rounded-[1.65rem]">
                                    <WorldMap accessToken={MAPBOX_TOKEN} initialLatitude={46.6} initialLongitude={1.8} initialZoom={5} mapStyle={mapState.mapStyle} mapConfig={mapState.mapConfig} pitch={mapState.mapPitch} locations={mapState.mapLocationsWithDayActivities} routeSegments={mapState.mapDisplaySegments} className="h-[420px] w-full lg:h-[620px]" />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[2rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Avant de continuer</p>
                                <h2 className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">Ajoutez trajet, dates et budget</h2>
                                <p className="mt-3 text-sm leading-relaxed text-[color:var(--app-muted)]">La carte arrive ensuite.</p>
                            </div>
                        )}
                        <ContextSummaryCard
                            eyebrow="Sauvegarde"
                            title="Sauvegarde auto"
                            items={[
                                { label: 'Brouillon', value: draftStatusMessage ?? 'Active' },
                                { label: 'Assistant', value: isAssistantOpen ? 'Ouvert' : 'Disponible' },
                            ]}
                        />
                    </aside>
                </section>
            </div>

            <FlightSearchModal
                visible={isFlightModalOpen}
                onClose={() => setIsFlightModalOpen(false)}
                departureCity={tripConfig.departureCity}
                setDepartureCity={tripConfig.setDepartureCity}
                arrivalCity={tripConfig.arrivalCity}
                setArrivalCity={tripConfig.setArrivalCity}
                arrivalDate={tripConfig.outboundDate}
                setArrivalDate={tripConfig.setOutboundDate}
                departureDate={tripConfig.returnDate}
                setDepartureDate={tripConfig.setReturnDate}
                travelerCount={tripConfig.travelerCount}
                setTravelerCount={tripConfig.setTravelerCount}
                budget={flightSearchBudget}
                setBudget={setFlightSearchBudget}
                onSearch={handleFlightSearch}
                onNewSearch={() => setFlightApiResponse(null)}
                onSelectOffer={handleFlightSelect}
                isLoading={isFlightSearchLoading}
                apiResponse={flightApiResponse}
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
                budget={hotelSearchBudget}
                setBudget={setHotelSearchBudget}
                mealRegime={hotelMealRegime}
                setMealRegime={setHotelMealRegime}
                selectedOptions={hotelSearchOptions}
                setSelectedOptions={setHotelSearchOptions}
                onSearch={handleHotelSearch}
                onNewSearch={() => setHotelApiResponse(null)}
                onSelectOffer={handleHotelSelect}
                isLoading={isHotelSearchLoading}
                apiResponse={hotelApiResponse}
            />

            <AnimatePresence>{showMapSheet && hasMapContext ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[rgba(7,19,31,0.72)] backdrop-blur-sm"><motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} className="absolute inset-x-0 bottom-0 top-[8vh] rounded-t-[2rem] border border-white/10 bg-[var(--app-surface-dark)] p-4 text-white shadow-[var(--shadow-lg)]"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Carte</p><h2 className="mt-1 text-xl font-semibold">Vue contextuelle</h2></div><button type="button" onClick={() => setShowMapSheet(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10" aria-label="Fermer la carte"><X size={18} /></button></div><div className="overflow-hidden rounded-[1.6rem]"><WorldMap accessToken={MAPBOX_TOKEN} initialLatitude={46.6} initialLongitude={1.8} initialZoom={5} mapStyle={mapState.mapStyle} mapConfig={mapState.mapConfig} pitch={mapState.mapPitch} locations={mapState.mapLocationsWithDayActivities} routeSegments={mapState.mapDisplaySegments} className="h-[calc(92vh-7.5rem)] w-full" /></div></motion.div></motion.div> : null}</AnimatePresence>

            <AnimatePresence>
                {isAssistantOpen ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[60]">
                        <div className="pointer-events-auto absolute inset-0 bg-[rgba(7,19,31,0.48)] backdrop-blur-sm" onClick={() => setIsAssistantOpen(false)} />
                        <motion.div
                            initial={isDesktop ? { x: 24, opacity: 0 } : { y: 36, opacity: 0 }}
                            animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                            exit={isDesktop ? { x: 24, opacity: 0 } : { y: 36, opacity: 0 }}
                            className={`pointer-events-auto absolute overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--app-surface-dark)] shadow-[var(--shadow-lg)] ${isDesktop ? 'right-6 top-24 h-[calc(100dvh-7rem)] w-[420px]' : 'inset-x-0 bottom-0 top-[12vh] rounded-b-none'}`}
                        >
                            {!isDesktop ? (
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Triply</p>
                                        <h2 className="mt-1 text-lg font-semibold">Assistant</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAssistantOpen(false)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10"
                                        aria-label="Fermer l assistant"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : null}
                            <Assistant
                                chatOwnerId={currentUser?.id ?? null}
                                destination={tripConfig.arrivalCityName || tripConfig.arrivalCity}
                                planningContext={{
                                    maxActivityHoursPerDay: Number.parseFloat(tripConfig.activityTime || '8') || 8,
                                    selectedDay,
                                    travelDays: tripConfig.travelDays,
                                    planningMode: planningMode ?? 'semi_ai',
                                    currentDayActivityTitles: [],
                                }}
                            />
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <TuPreferes visible={showTuPreferes} onSkip={() => setShowTuPreferes(false)} onComplete={() => setShowTuPreferes(false)} />
        </AppShell>
    );
}
