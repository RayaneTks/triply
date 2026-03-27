// src/utils/amadeus.ts

export interface FlightRequestPayload {
    currencyCode: string;
    originDestinations: Array<{
        id: string;
        originLocationCode: string;
        destinationLocationCode: string;
        departureDateTimeRange: { date: string; time?: string };
    }>;
    travelers: Array<{ id: string; travelerType: string }>;
    sources: string[];
    searchCriteria?: {
        maxPrice?: number;
        flightFilters?: {
            cabinRestrictions?: Array<{ cabin: string; coverage: string; originDestinationIds: string[] }>;
        };
    };
}

export const generateFlightRequest = (
    departureCity: string,
    arrivalCity: string,
    outboundDate: string,
    returnDate: string,
    travelerCount: number,
    budget: string,
    /** Heure de départ du vol aller (HH:mm) */
    outboundDepartureTime: string,
    /** Heure de départ du vol retour (HH:mm) */
    returnDepartureTime: string
): FlightRequestPayload => {
    const travelers = Array.from({ length: travelerCount }, (_, i) => ({
        id: (i + 1).toString(),
        travelerType: 'ADULT',
    }));

    const originDestinations = [
        {
            id: '1',
            originLocationCode: departureCity,
            destinationLocationCode: arrivalCity,
            departureDateTimeRange: {
                date: outboundDate,
                ...(outboundDepartureTime ? { time: outboundDepartureTime + ':00' } : {}),
            },
        },
    ];

    if (returnDate) {
        originDestinations.push({
            id: '2',
            originLocationCode: arrivalCity,
            destinationLocationCode: departureCity,
            departureDateTimeRange: {
                date: returnDate,
                ...(returnDepartureTime ? { time: returnDepartureTime + ':00' } : {}),
            },
        });
    }

    const payload: FlightRequestPayload = {
        currencyCode: 'EUR',
        originDestinations,
        travelers,
        sources: ['GDS'],
        searchCriteria: {},
    };

    if (budget && parseInt(budget, 10) > 0) {
        if (!payload.searchCriteria) payload.searchCriteria = {};
        payload.searchCriteria.maxPrice = parseInt(budget, 10);
    }

    return payload;
};
