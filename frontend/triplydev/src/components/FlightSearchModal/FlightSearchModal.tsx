'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Users, Banknote, Calendar, X, ArrowRight } from 'lucide-react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
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

export const FlightSearchModal: React.FC<FlightSearchModalProps> = (props) => {
    const {
        visible, onClose, departureCity, setDepartureCity, arrivalCity, setArrivalCity,
        arrivalDate, setArrivalDate, departureDate, setDepartureDate,
        travelerCount, setTravelerCount, budget, setBudget,
        onSearch, onNewSearch, onSelectOffer, isLoading, apiResponse
    } = props;

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearchClick = () => {
        if (isLoading) return;
        const e: Record<string, string> = {};
        if (!departureCity.trim()) e.dep = 'Requis';
        if (!arrivalCity.trim()) e.arr = 'Requis';
        if (!arrivalDate || !departureDate) e.dates = 'Requis';
        setErrors(e);
        if (Object.keys(e).length === 0) onSearch();
    };

    const modalContent = (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[9999] flex flex-col overflow-hidden rounded-none border border-white/10 bg-[#020617]/90 shadow-2xl backdrop-blur-2xl md:inset-12 lg:inset-24 md:rounded-3xl md:max-w-5xl md:mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 p-4 md:p-6 md:px-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                                    <Plane size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Recherche de vols</h2>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Amadeus Intelligence</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-10">
                            {!apiResponse || !('data' in apiResponse) ? (
                                <div className="mx-auto max-w-3xl space-y-8">
                                    {/* Route Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Départ</label>
                                            <CityAutocomplete value={departureCity} onChange={setDepartureCity} placeholder="D'où partez-vous ?" />
                                            {errors.dep && <p className="text-[10px] text-red-400">Champ requis</p>}
                                        </div>
                                        <div className="hidden md:flex mt-6 h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500">
                                            <ArrowRight size={16} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arrivée</label>
                                            <CityAutocomplete value={arrivalCity} onChange={setArrivalCity} placeholder="Quelle destination ?" />
                                            {errors.arr && <p className="text-[10px] text-red-400">Champ requis</p>}
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                <Users size={18} />
                                                <span className="text-sm font-semibold">Voyageurs</span>
                                            </div>
                                            <TravelerCounter count={travelerCount} onChange={setTravelerCount} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                <Banknote size={18} />
                                                <span className="text-sm font-semibold">Budget Max</span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
                                                <input 
                                                    type="number" value={budget} onChange={e => setBudget(e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500/50"
                                                    placeholder="Ex: 800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-cyan-400">
                                            <Calendar size={18} />
                                            <span className="text-sm font-semibold">Période du voyage</span>
                                        </div>
                                        <DateRangePicker 
                                            startDate={arrivalDate} endDate={departureDate}
                                            onDatesChange={(s, e) => { setArrivalDate(s); setDepartureDate(e); }}
                                        />
                                        {errors.dates && <p className="text-[10px] text-red-400">Veuillez sélectionner vos dates</p>}
                                    </div>

                                    {/* Search CTA */}
                                    <div className="pt-6">
                                        <button 
                                            onClick={handleSearchClick} disabled={isLoading}
                                            className="w-full rounded-2xl bg-cyan-500 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-900/40 hover:bg-cyan-400 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? 'Recherche en cours...' : 'Trouver les meilleurs vols'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">Offres Disponibles</h3>
                                        <button onClick={onNewSearch} className="text-xs font-semibold text-cyan-400 hover:underline">Nouvelle recherche</button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <FlightResults data={apiResponse} onSelectOffer={onSelectOffer} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
};
