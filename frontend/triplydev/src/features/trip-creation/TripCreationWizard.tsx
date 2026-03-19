import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { TruckIcon, UserIcon, MapPinIcon, ClockIcon, ChatBubbleLeftRightIcon, Bars3Icon, CalendarDaysIcon, ChevronDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Bike } from 'lucide-react';
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { UseTripConfigurationResult } from './useTripConfiguration';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';

type PanelView = 'plan' | 'activity';

export type DayActivityPoi = MapboxPoiFeature & { lngLat: { lng: number; lat: number }; _dragId?: string };

function DaySelector({ selectedDay, travelDays, onSelect }: { selectedDay: number; travelDays: number; onSelect: (day: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const days = Array.from({ length: Math.max(1, travelDays) }, (_, i) => i + 1);

    return (
        <div className="flex items-center gap-2" ref={containerRef}>
            <CalendarDaysIcon className="h-5 w-5 shrink-0 text-cyan-400" />
            <div className="relative flex-1">
                <button
                    type="button"
                    onClick={() => setIsOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 py-2.5 pl-4 pr-10 text-[13px] font-semibold text-slate-100 outline-none transition-colors hover:bg-white/10 focus:border-cyan-500/60 focus:bg-cyan-500/10 focus:ring-2 focus:ring-cyan-500/30"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                >
                    <span>Jour {selectedDay}</span>
                    <ChevronDownIcon className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div
                        className="absolute left-0 right-0 top-full z-50 mt-2 max-h-48 overflow-y-auto rounded-xl shadow-xl"
                        style={{
                            backgroundColor: 'var(--background, #222222)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        }}
                    >
                        {days.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => {
                                    onSelect(d);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center px-4 py-3 text-left text-[13px] font-medium transition-all duration-150 hover:bg-cyan-500/15 hover:text-cyan-300 ${
                                    d === selectedDay ? 'bg-cyan-500/15 text-cyan-400' : 'bg-transparent text-slate-100'
                                }`}
                            >
                                Jour {d}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Durée estimée selon le type de POI (layer Mapbox) */
function getEstimatedDuration(layerId?: string): string {
    if (!layerId) return '~1h';
    const id = layerId.toLowerCase();
    if (id.includes('restaurant') || id.includes('food') || id.includes('cafe') || id.includes('bar')) return '1h–2h';
    if (id.includes('museum') || id.includes('gallery') || id.includes('theater')) return '1h30–3h';
    if (id.includes('park') || id.includes('nature') || id.includes('garden')) return '1h–2h';
    if (id.includes('place-city') || id.includes('place-town')) return '2h–4h';
    if (id.includes('shop') || id.includes('store')) return '30min–1h';
    return '~1h';
}

/** Coût moyen estimé selon le type de POI (layer Mapbox + nom + class) */
function getEstimatedCost(layerId?: string, hint?: string): string {
    const id = [layerId, hint].filter(Boolean).join(' ').toLowerCase();
    if (!id) return '~15 €';
    if (id.includes('restaurant') || id.includes('food') || id.includes('cafe') || id.includes('bar') || id.includes('bistro')) return '15–40 €';
    if (id.includes('museum') || id.includes('musée') || id.includes('gallery') || id.includes('galerie') || id.includes('theater') || id.includes('théâtre')) return '10–20 €';
    if (id.includes('park') || id.includes('parc') || id.includes('nature') || id.includes('garden') || id.includes('jardin')) return 'Gratuit';
    if (id.includes('place-city') || id.includes('place-town') || id.includes('place-village')) return 'Gratuit';
    if (id.includes('shop') || id.includes('store') || id.includes('boutique')) return '20–100 €';
    return '~15 €';
}

/** Convertit la durée affichée en heures (nombre) pour le calcul de la barre de progression */
export function getEstimatedDurationHours(layerId?: string): number {
    const s = getEstimatedDuration(layerId);
    // "~1h" -> 1, "1h–2h" -> 1.5, "1h30–3h" -> 2.25, "30min–1h" -> 0.75, "2h–4h" -> 3
    const simple = s.match(/^~?(\d+(?:\.\d+)?)h$/);
    if (simple) return parseFloat(simple[1]);
    const minRange = s.match(/(\d+)\s*min\s*–\s*(\d+(?:\.\d+)?)h/);
    if (minRange) return (parseInt(minRange[1], 10) / 60 + parseFloat(minRange[2])) / 2;
    const hMinRange = s.match(/(\d+)h(\d+)\s*–\s*(\d+(?:\.\d+)?)h/);
    if (hMinRange) {
        const a = parseInt(hMinRange[1], 10) + parseInt(hMinRange[2], 10) / 60;
        const b = parseFloat(hMinRange[3]);
        return (a + b) / 2;
    }
    const rangeH = s.match(/(\d+(?:\.\d+)?)h?\s*–\s*(\d+(?:\.\d+)?)h/);
    if (rangeH) return (parseFloat(rangeH[1].replace('h', '')) + parseFloat(rangeH[2].replace('h', ''))) / 2;
    const minOnly = s.match(/(\d+)\s*min/);
    if (minOnly) return parseInt(minOnly[1], 10) / 60;
    return 1;
}

function ActivityCard({
    poi,
    index,
    onRemove,
}: {
    poi: DayActivityPoi;
    index: number;
    onRemove?: () => void;
}) {
    const name = poi.properties?.name ?? poi.properties?.name_en ?? poi.layer?.id ?? 'Lieu';
    const [address, setAddress] = useState<string | null>(null);
    const [addressLoading, setAddressLoading] = useState(true);
    const duration = getEstimatedDuration(poi.layer?.id);
    const costHint = [poi.properties?.class, name].filter(Boolean).join(' ');
    const cost = getEstimatedCost(poi.layer?.id, costHint);
    const dragControls = useDragControls();

    useEffect(() => {
        let cancelled = false;
        setAddressLoading(true);
        fetch(`/api/geocode/reverse?lng=${poi.lngLat.lng}&lat=${poi.lngLat.lat}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data.address) setAddress(data.address);
            })
            .catch(() => {
                if (!cancelled) setAddress(null);
            })
            .finally(() => {
                if (!cancelled) setAddressLoading(false);
            });
        return () => { cancelled = true; };
    }, [poi.lngLat.lng, poi.lngLat.lat]);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.lngLat.lat},${poi.lngLat.lng}`;

    return (
        <Reorder.Item
            value={poi}
            id={poi._dragId ?? `${poi.lngLat.lng}-${poi.lngLat.lat}-${String(name)}`}
            dragListener={false}
            dragControls={dragControls}
            className="rounded-xl border border-white/10 bg-white/[0.06] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.08] list-none"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300 touch-none"
                        style={{ touchAction: 'none' }}
                        title="Glisser pour réordonner"
                        aria-label="Glisser pour réordonner"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="mb-1.5 text-[14px] font-semibold text-slate-100 truncate">
                            {String(name)}
                        </h4>
                    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-cyan-400">
                        <span className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Temps moyen : {duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <BanknotesIcon className="h-3.5 w-3.5" />
                            Coût moyen : {cost}
                        </span>
                    </div>
                    <div className="flex items-start gap-2 text-[12px] text-slate-400">
                        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        {addressLoading ? (
                            <span className="animate-pulse">Chargement de l&apos;adresse...</span>
                        ) : address ? (
                            <span className="line-clamp-2">{address}</span>
                        ) : (
                            <span className="italic">Adresse non disponible</span>
                        )}
                    </div>
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[12px] font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-500/40"
                        >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            Laisser un avis
                        </a>
                    </div>
                </div>
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
                        title="Retirer"
                        aria-label={`Retirer ${name}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </Reorder.Item>
    );
}

interface TripCreationWizardProps {
    state: UseTripConfigurationResult;
    multiSelectOptions: string[];
    selectedFlight: FlightOffer | null;
    selectedFlightCarrierName: string;
    selectedHotel: HotelOffer | null;
    isFlightModalOpen: boolean;
    isHotelModalOpen: boolean;
    onOpenFlightSearch: () => void;
    onCloseFlightSearch: () => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch: () => void;
    onFlightCardClick: () => void;
    onRemoveFlight: () => void;
    onHotelCardClick: () => void;
    onRemoveHotel: () => void;
    selectedDay?: number;
    onSelectedDayChange?: (day: number) => void;
    travelDays?: number;
    dayActivities?: DayActivityPoi[];
    onRemoveDayActivity?: (index: number) => void;
    onReorderDayActivities?: (reordered: DayActivityPoi[]) => void;
    dayRoutes?: Partial<Record<'driving' | 'walking' | 'cycling', { geometry: GeoJSON.LineString; duration: number }>>;
    selectedRouteType?: 'driving' | 'walking' | 'cycling' | null;
    onSelectRouteType?: (type: 'driving' | 'walking' | 'cycling' | null) => void;
    onComplete?: () => void;
}

export const TripCreationWizard: React.FC<TripCreationWizardProps> = ({
    state,
    multiSelectOptions,
    selectedFlight,
    selectedFlightCarrierName,
    selectedHotel,
    isFlightModalOpen,
    isHotelModalOpen,
    onOpenFlightSearch,
    onCloseFlightSearch,
    onOpenHotelSearch,
    onCloseHotelSearch,
    onFlightCardClick,
    onRemoveFlight,
    onHotelCardClick,
    onRemoveHotel,
    selectedDay = 1,
    onSelectedDayChange,
    travelDays = 1,
    dayActivities = [],
    onRemoveDayActivity,
    onReorderDayActivities,
    dayRoutes = {},
    selectedRouteType = null,
    onSelectRouteType,
    onComplete,
}) => {
    const filledFields = useMemo(() => {
        return [
            state.arrivalCity,
            state.outboundDate && state.returnDate,
            state.travelerCount > 0,
            selectedFlight,
            selectedHotel,
            state.budget,
        ].filter(Boolean).length;
    }, [state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount, selectedFlight, selectedHotel, state.budget]);

    const hasMinimum = !!state.arrivalCity && !!state.outboundDate && !!state.returnDate;
    const [activeView, setActiveView] = useState<PanelView>('plan');

    return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            {/* Tabs pour basculer entre les vues */}
            <div className="shrink-0 border-b border-white/10">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setActiveView('plan')}
                        className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${
                            activeView === 'plan'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Planifiez votre voyage
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView('activity')}
                        className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${
                            activeView === 'activity'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Activité de la journée
                    </button>
                </div>
            </div>

            {/* Contenu selon la vue active */}
            {activeView === 'plan' ? (
                <>
                    {/* Form content - scrollable */}
                    <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                        <TripConfigurationForm
                            departureCity={state.departureCity}
                            setDepartureCity={state.setDepartureCity}
                            arrivalCity={state.arrivalCity}
                            setArrivalCity={state.setArrivalCity}
                            setArrivalCityName={state.setArrivalCityName}
                            travelDays={state.travelDays}
                            setTravelDays={state.setTravelDays}
                            travelerCount={state.travelerCount}
                            setTravelerCount={state.setTravelerCount}
                            budget={state.budget}
                            setBudget={state.setBudget}
                            activityTime={state.activityTime}
                            setActivityTime={state.setActivityTime}
                            arrivalDate={state.outboundDate}
                            setArrivalDate={state.setOutboundDate}
                            departureDate={state.returnDate}
                            setDepartureDate={state.setReturnDate}
                            arrivalTime={state.arrivalTime}
                            setArrivalTime={state.setArrivalTime}
                            departureTime={state.departureTime}
                            setDepartureTime={state.setDepartureTime}
                            selectedOptions={state.selectedOptions}
                            setSelectedOptions={state.setSelectedOptions}
                            multiSelectOptions={multiSelectOptions}
                            onOpenFlightSearch={onOpenFlightSearch}
                            onCloseFlightSearch={onCloseFlightSearch}
                            flightSearchChecked={isFlightModalOpen}
                            selectedFlight={selectedFlight}
                            selectedFlightCarrierName={selectedFlightCarrierName}
                            onFlightCardClick={onFlightCardClick}
                            onRemoveFlight={onRemoveFlight}
                            onOpenHotelSearch={onOpenHotelSearch}
                            onCloseHotelSearch={onCloseHotelSearch}
                            hotelSearchChecked={isHotelModalOpen}
                            selectedHotel={selectedHotel}
                            onHotelCardClick={onHotelCardClick}
                            onRemoveHotel={onRemoveHotel}
                        />
                    </div>

                    {/* CTA Footer - Plan */}
                    <div className="shrink-0 border-t border-white/10 px-3 py-3">
                        {filledFields > 0 && (
                            <div className="mb-2 flex items-center gap-1.5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${i < filledFields ? 'bg-cyan-500' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onComplete}
                            className={`w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                                hasMinimum
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 active:scale-[0.98]'
                                    : 'bg-white/[0.06] text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            {hasMinimum ? 'Lancer Triply' : 'Renseignez au moins une destination et des dates'}
                        </button>
                    </div>
                </>
            ) : (
                /* Activité de la journée - POIs sélectionnés sur la carte */
                <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                        {/* En-tête avec sélecteur de jour */}
                        <div className="mb-4 flex flex-col gap-3">
                            {onSelectedDayChange && travelDays > 0 && (
                                <DaySelector
                                    selectedDay={selectedDay}
                                    travelDays={travelDays}
                                    onSelect={onSelectedDayChange}
                                />
                            )}
                            <p className="text-[12px] text-slate-400">
                                Cliquez sur un lieu sur la carte pour l&apos;ajouter à votre journée.
                            </p>
                        </div>
                        {dayActivities.length >= 2 && Object.keys(dayRoutes).length > 0 && onSelectRouteType && (
                            <div className="mb-4">
                                <p className="mb-2 text-[11px] font-medium text-slate-500">
                                    Choisir un itinéraire
                                </p>
                                <div className="flex w-full gap-2">
                                    {(['driving', 'walking', 'cycling'] as const).map((type) => {
                                        if (!dayRoutes[type]) return null;
                                        const labels = { driving: 'Voiture', walking: 'À pied', cycling: 'Vélo' };
                                        const isActive = selectedRouteType === type;
                                        const durationMin = Math.round(dayRoutes[type]!.duration / 60);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => onSelectRouteType(isActive ? null : type)}
                                                className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 min-w-0 transition-all active:scale-[0.98] ${
                                                    isActive
                                                        ? 'border-cyan-500/80 bg-cyan-500/20 shadow-md shadow-cyan-500/20'
                                                        : 'border-white/10 bg-slate-800/50 hover:border-white/20 hover:bg-slate-800/80'
                                                }`}
                                            >
                                                {type === 'driving' && (
                                                    <TruckIcon className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                {type === 'walking' && (
                                                    <UserIcon className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                {type === 'cycling' && (
                                                    <Bike className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                <span className={`text-[11px] font-semibold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                                                    {labels[type]}
                                                </span>
                                                <span className={`text-[13px] font-bold tabular-nums ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                                    {durationMin} min
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {dayActivities.length === 0 ? (
                            <p className="text-[13px] text-slate-500 italic">
                                Aucune activité ajoutée.
                            </p>
                        ) : (
                            <Reorder.Group
                                axis="y"
                                values={dayActivities}
                                onReorder={onReorderDayActivities ?? (() => {})}
                                className="flex flex-col gap-3"
                            >
                                {dayActivities.map((poi, index) => (
                                    <ActivityCard
                                        key={poi._dragId ?? `${poi.lngLat.lng.toFixed(6)}-${poi.lngLat.lat.toFixed(6)}-${index}`}
                                        poi={poi}
                                        index={index}
                                        onRemove={onRemoveDayActivity ? () => onRemoveDayActivity(index) : undefined}
                                    />
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
