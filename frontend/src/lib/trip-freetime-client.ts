'use client';

import { apiFetch, type ApiSuccessEnvelope } from './http';

export interface FreeTimeSuggestion {
    id: string | null;
    name: string;
    category: string;
    lat: number;
    lng: number;
    distance_km: number;
    walking_minutes: number;
}

export interface FreeTimePayload {
    trip_id: string;
    day: number;
    has_free_time: boolean;
    free_minutes: number;
    max_minutes: number;
    used_minutes: number;
    anchor: { lat: number; lng: number } | null;
    suggestions: FreeTimeSuggestion[];
}

function unwrap<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return (payload as ApiSuccessEnvelope<T>).data;
    }
    return payload as T;
}

export const tripFreeTimeClient = {
    async getForDay(tripId: string, day: number): Promise<FreeTimePayload> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/days/${day}/free-time`, {
            method: 'GET',
        });
        return unwrap<FreeTimePayload>(res);
    },
};

export function formatFreeMinutes(minutes: number): string {
    if (minutes <= 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function categoryEmoji(category: string): string {
    switch (category.toUpperCase()) {
        case 'RESTAURANT':
            return '🍽️';
        case 'SIGHTS':
        case 'HISTORICAL':
            return '🏛️';
        case 'SHOPPING':
            return '🛍️';
        case 'NIGHTLIFE':
            return '🍸';
        case 'BEACH_PARK':
            return '🌳';
        default:
            return '📍';
    }
}
