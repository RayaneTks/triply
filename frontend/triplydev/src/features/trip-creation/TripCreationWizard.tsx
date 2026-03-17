import React, { useMemo } from 'react';
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { UseTripConfigurationResult } from './useTripConfiguration';

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
    onComplete,
}) => {
    const filledFields = useMemo(() => {
        let count = 0;
        if (state.arrivalCity) count++;
        if (state.outboundDate && state.returnDate) count++;
        if (state.travelerCount > 0) count++;
        if (selectedFlight) count++;
        if (selectedHotel) count++;
        if (state.budget) count++;
        return count;
    }, [state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount, selectedFlight, selectedHotel, state.budget]);

    const hasMinimum = !!state.arrivalCity && !!state.outboundDate && !!state.returnDate;

    return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            {/* Header */}
            <div className="shrink-0 border-b border-white/10 px-4 py-3">
                <h2 className="text-[15px] font-bold text-slate-100">Planifiez votre voyage</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">
                    Remplissez ce que vous savez, Triply s'occupe du reste.
                </p>
            </div>

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

            {/* CTA Footer */}
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
        </div>
    );
};
