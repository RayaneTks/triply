'use client';

import { authClient } from './auth-client';

export interface RecapActivity {
    id: string;
    title: string;
    city: string | null;
    country: string | null;
    duration?: number | null;
    cost?: number | null;
    liked_state?: 'liked' | 'disliked' | 'neutral' | null;
    lat: number | null;
    lng: number | null;
}

export type RecapSection =
    | {
          type: 'flight';
          transport_id: string;
          depart_lieu: string | null;
          arrivee_lieu: string | null;
          depart_le: string | null;
          arrivee_le: string | null;
          information_supplementaire?: string | null;
          prix?: number | null;
          devise?: string | null;
      }
    | {
          type: 'hotel';
          nom: string | null;
          adresse: string | null;
          ville: string | null;
          arrivee_le: string | null;
          depart_le: string | null;
          prix?: number | null;
          devise?: string | null;
          latitude?: number | null;
          longitude?: number | null;
      }
    | {
          type: 'day';
          day_id: string;
          day_index: number;
          date: string | null;
          activities: RecapActivity[];
          route_polyline: { lat: number; lng: number }[];
      };

export interface TripRecap {
    id: string;
    trip: {
        id: string;
        title: string;
        destination: string;
        start_date: string;
        end_date: string;
        travel_days: number;
        travelers_count: number;
        budget_total?: number;
        currency?: string;
        status?: string;
        plan_snapshot?: unknown;
    };
    sections: RecapSection[];
}

export interface RouteSegment {
    day_id: string;
    day_index: number;
    from: { id: string; title: string; lat: number; lng: number };
    to: { id: string; title: string; lat: number; lng: number };
    profile: 'walking' | 'driving' | 'cycling';
    distance_km: number;
    estimated_minutes: number;
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

export const recapClient = {
    async getRecap(tripId: string): Promise<TripRecap> {
        const response = await fetch(apiUrl(`/trips/${tripId}/recap`), {
            method: 'GET',
            headers: { Accept: 'application/json', Authorization: `Bearer ${requireToken()}` },
        });
        const payload = (await response.json().catch(() => null)) as ApiSuccess<TripRecap> | ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, 'Impossible de charger le récap.'));
        }
        const data = payload as ApiSuccess<TripRecap> | null;
        if (!data?.success || !data.data) {
            throw new Error('Impossible de charger le récap.');
        }
        return data.data;
    },

    async getRoutes(tripId: string): Promise<{ trip_id: string; segments: RouteSegment[] }> {
        const response = await fetch(apiUrl(`/trips/${tripId}/routes`), {
            method: 'GET',
            headers: { Accept: 'application/json', Authorization: `Bearer ${requireToken()}` },
        });
        const payload = (await response.json().catch(() => null)) as
            | ApiSuccess<{ trip_id: string; segments: RouteSegment[] }>
            | ApiError
            | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, 'Impossible de charger les trajets.'));
        }
        const data = payload as ApiSuccess<{ trip_id: string; segments: RouteSegment[] }> | null;
        if (!data?.success || !data.data) {
            return { trip_id: tripId, segments: [] };
        }
        return data.data;
    },

    async createShareLink(
        tripId: string,
        body: { ttl_days?: number } = {},
    ): Promise<{ id: string; token: string; expires_at: string | null; share_url: string }> {
        const response = await fetch(apiUrl(`/trips/${tripId}/share`), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${requireToken()}`,
            },
            body: JSON.stringify(body),
        });
        const payload = (await response.json().catch(() => null)) as
            | ApiSuccess<{ id: string; token: string; expires_at: string | null; share_url: string }>
            | ApiError
            | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, 'Impossible de générer le lien de partage.'));
        }
        const data = payload as ApiSuccess<{ id: string; token: string; expires_at: string | null; share_url: string }> | null;
        if (!data?.success || !data.data) {
            throw new Error('Impossible de générer le lien de partage.');
        }
        return data.data;
    },

    async getPublicRecap(token: string): Promise<TripRecap> {
        const response = await fetch(apiUrl(`/share/${token}`), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        const payload = (await response.json().catch(() => null)) as ApiSuccess<TripRecap> | ApiError | null;
        if (!response.ok) {
            throw new Error(pickErrorMessage(payload as ApiError | null, 'Ce lien de partage est invalide ou expiré.'));
        }
        const data = payload as ApiSuccess<TripRecap> | null;
        if (!data?.success || !data.data) {
            throw new Error('Ce lien de partage est invalide ou expiré.');
        }
        return data.data;
    },
};
