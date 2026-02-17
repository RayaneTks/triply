'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { Button } from '@/src/components/Button/Button';
import { HotelResults } from '@/src/components/HotelResults/HotelResults';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

export const HOTEL_PREFERENCE_OPTIONS = [
    'Petit déjeuner inclus', 'Proche du centre ville', 'Spa/piscine',
    'Plage', 'Équipement', 'Retour positif', 'Hôtel de luxe',
    'Animaux domestiques', 'Réservé aux adultes', 'Wi-Fi',
];

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
    selectedOptions?: string[];
    setSelectedOptions?: (options: string[]) => void;
    multiSelectOptions?: string[];
    onSearch: () => void;
    onNewSearch?: () => void;
    onSelectOffer?: (offer: HotelOffer) => void;
    isLoading: boolean;
    apiResponse: any;
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
    selectedOptions = [],
    setSelectedOptions,
    multiSelectOptions = HOTEL_PREFERENCE_OPTIONS,
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
                        className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-12 z-[9999] flex flex-col rounded-xl overflow-hidden max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-4rem)]"
                        style={{
                            backgroundColor: 'var(--background, #222222)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hotel-search-title"
                    >
                        <div
                            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                        >
                            <h2 id="hotel-search-title" className="text-xl font-semibold" style={{ color: 'var(--foreground, #ededed)' }}>
                                Recherche d'hôtels
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

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0" style={{ backgroundColor: '#222222' }}>
                            {!apiResponse?.data ? (
                                <div className="max-w-2xl mx-auto space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                            Ville / Destination
                                        </label>
                                        <CityAutocomplete
                                            value={cityCode}
                                            onChange={setCityCode}
                                            placeholder="Ex. Paris, Marseille..."
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
                                    </div>

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

                                    <div className="pt-4">
                                        <Button
                                            label="Rechercher les hôtels"
                                            onClick={!isLoading ? onSearch : undefined}
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
