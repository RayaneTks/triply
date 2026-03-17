import { useState, useEffect } from 'react';

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
    arrivalTime: string;
    departureTime: string;
    selectedOptions: string[];
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
    setArrivalTime: (v: string) => void;
    setDepartureTime: (v: string) => void;
    setSelectedOptions: (values: string[]) => void;
}

export function useTripConfiguration(initial?: Partial<TripConfigurationState>): UseTripConfigurationResult {
    const [departureCity, setDepartureCity] = useState(initial?.departureCity ?? '');
    const [arrivalCity, setArrivalCity] = useState(initial?.arrivalCity ?? '');
    const [arrivalCityName, setArrivalCityName] = useState(initial?.arrivalCityName ?? '');
    const [travelDays, setTravelDays] = useState(initial?.travelDays ?? 3);
    const [travelerCount, setTravelerCount] = useState(initial?.travelerCount ?? 1);
    const [budget, setBudget] = useState(initial?.budget ?? '');
    const [activityTime, setActivityTime] = useState(initial?.activityTime ?? '');
    const [outboundDate, setOutboundDate] = useState(initial?.outboundDate ?? '');
    const [returnDate, setReturnDate] = useState(initial?.returnDate ?? '');
    const [arrivalTime, setArrivalTime] = useState(initial?.arrivalTime ?? '');
    const [departureTime, setDepartureTime] = useState(initial?.departureTime ?? '');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(initial?.selectedOptions ?? []);

    useEffect(() => {
        const days = daysBetween(outboundDate, returnDate);
        if (days > 0) setTravelDays(days);
    }, [outboundDate, returnDate]);

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
        arrivalTime,
        departureTime,
        selectedOptions,
        setDepartureCity,
        setArrivalCity,
        setArrivalCityName,
        setTravelDays,
        setTravelerCount,
        setBudget,
        setActivityTime,
        setOutboundDate,
        setReturnDate,
        setArrivalTime,
        setDepartureTime,
        setSelectedOptions,
    };
}

