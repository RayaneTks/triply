'use client';

import type { PlanSnapshot } from '@/src/lib/plan-snapshot';

export interface TripSummary {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    travel_days: number;
    travelers_count: number;
    budget_total: number;
    currency: string;
    status: string;
    flight?: {
        carrier?: string | null;
        price?: number | null;
    };
    plan_snapshot?: PlanSnapshot | null;
    created_at?: string;
    updated_at?: string;
}

export type CreateTripPayload = {
    title: string;
    destination: string;
    start_date?: string;
    end_date?: string;
    travelers_count?: number;
    plan_snapshot?: PlanSnapshot;
};

interface ApiSuccess<T> {
    success: boolean;
    data: T;
}

interface ApiError {
    message?: string;
    error?: {
        message?: string;
        details?: Record<string, string[]>;
    };
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

function getApiUrl(path: string): string {
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

export async function listTrips(token: string): Promise<TripSummary[]> {
    const response = await fetch(getApiUrl('/trips'), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const payload = (await response.json().catch(() => null)) as ApiSuccess<{ items?: TripSummary[] }> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, 'Impossible de recuperer les voyages.'));
    }

    const data = payload as ApiSuccess<{ items?: TripSummary[] }> | null;
    if (!data?.success) {
        throw new Error('Impossible de recuperer les voyages.');
    }

    return data.data?.items ?? [];
}

export async function getTrip(token: string, tripId: string): Promise<TripSummary> {
    const response = await fetch(getApiUrl(`/trips/${tripId}`), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const payload = (await response.json().catch(() => null)) as ApiSuccess<TripSummary> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, 'Impossible de recuperer le voyage.'));
    }

    const data = payload as ApiSuccess<TripSummary> | null;
    if (!data?.success || !data.data) {
        throw new Error('Impossible de recuperer le voyage.');
    }

    return data.data;
}

export async function createTrip(token: string, body: CreateTripPayload): Promise<TripSummary> {
    const url = getApiUrl('/trips');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/e8d24975-b2be-4d00-96d2-ddcaae8b1c5d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cc5fd8' },
        body: JSON.stringify({
            sessionId: 'cc5fd8',
            hypothesisId: 'G',
            location: 'trips-client.ts:createTrip:pre',
            message: 'createTrip request',
            data: {
                url,
                hasToken: Boolean(token?.length),
                bodyKeys: Object.keys(body),
                hasPlanSnapshot: body.plan_snapshot != null,
            },
            timestamp: Date.now(),
        }),
    }).catch(() => {});
    // #endregion
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/e8d24975-b2be-4d00-96d2-ddcaae8b1c5d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cc5fd8' },
        body: JSON.stringify({
            sessionId: 'cc5fd8',
            hypothesisId: 'G',
            location: 'trips-client.ts:createTrip:post',
            message: 'createTrip response',
            data: { status: response.status, ok: response.ok },
            timestamp: Date.now(),
        }),
    }).catch(() => {});
    // #endregion

    const payload = (await response.json().catch(() => null)) as ApiSuccess<TripSummary> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, 'Impossible de creer le voyage.'));
    }

    const data = payload as ApiSuccess<TripSummary> | null;
    if (!data?.success || !data.data) {
        throw new Error('Impossible de creer le voyage.');
    }

    return data.data;
}

export async function updateTrip(
    token: string,
    tripId: string,
    body: Partial<CreateTripPayload> & { plan_snapshot?: PlanSnapshot | null }
): Promise<TripSummary> {
    const response = await fetch(getApiUrl(`/trips/${tripId}`), {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as ApiSuccess<TripSummary> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, 'Impossible de mettre a jour le voyage.'));
    }

    const data = payload as ApiSuccess<TripSummary> | null;
    if (!data?.success || !data.data) {
        throw new Error('Impossible de mettre a jour le voyage.');
    }

    return data.data;
}

export async function validateTripApi(token: string, tripId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/trips/${tripId}/validate`), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const payload = (await response.json().catch(() => null)) as ApiSuccess<unknown> | ApiError | null;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiError | null, 'Impossible de valider le voyage.'));
    }

    const data = payload as ApiSuccess<unknown> | null;
    if (!data?.success) {
        throw new Error('Impossible de valider le voyage.');
    }
}
