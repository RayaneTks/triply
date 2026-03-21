import React from 'react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { SelectedFlightCard } from '@/src/components/SelectedFlightCard/SelectedFlightCard';
import { SelectedHotelCard } from '@/src/components/SelectedHotelCard/SelectedHotelCard';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

interface TripConfigurationFormProps {
    departureCity: string;
    setDepartureCity: (v: string) => void;
    arrivalCity: string;
    setArrivalCity: (v: string) => void;
    setArrivalCityName?: (v: string) => void;
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
    arrivalTime: string;
    setArrivalTime: (v: string) => void;
    departureTime: string;
    setDepartureTime: (v: string) => void;
    selectedOptions: string[];
    setSelectedOptions: (o: string[]) => void;
    multiSelectOptions: string[];
    /** Type d'alimentation (optionnel) */
    dietaryMultiSelectOptions: string[];
    dietarySelections: string[];
    setDietarySelections: (o: string[]) => void;
    onOpenFlightSearch: () => void;
    onCloseFlightSearch?: () => void;
    flightSearchChecked?: boolean;
    selectedFlight?: FlightOffer | null;
    selectedFlightCarrierName?: string;
    onFlightCardClick?: () => void;
    onRemoveFlight?: () => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch?: () => void;
    hotelSearchChecked?: boolean;
    selectedHotel?: HotelOffer | null;
    onHotelCardClick?: () => void;
    onRemoveHotel?: () => void;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; tag?: string; children: React.ReactNode }> = ({ icon, title, tag, children }) => (
    <fieldset className="min-w-0">
        <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: 'var(--primary, #0096c7)' }}>{icon}</span>
            <legend className="text-[12px] font-semibold uppercase tracking-wider text-slate-300">{title}</legend>
            {tag && <span className="ml-auto rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-500">{tag}</span>}
        </div>
        {children}
    </fieldset>
);

const svg = (d: string | React.ReactNode) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
);

const iconUser = (
    <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </>
);

/** Même étoile que « Budget & style » */
const iconSparkle = (
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
);

export const TripConfigurationForm: React.FC<TripConfigurationFormProps> = (props) => {
    const {
        departureCity, setDepartureCity, arrivalCity, setArrivalCity,
        travelDays, setTravelDays, travelerCount, setTravelerCount,
        budget, setBudget, activityTime, setActivityTime,
        arrivalDate, setArrivalDate, departureDate, setDepartureDate,
        arrivalTime, setArrivalTime, departureTime, setDepartureTime,
        selectedOptions, setSelectedOptions, multiSelectOptions,
        dietaryMultiSelectOptions, dietarySelections, setDietarySelections,
        onOpenFlightSearch, selectedFlight, selectedFlightCarrierName = '',
        onFlightCardClick, onRemoveFlight, setArrivalCityName,
        onOpenHotelSearch, selectedHotel, onHotelCardClick, onRemoveHotel,
    } = props;

    const inputCls = 'flex h-10 w-full min-w-0 items-center rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-[13px] text-slate-100 placeholder:text-slate-600 outline-none focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-colors overflow-hidden';

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50">
            <div className="space-y-5">

                {/* 1 - Destination */}
                <Section icon={svg("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z")} title="Où allez-vous ?">
                    <div className="space-y-2.5">
                        <CityAutocomplete value={departureCity} onChange={setDepartureCity} label="Ville de départ" placeholder="Ex. Paris, Lyon..." />
                        <CityAutocomplete value={arrivalCity} onChange={setArrivalCity} onSelectName={(n) => setArrivalCityName?.(n)} label="Destination" placeholder="Ex. Barcelone, Tokyo..." />
                    </div>
                </Section>

                {/* 2 - Dates */}
                <Section icon={svg("M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z")} title="Quand partez-vous ?">
                    <DateRangePicker startDate={arrivalDate} endDate={departureDate} onDatesChange={(s, e) => { setArrivalDate(s); setDepartureDate(e); }} className="mb-2.5 w-full" />
                    <div className="grid grid-cols-2 gap-2">
                        <TimePicker value={arrivalTime} onChange={setArrivalTime} label="Heure départ" />
                        <TimePicker value={departureTime} onChange={setDepartureTime} label="Heure retour" />
                    </div>
                </Section>

                {/* 3 - Voyageurs & séjour */}
                <Section icon={svg(iconUser)} title="Voyageurs & séjour">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0">
                            <label className="mb-1 block text-[12px] font-medium text-slate-300">Voyageurs</label>
                            <TravelerCounter count={travelerCount} onChange={setTravelerCount} className="w-full" />
                        </div>
                        <div className="min-w-0">
                            <label className="mb-1 block text-[12px] font-medium text-slate-300">Durée (jours)</label>
                            <div className={inputCls}>
                                <input type="number" min={1} value={travelDays === 0 ? '' : travelDays} onChange={(e) => setTravelDays(Math.max(1, parseInt(e.target.value, 10) || 0))} placeholder="3" className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none" />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 4 - Transport */}
                <Section icon={svg("M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z")} title="Transport" tag="optionnel">
                    {selectedFlight ? (
                        <SelectedFlightCard offer={selectedFlight} carrierName={selectedFlightCarrierName} onClick={onFlightCardClick || (() => {})} onRemove={onRemoveFlight} />
                    ) : (
                        <button type="button" onClick={onOpenFlightSearch} className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-3 text-left transition-all hover:border-cyan-500/40 hover:bg-cyan-500/[0.04]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20" style={{ color: 'var(--primary, #0096c7)' }}>
                                {svg("M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z")}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[13px] font-medium text-slate-200">Rechercher un vol</span>
                                <span className="block text-[11px] text-slate-500">Trouvez les meilleurs tarifs</span>
                            </span>
                        </button>
                    )}
                </Section>

                {/* 5 - Hébergement */}
                <Section icon={svg("M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.9M19 21V10.9")} title="Hébergement" tag="optionnel">
                    {selectedHotel ? (
                        <SelectedHotelCard offer={selectedHotel} onClick={onHotelCardClick || (() => {})} onRemove={onRemoveHotel} />
                    ) : (
                        <button type="button" onClick={onOpenHotelSearch} className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-3 text-left transition-all hover:border-cyan-500/40 hover:bg-cyan-500/[0.04]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20" style={{ color: 'var(--primary, #0096c7)' }}>
                                {svg("M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.9M19 21V10.9")}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[13px] font-medium text-slate-200">Rechercher un hôtel</span>
                                <span className="block text-[11px] text-slate-500">Comparez les offres d&apos;hébergement</span>
                            </span>
                        </button>
                    )}
                </Section>

                {/* 6 - Budget & style */}
                <Section icon={svg(iconSparkle)} title="Budget & style" tag="optionnel">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0">
                            <label className="mb-1 block text-[12px] font-medium text-slate-300">Budget</label>
                            <div className={inputCls}>
                                <span className="mr-1 shrink-0 text-[12px] text-slate-500">€</span>
                                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <label className="mb-1 block text-[12px] font-medium text-slate-300">Activité / jour</label>
                            <div className={inputCls}>
                                <input type="number" value={activityTime} onChange={(e) => setActivityTime(e.target.value)} placeholder="0" min="0" max="24" className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none" />
                                <span className="ml-1 shrink-0 text-[12px] text-slate-500">h</span>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 7 - Type d'alimentation */}
                <Section icon={svg(iconSparkle)} title={"Type d'alimentation"} tag="optionnel">
                    <MultiSelect
                        variant="tripForm"
                        options={dietaryMultiSelectOptions}
                        selectedValues={dietarySelections}
                        onChange={setDietarySelections}
                        placeholder="Ex. végétarien, sans gluten…"
                        className="w-full"
                    />
                </Section>

                {/* 8 - Préférences de voyage */}
                <Section icon={svg(iconSparkle)} title="Préférences de voyage" tag="optionnel">
                    <MultiSelect
                        variant="tripForm"
                        options={multiSelectOptions}
                        selectedValues={selectedOptions}
                        onChange={setSelectedOptions}
                        placeholder="Préférences de voyage…"
                        className="w-full"
                    />
                </Section>

            </div>
        </div>
    );
};
