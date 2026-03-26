import { useState } from 'react';

function daysBetween(start: string, end: string): number {
    if (!start || !end) return 0;
    const a = new Date(start);
    const b = new Date(end);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    const diff = b.getTime() - a.getTime();
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
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

    const computedDays = daysBetween(outboundDate, returnDate);
    const travelDays = computedDays > 0 ? computedDays : travelDaysFallback;

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
        setDepartureCity,
        setArrivalCity,
        setArrivalCityName,
        setTravelDays: setTravelDaysFallback,
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
    };
}
