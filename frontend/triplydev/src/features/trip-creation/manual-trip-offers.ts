import type { FlightOffer, FlightItinerary } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

function padIata(code: string): string {
    const c = code.trim().toUpperCase();
    if (c.length >= 3) return c.slice(0, 3);
    return c;
}

function atIso(date: string, time: string): string {
    const d = date.trim();
    const t = (time.trim() || '09:00').slice(0, 5);
    if (!d) return `${new Date().toISOString().slice(0, 10)}T${t}:00`;
    return `${d}T${t}:00`;
}

export type ManualFlightBuildInput = {
    manualFlightEntry: boolean;
    departureCity: string;
    arrivalCity: string;
    outboundDate: string;
    returnDate: string;
    outboundDepartureTime: string;
    outboundArrivalTime: string;
    returnDepartureTime: string;
    returnArrivalTime: string;
    manualFlightAirline: string;
    manualFlightNumber: string;
    manualFlightNumberReturn: string;
};

/** Vol minimal pour cartes / modales / append aéroport (saisie manuelle). */
export function buildManualFlightOffer(i: ManualFlightBuildInput): FlightOffer | null {
    if (!i.manualFlightEntry) return null;
    const airline = i.manualFlightAirline.trim();
    const num = i.manualFlightNumber.trim();
    if (!airline || !num) return null;
    const dep = padIata(i.departureCity);
    const arr = padIata(i.arrivalCity);
    if (dep.length < 2 || arr.length < 2) return null;
    if (!i.outboundDate.trim()) return null;

    const outSeg = {
        departure: { iataCode: dep, at: atIso(i.outboundDate, i.outboundDepartureTime) },
        arrival: { iataCode: arr, at: atIso(i.outboundDate, i.outboundArrivalTime) },
        carrierCode: '',
        number: num,
    };

    const itineraries: FlightItinerary[] = [{ segments: [outSeg] }];

    if (i.returnDate.trim()) {
        const retNum = (i.manualFlightNumberReturn || i.manualFlightNumber).trim();
        itineraries.push({
            segments: [
                {
                    departure: { iataCode: arr, at: atIso(i.returnDate, i.returnDepartureTime) },
                    arrival: { iataCode: dep, at: atIso(i.returnDate, i.returnArrivalTime) },
                    number: retNum || num,
                },
            ],
        });
    }

    return {
        id: 'manual-flight',
        price: { grandTotal: '—', currency: 'EUR' },
        validatingAirlineCodes: [],
        itineraries,
    };
}

export type ManualHotelBuildInput = {
    manualHotelEntry: boolean;
    manualHotelName: string;
    manualHotelAddress: string;
    manualHotelCheckIn: string;
    manualHotelCheckOut: string;
    arrivalCity: string;
};

export function buildManualHotelOffer(i: ManualHotelBuildInput): HotelOffer | null {
    if (!i.manualHotelEntry) return null;
    const name = i.manualHotelName.trim();
    const addr = i.manualHotelAddress.trim();
    const title = name || addr;
    if (!title) return null;
    if (!i.manualHotelCheckIn.trim() || !i.manualHotelCheckOut.trim()) return null;
    const cc = padIata(i.arrivalCity) || '—';
    const displayName = name && addr && name !== addr ? `${name} · ${addr}` : title;
    return {
        id: 'manual-hotel',
        hotelId: 'manual',
        hotelName: displayName.slice(0, 120),
        cityCode: cc.length >= 2 ? cc.slice(0, 3) : '—',
        checkInDate: i.manualHotelCheckIn.trim(),
        checkOutDate: i.manualHotelCheckOut.trim(),
        price: { total: '—', currency: 'EUR' },
    };
}
