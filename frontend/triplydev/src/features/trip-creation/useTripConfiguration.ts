import { useState } from 'react';

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

