'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import { Button } from '@/src/components/Button/Button';
import { FlightResults } from '@/src/components/FlightResults/FlightResults';

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
    onSelectOffer?: (offer: any, carrierName: string) => void;
    isLoading: boolean;
    apiResponse: any;
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
                        className="fixed inset-4 md:inset-8 lg:inset-12 z-[9999] flex flex-col rounded-xl overflow-hidden"
                        style={{
                            backgroundColor: 'var(--background, #222222)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="flight-search-title"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                        >
                            <h2 id="flight-search-title" className="text-xl font-semibold" style={{ color: 'var(--foreground, #ededed)' }}>
                                Recherche de vols
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Fermer"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content - scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0" style={{ backgroundColor: '#222222' }}>
                            {!apiResponse?.data ? (
                                /* Formulaire de recherche */
                                <div className="max-w-2xl mx-auto space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CityAutocomplete
                                            value={departureCity}
                                            onChange={setDepartureCity}
                                            label="Ville de départ"
                                            placeholder="Ex. Paris, Lyon..."
                                            containerStyle={{ color: 'var(--foreground, #ededed)' }}
                                        />
                                        <CityAutocomplete
                                            value={arrivalCity}
                                            onChange={setArrivalCity}
                                            label="Ville d'arrivée"
                                            placeholder="Ex. Marseille, Bordeaux..."
                                            containerStyle={{ color: 'var(--foreground, #ededed)' }}
                                        />
                                    </div>

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

                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                            Budget maximum (€)
                                        </label>
                                        <div className="input-assistant w-full">
                                            <span className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>€</span>
                                            <input
                                                type="number"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                placeholder="0"
                                                className="flex-grow"
                                            />
                                        </div>
                                    </div>

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

                                    <div className="pt-4">
                                        <Button
                                            label="Rechercher les vols"
                                            onClick={!isLoading ? onSearch : undefined}
                                            variant="light"
                                            loading={isLoading}
                                            disabled={isLoading}
                                            className="w-full py-3 text-lg font-bold"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Résultats */
                                <div className="flex flex-col min-h-[400px]" style={{ color: '#ededed' }}>
                                    <h3 className="text-lg font-semibold mb-4 shrink-0" style={{ color: '#ededed' }}>
                                        Meilleures offres trouvées
                                    </h3>
                                    <div className="flex-1 min-h-[300px] overflow-y-auto">
                                        <FlightResults data={apiResponse} onSelectOffer={onSelectOffer} />
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
