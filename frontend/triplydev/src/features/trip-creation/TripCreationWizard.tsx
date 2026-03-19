import React, { useMemo, useState } from 'react';
import { TruckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Bike } from 'lucide-react';
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { UseTripConfigurationResult } from './useTripConfiguration';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';

type PanelView = 'plan' | 'activity';

export type DayActivityPoi = MapboxPoiFeature & { lngLat: { lng: number; lat: number } };

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
    dayActivities?: DayActivityPoi[];
    onRemoveDayActivity?: (index: number) => void;
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
    dayActivities = [],
    onRemoveDayActivity,
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
                        <p className="mb-3 text-[12px] text-slate-400">
                            Cliquez sur un lieu sur la carte pour l&apos;ajouter à votre journée.
                        </p>
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
                            <ul className="space-y-2">
                                {dayActivities.map((poi, index) => {
                                    const name = poi.properties?.name ?? poi.properties?.name_en ?? poi.layer?.id ?? 'Lieu';
                                    return (
                                        <li
                                            key={`${String(name)}-${poi.lngLat.lng.toFixed(5)}-${poi.lngLat.lat.toFixed(5)}-${index}`}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                                        >
                                            <span className="text-[13px] font-medium text-slate-100 truncate">
                                                {String(name)}
                                            </span>
                                            {onRemoveDayActivity && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveDayActivity(index)}
                                                    className="shrink-0 rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
                                                    title="Retirer"
                                                    aria-label={`Retirer ${name}`}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
