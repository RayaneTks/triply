'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import { Button } from '@/src/components/Button/Button';
import { FlightResults } from '@/src/components/FlightResults/FlightResults';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { AmadeusResponse } from '@/src/components/FlightResults/FlightResults';

export interface FlightSearchModalProps {
    visible: boolean;
    onClose: () => void;
    departureCity: string;
    setDepartureCity: (value: string) => void;
    arrivalCity: string;
    setArrivalCity: (value: string) => void;
    arrivalDate: string;
    setArrivalDate: (value: string) => void;
    departureDate: string;
    setDepartureDate: (value: string) => void;
    arrivalTime: string;
    setArrivalTime: (value: string) => void;
    departureTime: string;
    setDepartureTime: (value: string) => void;
    travelerCount: number;
    setTravelerCount: (value: number) => void;
    budget: string;
    setBudget: (value: string) => void;
    onSearch: () => void;
    onNewSearch?: () => void;
    onSelectOffer?: (offer: FlightOffer, carrierName: string) => void;
    isLoading: boolean;
    apiResponse: (AmadeusResponse | { error?: string; details?: string }) | null;
}

interface FlightFormErrors {
    departureCity?: string;
    arrivalCity?: string;
    dates?: string;
    travelerCount?: string;
    budget?: string;
}

export const FlightSearchModal: React.FC<FlightSearchModalProps> = ({
    visible,
    onClose,
    departureCity,
    setDepartureCity,
    arrivalCity,
    setArrivalCity,
    arrivalDate,
    setArrivalDate,
    departureDate,
    setDepartureDate,
    arrivalTime,
    setArrivalTime,
    departureTime,
    setDepartureTime,
    travelerCount,
    setTravelerCount,
    budget,
    setBudget,
    onSearch,
    onNewSearch,
    onSelectOffer,
    isLoading,
    apiResponse,
}) => {
    const [errors, setErrors] = useState<FlightFormErrors>({});

    const handleSearchClick = () => {
        if (isLoading) return;

        const nextErrors: FlightFormErrors = {};

        if (!departureCity.trim()) {
            nextErrors.departureCity = 'Veuillez renseigner une ville de départ.';
        }
        if (!arrivalCity.trim()) {
            nextErrors.arrivalCity = "Veuillez renseigner une ville d'arrivée.";
        }
        if (!arrivalDate || !departureDate) {
            nextErrors.dates = 'Veuillez sélectionner des dates aller et retour.';
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
                        aria-labelledby="flight-search-title"
                    >
                        {/* Header */}
                        <div
                            className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4"
                        >
                            <h2 id="flight-search-title" className="text-xl font-semibold text-slate-100">
                                Recherche de vols
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

                        {/* Content - scrollable */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--background, #222222)' }}>
                            {!apiResponse || !('data' in apiResponse) || !apiResponse.data ? (
                                /* Formulaire de recherche */
                                <div className="mx-auto max-w-2xl space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <CityAutocomplete
                                            value={departureCity}
                                            onChange={setDepartureCity}
                                            label="Ville de départ"
                                            placeholder="Ex. Paris, Lyon..."
                                        />
                                        {errors.departureCity && (
                                            <p className="col-span-full text-xs text-red-400">
                                                {errors.departureCity}
                                            </p>
                                        )}
                                        <CityAutocomplete
                                            value={arrivalCity}
                                            onChange={setArrivalCity}
                                            label="Ville d'arrivée"
                                            placeholder="Ex. Marseille, Bordeaux..."
                                        />
                                        {errors.arrivalCity && (
                                            <p className="col-span-full text-xs text-red-400">
                                                {errors.arrivalCity}
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
                                            Budget maximum vol (€)
                                        </label>
                                        <div className="input-assistant flex h-11 w-full items-center rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-slate-100 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                            <span className="mr-2 text-slate-400">€</span>
                                            <input
                                                type="number"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                placeholder="Ex. 500"
                                                className="h-full w-full flex-grow bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                                                aria-invalid={!!errors.budget}
                                                aria-describedby={errors.budget ? 'flight-budget-error' : undefined}
                                            />
                                        </div>
                                        {errors.budget && (
                                            <p id="flight-budget-error" className="mt-1 text-xs text-red-400">
                                                {errors.budget}
                                            </p>
                                        )}
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
                                            <p className="mb-1 text-xs text-red-400">
                                                {errors.dates}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                            <div className="min-w-0 flex-1">
                                                <TimePicker
                                                    value={arrivalTime}
                                                    onChange={setArrivalTime}
                                                    label="Heure d'arrivée"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <TimePicker
                                                    value={departureTime}
                                                    onChange={setDepartureTime}
                                                    label="Heure de départ"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            label="Rechercher les vols"
                                            onClick={handleSearchClick}
                                            variant="light"
                                            loading={isLoading}
                                            disabled={isLoading}
                                            className="w-full py-3 text-lg font-bold"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Résultats */
                                <div className="flex min-h-[400px] flex-col text-slate-100">
                                    <h3 className="mb-4 shrink-0 text-lg font-semibold">
                                        Meilleures offres trouvées
                                    </h3>
                                    <div className="min-h-[300px] flex-1 overflow-y-auto">
                                        <FlightResults data={apiResponse} onSelectOffer={onSelectOffer} />
                                    </div>
                                    <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
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
