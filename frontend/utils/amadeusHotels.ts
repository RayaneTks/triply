// utils/amadeusHotels.ts - Requêtes pour la recherche d'hôtels Amadeus

export interface HotelSearchParams {
    cityCode: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    roomQuantity?: number;
    maxPrice?: number;
}
