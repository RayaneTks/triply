'use client';

import React from 'react';
import { AlertCircle, ArrowLeft, BedDouble, CalendarDays, CheckCircle2, CircleDashed, MapPin, Plane, Sparkles, Users } from 'lucide-react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { SelectedFlightCard } from '@/src/components/SelectedFlightCard/SelectedFlightCard';
import { SelectedHotelCard } from '@/src/components/SelectedHotelCard/SelectedHotelCard';
import { InlineStatus } from '@/src/components/GuidedUI/InlineStatus';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import { PLAN_FORM_STEP_COUNT, clampPlanFormStep } from '@/src/features/trip-creation/plan-form-wizard';
import type { BookingStepChoice } from '@/src/features/trip-creation/booking-step';

interface TripConfigurationFormProps {
    departureCity: string;
    setDepartureCity: (v: string) => void;
    arrivalCity: string;
    setArrivalCity: (v: string) => void;
    setArrivalCityName?: (v: string) => void;
    onArrivalGeoSelect?: (payload: { latitude: number; longitude: number; iataCode: string; name: string }) => void;
    travelDays: number;
    setTravelDays: (v: number) => void;
    travelerCount: number;
    setTravelerCount: (v: number) => void;
    budget: string;
    setBudget: (v: string) => void;
    activityTime: string;
    setActivityTime: (v: string) => void;
    arrivalDate: string;
    setArrivalDate: (v: string) => void;
    departureDate: string;
    setDepartureDate: (v: string) => void;
    outboundDepartureTime: string;
    setOutboundDepartureTime: (v: string) => void;
    outboundArrivalTime: string;
    setOutboundArrivalTime: (v: string) => void;
    returnDepartureTime: string;
    setReturnDepartureTime: (v: string) => void;
    returnArrivalTime: string;
    setReturnArrivalTime: (v: string) => void;
    selectedOptions: string[];
    setSelectedOptions: (o: string[]) => void;
    multiSelectOptions: string[];
    dietaryMultiSelectOptions: string[];
    dietarySelections: string[];
    setDietarySelections: (o: string[]) => void;
    onOpenFlightSearch: () => void;
    onCloseFlightSearch?: () => void;
    flightChoice: BookingStepChoice;
    onFlightChoiceChange: (choice: BookingStepChoice) => void;
    selectedFlight?: FlightOffer | null;
    selectedFlightCarrierName?: string;
    flightSearchChecked?: boolean;
    onFlightCardClick: () => void;
    onRemoveFlight?: () => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch?: () => void;
    hotelChoice: BookingStepChoice;
    onHotelChoiceChange: (choice: BookingStepChoice) => void;
    selectedHotel?: HotelOffer | null;
    hotelSearchChecked?: boolean;
    onHotelCardClick: () => void;
    onRemoveHotel?: () => void;
    onBackToPlanningMode?: () => void;
    manualFlightEntry: boolean;
    setManualFlightEntry: (v: boolean) => void;
    manualFlightAirline: string;
    setManualFlightAirline: (v: string) => void;
    manualFlightNumber: string;
    setManualFlightNumber: (v: string) => void;
    manualFlightNumberReturn: string;
    setManualFlightNumberReturn: (v: string) => void;
    manualHotelEntry: boolean;
    setManualHotelEntry: (v: boolean) => void;
    manualHotelName: string;
    setManualHotelName: (v: string) => void;
    manualHotelAddress: string;
    setManualHotelAddress: (v: string) => void;
    manualHotelCheckIn: string;
    setManualHotelCheckIn: (v: string) => void;
    manualHotelCheckOut: string;
    setManualHotelCheckOut: (v: string) => void;
    planFormStep: number;
    planFormMaxVisited: number;
    onPlanFormStepSelect: (step: number) => void;
    stepInvalidHighlight: boolean[];
    onOpenAssistant?: () => void;
    flightStatusMessage?: string;
    hotelStatusMessage?: string;
}

const STEP_META = [
    { id: 0, label: 'Trajet', title: 'Depart et destination', description: 'Renseignez le trajet.', icon: MapPin },
    { id: 1, label: 'Dates', title: 'Dates du voyage', description: 'Choisissez vos dates.', icon: CalendarDays },
    { id: 2, label: 'Voyageurs', title: 'Voyageurs et duree', description: 'Cadrez le sejour.', icon: Users },
    { id: 3, label: 'Vol', title: 'Vol', description: 'Ajoutez un vol, cherchez ou passez.', icon: Plane },
    { id: 4, label: 'Hotel', title: 'Hebergement', description: 'Ajoutez un logement, cherchez ou passez.', icon: BedDouble },
    { id: 5, label: 'Style', title: 'Budget et envies', description: 'Affinez le voyage.', icon: Sparkles },
    { id: 6, label: 'Resume', title: 'Resume', description: 'Verifiez avant de continuer.', icon: CheckCircle2 },
] as const;

const defaultExperienceOptions = ['Culture', 'Cuisine locale', 'Detente', 'Balades a pied', 'Sorties en soiree', 'Nature'];
const defaultFoodOptions = ['Aucune contrainte', 'Vegetarien', 'Halal', 'Sans gluten'];

function joinClasses(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(' ');
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="mb-4">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {hint ? <p className="mt-1 text-sm leading-relaxed text-slate-400">{hint}</p> : null}
        </div>
    );
}

function ModeChoice({
    active,
    title,
    description,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={joinClasses(
                'rounded-2xl border p-4 text-left transition-colors',
                active
                    ? 'border-cyan-400/60 bg-cyan-500/12 text-white'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/8'
            )}
        >
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        </button>
    );
}

export const TripConfigurationForm: React.FC<TripConfigurationFormProps> = (props) => {
    const {
        departureCity, setDepartureCity, arrivalCity, setArrivalCity, setArrivalCityName, onArrivalGeoSelect,
        travelDays, setTravelDays, travelerCount, setTravelerCount, budget, setBudget, activityTime, setActivityTime,
        arrivalDate, setArrivalDate, departureDate, setDepartureDate, outboundDepartureTime, setOutboundDepartureTime,
        outboundArrivalTime, setOutboundArrivalTime, returnDepartureTime, setReturnDepartureTime, returnArrivalTime, setReturnArrivalTime,
        selectedOptions, setSelectedOptions, multiSelectOptions, dietaryMultiSelectOptions, dietarySelections, setDietarySelections,
        onOpenFlightSearch, onCloseFlightSearch, flightChoice, onFlightChoiceChange, selectedFlight, selectedFlightCarrierName = '', onFlightCardClick, onRemoveFlight,
        onOpenHotelSearch, onCloseHotelSearch, hotelChoice, onHotelChoiceChange, selectedHotel, onHotelCardClick, onRemoveHotel, onBackToPlanningMode,
        setManualFlightEntry, manualFlightAirline, setManualFlightAirline, manualFlightNumber, setManualFlightNumber,
        manualFlightNumberReturn, setManualFlightNumberReturn, setManualHotelEntry, manualHotelName, setManualHotelName,
        manualHotelAddress, setManualHotelAddress, manualHotelCheckIn, setManualHotelCheckIn, manualHotelCheckOut, setManualHotelCheckOut,
        planFormStep, planFormMaxVisited, onPlanFormStepSelect, stepInvalidHighlight, onOpenAssistant, flightStatusMessage, hotelStatusMessage,
    } = props;

    const currentStep = clampPlanFormStep(planFormStep);
    const currentMeta = STEP_META[currentStep];
    const optionValues = multiSelectOptions.length ? multiSelectOptions : defaultExperienceOptions;
    const foodValues = dietaryMultiSelectOptions.length ? dietaryMultiSelectOptions : defaultFoodOptions;

    const inputCls = 'w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-500/60 focus:bg-white/8 focus:ring-2 focus:ring-cyan-500/20';

    return (
        <div className="flex h-full flex-col bg-[#07131f] text-slate-200">
            <div className="border-b border-white/6 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {onBackToPlanningMode ? (
                            <button type="button" onClick={onBackToPlanningMode} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-300 transition-colors hover:bg-white/10">
                                <ArrowLeft size={18} />
                            </button>
                        ) : null}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Etape {currentStep + 1} / {PLAN_FORM_STEP_COUNT}</p>
                            <h2 className="mt-1 text-xl font-semibold text-white">{currentMeta.title}</h2>
                        </div>
                    </div>
                    {stepInvalidHighlight[currentStep] ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-2 text-xs font-semibold text-amber-300">
                            <AlertCircle size={14} />
                            A completer
                        </div>
                    ) : null}
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {STEP_META.map((step) => {
                        const active = step.id === currentStep;
                        const visited = step.id <= planFormMaxVisited;
                        const warn = stepInvalidHighlight[step.id];
                        return (
                            <button
                                key={step.id}
                                type="button"
                                disabled={!visited}
                                onClick={() => onPlanFormStepSelect(step.id)}
                                className={joinClasses(
                                    'inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors',
                                    active
                                        ? 'border-cyan-500/60 bg-cyan-500/12 text-white'
                                        : visited
                                          ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
                                          : 'border-transparent bg-white/[0.03] text-slate-600'
                                )}
                            >
                                {warn ? <AlertCircle size={14} className="text-amber-400" /> : visited ? <CheckCircle2 size={14} className="text-emerald-400" /> : <CircleDashed size={14} />}
                                <span>{step.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="mx-auto max-w-xl">
                    {currentStep === 0 ? (
                        <div className="space-y-4">
                            <SectionTitle title="Depart et destination" hint="Renseignez le trajet." />
                            <CityAutocomplete value={departureCity} onChange={setDepartureCity} label="Depart" placeholder="Exemple : Paris" />
                            <CityAutocomplete value={arrivalCity} onChange={setArrivalCity} onSelectName={(value) => setArrivalCityName?.(value)} onSelectGeo={onArrivalGeoSelect} label="Destination" placeholder="Exemple : Lisbonne" />
                        </div>
                    ) : null}

                    {currentStep === 1 ? (
                        <div className="space-y-5">
                            <SectionTitle title="Choisissez votre periode" hint="Choisissez vos dates." />
                            <DateRangePicker startDate={arrivalDate} endDate={departureDate} onDatesChange={(start, end) => { setArrivalDate(start); setDepartureDate(end); }} className="w-full" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Depart aller</label>
                                    <input type="time" value={outboundDepartureTime} onChange={(event) => setOutboundDepartureTime(event.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Arrivee aller</label>
                                    <input type="time" value={outboundArrivalTime} onChange={(event) => setOutboundArrivalTime(event.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Depart retour</label>
                                    <input type="time" value={returnDepartureTime} onChange={(event) => setReturnDepartureTime(event.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Arrivee retour</label>
                                    <input type="time" value={returnArrivalTime} onChange={(event) => setReturnArrivalTime(event.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === 2 ? (
                        <div className="space-y-5">
                            <SectionTitle title="Combien de personnes et de jours ?" hint="Cadrez le sejour." />
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Voyageurs</label>
                                <TravelerCounter count={travelerCount} onChange={setTravelerCount} />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Duree du sejour</label>
                                <input type="number" min={1} value={travelDays || ''} onChange={(event) => setTravelDays(Math.max(1, Number.parseInt(event.target.value, 10) || 1))} className={inputCls} placeholder="Exemple : 4 jours" />
                            </div>
                        </div>
                    ) : null}

                    {currentStep === 3 ? (
                        <div className="space-y-5">
                            <SectionTitle title="Transport principal" hint="Ajoutez un vol, cherchez ou passez." />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <ModeChoice active={flightChoice === 'existing'} title="J ai deja reserve" description="Je renseigne mon vol pour que Triply tienne compte des horaires." onClick={() => { onFlightChoiceChange('existing'); setManualFlightEntry(true); onCloseFlightSearch?.(); }} />
                                <ModeChoice active={flightChoice === 'triply_search'} title="Triply m aide a chercher" description="Je lance la recherche et je reviens ici." onClick={() => { onFlightChoiceChange('triply_search'); setManualFlightEntry(false); onOpenFlightSearch(); }} />
                                <ModeChoice active={flightChoice === 'later'} title="Je completerai plus tard" description="Je continue le voyage sans bloquer sur le transport pour l instant." onClick={() => { onFlightChoiceChange('later'); setManualFlightEntry(false); onCloseFlightSearch?.(); }} />
                            </div>
                            {flightChoice === 'existing' ? (
                                <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <input type="text" value={manualFlightAirline} onChange={(event) => setManualFlightAirline(event.target.value)} placeholder="Compagnie aerienne" className={inputCls} />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input type="text" value={manualFlightNumber} onChange={(event) => setManualFlightNumber(event.target.value)} placeholder="Numero aller" className={inputCls} />
                                        <input type="text" value={manualFlightNumberReturn} onChange={(event) => setManualFlightNumberReturn(event.target.value)} placeholder="Numero retour" className={inputCls} />
                                    </div>
                                </div>
                            ) : flightChoice === 'triply_search' && selectedFlight ? (
                                <SelectedFlightCard offer={selectedFlight} carrierName={selectedFlightCarrierName} onClick={onFlightCardClick} onRemove={onRemoveFlight} />
                            ) : flightChoice === 'triply_search' ? (
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <p className="text-sm font-semibold text-white">Lancez une recherche de vol.</p>
                                    <button type="button" onClick={onOpenFlightSearch} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-400">
                                        Chercher un vol
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-400">
                                    Aucun vol ajoute pour l instant.
                                </div>
                            )}
                            {flightStatusMessage ? <InlineStatus tone="success" message={flightStatusMessage} /> : null}
                        </div>
                    ) : null}

                    {currentStep === 4 ? (
                        <div className="space-y-5">
                            <SectionTitle title="Hebergement" hint="Ajoutez un logement, cherchez ou passez." />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <ModeChoice active={hotelChoice === 'existing'} title="J ai deja reserve" description="Je renseigne mon logement pour garder un voyage coherent." onClick={() => { onHotelChoiceChange('existing'); setManualHotelEntry(true); onCloseHotelSearch?.(); }} />
                                <ModeChoice active={hotelChoice === 'triply_search'} title="Triply m aide a chercher" description="Je compare des hotels puis je reviens ici." onClick={() => { onHotelChoiceChange('triply_search'); setManualHotelEntry(false); onOpenHotelSearch(); }} />
                                <ModeChoice active={hotelChoice === 'later'} title="Je completerai plus tard" description="Je continue le plan puis je reviendrai sur le logement." onClick={() => { onHotelChoiceChange('later'); setManualHotelEntry(false); onCloseHotelSearch?.(); }} />
                            </div>
                            {hotelChoice === 'existing' ? (
                                <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <input type="text" value={manualHotelName} onChange={(event) => setManualHotelName(event.target.value)} placeholder="Nom du logement" className={inputCls} />
                                    <input type="text" value={manualHotelAddress} onChange={(event) => setManualHotelAddress(event.target.value)} placeholder="Adresse" className={inputCls} />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input type="date" value={manualHotelCheckIn} onChange={(event) => setManualHotelCheckIn(event.target.value)} className={inputCls} />
                                        <input type="date" value={manualHotelCheckOut} onChange={(event) => setManualHotelCheckOut(event.target.value)} className={inputCls} />
                                    </div>
                                </div>
                            ) : hotelChoice === 'triply_search' && selectedHotel ? (
                                <SelectedHotelCard offer={selectedHotel} onClick={onHotelCardClick} onRemove={onRemoveHotel} />
                            ) : hotelChoice === 'triply_search' ? (
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <p className="text-sm font-semibold text-white">Lancez une recherche d hotel.</p>
                                    <button type="button" onClick={onOpenHotelSearch} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-400">
                                        Chercher un hotel
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-400">
                                    Aucun hebergement ajoute pour l instant.
                                </div>
                            )}
                            {hotelStatusMessage ? <InlineStatus tone="success" message={hotelStatusMessage} /> : null}
                        </div>
                    ) : null}

                    {currentStep === 5 ? (
                        <div className="space-y-5">
                            <SectionTitle title="Rythme, budget et envies" hint="Affinez le voyage." />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Budget total</label>
                                    <input type="number" min={0} value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Exemple : 900" className={inputCls} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Heures d activite par jour</label>
                                    <input type="number" min={1} max={16} value={activityTime} onChange={(event) => setActivityTime(event.target.value)} placeholder="Exemple : 8" className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ambiance du sejour</label>
                                <MultiSelect options={optionValues} selectedValues={selectedOptions} onChange={setSelectedOptions} variant="tripForm" />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contraintes alimentaires</label>
                                <MultiSelect options={foodValues} selectedValues={dietarySelections} onChange={setDietarySelections} variant="tripForm" />
                            </div>
                        </div>
                    ) : null}

                    {currentStep === 6 ? (
                        <div className="space-y-4">
                            <SectionTitle title="Resume" hint="Verifiez avant de continuer." />
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: 'Trajet', value: departureCity && arrivalCity ? `${departureCity} -> ${arrivalCity}` : 'A completer' },
                                    { label: 'Dates', value: arrivalDate && departureDate ? `${arrivalDate} -> ${departureDate}` : 'A completer' },
                                    { label: 'Voyageurs', value: travelerCount ? `${travelerCount} voyageur${travelerCount > 1 ? 's' : ''}` : 'A completer' },
                                    { label: 'Budget', value: budget ? `${budget} EUR max` : 'Non renseigne' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            {onOpenAssistant ? (
                                <button type="button" onClick={onOpenAssistant} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-500/90 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-400">
                                    Demander de l aide
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
