'use client';

import React, { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { activitiesClient, type LikedState } from '../../lib/activities-client';

interface LikeButtonsProps {
    tripId: string;
    activityId: string;
    initialState?: LikedState;
    onChange?: (state: LikedState) => void;
    size?: 'sm' | 'md';
    className?: string;
}

export function LikeButtons({
    tripId,
    activityId,
    initialState = 'neutral',
    onChange,
    size = 'sm',
    className,
}: LikeButtonsProps) {
    const [state, setState] = useState<LikedState>(initialState);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const iconSize = size === 'sm' ? 14 : 16;
    const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

    const apply = async (next: LikedState) => {
        const target: LikedState = state === next ? 'neutral' : next;
        const previous = state;
        setState(target);
        setSaving(true);
        setError(null);
        try {
            await activitiesClient.setLikedState(tripId, activityId, target);
            onChange?.(target);
        } catch (err) {
            setState(previous);
            setError(err instanceof Error ? err.message : 'Impossible d’enregistrer votre avis.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <button
                type="button"
                aria-pressed={state === 'liked'}
                aria-label="J’aime cette activité"
                disabled={saving}
                onClick={(e) => {
                    e.stopPropagation();
                    void apply('liked');
                }}
                className={cn(
                    'rounded-full flex items-center justify-center transition-colors border',
                    buttonSize,
                    state === 'liked'
                        ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                        : 'bg-light-bg text-light-muted border-light-border hover:text-emerald-600 hover:border-emerald-200',
                    saving && 'opacity-60',
                )}
                title="J’aime"
            >
                <ThumbsUp size={iconSize} />
            </button>
            <button
                type="button"
                aria-pressed={state === 'disliked'}
                aria-label="Je n’aime pas cette activité"
                disabled={saving}
                onClick={(e) => {
                    e.stopPropagation();
                    void apply('disliked');
                }}
                className={cn(
                    'rounded-full flex items-center justify-center transition-colors border',
                    buttonSize,
                    state === 'disliked'
                        ? 'bg-red-100 text-error border-red-200'
                        : 'bg-light-bg text-light-muted border-light-border hover:text-error hover:border-red-200',
                    saving && 'opacity-60',
                )}
                title="Je n’aime pas"
            >
                <ThumbsDown size={iconSize} />
            </button>
            {error && (
                <span className="text-[10px] text-error ml-1" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
