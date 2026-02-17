import React from 'react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { Button } from '@/src/components/Button/Button';
import { SelectedFlightCard } from '@/src/components/SelectedFlightCard/SelectedFlightCard';
import { SelectedHotelCard } from '@/src/components/SelectedHotelCard/SelectedHotelCard';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

interface TripConfigurationFormProps {
    departureCity: string;
    setDepartureCity: (value: string) => void;
    arrivalCity: string;
    setArrivalCity: (value: string) => void;
    setArrivalCityName?: (value: string) => void;
    travelDays: number;
    setTravelDays: (value: number) => void;
    travelerCount: number;
    setTravelerCount: (value: number) => void;
    budget: string;
    setBudget: (value: string) => void;
    activityTime: string;
    setActivityTime: (value: string) => void;
    arrivalDate: string;
    setArrivalDate: (value: string) => void;
    departureDate: string;
    setDepartureDate: (value: string) => void;
    arrivalTime: string;
    setArrivalTime: (value: string) => void;
    departureTime: string;
    setDepartureTime: (value: string) => void;
    selectedOptions: string[];
    setSelectedOptions: (options: string[]) => void;
    multiSelectOptions: string[];
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

export const TripConfigurationForm: React.FC<TripConfigurationFormProps> = ({
                                                                                departureCity, setDepartureCity,
                                                                                arrivalCity, setArrivalCity,
                                                                                travelDays, setTravelDays,
                                                                                travelerCount, setTravelerCount,
                                                                                budget, setBudget,
                                                                                activityTime, setActivityTime,
                                                                                arrivalDate, setArrivalDate,
                                                                                departureDate, setDepartureDate,
                                                                                arrivalTime, setArrivalTime,
                                                                                departureTime, setDepartureTime,
                                                                                selectedOptions, setSelectedOptions,
                                                                                multiSelectOptions,
                                                                                onOpenFlightSearch,
                                                                                onCloseFlightSearch,
                                                                                flightSearchChecked = false,
                                                                                selectedFlight,
                                                                                selectedFlightCarrierName = '',
                                                                                onFlightCardClick,
                                                                                onRemoveFlight,
                                                                                setArrivalCityName,
                                                                                onOpenHotelSearch,
                                                                                onCloseHotelSearch,
                                                                                hotelSearchChecked = false,
                                                                                selectedHotel,
                                                                                onHotelCardClick,
                                                                                onRemoveHotel,
                                                                            }) => {
    return (
        <div
            className="flex flex-col h-full p-4 sm:p-6 md:p-8 overflow-y-auto slide-content-scroll min-h-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style>{`.slide-content-scroll::-webkit-scrollbar { display: none !important; }`}</style>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--foreground, #ededed)' }}>
                Configurez votre voyage
            </h1>

            <div className="space-y-4 max-w-2xl w-full min-w-0">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input
                        type="checkbox"
                        checked={flightSearchChecked}
                        onChange={(e) => (e.target.checked ? onOpenFlightSearch() : onCloseFlightSearch?.())}
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-primary"
                        style={{ accentColor: 'var(--primary, #0096c7)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground, #ededed)' }}>
                        Rechercher des vols
                    </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input
                        type="checkbox"
                        checked={hotelSearchChecked}
                        onChange={(e) => (e.target.checked ? onOpenHotelSearch() : onCloseHotelSearch?.())}
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-primary"
                        style={{ accentColor: 'var(--primary, #0096c7)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground, #ededed)' }}>
                        Rechercher des hôtels
                    </span>
                </label>

                {selectedFlight && (
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Billet sélectionné
                        </label>
                        <SelectedFlightCard
                            offer={selectedFlight}
                            carrierName={selectedFlightCarrierName}
                            onClick={onFlightCardClick || (() => {})}
                            onRemove={onRemoveFlight}
                        />
                    </div>
                )}

                {selectedHotel && (
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Hôtel sélectionné
                        </label>
                        <SelectedHotelCard
                            offer={selectedHotel}
                            onClick={onHotelCardClick || (() => {})}
                            onRemove={onRemoveHotel}
                        />
                    </div>
                )}

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
                        onSelectName={(name) => setArrivalCityName?.(name)}
                        label="Ville d'arrivée"
                        placeholder="Ex. Marseille, Bordeaux..."
                        containerStyle={{ color: 'var(--foreground, #ededed)' }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                        Nombre de jours de voyage
                    </label>
                    <div className="input-assistant w-full">
                        <input
                            type="number"
                            min={1}
                            value={travelDays === 0 ? '' : travelDays}
                            onChange={(e) => setTravelDays(Math.max(1, parseInt(e.target.value, 10) || 0))}
                            placeholder="Ex. 3"
                            className="w-full flex-grow"
                        />
                    </div>
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
                        Temps par jour d'activité (heures)
                    </label>
                    <div className="input-assistant w-full">
                        <input
                            type="number"
                            value={activityTime}
                            onChange={(e) => setActivityTime(e.target.value)}
                            placeholder="0"
                            min="0"
                            max="24"
                            className="flex-grow"
                        />
                        <span className="ml-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>h</span>
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
            </div>
        </div>
    );
};