'use client';

import { authClient } from './auth-client';

export type LikedState = 'liked' | 'disliked' | 'neutral';

export interface ActivityAttributes {
    trip_id: string;
    day_id: string | null;
    title: string;
    duration: string | null;
    cost: number | null;
    city: string | null;
    country: string | null;
    order: number;
    liked_state: LikedState;
    lat: number | null;
    lng: number | null;
    layer_id: string | null;
    notes: string | null;
    deleted_at: string | null;
}

export interface ActivityResource {
    id: string;
    type: 'activity';
    attributes: ActivityAttributes;
}

export interface ActivityDayBucket {
    day_id: string;
    index: number;
    date: string | null;
    activities: ActivityResource[];
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
}

interface ApiError {
    message?: string;
    error?: { message?: string; details?: Record<string, string[]> };
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

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

async function request<T>(input: string, init: RequestInit, fallback: string): Promise<T> {
    const response = await fetch(input, init);
    if (response.status === 204) {
        return undefined as unknown as T;
    }
    const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, fallback));
    }
    const data = payload as ApiSuccess<T> | null;
    if (!data?.success) {
        throw new Error(fallback);
    }
    return data.data;
}

export const activitiesClient = {
    async groupedByDay(tripId: string): Promise<{ trip_id: string; days: ActivityDayBucket[] }> {
        const token = requireToken();
        return request(
            apiUrl(`/trips/${tripId}/activities/grouped-by-day`),
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
            'Impossible de récupérer les activités.',
        );
    },

    async update(tripId: string, activityId: string, payload: Partial<ActivityAttributes> & {
        estimated_duration_minutes?: number;
        lat?: number | null;
        lng?: number | null;
        layer_id?: string | null;
    }): Promise<ActivityResource> {
        const token = requireToken();
        return request(
            apiUrl(`/trips/${tripId}/activities/${activityId}`),
            {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            },
            'Mise à jour de l’activité impossible.',
        );
    },

    async setLikedState(tripId: string, activityId: string, liked_state: LikedState): Promise<ActivityResource> {
        return this.update(tripId, activityId, { liked_state });
    },

    async delete(tripId: string, activityId: string): Promise<void> {
        const token = requireToken();
        const response = await fetch(apiUrl(`/trips/${tripId}/activities/${activityId}`), {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 204) return;
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        if (!response.ok) {
            throw new Error(getErrorMessage(payload, 'Suppression impossible.'));
        }
    },

    async restore(tripId: string, activityId: string): Promise<void> {
        const token = requireToken();
        const response = await fetch(apiUrl(`/trips/${tripId}/activities/${activityId}/restore`), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 204 || response.ok) return;
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        throw new Error(getErrorMessage(payload, 'Restauration impossible.'));
    },

    async create(
        tripId: string,
        payload: {
            source: 'manual' | 'place' | 'ai';
            title?: string;
            day_id?: string;
            estimated_duration_minutes?: number;
            cost?: number;
            lat?: number;
            lng?: number;
            layer_id?: string;
            place_id?: string;
        },
    ): Promise<ActivityResource> {
        const token = requireToken();
        return request(
            apiUrl(`/trips/${tripId}/activities`),
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            },
            'Création de l’activité impossible.',
        );
    },

    async reorder(tripId: string, activityIds: string[]): Promise<{ trip_id: string; updated: string[] }> {
        const token = requireToken();
        return request(
            apiUrl(`/trips/${tripId}/activities/reorder`),
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ activity_ids: activityIds }),
            },
            'Réordonnancement impossible.',
        );
    },
};
