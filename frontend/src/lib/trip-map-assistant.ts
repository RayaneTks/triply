'use client';

import { authClient } from './auth-client';
import { sendChat, type SuggestedActivity } from './integrations/assistant';
import { requestActivityRegeneration } from './assistant-regenerate';

export async function regenerateSingleActivity(payload: {
    title: string;
    lat: number;
    lng: number;
    dayIndex: number;
    destinationContext: string;
}) {
    const token = authClient.getToken();
    if (!token) throw new Error('Session expirée.');
    return requestActivityRegeneration(token, payload);
}

export async function suggestActivitiesForDay(payload: {
    destinationContext: string;
    dayIndex: number;
    travelDays: number;
    currentTitles: string[];
    maxActivityHoursPerDay?: number;
}): Promise<SuggestedActivity[]> {
    const token = authClient.getToken();
    if (!token) throw new Error('Session expirée.');

    const res = await sendChat({
        messages: [
            {
                role: 'user',
                content: `Propose de nouvelles activités variées pour le jour ${payload.dayIndex} à ${payload.destinationContext}. Remplace l'itinéraire actuel de ce jour.`,
            },
        ],
        destinationContext: payload.destinationContext,
        chatMode: 'itinerary',
        selectedDay: payload.dayIndex,
        travelDays: payload.travelDays,
        maxActivityHoursPerDay: payload.maxActivityHoursPerDay ?? 10,
        currentDayActivityTitles: payload.currentTitles,
        requestFullItinerary: false,
    });

    return (res.suggestedActivities ?? []).filter(
        (a) => !payload.dayIndex || a.day === payload.dayIndex || a.day == null,
    );
}

export async function suggestActivitiesForAllDays(payload: {
    destinationContext: string;
    travelDays: number;
    activitiesByDay: { index: number; titles: string[] }[];
    maxActivityHoursPerDay?: number;
}): Promise<SuggestedActivity[]> {
    const token = authClient.getToken();
    if (!token) throw new Error('Session expirée.');

    const summary = payload.activitiesByDay
        .map((d) => `Jour ${d.index}: ${d.titles.join(', ') || '(vide)'}`)
        .join('\n');

    const res = await sendChat({
        messages: [
            {
                role: 'user',
                content: `Régénère un itinéraire complet pour ${payload.travelDays} jours à ${payload.destinationContext}.\nItinéraire actuel:\n${summary}`,
            },
        ],
        destinationContext: payload.destinationContext,
        chatMode: 'itinerary',
        travelDays: payload.travelDays,
        maxActivityHoursPerDay: payload.maxActivityHoursPerDay ?? 10,
        requestFullItinerary: true,
    });

    return res.suggestedActivities ?? [];
}
