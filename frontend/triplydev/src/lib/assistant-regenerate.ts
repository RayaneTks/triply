export type ActivityReplacement = {
    title: string;
    lat: number;
    lng: number;
    durationHours?: number;
};

export type RegenerateActivityApiResponse = {
    reply: string;
    replacement: ActivityReplacement | null;
};

import { apiV1 } from '@/src/lib/api-base';

export async function requestActivityRegeneration(
    token: string,
    payload: {
        title: string;
        lat: number;
        lng: number;
        dayIndex: number;
        destinationContext: string;
    }
): Promise<RegenerateActivityApiResponse> {
    const res = await fetch(apiV1('/integrations/assistant'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            intent: 'regenerate_activity',
            messages: [],
            regenerateActivity: {
                title: payload.title,
                lat: payload.lat,
                lng: payload.lng,
                dayIndex: payload.dayIndex,
                destinationContext: payload.destinationContext,
            },
        }),
    });
    const data = (await res.json().catch(() => null)) as RegenerateActivityApiResponse & { error?: string };
    if (!res.ok) {
        throw new Error(data?.error || 'Régénération impossible.');
    }
    return {
        reply: typeof data.reply === 'string' ? data.reply : '',
        replacement: data.replacement && typeof data.replacement === 'object' ? data.replacement : null,
    };
}
