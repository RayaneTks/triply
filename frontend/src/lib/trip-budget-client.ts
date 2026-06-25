'use client';

import { apiFetch, type ApiSuccessEnvelope } from './http';

export type BudgetSwapKind = 'hotel' | 'transport' | 'activity';
export type BudgetSwapAction = 'downgrade' | 'cheaper_alternative' | 'drop';
export type BudgetImpactLevel = 'low' | 'medium' | 'high';

export interface BudgetSwap {
    id: string;
    kind: BudgetSwapKind;
    entity_id: string;
    action: BudgetSwapAction;
    title: string;
    description: string;
    current_cost_eur: number;
    proposed_cost_eur: number;
    savings_eur: number;
    impact_level: BudgetImpactLevel;
    recommended: boolean;
}

export interface BudgetReshufflePayload {
    trip_id: string;
    savings_target_eur: number;
    total_cost_eur: number;
    total_savings_eur: number;
    target_met: boolean;
    swaps: BudgetSwap[];
}

function unwrap<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return (payload as ApiSuccessEnvelope<T>).data;
    }
    return payload as T;
}

export const tripBudgetClient = {
    async reshuffle(tripId: string, savingsTargetEur: number): Promise<BudgetReshufflePayload> {
        const res = await apiFetch<unknown>(`/trips/${tripId}/budget-reshuffle`, {
            method: 'POST',
            body: { savings_target_eur: savingsTargetEur },
        });
        return unwrap<BudgetReshufflePayload>(res);
    },
};

export function swapKindLabel(kind: BudgetSwapKind): string {
    switch (kind) {
        case 'hotel':
            return 'Hôtel';
        case 'transport':
            return 'Transport';
        case 'activity':
            return 'Activité';
    }
}

export function swapKindEmoji(kind: BudgetSwapKind): string {
    switch (kind) {
        case 'hotel':
            return '🛏️';
        case 'transport':
            return '✈️';
        case 'activity':
            return '🎟️';
    }
}
