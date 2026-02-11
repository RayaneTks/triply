import React from 'react';
import { CityAutocomplete } from '@/src/components/CityAutocomplete/CityAutocomplete';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { Button } from '@/src/components/Button/Button';

interface TripConfigurationFormProps {
    mapboxToken: string;
    departureCity: string;
    setDepartureCity: (value: string) => void;
    arrivalCity: string;
    setArrivalCity: (value: string) => void;
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
    onSearch: () => void;
    isLoading: boolean;
}

const loaderIcon = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const TripConfigurationForm: React.FC<TripConfigurationFormProps> = ({
                                                                                mapboxToken,
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
                                                                                onSearch,
                                                                                isLoading,
                                                                            }) => {
    return (
        <div
            className="flex flex-col h-full p-8 overflow-y-auto slide-content-scroll"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style>{`.slide-content-scroll::-webkit-scrollbar { display: none !important; }`}</style>

            <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground, #ededed)' }}>
                Configurez votre voyage
            </h1>

            <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CityAutocomplete
                        value={departureCity}
                        onChange={setDepartureCity}
                        label="Ville de départ"
                        placeholder="Ex. Paris, Lyon..."
                        mapboxToken={mapboxToken}
                        containerStyle={{ color: 'var(--foreground, #ededed)' }}
                    />
                    <CityAutocomplete
                        value={arrivalCity}
                        onChange={setArrivalCity}
                        label="Ville d'arrivée"
                        placeholder="Ex. Marseille, Bordeaux..."
                        mapboxToken={mapboxToken}
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

                <div className="pt-4">
                    <Button
                        // Change le label si ça charge
                        label={
                            isLoading ? (
                                <div className="flex items-center justify-center">
                                    {loaderIcon} Recherche...
                                </div>
                            ) : (
                                "Rechercher les vols"
                            )
                        }

                        // Empêche le clic si ça charge
                        onClick={!isLoading ? onSearch : undefined}

                        variant="light"
                        className={`w-full py-3 text-lg font-bold ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}

                        // Si ton composant Button accepte une prop disabled, utilise-la :
                        // disabled={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};