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
    sources: string[]; // <--- IMPORTANT : Champ obligatoire ajouté
    searchCriteria?: {
        maxPrice?: number;
        flightFilters?: {
            cabinRestrictions?: Array<{ cabin: string; coverage: string; originDestinationIds: string[] }>;
        };
    };
}

export const generateFlightRequest = (
    departureCity: string, // Reçoit maintenant "MRS" directement
    arrivalCity: string,   // Reçoit maintenant "NYC" directement
    departureDate: string,
    arrivalDate: string,
    travelerCount: number,
    budget: string,
    arrivalTime: string,
    departureTime: string
): FlightRequestPayload => {

    // Génération des voyageurs
    const travelers = Array.from({ length: travelerCount }, (_, i) => ({
        id: (i + 1).toString(),
        travelerType: 'ADULT'
    }));

    // Construction du vol Aller
    const originDestinations = [
        {
            id: '1',
            originLocationCode: departureCity, // Plus de conversion, on utilise la valeur directe
            destinationLocationCode: arrivalCity,
            departureDateTimeRange: {
                date: departureDate,
                // On ajoute l'heure seulement si elle est définie
                ...(departureTime ? { time: departureTime + ':00' } : {})
            }
        }
    ];

    // Construction du vol Retour (si date de retour présente)
    if (arrivalDate) {
        originDestinations.push({
            id: '2',
            originLocationCode: arrivalCity,      // L'arrivée devient le départ du retour
            destinationLocationCode: departureCity, // Le départ devient l'arrivée du retour
            departureDateTimeRange: {
                date: arrivalDate,
                ...(arrivalTime ? { time: arrivalTime + ':00' } : {})
            }
        });
    }

    const payload: FlightRequestPayload = {
        currencyCode: 'EUR',
        originDestinations,
        travelers,
        sources: ['GDS'], // <--- OBLIGATOIRE : Corrige l'erreur "MANDATORY DATA MISSING"
        searchCriteria: {}
    };

    // Ajout du budget max s'il est défini
    if (budget && parseInt(budget) > 0) {
        if (!payload.searchCriteria) payload.searchCriteria = {};
        payload.searchCriteria.maxPrice = parseInt(budget);
    }

    return payload;
};