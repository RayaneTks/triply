import { useCallback, useState } from 'react';

function daysBetween(start: string, end: string): number {
    if (!start || !end) return 0;
    const a = new Date(start);
    const b = new Date(end);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    const diff = b.getTime() - a.getTime();
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** Ajoute des jours calendaires à une date ISO YYYY-MM-DD (fuseau local). */
function addDaysToIsoDate(iso: string, daysToAdd: number): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return iso;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    dt.setDate(dt.getDate() + daysToAdd);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

export interface TripConfigurationState {
    departureCity: string;
    arrivalCity: string;
    arrivalCityName: string;
    travelDays: number;
    travelerCount: number;
    budget: string;
    activityTime: string;
    outboundDate: string;
    returnDate: string;
    /** Décollage vol aller */
    outboundDepartureTime: string;
    /** Atterrissage vol aller */
    outboundArrivalTime: string;
    /** Décollage vol retour */
    returnDepartureTime: string;
    /** Atterrissage vol retour */
    returnArrivalTime: string;
    selectedOptions: string[];
    /** Préférences alimentaires (optionnel) */
    dietarySelections: string[];
    /** Saisie vol sans recherche Amadeus */
    manualFlightEntry: boolean;
    manualFlightAirline: string;
    manualFlightNumber: string;
    manualFlightNumberReturn: string;
    /** Saisie hôtel sans recherche */
    manualHotelEntry: boolean;
    manualHotelName: string;
    manualHotelAddress: string;
    manualHotelCheckIn: string;
    manualHotelCheckOut: string;
}

export interface UseTripConfigurationResult extends TripConfigurationState {
    setDepartureCity: (v: string) => void;
    setArrivalCity: (v: string) => void;
    setArrivalCityName: (v: string) => void;
    setTravelDays: (v: number) => void;
    setTravelerCount: (v: number) => void;
    setBudget: (v: string) => void;
    setActivityTime: (v: string) => void;
    setOutboundDate: (v: string) => void;
    setReturnDate: (v: string) => void;
    setOutboundDepartureTime: (v: string) => void;
    setOutboundArrivalTime: (v: string) => void;
    setReturnDepartureTime: (v: string) => void;
    setReturnArrivalTime: (v: string) => void;
    setSelectedOptions: (values: string[]) => void;
    setDietarySelections: (values: string[]) => void;
    setManualFlightEntry: (v: boolean) => void;
    setManualFlightAirline: (v: string) => void;
    setManualFlightNumber: (v: string) => void;
    setManualFlightNumberReturn: (v: string) => void;
    setManualHotelEntry: (v: boolean) => void;
    setManualHotelName: (v: string) => void;
    setManualHotelAddress: (v: string) => void;
    setManualHotelCheckIn: (v: string) => void;
    setManualHotelCheckOut: (v: string) => void;
}

export function useTripConfiguration(initial?: Partial<TripConfigurationState>): UseTripConfigurationResult {
    const [departureCity, setDepartureCity] = useState(initial?.departureCity ?? '');
    const [arrivalCity, setArrivalCity] = useState(initial?.arrivalCity ?? '');
    const [arrivalCityName, setArrivalCityName] = useState(initial?.arrivalCityName ?? '');
    const [travelDaysFallback, setTravelDaysFallback] = useState(initial?.travelDays ?? 3);
    const [travelerCount, setTravelerCount] = useState(initial?.travelerCount ?? 1);
    const [budget, setBudget] = useState(initial?.budget ?? '');
    const [activityTime, setActivityTime] = useState(initial?.activityTime ?? '');
    const [outboundDate, setOutboundDate] = useState(initial?.outboundDate ?? '');
    const [returnDate, setReturnDate] = useState(initial?.returnDate ?? '');
    const [outboundDepartureTime, setOutboundDepartureTime] = useState(
        initial?.outboundDepartureTime ?? ''
    );
    const [outboundArrivalTime, setOutboundArrivalTime] = useState(initial?.outboundArrivalTime ?? '');
    const [returnDepartureTime, setReturnDepartureTime] = useState(initial?.returnDepartureTime ?? '');
    const [returnArrivalTime, setReturnArrivalTime] = useState(initial?.returnArrivalTime ?? '');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(initial?.selectedOptions ?? []);
    const [dietarySelections, setDietarySelections] = useState<string[]>(initial?.dietarySelections ?? []);
    const [manualFlightEntry, setManualFlightEntry] = useState(initial?.manualFlightEntry ?? false);
    const [manualFlightAirline, setManualFlightAirline] = useState(initial?.manualFlightAirline ?? '');
    const [manualFlightNumber, setManualFlightNumber] = useState(initial?.manualFlightNumber ?? '');
    const [manualFlightNumberReturn, setManualFlightNumberReturn] = useState(initial?.manualFlightNumberReturn ?? '');
    const [manualHotelEntry, setManualHotelEntry] = useState(initial?.manualHotelEntry ?? false);
    const [manualHotelName, setManualHotelName] = useState(initial?.manualHotelName ?? '');
    const [manualHotelAddress, setManualHotelAddress] = useState(initial?.manualHotelAddress ?? '');
    const [manualHotelCheckIn, setManualHotelCheckIn] = useState(initial?.manualHotelCheckIn ?? '');
    const [manualHotelCheckOut, setManualHotelCheckOut] = useState(initial?.manualHotelCheckOut ?? '');

    const computedDays = daysBetween(outboundDate, returnDate);
    const travelDays = computedDays > 0 ? computedDays : travelDaysFallback;

    const setTravelDays = useCallback((raw: number) => {
        const n = Math.min(365, Math.max(1, Math.floor(Number(raw)) || 1));
        setTravelDaysFallback(n);
        if (outboundDate.trim()) {
            setReturnDate(addDaysToIsoDate(outboundDate, n));
        }
    }, [outboundDate]);

    return {
        departureCity,
        arrivalCity,
        arrivalCityName,
        travelDays,
        travelerCount,
        budget,
        activityTime,
        outboundDate,
        returnDate,
        outboundDepartureTime,
        outboundArrivalTime,
        returnDepartureTime,
        returnArrivalTime,
        selectedOptions,
        dietarySelections,
        manualFlightEntry,
        manualFlightAirline,
        manualFlightNumber,
        manualFlightNumberReturn,
        manualHotelEntry,
        manualHotelName,
        manualHotelAddress,
        manualHotelCheckIn,
        manualHotelCheckOut,
        setDepartureCity,
        setArrivalCity,
        setArrivalCityName,
        setTravelDays,
        setTravelerCount,
        setBudget,
        setActivityTime,
        setOutboundDate,
        setReturnDate,
        setOutboundDepartureTime,
        setOutboundArrivalTime,
        setReturnDepartureTime,
        setReturnArrivalTime,
        setSelectedOptions,
        setDietarySelections,
        setManualFlightEntry,
        setManualFlightAirline,
        setManualFlightNumber,
        setManualFlightNumberReturn,
        setManualHotelEntry,
        setManualHotelName,
        setManualHotelAddress,
        setManualHotelCheckIn,
        setManualHotelCheckOut,
    };
}
