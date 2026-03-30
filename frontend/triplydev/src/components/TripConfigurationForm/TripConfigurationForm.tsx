'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Calendar as CalendarIcon, 
    Users, 
    Plane, 
    Hotel, 
    Settings2, 
    CheckCircle2, 
    ChevronRight,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { SelectedFlightCard } from '@/src/components/SelectedFlightCard/SelectedFlightCard';
import { SelectedHotelCard } from '@/src/components/SelectedHotelCard/SelectedHotelCard';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import {
    PLAN_FORM_STEP_COUNT,
    PLAN_FORM_STEP_LABELS,
    PLAN_FORM_STEP_LAST,
    clampPlanFormStep,
} from '@/src/features/trip-creation/plan-form-wizard';

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
    selectedFlight?: FlightOffer | null;
    selectedFlightCarrierName?: string;
    flightSearchChecked?: boolean;
    onFlightCardClick: () => void;
    onRemoveFlight?: () => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch?: () => void;
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
}

export const TripConfigurationForm: React.FC<TripConfigurationFormProps> = (props) => {
    const {
        departureCity, setDepartureCity,
        arrivalCity, setArrivalCity,
        travelDays, setTravelDays,
        travelerCount, setTravelerCount,
        budget, setBudget,
        activityTime, setActivityTime,
        arrivalDate, setArrivalDate,
        departureDate, setDepartureDate,
        outboundDepartureTime,
        setOutboundDepartureTime,
        outboundArrivalTime,
        setOutboundArrivalTime,
        returnDepartureTime,
        setReturnDepartureTime,
        returnArrivalTime,
        setReturnArrivalTime,
        selectedOptions, setSelectedOptions,
        multiSelectOptions, dietaryMultiSelectOptions,
        dietarySelections, setDietarySelections,
        onOpenFlightSearch, onCloseFlightSearch,
        selectedFlight, selectedFlightCarrierName = '', onRemoveFlight,
        flightSearchChecked,
        onFlightCardClick,
        onOpenHotelSearch, onCloseHotelSearch,
        selectedHotel, onRemoveHotel,
        hotelSearchChecked,
        onHotelCardClick,
        onBackToPlanningMode,
        manualFlightEntry, setManualFlightEntry,
        manualFlightAirline, setManualFlightAirline,
        manualFlightNumber, setManualFlightNumber,
        manualFlightNumberReturn, setManualFlightNumberReturn,
        manualHotelEntry, setManualHotelEntry,
        manualHotelName, setManualHotelName,
        manualHotelAddress, setManualHotelAddress,
        manualHotelCheckIn, setManualHotelCheckIn,
        manualHotelCheckOut, setManualHotelCheckOut,
        planFormStep, planFormMaxVisited,
        onPlanFormStepSelect, stepInvalidHighlight,
        onOpenAssistant,
        setArrivalCityName, onArrivalGeoSelect
    } = props;

    const currentStep = clampPlanFormStep(planFormStep);

    const steps = [
        { id: 0, label: 'Destination', icon: MapPin },
        { id: 1, label: 'Dates', icon: CalendarIcon },
        { id: 2, label: 'Voyageurs', icon: Users },
        { id: 3, label: 'Transport', icon: Plane },
        { id: 4, label: 'Hébergement', icon: Hotel },
        { id: 5, label: 'Préférences', icon: Settings2 },
        { id: 6, label: 'Récapitulatif', icon: CheckCircle2 },
    ];

    const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all";

    return (
        <div className="flex h-full flex-col bg-[#020617] text-slate-200">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4 border-b border-white/5 p-6">
                {onBackToPlanningMode && (
                    <button 
                        onClick={onBackToPlanningMode}
                        className="rounded-full p-2 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h2 className="text-lg font-bold text-white">Configuration</h2>
                    <p className="text-xs text-slate-500">Étape {currentStep + 1} sur {PLAN_FORM_STEP_COUNT}</p>
                </div>
            </div>

            {/* Stepper Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
                <div className="space-y-6">
                    {steps.map((step) => {
                        const isExpanded = currentStep === step.id;
                        const isCompleted = planFormMaxVisited > step.id;
                        const isLocked = step.id > planFormMaxVisited;
                        const hasError = stepInvalidHighlight[step.id];

                        return (
                            <div key={step.id} className="relative">
                                {/* Step Connector Line */}
                                {step.id !== steps.length - 1 && (
                                    <div className="absolute left-[19px] top-10 h-full w-[2px] bg-white/5" />
                                )}

                                {/* Step Header */}
                                <button
                                    onClick={() => !isLocked && onPlanFormStepSelect(step.id)}
                                    disabled={isLocked}
                                    className={`group flex w-full items-center gap-4 text-left transition-all ${isLocked ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                        isExpanded ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' :
                                        isCompleted ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                                        'border-white/10 bg-white/5 text-slate-500 group-hover:border-white/20'
                                    }`}>
                                        {isCompleted && !isExpanded ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                                    </div>
                                    <div className="flex flex-1 items-center justify-between">
                                        <span className={`text-sm font-semibold transition-colors ${isExpanded ? 'text-white' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                        {hasError && <AlertCircle size={16} className="text-red-400" />}
                                        {!isExpanded && !isLocked && <ChevronRight size={16} className="text-slate-600" />}
                                    </div>
                                </button>

                                {/* Step Body (Animated) */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-14 pb-4 pt-6 space-y-4">
                                                {step.id === 0 && (
                                                    <div className="space-y-4">
                                                        <CityAutocomplete value={departureCity} onChange={setDepartureCity} label="Départ" placeholder="D'où partez-vous ?" />
                                                        <CityAutocomplete 
                                                            value={arrivalCity} 
                                                            onChange={setArrivalCity} 
                                                            onSelectName={(n) => setArrivalCityName?.(n)}
                                                            onSelectGeo={onArrivalGeoSelect}
                                                            label="Arrivée" 
                                                            placeholder="Quelle destination ?" 
                                                        />
                                                    </div>
                                                )}
                                                {step.id === 1 && (
                                                    <DateRangePicker
                                                        startDate={arrivalDate}
                                                        endDate={departureDate}
                                                        onDatesChange={(s, e) => { setArrivalDate(s); setDepartureDate(e); }}
                                                        className="w-full"
                                                    />
                                                )}
                                                {step.id === 2 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Voyageurs</label>
                                                            <TravelerCounter count={travelerCount} onChange={setTravelerCount} />
                                                        </div>
                                                        <div>
                                                            <label className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Durée (jours)</label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={travelDays || ''}
                                                                onChange={(e) => setTravelDays(Math.max(1, parseInt(e.target.value, 10) || 0))}
                                                                className={inputCls}
                                                                placeholder="Ex: 7"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {step.id === 3 && (
                                                    <div className="space-y-4">
                                                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                                                            <input
                                                                type="checkbox"
                                                                checked={manualFlightEntry}
                                                                onChange={(e) => {
                                                                    setManualFlightEntry(e.target.checked);
                                                                    if (e.target.checked) onCloseFlightSearch?.();
                                                                }}
                                                                className="h-5 w-5 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/50"
                                                            />
                                                            <span className="text-sm text-slate-300">Saisie manuelle du vol</span>
                                                        </label>
                                                        {!manualFlightEntry ? (
                                                            <div className="space-y-3">
                                                                {selectedFlight ? (
                                                                    <SelectedFlightCard
                                                                        offer={selectedFlight}
                                                                        carrierName={selectedFlightCarrierName}
                                                                        onClick={onFlightCardClick}
                                                                        onRemove={onRemoveFlight}
                                                                    />
                                                                ) : (
                                                                    <button onClick={onOpenFlightSearch} className="w-full rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 py-6 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 transition-all">
                                                                        + Rechercher un vol
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                <input type="text" value={manualFlightAirline} onChange={(e) => setManualFlightAirline(e.target.value)} placeholder="Compagnie" className={inputCls} />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input type="text" value={manualFlightNumber} onChange={(e) => setManualFlightNumber(e.target.value)} placeholder="N° Aller" className={inputCls} />
                                                                    <input type="text" value={manualFlightNumberReturn} onChange={(e) => setManualFlightNumberReturn(e.target.value)} placeholder="N° Retour" className={inputCls} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {step.id === 4 && (
                                                    <div className="space-y-4">
                                                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                                                            <input
                                                                type="checkbox"
                                                                checked={manualHotelEntry}
                                                                onChange={(e) => {
                                                                    setManualHotelEntry(e.target.checked);
                                                                    if (e.target.checked) onCloseHotelSearch?.();
                                                                }}
                                                                className="h-5 w-5 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/50"
                                                            />
                                                            <span className="text-sm text-slate-300">Saisie manuelle de l&apos;hôtel</span>
                                                        </label>
                                                        {!manualHotelEntry ? (
                                                            <div className="space-y-3">
                                                                {selectedHotel ? (
                                                                    <SelectedHotelCard offer={selectedHotel} onClick={onHotelCardClick} onRemove={onRemoveHotel} />
                                                                ) : (
                                                                    <button onClick={onOpenHotelSearch} className="w-full rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 py-6 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                                                        + Rechercher un hôtel
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                <input type="text" value={manualHotelName} onChange={(e) => setManualHotelName(e.target.value)} placeholder="Nom de l'hôtel" className={inputCls} />
                                                                <input type="text" value={manualHotelAddress} onChange={(e) => setManualHotelAddress(e.target.value)} placeholder="Adresse" className={inputCls} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {step.id === 5 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Budget indicatif (€)</label>
                                                            <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Ex: 1500" className={inputCls} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Style de voyage</label>
                                                            <MultiSelect options={multiSelectOptions} selectedValues={selectedOptions} onChange={setSelectedOptions} placeholder="Sélectionnez..." />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Régime alimentaire</label>
                                                            <MultiSelect options={dietaryMultiSelectOptions} selectedValues={dietarySelections} onChange={setDietarySelections} placeholder="Restrictions..." />
                                                        </div>
                                                    </div>
                                                )}
                                                {step.id === 6 && (
                                                    <div className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-400 leading-relaxed">
                                                        <p>Presque terminé ! Vérifiez vos informations à gauche. Vous pouvez cliquer sur n&apos;importe quel titre pour corriger.</p>
                                                        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                                                            <CheckCircle2 size={14} /> Tout semble correct
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Assistant Hint / Quick Actions */}
            <div className="border-t border-white/5 bg-white/2 p-6">
                <div className="flex items-start gap-3 rounded-2xl bg-[#0F172A] p-4 border border-white/5">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                        <Settings2 size={14} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-white mb-1">Besoin d&apos;un coup de pouce ?</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">L&apos;assistant peut remplir ces informations pour vous en quelques secondes.</p>
                        {onOpenAssistant && (
                            <button 
                                onClick={onOpenAssistant}
                                className="mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                Demander à l&apos;IA →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
