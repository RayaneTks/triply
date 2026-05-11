'use client';

import { authClient } from './auth-client';

export interface BookingCheckoutResult {
    id: string;
    type: 'booking_checkout';
    attributes: {
        trip_id: string;
        provider: string;
        kind: string;
        deeplink: string;
        destination: string | null;
        check_in: string | null;
        check_out: string | null;
        adults: number;
        currency: string | null;
        amount: number | null;
    };
}

export type CheckoutPayload = {
    provider: 'booking' | 'skyscanner' | 'getyourguide' | string;
    kind?: 'flight' | 'hotel' | 'activity' | 'bundle';
    destination?: string;
    check_in?: string;
    check_out?: string;
    adults?: number;
    origin?: string;
    destination_code?: string;
};

interface ApiSuccess<T> {
    success: boolean;
    data: T;
}

interface ApiError {
    message?: string;
    error?: { message?: string; details?: Record<string, string[]> };
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

function pickErrorMessage(payload: ApiError | null, fallback: string): string {
    const details = payload?.error?.details;
    if (details) {
        for (const messages of Object.values(details)) {
            if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
                return messages[0];
            }
        }
    }
    return payload?.error?.message || payload?.message || fallback;
}

export const bookingClient = {
    async checkout(tripId: string, payload: CheckoutPayload): Promise<BookingCheckoutResult> {
        const token = authClient.getToken();
        if (!token) throw new Error('Session expirée. Reconnectez-vous.');

        const response = await fetch(`${API_BASE_URL}/trips/${tripId}/booking/checkout`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const json = (await response.json().catch(() => null)) as ApiSuccess<BookingCheckoutResult> | ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(json as ApiError | null, 'Impossible de générer le lien de réservation.'));
        }
        const data = json as ApiSuccess<BookingCheckoutResult> | null;
        if (!data?.success || !data.data) {
            throw new Error('Impossible de générer le lien de réservation.');
        }
        return data.data;
    },
};
