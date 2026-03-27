import React, { useState } from 'react';
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
    /** Coordonnées de la destination (Amadeus) au moment du choix dans l’autocomplete */
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
    /** Retour à l’écran de sélection du mode (pleine IA / semi-IA / manuel) */
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
        outboundDepartureTime, setOutboundDepartureTime,
        outboundArrivalTime, setOutboundArrivalTime,
        returnDepartureTime, setReturnDepartureTime,
        returnArrivalTime, setReturnArrivalTime,
        selectedOptions, setSelectedOptions, multiSelectOptions,
        dietaryMultiSelectOptions, dietarySelections, setDietarySelections,
        onOpenFlightSearch,
        onCloseFlightSearch,
        onCloseHotelSearch,
        selectedFlight,
        selectedFlightCarrierName = '',
        onFlightCardClick, onRemoveFlight, setArrivalCityName, onArrivalGeoSelect,
        onOpenHotelSearch, selectedHotel, onHotelCardClick, onRemoveHotel,
        onBackToPlanningMode,
        manualFlightEntry,
        setManualFlightEntry,
        manualFlightAirline,
        setManualFlightAirline,
        manualFlightNumber,
        setManualFlightNumber,
        manualFlightNumberReturn,
        setManualFlightNumberReturn,
        manualHotelEntry,
        setManualHotelEntry,
        manualHotelName,
        setManualHotelName,
        manualHotelAddress,
        setManualHotelAddress,
        manualHotelCheckIn,
        setManualHotelCheckIn,
        manualHotelCheckOut,
        setManualHotelCheckOut,
    } = props;

    const inputCls = 'flex h-10 w-full min-w-0 items-center rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-[13px] text-slate-100 placeholder:text-slate-600 outline-none focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-colors overflow-hidden';
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50">
            <div className="space-y-5">
                {onBackToPlanningMode && (
                    <button
                        type="button"
                        onClick={onBackToPlanningMode}
                        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-[12px] font-semibold text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-white/[0.06] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background,#222222)]"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-slate-400"
                            aria-hidden
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Retour au choix du plan
                    </button>
                )}

                {/* 1 - Destination */}
                <Section icon={svg("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z")} title="Où allez-vous ?">
                    <div className="space-y-2.5">
                        <CityAutocomplete value={departureCity} onChange={setDepartureCity} label="Ville de départ" placeholder="Ex. Paris, Lyon..." />
                        <CityAutocomplete
                            value={arrivalCity}
                            onChange={setArrivalCity}
                            onSelectName={(n) => setArrivalCityName?.(n)}
                            onSelectGeo={onArrivalGeoSelect}
                            label="Destination"
                            placeholder="Ex. Barcelone, Tokyo..."
                        />
                    </div>
                </Section>

                {/* 2 - Dates */}
                <Section icon={svg("M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z")} title="Quand partez-vous ?">
                    <DateRangePicker startDate={arrivalDate} endDate={departureDate} onDatesChange={(s, e) => { setArrivalDate(s); setDepartureDate(e); }} className="mb-2.5 w-full" />
                    <p className="mb-1.5 text-[11px] font-medium text-slate-500">Vol aller</p>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                        <TimePicker value={outboundDepartureTime} onChange={setOutboundDepartureTime} label="Décollage" />
                        <TimePicker value={outboundArrivalTime} onChange={setOutboundArrivalTime} label="Atterrissage" />
                    </div>
                    <p className="mb-1.5 text-[11px] font-medium text-slate-500">Vol retour</p>
                    <div className="grid grid-cols-2 gap-2">
                        <TimePicker value={returnDepartureTime} onChange={setReturnDepartureTime} label="Décollage" />
                        <TimePicker value={returnArrivalTime} onChange={setReturnArrivalTime} label="Atterrissage" />
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

                <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-[12px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]"
                >
                    <span>Options avancées (vol, hôtel, budget, préférences)</span>
                    <span className="text-slate-400">{showAdvanced ? 'Masquer' : 'Afficher'}</span>
                </button>

                {showAdvanced && (
                <>
                {/* 4 - Transport */}
                <Section icon={svg("M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z")} title="Transport" tag="optionnel">
                    <label className="mb-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <input
                            type="checkbox"
                            checked={manualFlightEntry}
                            onChange={(e) => {
                                const on = e.target.checked;
                                setManualFlightEntry(on);
                                if (on) onCloseFlightSearch?.();
                            }}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50"
                        />
                        <span className="text-[12px] leading-snug text-slate-300">
                            <span className="font-semibold text-slate-200">Saisir un vol manuellement</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                                Masque la recherche. Horaires : section « Quand partez-vous ? » (vol aller / retour).
                            </span>
                        </span>
                    </label>
                    {manualFlightEntry ? (
                        <div className="space-y-2.5">
                            <div className={inputCls}>
                                <input
                                    type="text"
                                    value={manualFlightAirline}
                                    onChange={(e) => setManualFlightAirline(e.target.value)}
                                    placeholder="Compagnie (ex. Air France)"
                                    className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">N° vol aller</label>
                                    <div className={inputCls}>
                                        <input
                                            type="text"
                                            value={manualFlightNumber}
                                            onChange={(e) => setManualFlightNumber(e.target.value)}
                                            placeholder="AF123"
                                            className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">N° vol retour</label>
                                    <div className={inputCls}>
                                        <input
                                            type="text"
                                            value={manualFlightNumberReturn}
                                            onChange={(e) => setManualFlightNumberReturn(e.target.value)}
                                            placeholder="optionnel"
                                            className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            {selectedFlight ? (
                                <SelectedFlightCard
                                    offer={selectedFlight}
                                    carrierName={selectedFlightCarrierName}
                                    onClick={onFlightCardClick || (() => {})}
                                    onRemove={onRemoveFlight}
                                />
                            ) : (
                                <p className="text-[11px] text-slate-500">
                                    Renseignez départ, destination et dates plus haut pour afficher le récapitulatif.
                                </p>
                            )}
                        </div>
                    ) : selectedFlight ? (
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
                    <label className="mb-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <input
                            type="checkbox"
                            checked={manualHotelEntry}
                            onChange={(e) => {
                                const on = e.target.checked;
                                setManualHotelEntry(on);
                                if (on) {
                                    onCloseHotelSearch?.();
                                    if (!manualHotelCheckIn.trim() && arrivalDate) setManualHotelCheckIn(arrivalDate);
                                    if (!manualHotelCheckOut.trim() && departureDate) setManualHotelCheckOut(departureDate);
                                }
                            }}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50"
                        />
                        <span className="text-[12px] leading-snug text-slate-300">
                            <span className="font-semibold text-slate-200">Saisir un hôtel manuellement</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">Masque la recherche. Adresse et dates d&apos;hébergement.</span>
                        </span>
                    </label>
                    {manualHotelEntry ? (
                        <div className="space-y-2.5">
                            <div className={inputCls}>
                                <input
                                    type="text"
                                    value={manualHotelName}
                                    onChange={(e) => setManualHotelName(e.target.value)}
                                    placeholder="Nom de l'hébergement"
                                    className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none"
                                />
                            </div>
                            <div className={inputCls}>
                                <input
                                    type="text"
                                    value={manualHotelAddress}
                                    onChange={(e) => setManualHotelAddress(e.target.value)}
                                    placeholder="Adresse complète"
                                    className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Check-in</label>
                                    <div className={inputCls}>
                                        <input
                                            type="date"
                                            value={manualHotelCheckIn}
                                            onChange={(e) => setManualHotelCheckIn(e.target.value)}
                                            className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Check-out</label>
                                    <div className={inputCls}>
                                        <input
                                            type="date"
                                            value={manualHotelCheckOut}
                                            onChange={(e) => setManualHotelCheckOut(e.target.value)}
                                            className="h-full w-full min-w-0 bg-transparent text-[13px] text-slate-100 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            {selectedHotel ? (
                                <SelectedHotelCard offer={selectedHotel} onClick={onHotelCardClick || (() => {})} onRemove={onRemoveHotel} />
                            ) : (
                                <p className="text-[11px] text-slate-500">Nom ou adresse + dates pour afficher le récapitulatif.</p>
                            )}
                        </div>
                    ) : selectedHotel ? (
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
                </>
                )}

            </div>
        </div>
    );
};
