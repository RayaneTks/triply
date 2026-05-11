'use client';

import { authClient } from './auth-client';

export interface LocalTransport {
    id: string;
    type: 'local_transport';
    attributes: {
        trip_id: string;
        mode: string;
        from: string;
        to: string;
        departure_at: string | null;
        arrival_at: string | null;
        price: number | null;
        currency: string | null;
        notes: string | null;
    };
}

export type CreateLocalTransportPayload = {
    type: string;
    from: string;
    to: string;
    departure_at?: string | null;
    arrival_at?: string | null;
    price?: number | null;
    currency?: string | null;
    notes?: string | null;
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

function apiUrl(path: string) {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

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

function requireToken(): string {
    const token = authClient.getToken();
    if (!token) throw new Error('Session expirée. Reconnectez-vous.');
    return token;
}

export const localTransportsClient = {
    async list(tripId: string): Promise<LocalTransport[]> {
        const response = await fetch(apiUrl(`/trips/${tripId}/local-transports`), {
            method: 'GET',
            headers: { Accept: 'application/json', Authorization: `Bearer ${requireToken()}` },
        });
        const payload = (await response.json().catch(() => null)) as ApiSuccess<{ items?: LocalTransport[] }> | ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, 'Impossible de charger les transports locaux.'));
        }
        const data = payload as ApiSuccess<{ items?: LocalTransport[] }> | null;
        return data?.data?.items ?? [];
    },

    async create(tripId: string, body: CreateLocalTransportPayload): Promise<LocalTransport> {
        const response = await fetch(apiUrl(`/trips/${tripId}/local-transports`), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${requireToken()}`,
            },
            body: JSON.stringify(body),
        });
        const payload = (await response.json().catch(() => null)) as ApiSuccess<LocalTransport> | ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, "Impossible d'ajouter le transport."));
        }
        const data = payload as ApiSuccess<LocalTransport> | null;
        if (!data?.success || !data.data) {
            throw new Error("Impossible d'ajouter le transport.");
        }
        return data.data;
    },

    async delete(tripId: string, transportId: string): Promise<void> {
        const response = await fetch(apiUrl(`/trips/${tripId}/local-transports/${transportId}`), {
            method: 'DELETE',
            headers: { Accept: 'application/json', Authorization: `Bearer ${requireToken()}` },
        });
        if (response.status === 204) return;
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload, 'Impossible de supprimer le transport.'));
        }
    },
};
