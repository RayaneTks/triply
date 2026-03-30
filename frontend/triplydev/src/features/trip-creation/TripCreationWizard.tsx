import React, { useMemo, useState } from 'react';
import { ChevronDown, MapPinned, Route } from 'lucide-react';
import { StickyActionBar } from '@/src/components/GuidedUI/StickyActionBar';
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { UseTripConfigurationResult } from './useTripConfiguration';
import type { PlanningMode } from './planning-mode';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import { PLAN_FORM_STEP_COUNT, PLAN_FORM_STEP_LABELS, PLAN_FORM_STEP_LAST, clampPlanFormStep, validatePlanFormStep } from './plan-form-wizard';
import type { BookingStepChoice } from './booking-step';

type PanelView = 'plan' | 'activity';

export type DayActivityPoi = MapboxPoiFeature & {
    lngLat: { lng: number; lat: number };
    _dragId?: string;
    durationHours?: number;
};

export type DayActivityRouteLeg = { duration: number; distance: number; geometry?: GeoJSON.LineString };
export type DayActivityRouteInfo = { geometry: GeoJSON.LineString; duration: number; legs: DayActivityRouteLeg[] };
export type ActivityRouteProfile = 'driving' | 'walking' | 'cycling';

interface TripCreationWizardProps {
    state: UseTripConfigurationResult;
    multiSelectOptions: string[];
    dietaryMultiSelectOptions: string[];
    selectedFlight: FlightOffer | null;
    selectedFlightCarrierName: string;
    selectedHotel: HotelOffer | null;
    isFlightModalOpen: boolean;
    isHotelModalOpen: boolean;
    onOpenFlightSearch: () => void;
    onCloseFlightSearch: () => void;
    flightChoice: BookingStepChoice;
    onFlightChoiceChange: (choice: BookingStepChoice) => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch: () => void;
    hotelChoice: BookingStepChoice;
    onHotelChoiceChange: (choice: BookingStepChoice) => void;
    onFlightCardClick: () => void;
    onRemoveFlight: () => void;
    onHotelCardClick: () => void;
    onRemoveHotel: () => void;
    selectedDay?: number;
    onSelectedDayChange?: (day: number) => void;
    travelDays?: number;
    dayActivities?: DayActivityPoi[];
    activityTimeAlertDragId?: string | null;
    onRemoveDayActivity?: (index: number) => void;
    onReorderDayActivities?: (reordered: DayActivityPoi[]) => void;
    dayRoutes?: Partial<Record<'driving' | 'walking' | 'cycling', DayActivityRouteInfo>>;
    selectedRouteType?: 'driving' | 'walking' | 'cycling' | null;
    onSelectRouteType?: (type: 'driving' | 'walking' | 'cycling' | null) => void;
    legTransportModes?: ActivityRouteProfile[];
    onLegTransportChange?: (legIndex: number, mode: ActivityRouteProfile) => void;
    activeView?: PanelView;
    onActiveViewChange?: (view: PanelView) => void;
    onComplete?: () => void;
    onValidateChoices?: () => void;
    onDestinationGeoSelect?: (payload: { latitude: number; longitude: number; iataCode: string; name: string }) => void;
    planningMode: PlanningMode | null;
    onPlanningModeChange: (mode: PlanningMode) => void;
    onBackToPlanningMode?: () => void;
    isConnected: boolean;
    onLoginClick: () => void;
    onAppendHotelToDay?: () => void;
    onAppendAirportOutbound?: () => void;
    onAppendAirportReturn?: () => void;
    canAppendReturnAirport?: boolean;
    onRequestAiDaySuggestions?: () => void;
    onRequestAiAllDaysSuggestions?: () => void;
    showAiSuggestionButton?: boolean;
    aiSuggestionsLoading?: boolean;
    aiAllDaysSuggestionsLoading?: boolean;
    onOpenValidateTrip?: () => void;
    validateTripDisabled?: boolean;
    geocodeAppendPending?: boolean;
    onDayActivityDurationChange?: (activityIndex: number, hours: number | null) => void;
    onRegenerateDayActivity?: (activityIndex: number) => void | Promise<void>;
    regeneratingActivity?: { day: number; index: number } | null;
    planFormStep: number;
    onPlanFormStepChange: (step: number) => void;
    planFormMaxVisited: number;
    onPlanFormMaxVisitedChange: (max: number) => void;
    onOpenAssistant?: () => void;
    showPanelClose?: boolean;
    onClosePanel?: () => void;
    flightStatusMessage?: string;
    hotelStatusMessage?: string;
}

function PlanningModeLoginRequired({ onLoginClick }: { onLoginClick: () => void }) {
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center">
            <div className="max-w-sm">
                <h2 className="text-lg font-semibold text-white">Connectez-vous pour continuer</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">Sauvegardez vos choix et reprenez plus tard.</p>
                <button
                    type="button"
                    onClick={onLoginClick}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
                >
                    Se connecter
                </button>
            </div>
        </div>
    );
}

function PlanningModeCards({ onSelect }: { onSelect: (mode: PlanningMode) => void }) {
    const cards = [
        {
            mode: 'full_ai' as const,
            title: 'Triply m aide',
            description: 'Triply propose et organise avec vous.',
        },
        {
            mode: 'semi_ai' as const,
            title: 'Je fais mes choix',
            description: 'Vous avancez a votre rythme.',
        },
    ];

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
            <h2 className="text-lg font-semibold text-white">Comment voulez-vous preparer ce voyage ?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Vous pourrez changer plus tard.</p>
            <div className="mt-5 grid gap-3">
                {cards.map((card) => (
                    <button
                        key={card.mode}
                        type="button"
                        onClick={() => onSelect(card.mode)}
                        className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/10"
                    >
                        <p className="text-base font-semibold text-white">{card.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ActivityDaySelector({
    selectedDay,
    travelDays,
    onSelect,
}: {
    selectedDay: number;
    travelDays: number;
    onSelect?: (day: number) => void;
}) {
    if (!onSelect || travelDays <= 1) return null;
    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: Math.max(1, travelDays) }, (_, index) => index + 1).map((day) => (
                <button
                    key={day}
                    type="button"
                    onClick={() => onSelect(day)}
                    className={`min-h-11 rounded-2xl px-4 text-sm font-semibold transition-colors ${
                        day === selectedDay
                            ? 'bg-cyan-500 text-white'
                            : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
                    }`}
                >
                    Jour {day}
                </button>
            ))}
        </div>
    );
}

export const TripCreationWizard: React.FC<TripCreationWizardProps> = ({
    state,
    multiSelectOptions,
    dietaryMultiSelectOptions,
    selectedFlight,
    selectedFlightCarrierName,
    selectedHotel,
    isFlightModalOpen,
    isHotelModalOpen,
    onOpenFlightSearch,
    onCloseFlightSearch,
    flightChoice,
    onFlightChoiceChange,
    onOpenHotelSearch,
    onCloseHotelSearch,
    hotelChoice,
    onHotelChoiceChange,
    onFlightCardClick,
    onRemoveFlight,
    onHotelCardClick,
    onRemoveHotel,
    selectedDay = 1,
    onSelectedDayChange,
    travelDays = 1,
    dayActivities = [],
    selectedRouteType = null,
    activeView,
    onActiveViewChange,
    onComplete,
    onValidateChoices,
    onDestinationGeoSelect,
    planningMode,
    onPlanningModeChange,
    onBackToPlanningMode,
    isConnected,
    onLoginClick,
    onRequestAiDaySuggestions,
    onRequestAiAllDaysSuggestions,
    showAiSuggestionButton = false,
    aiSuggestionsLoading = false,
    aiAllDaysSuggestionsLoading = false,
    onOpenValidateTrip,
    validateTripDisabled = true,
    planFormStep,
    onPlanFormStepChange,
    planFormMaxVisited,
    onPlanFormMaxVisitedChange,
    onOpenAssistant,
    showPanelClose = false,
    onClosePanel,
    flightStatusMessage,
    hotelStatusMessage,
}) => {
    const requiredChecklist = useMemo(
        () => [
            { valid: !!state.departureCity.trim() && !!state.arrivalCity.trim() },
            { valid: !!state.outboundDate && !!state.returnDate && state.returnDate >= state.outboundDate },
            { valid: state.travelerCount > 0 && state.travelDays >= 1 },
        ],
        [state.departureCity, state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount, state.travelDays]
    );
    const requiredCompleted = requiredChecklist.filter((item) => item.valid).length;
    const hasMinimum = planningMode != null && requiredCompleted === requiredChecklist.length;
    const canAccessStep2 = hasMinimum || planningMode === 'full_ai';
    const [internalActiveView, setInternalActiveView] = useState<PanelView>('plan');
    const resolvedActiveView = activeView ?? internalActiveView;
    const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
    const [attemptedInvalidStep, setAttemptedInvalidStep] = useState<boolean[]>(() => Array(PLAN_FORM_STEP_COUNT).fill(false));
    const planStep = clampPlanFormStep(planFormStep);
    const planMaxVisited = clampPlanFormStep(planFormMaxVisited);
    const planSnap = useMemo(() => ({
        departureCity: state.departureCity,
        arrivalCity: state.arrivalCity,
        outboundDate: state.outboundDate,
        returnDate: state.returnDate,
        travelerCount: state.travelerCount,
        travelDays: state.travelDays,
    }), [state.departureCity, state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount, state.travelDays]);

    const stepInvalidHighlight = useMemo(
        () =>
            Array.from({ length: PLAN_FORM_STEP_COUNT }, (_, index) => {
                if (index > 2) return false;
                const invalid = !validatePlanFormStep(index, planSnap);
                return invalid && attemptedInvalidStep[index];
            }),
        [attemptedInvalidStep, planSnap]
    );

    const setResolvedView = (view: PanelView) => {
        onActiveViewChange?.(view);
        if (activeView === undefined) setInternalActiveView(view);
    };

    const goPlanNext = () => {
        if (!validatePlanFormStep(planStep, planSnap)) {
            setAttemptedInvalidStep((prev) => {
                const next = [...prev];
                next[planStep] = true;
                return next;
            });
            return;
        }
        const next = Math.min(planStep + 1, PLAN_FORM_STEP_LAST);
        onPlanFormStepChange(next);
        onPlanFormMaxVisitedChange(Math.max(planMaxVisited, next));
    };

    const goPlanPrev = () => onPlanFormStepChange(Math.max(0, planStep - 1));

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[#07131f]">
            {showPanelClose && onClosePanel ? (
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 lg:hidden">
                    <span className="text-sm font-semibold text-white">Plan de voyage</span>
                    <button type="button" onClick={onClosePanel} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10">
                        x
                    </button>
                </div>
            ) : null}

            <div className="border-b border-white/10">
                <div className="flex">
                    <button type="button" onClick={() => setResolvedView('plan')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${resolvedActiveView === 'plan' ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
                        Planifier
                    </button>
                    <button type="button" onClick={() => canAccessStep2 && setResolvedView('activity')} disabled={!canAccessStep2} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${resolvedActiveView === 'activity' ? 'border-b-2 border-cyan-500 text-cyan-400' : canAccessStep2 ? 'text-slate-400 hover:text-slate-200' : 'cursor-not-allowed text-slate-600'}`}>
                        Programme
                    </button>
                </div>
            </div>

            {resolvedActiveView === 'plan' ? (
                <>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {planningMode == null ? (
                            isConnected ? <PlanningModeCards onSelect={onPlanningModeChange} /> : <PlanningModeLoginRequired onLoginClick={onLoginClick} />
                        ) : (
                            <>
                                <div className="flex shrink-0 items-center justify-between border-b border-white/6 px-4 py-3 lg:hidden">
                                    <button type="button" onClick={() => setMobileStepsOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                                        <ChevronDown size={14} />
                                        Etapes
                                    </button>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{PLAN_FORM_STEP_LABELS[planStep]}</p>
                                </div>
                                {mobileStepsOpen ? (
                                    <div className="border-b border-white/6 px-4 py-3 lg:hidden">
                                        <div className="grid gap-2">
                                            {PLAN_FORM_STEP_LABELS.map((label, index) => (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    disabled={index > planMaxVisited}
                                                    onClick={() => {
                                                        onPlanFormStepChange(index);
                                                        setMobileStepsOpen(false);
                                                    }}
                                                    className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                                                        index === planStep
                                                            ? 'bg-cyan-500/12 text-cyan-300'
                                                            : index <= planMaxVisited
                                                              ? 'bg-white/5 text-slate-300'
                                                              : 'bg-white/[0.03] text-slate-600'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                <TripConfigurationForm
                                    departureCity={state.departureCity}
                                    setDepartureCity={state.setDepartureCity}
                                    arrivalCity={state.arrivalCity}
                                    setArrivalCity={state.setArrivalCity}
                                    setArrivalCityName={state.setArrivalCityName}
                                    onArrivalGeoSelect={onDestinationGeoSelect}
                                    travelDays={state.travelDays}
                                    setTravelDays={state.setTravelDays}
                                    travelerCount={state.travelerCount}
                                    setTravelerCount={state.setTravelerCount}
                                    budget={state.budget}
                                    setBudget={state.setBudget}
                                    activityTime={state.activityTime}
                                    setActivityTime={state.setActivityTime}
                                    arrivalDate={state.outboundDate}
                                    setArrivalDate={state.setOutboundDate}
                                    departureDate={state.returnDate}
                                    setDepartureDate={state.setReturnDate}
                                    outboundDepartureTime={state.outboundDepartureTime}
                                    setOutboundDepartureTime={state.setOutboundDepartureTime}
                                    outboundArrivalTime={state.outboundArrivalTime}
                                    setOutboundArrivalTime={state.setOutboundArrivalTime}
                                    returnDepartureTime={state.returnDepartureTime}
                                    setReturnDepartureTime={state.setReturnDepartureTime}
                                    returnArrivalTime={state.returnArrivalTime}
                                    setReturnArrivalTime={state.setReturnArrivalTime}
                                    selectedOptions={state.selectedOptions}
                                    setSelectedOptions={state.setSelectedOptions}
                                    multiSelectOptions={multiSelectOptions}
                                    dietaryMultiSelectOptions={dietaryMultiSelectOptions}
                                    dietarySelections={state.dietarySelections}
                                    setDietarySelections={state.setDietarySelections}
                                    onOpenFlightSearch={onOpenFlightSearch}
                                    onCloseFlightSearch={onCloseFlightSearch}
                                    flightChoice={flightChoice}
                                    onFlightChoiceChange={onFlightChoiceChange}
                                    flightSearchChecked={isFlightModalOpen}
                                    selectedFlight={selectedFlight}
                                    selectedFlightCarrierName={selectedFlightCarrierName}
                                    onFlightCardClick={onFlightCardClick}
                                    onRemoveFlight={onRemoveFlight}
                                    onOpenHotelSearch={onOpenHotelSearch}
                                    onCloseHotelSearch={onCloseHotelSearch}
                                    hotelChoice={hotelChoice}
                                    onHotelChoiceChange={onHotelChoiceChange}
                                    hotelSearchChecked={isHotelModalOpen}
                                    selectedHotel={selectedHotel}
                                    onHotelCardClick={onHotelCardClick}
                                    onRemoveHotel={onRemoveHotel}
                                    onBackToPlanningMode={onBackToPlanningMode}
                                    manualFlightEntry={state.manualFlightEntry}
                                    setManualFlightEntry={state.setManualFlightEntry}
                                    manualFlightAirline={state.manualFlightAirline}
                                    setManualFlightAirline={state.setManualFlightAirline}
                                    manualFlightNumber={state.manualFlightNumber}
                                    setManualFlightNumber={state.setManualFlightNumber}
                                    manualFlightNumberReturn={state.manualFlightNumberReturn}
                                    setManualFlightNumberReturn={state.setManualFlightNumberReturn}
                                    manualHotelEntry={state.manualHotelEntry}
                                    setManualHotelEntry={state.setManualHotelEntry}
                                    manualHotelName={state.manualHotelName}
                                    setManualHotelName={state.setManualHotelName}
                                    manualHotelAddress={state.manualHotelAddress}
                                    setManualHotelAddress={state.setManualHotelAddress}
                                    manualHotelCheckIn={state.manualHotelCheckIn}
                                    setManualHotelCheckIn={state.setManualHotelCheckIn}
                                    manualHotelCheckOut={state.manualHotelCheckOut}
                                    setManualHotelCheckOut={state.setManualHotelCheckOut}
                                    planFormStep={planStep}
                                    planFormMaxVisited={planMaxVisited}
                                    onPlanFormStepSelect={onPlanFormStepChange}
                                    stepInvalidHighlight={stepInvalidHighlight}
                                    onOpenAssistant={onOpenAssistant}
                                    flightStatusMessage={flightStatusMessage}
                                    hotelStatusMessage={hotelStatusMessage}
                                />
                            </>
                        )}
                    </div>

                    {planningMode != null ? (
                        <StickyActionBar
                            progressValue={requiredCompleted}
                            progressMax={requiredChecklist.length}
                            progressLabel={`Essentiels completes : ${requiredCompleted}/${requiredChecklist.length}`}
                            secondaryAction={
                                <button type="button" onClick={goPlanPrev} disabled={planStep === 0} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${planStep === 0 ? 'cursor-not-allowed bg-white/[0.04] text-slate-600' : 'border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'}`}>
                                    Retour
                                </button>
                            }
                            primaryAction={
                                planStep < PLAN_FORM_STEP_LAST ? (
                                    <button type="button" onClick={goPlanNext} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400">
                                        Continuer
                                    </button>
                                ) : null
                            }
                        >
                            {planStep === PLAN_FORM_STEP_LAST ? (
                                <div className="flex gap-2">
                                    <button type="button" onClick={onValidateChoices} disabled={!state.arrivalCity.trim() || !onValidateChoices} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${state.arrivalCity.trim() && onValidateChoices ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10' : 'cursor-not-allowed bg-white/[0.04] text-slate-600'}`}>
                                        Relire les essentiels
                                    </button>
                                    <button type="button" onClick={onComplete} disabled={!hasMinimum || !onComplete} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${hasMinimum ? 'bg-cyan-500 text-white hover:bg-cyan-400' : 'cursor-not-allowed bg-white/[0.04] text-slate-500'}`}>
                                        {hasMinimum ? 'Voir la proposition Triply' : 'Completez depart, destination, dates et voyageurs'}
                                    </button>
                                </div>
                            ) : null}
                        </StickyActionBar>
                    ) : null}
                </>
            ) : (
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="mb-4 space-y-4">
                            <ActivityDaySelector selectedDay={selectedDay} travelDays={travelDays} onSelect={onSelectedDayChange} />
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPinned size={18} className="text-cyan-400" />
                                    <p className="text-sm font-semibold text-white">Programme du jour</p>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-slate-400">La carte sert ici a verifier les lieux et les trajets.</p>
                            </div>

                            {showAiSuggestionButton && (onRequestAiDaySuggestions || onRequestAiAllDaysSuggestions) ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {onRequestAiDaySuggestions ? (
                                        <button type="button" onClick={onRequestAiDaySuggestions} disabled={aiSuggestionsLoading} className="rounded-2xl border border-cyan-500/40 bg-cyan-500/12 px-4 py-3 text-left text-sm font-semibold text-cyan-200 disabled:opacity-50">
                                            {aiSuggestionsLoading ? 'Triply prepare les suggestions...' : 'Des idees pour ce jour'}
                                        </button>
                                    ) : null}
                                    {onRequestAiAllDaysSuggestions ? (
                                        <button type="button" onClick={onRequestAiAllDaysSuggestions} disabled={aiAllDaysSuggestionsLoading} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white disabled:opacity-50">
                                            {aiAllDaysSuggestionsLoading ? 'Triply prepare le sejour...' : 'Des idees pour tout le sejour'}
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        {dayActivities.length === 0 ? (
                            <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] p-5">
                                <div className="flex items-center gap-2">
                                    <Route size={18} className="text-cyan-400" />
                                    <p className="text-sm font-semibold text-white">Aucune activite pour l instant</p>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-slate-400">Ajoutez des lieux, puis verifiez le trajet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dayActivities.map((poi, index) => (
                                    <article key={poi._dragId ?? `${poi.lngLat.lng}-${poi.lngLat.lat}-${index}`} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Etape {index + 1}</p>
                                                <h3 className="mt-1 text-base font-semibold text-white">{String(poi.properties?.name ?? poi.properties?.name_en ?? 'Lieu')}</h3>
                                            </div>
                                            {selectedRouteType ? <span className="rounded-full bg-cyan-500/12 px-3 py-1 text-xs font-semibold text-cyan-300">{selectedRouteType}</span> : null}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/10 px-4 py-3">
                        {onOpenAssistant ? (
                            <button type="button" onClick={onOpenAssistant} className="mb-2 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                                Ajuster avec Triply
                            </button>
                        ) : null}
                        {onOpenValidateTrip ? (
                            <button type="button" onClick={onOpenValidateTrip} disabled={validateTripDisabled} className={`w-full rounded-xl py-2.5 text-sm font-semibold ${validateTripDisabled ? 'cursor-not-allowed bg-white/[0.04] text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                                Valider mon voyage
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};
