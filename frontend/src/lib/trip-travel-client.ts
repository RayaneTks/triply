'use client';

import { apiFetch, type ApiSuccessEnvelope } from './http';

export interface FlightRecord {
    id: string;
    type: string;
    depart_lieu: string;
    arrivee_lieu: string;
    depart_le: string | null;
    arrivee_le: string | null;
    prix: number;
    devise: string | null;
    information_supplementaire: string | null;
}

export interface HotelRecord {
    id: string;
    type: string;
    nom: string;
    adresse: string;
    code_postal: string | null;
    ville: string | null;
    latitude: number | null;
    longitude: number | null;
    arrivee_le: string | null;
    depart_le: string | null;
    prix: number;
    devise: string | null;
    informations_supplementaire: string | null;
}

interface ListEnvelope<T> {
    trip_id: string;
    items: T[];
}

function unwrap<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return (payload as ApiSuccessEnvelope<T>).data;
    }
    return payload as T;
}

export const tripTravelClient = {
    async listFlights(tripId: string): Promise<FlightRecord[]> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/flights`, { method: 'GET' });
        return unwrap<ListEnvelope<FlightRecord>>(res).items ?? [];
    },

    async createFlight(tripId: string, payload: Omit<FlightRecord, 'id'>): Promise<FlightRecord> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/flights`, {
            method: 'POST',
            body: payload,
        });
        return unwrap<FlightRecord>(res);
    },

    async deleteFlight(tripId: string, flightId: string): Promise<void> {
        await apiFetch<unknown>(`/trips/${tripId}/flights/${flightId}`, { method: 'DELETE' });
    },

    async listHotels(tripId: string): Promise<HotelRecord[]> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/hotels`, { method: 'GET' });
        return unwrap<ListEnvelope<HotelRecord>>(res).items ?? [];
    },

    async createHotel(tripId: string, payload: Omit<HotelRecord, 'id'>): Promise<HotelRecord> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/hotels`, {
            method: 'POST',
            body: payload,
        });
        return unwrap<HotelRecord>(res);
    },

    async deleteHotel(tripId: string, hotelId: string): Promise<void> {
        await apiFetch<unknown>(`/trips/${tripId}/hotels/${hotelId}`, { method: 'DELETE' });
    },
};

export interface BookingCheckoutPayload {
    provider: 'booking' | 'skyscanner' | 'getyourguide';
    kind: 'flight' | 'hotel' | 'activity';
    destination?: string;
    property_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    check_in?: string;
    check_out?: string;
    adults?: number;
    origin?: string;
    destination_code?: string;
    currency?: string;
    amount?: number | null;
}

export async function bookingCheckout(tripId: string, body: BookingCheckoutPayload): Promise<{ deeplink: string }> {
    const res = await apiFetch<unknown>(`/trips/${tripId}/booking/checkout`, {
        method: 'POST',
        body,
    });
    const data = unwrap<{ attributes: { deeplink: string } }>(res);
    return { deeplink: data.attributes.deeplink };
}
