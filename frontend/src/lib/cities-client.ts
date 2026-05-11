'use client';

import { authClient } from './auth-client';

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

interface ApiError {
    message?: string;
    error?: { message?: string; details?: Record<string, string[]> };
}

function apiUrl(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function getErrorMessage(payload: ApiError | null, fallback: string): string {
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

export const citiesClient = {
    async deleteCity(tripId: string, city: string): Promise<{ deleted_count: number }> {
        const token = requireToken();
        const response = await fetch(
            apiUrl(`/trips/${tripId}/cities/${encodeURIComponent(city)}`),
            {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (response.status === 204) {
            return { deleted_count: 0 };
        }

        const payload = (await response.json().catch(() => null)) as {
            success?: boolean;
            data?: { deleted_count?: number };
        } & ApiError | null;

        if (!response.ok) {
            throw new Error(getErrorMessage(payload as ApiError | null, 'Suppression de la ville impossible.'));
        }

        return { deleted_count: payload?.data?.deleted_count ?? 0 };
    },
};
