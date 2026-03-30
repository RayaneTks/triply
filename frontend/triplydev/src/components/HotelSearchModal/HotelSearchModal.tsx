'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hotel, Users, Banknote, Utensils, Calendar, Settings2, X, ChevronDown } from 'lucide-react';
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

export const HOTEL_MEAL_REGIME_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Aucune préférence' },
    { value: 'ROOM_ONLY', label: 'Chambre seule' },
    { value: 'BREAKFAST', label: 'Petit-déjeuner' },
    { value: 'HALF_BOARD', label: 'Demi-pension' },
    { value: 'FULL_BOARD', label: 'Pension complète' },
    { value: 'ALL_INCLUSIVE', label: 'Tout compris' },
];

function MealRegimeSelector({ value, onChange }: { value: string; onChange: (next: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selectedLabel = HOTEL_MEAL_REGIME_OPTIONS.find(o => o.value === value)?.label ?? 'Aucune préférence';

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
            >
                <span className="flex items-center gap-2">
                    <Utensils size={16} className="text-cyan-400" />
                    {selectedLabel}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full z-[110] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] p-1 shadow-2xl"
                    >
                        {HOTEL_MEAL_REGIME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value} type="button"
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${value === opt.value ? 'text-cyan-400 font-bold bg-cyan-500/5' : 'text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
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

export const HotelSearchModal: React.FC<HotelSearchModalProps> = (props) => {
    const {
        visible, onClose, cityCode, setCityCode, arrivalDate, setArrivalDate, departureDate, setDepartureDate,
        travelerCount, setTravelerCount, budget, setBudget, mealRegime, setMealRegime,
        selectedOptions = [], setSelectedOptions, multiSelectOptions = HOTEL_PREFERENCE_OPTIONS,
        onSearch, onNewSearch, onSelectOffer, isLoading, apiResponse
    } = props;

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearchClick = () => {
        if (isLoading) return;
        const e: Record<string, string> = {};
        if (!cityCode.trim()) e.city = 'Requis';
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
                        <div className="flex items-center justify-between border-b border-white/5 p-4 md:p-6 md:px-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Hotel size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Recherche d&apos;hôtels</h2>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Amadeus Intelligence</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-10">
                            {!apiResponse || !('data' in apiResponse) ? (
                                <div className="mx-auto max-w-3xl space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                                        <CityAutocomplete value={cityCode} onChange={setCityCode} placeholder="Où souhaitez-vous dormir ?" />
                                        {errors.city && <p className="text-[10px] text-red-400">Champ requis</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Users size={18} />
                                                <span className="text-sm font-semibold">Voyageurs</span>
                                            </div>
                                            <TravelerCounter count={travelerCount} onChange={setTravelerCount} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Banknote size={18} />
                                                <span className="text-sm font-semibold">Budget / nuit</span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
                                                <input 
                                                    type="number" value={budget} onChange={e => setBudget(e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500/50"
                                                    placeholder="Ex: 150"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Utensils size={18} />
                                                <span className="text-sm font-semibold">Régime alimentaire</span>
                                            </div>
                                            <MealRegimeSelector value={mealRegime} onChange={setMealRegime} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Calendar size={18} />
                                                <span className="text-sm font-semibold">Période du séjour</span>
                                            </div>
                                            <DateRangePicker 
                                                startDate={arrivalDate} endDate={departureDate}
                                                onDatesChange={(s, e) => { setArrivalDate(s); setDepartureDate(e); }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <Settings2 size={18} />
                                            <span className="text-sm font-semibold">Préférences & Commodités</span>
                                        </div>
                                        <MultiSelect options={multiSelectOptions} selectedValues={selectedOptions} onChange={setSelectedOptions ?? (() => {})} />
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            onClick={handleSearchClick} disabled={isLoading}
                                            className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? 'Recherche en cours...' : 'Trouver les meilleurs hôtels'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full text-slate-100">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-lg font-bold">Hôtels recommandés</h3>
                                        <button onClick={onNewSearch} className="text-xs font-semibold text-emerald-400 hover:underline">Nouvelle recherche</button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <HotelResults data={apiResponse} onSelectOffer={onSelectOffer} />
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
