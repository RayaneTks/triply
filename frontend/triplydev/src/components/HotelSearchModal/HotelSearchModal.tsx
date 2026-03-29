'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CakeIcon } from '@heroicons/react/24/outline';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { Button } from '@/src/components/Button/Button';
import { HotelResults } from '@/src/components/HotelResults/HotelResults';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { AmadeusHotelResponse } from '@/src/components/HotelResults/HotelResults';

export const HOTEL_PREFERENCE_OPTIONS = [
    'Petit déjeuner inclus', 'Proche du centre ville', 'Spa/piscine',
    'Plage', 'Équipement', 'Retour positif', 'Hôtel de luxe',
    'Animaux domestiques', 'Réservé aux adultes', 'LGBTQIA+ friendly',
];

/** Valeurs Amadeus Hotel Offers API v3 (boardType) */
export const HOTEL_MEAL_REGIME_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Aucune préférence' },
    { value: 'ROOM_ONLY', label: 'Chambre seule (sans repas)' },
    { value: 'BREAKFAST', label: 'Petit-déjeuner inclus' },
    { value: 'HALF_BOARD', label: 'Demi-pension' },
    { value: 'FULL_BOARD', label: 'Pension complète' },
    { value: 'ALL_INCLUSIVE', label: 'Tout compris (all inclusive)' },
];

/** Même pattern que DaySelector (Activité de la journée) */
function MealRegimeSelector({ value, onChange }: { value: string; onChange: (next: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel =
        HOTEL_MEAL_REGIME_OPTIONS.find((o) => o.value === value)?.label ?? 'Aucune préférence';

    return (
        <div className="flex items-center gap-2" ref={containerRef}>
            <CakeIcon className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
            <div className="relative min-w-0 flex-1">
                <button
                    type="button"
                    id="hotel-meal-regime"
                    onClick={() => setIsOpen((o) => !o)}
                    className="flex w-full min-w-0 items-center justify-between rounded-xl border border-white/15 bg-white/5 py-2.5 pl-4 pr-10 text-left text-[13px] font-semibold text-slate-100 outline-none transition-colors hover:bg-white/10 focus:border-cyan-500/60 focus:bg-cyan-500/10 focus:ring-2 focus:ring-cyan-500/30"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="hotel-meal-regime-label"
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDownIcon
                        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                    />
                </button>
                {isOpen && (
                    <div
                        className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-48 overflow-y-auto rounded-xl shadow-xl"
                        style={{
                            backgroundColor: 'var(--background, #222222)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        }}
                        role="listbox"
                        aria-labelledby="hotel-meal-regime-label"
                    >
                        {HOTEL_MEAL_REGIME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value || 'any'}
                                type="button"
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center px-4 py-3 text-left text-[13px] font-medium transition-all duration-150 hover:bg-cyan-500/15 hover:text-cyan-300 ${
                                    value === opt.value
                                        ? 'bg-cyan-500/15 text-cyan-400'
                                        : 'bg-transparent text-slate-100'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export interface HotelSearchModalProps {
    visible: boolean;
    onClose: () => void;
    cityCode: string;
    setCityCode: (value: string) => void;
    arrivalDate: string;
    setArrivalDate: (value: string) => void;
    departureDate: string;
    setDepartureDate: (value: string) => void;
    travelerCount: number;
    setTravelerCount: (value: number) => void;
    budget: string;
    setBudget: (value: string) => void;
    /** Régime alimentaire (boardType Amadeus : ROOM_ONLY, BREAKFAST, etc.) */
    mealRegime: string;
    setMealRegime: (value: string) => void;
    selectedOptions?: string[];
    setSelectedOptions?: (options: string[]) => void;
    multiSelectOptions?: string[];
    onSearch: () => void;
    onNewSearch?: () => void;
    onSelectOffer?: (offer: HotelOffer) => void;
    isLoading: boolean;
    apiResponse: (AmadeusHotelResponse | { error?: string; details?: string }) | null;
}

interface HotelFormErrors {
    cityCode?: string;
    dates?: string;
    travelerCount?: string;
    budget?: string;
}

export const HotelSearchModal: React.FC<HotelSearchModalProps> = ({
    visible,
    onClose,
    cityCode,
    setCityCode,
    arrivalDate,
    setArrivalDate,
    departureDate,
    setDepartureDate,
    travelerCount,
    setTravelerCount,
    budget,
    setBudget,
    mealRegime,
    setMealRegime,
    selectedOptions = [],
    setSelectedOptions,
    multiSelectOptions = HOTEL_PREFERENCE_OPTIONS,
    onSearch,
    onNewSearch,
    onSelectOffer,
    isLoading,
    apiResponse,
}) => {
    const [errors, setErrors] = useState<HotelFormErrors>({});

    const handleSearchClick = () => {
        if (isLoading) return;

        const nextErrors: HotelFormErrors = {};

        if (!cityCode.trim()) {
            nextErrors.cityCode = 'Veuillez renseigner une ville ou destination.';
        }
        if (!arrivalDate || !departureDate) {
            nextErrors.dates = 'Veuillez sélectionner des dates d’arrivée et de départ.';
        }
        if (!Number.isFinite(travelerCount) || travelerCount <= 0) {
            nextErrors.travelerCount = 'Veuillez indiquer au moins un voyageur.';
        }
        if (budget && Number(budget) < 0) {
            nextErrors.budget = 'Le budget ne peut pas être négatif.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length === 0) {
            onSearch();
        }
    };

    const modalContent = (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                        aria-hidden="true"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-2 z-[9999] flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl sm:inset-4 sm:max-h-[calc(100dvh-2rem)] md:inset-8 md:max-h-[calc(100dvh-4rem)] lg:inset-12"
                        style={{ backgroundColor: 'var(--background, #222222)' }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hotel-search-title"
                    >
                        <div
                            className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4"
                        >
                            <h2 id="hotel-search-title" className="text-xl font-semibold text-slate-100">
                                Recherche d&apos;hôtels
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                aria-label="Fermer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-slate-100">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--background, #222222)' }}>
                            {!apiResponse || !('data' in apiResponse) || !apiResponse.data ? (
                                <div className="mx-auto max-w-2xl space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-100">
                                            Ville / Destination
                                        </label>
                                        <CityAutocomplete
                                            value={cityCode}
                                            onChange={setCityCode}
                                            placeholder="Ex. Paris, Marseille..."
                                        />
                                        {errors.cityCode && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {errors.cityCode}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-100">
                                            Nombre de voyageurs
                                        </label>
                                        <TravelerCounter
                                            count={travelerCount}
                                            onChange={setTravelerCount}
                                            className="w-full bg-white/5 text-slate-200"
                                        />
                                        {errors.travelerCount && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {errors.travelerCount}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-100">
                                            Budget maximum par nuit (€)
                                        </label>
                                        <div className="input-assistant flex h-11 w-full items-center rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-slate-100 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                            <span className="mr-2 text-slate-400">€</span>
                                            <input
                                                type="number"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                placeholder="Ex. 150"
                                                className="h-full w-full flex-grow bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                                                aria-invalid={!!errors.budget}
                                                aria-describedby={errors.budget ? 'hotel-budget-error' : undefined}
                                            />
                                        </div>
                                        {errors.budget && (
                                            <p id="hotel-budget-error" className="mt-1 text-xs text-red-400">
                                                {errors.budget}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <span
                                            id="hotel-meal-regime-label"
                                            className="mb-2 block text-sm font-medium text-slate-100"
                                        >
                                            Régime alimentaire souhaité
                                        </span>
                                        <MealRegimeSelector value={mealRegime} onChange={setMealRegime} />
                                        <p className="mt-1 text-xs text-slate-500">
                                            Filtre les offres selon le type de pension (selon disponibilité Amadeus).
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-100">
                                            Date d&apos;arrivée / Départ
                                        </label>
                                        <DateRangePicker
                                            startDate={arrivalDate}
                                            endDate={departureDate}
                                            onDatesChange={(start, end) => {
                                                setArrivalDate(start);
                                                setDepartureDate(end);
                                            }}
                                            className="mb-2 w-full"
                                        />
                                        {errors.dates && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {errors.dates}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-100">
                                            Préférences de voyage
                                        </label>
                                        <MultiSelect
                                            variant="tripForm"
                                            options={multiSelectOptions}
                                            selectedValues={selectedOptions}
                                            onChange={setSelectedOptions ?? (() => {})}
                                            placeholder="Préférences de voyage…"
                                            className="w-full"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            Identique au formulaire d&apos;étape 1 : les choix restent synchronisés.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            label="Rechercher les hôtels"
                                            onClick={handleSearchClick}
                                            variant="light"
                                            loading={isLoading}
                                            disabled={isLoading}
                                            className="w-full py-3 text-lg font-bold"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col min-h-[400px]" style={{ color: '#ededed' }}>
                                    <h3 className="text-lg font-semibold mb-4 shrink-0" style={{ color: '#ededed' }}>
                                        Meilleures offres trouvées
                                    </h3>
                                    <div className="flex-1 min-h-[300px] overflow-y-auto">
                                        <HotelResults data={apiResponse} onSelectOffer={onSelectOffer} />
                                    </div>
                                    <div className="pt-4 mt-4 border-t shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                        <Button
                                            label="Nouvelle recherche"
                                            onClick={onNewSearch}
                                            variant="dark"
                                            tone="tone1"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(modalContent, document.body)
        : modalContent;
};
