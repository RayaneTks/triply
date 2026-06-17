'use client';

import { apiFetch, type ApiSuccessEnvelope } from './http';

export type ReplanReason =
    | 'flight_delay'
    | 'weather'
    | 'health'
    | 'over_budget'
    | 'time_lost'
    | 'other';

export interface ReplanRequestBody {
    reason: ReplanReason;
    details?: string;
    locked_activity_ids?: string[];
    affected_days?: number[];
}

export interface ReplannedActivity {
    title: string;
    lat: number;
    lng: number;
    day: number;
    durationHours?: number;
    locked?: boolean;
}

export interface ReplanPreview {
    trip_id: string;
    reason: ReplanReason;
    reply: string;
    summary: string;
    replannedActivities: ReplannedActivity[];
    affectedDays: number[];
    lockedCount: number;
}

function unwrap<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return (payload as ApiSuccessEnvelope<T>).data;
    }
    return payload as T;
}

export const tripReplanClient = {
    async requestReplan(tripId: string, body: ReplanRequestBody): Promise<ReplanPreview> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/replan`, {
            method: 'POST',
            body,
        });
        return unwrap<ReplanPreview>(res);
    },
};

export const REPLAN_REASON_LABELS: Record<ReplanReason, { label: string; emoji: string; hint: string }> = {
    flight_delay: {
        label: 'Vol retardé',
        emoji: '✈️',
        hint: 'L’IA compresse les jours impactés et préserve vos must-do.',
    },
    weather: {
        label: 'Météo défavorable',
        emoji: '🌧️',
        hint: 'Activités d’extérieur remplacées par de l’intérieur si besoin.',
    },
    health: {
        label: 'Un voyageur fatigué',
        emoji: '🤒',
        hint: 'Programme allégé, retire les activités physiques exigeantes.',
    },
    over_budget: {
        label: 'Au-dessus du budget',
        emoji: '💸',
        hint: 'Priorité aux expériences fortes, allège le superflu.',
    },
    time_lost: {
        label: 'Temps perdu',
        emoji: '⏰',
        hint: 'Resserre les jours touchés sans sacrifier vos coups de cœur.',
    },
    other: {
        label: 'Autre contrainte',
        emoji: '🔁',
        hint: 'Décrivez votre situation, l’IA s’adapte.',
    },
};
