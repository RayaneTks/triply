'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Plus, RefreshCw, Sparkles } from 'lucide-react';

import {
    categoryEmoji,
    formatFreeMinutes,
    tripFreeTimeClient,
    type FreeTimePayload,
    type FreeTimeSuggestion,
} from '../../lib/trip-freetime-client';
import type { PlanSnapshot, PlanSnapshotActivity, PlanSnapshotDay } from '../../lib/plan-snapshot';
import { tripsClient, type TripApi } from '../../lib/trips-client';
import { cn } from '../../lib/utils';

interface FreeTimeWidgetProps {
    trip: TripApi;
    day: number;
    onInserted: () => void;
}

export function FreeTimeWidget({ trip, day, onInserted }: FreeTimeWidgetProps) {
    const [data, setData] = useState<FreeTimePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [insertingId, setInsertingId] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fresh = await tripFreeTimeClient.getForDay(trip.id, day);
            setData(fresh);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de charger la suggestion.');
        } finally {
            setLoading(false);
        }
    }, [trip.id, day]);

    useEffect(() => {
        void reload();
    }, [reload]);

    async function insert(suggestion: FreeTimeSuggestion) {
        const slotId = suggestion.id ?? `${suggestion.lat}-${suggestion.lng}`;
        setInsertingId(slotId);
        try {
            const merged = appendActivityToSnapshot(trip.plan_snapshot ?? { days: [] }, day, suggestion);
            await tripsClient.update(trip.id, { plan_snapshot: merged });
            onInserted();
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ajout impossible.");
        } finally {
            setInsertingId(null);
        }
    }

    if (dismissed || (!loading && data && !data.has_free_time)) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="triply-card p-5 mb-6 border-brand/30"
                style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 4%, transparent)' }}
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                        <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                                color: 'var(--primary)',
                            }}
                        >
                            <Sparkles size={16} />
                        </span>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-brand font-bold flex items-center gap-2">
                                <Clock size={11} /> Concierge — temps libre détecté
                            </p>
                            {data && (
                                <p className="text-sm text-light-foreground mt-1 font-bold">
                                    Vous avez <span className="text-brand">{formatFreeMinutes(data.free_minutes)}</span> de
                                    libre sur le jour {day}.
                                </p>
                            )}
                            {!data && loading && (
                                <p className="text-sm text-light-muted mt-1">Analyse de votre journée…</p>
                            )}
                            {error && <p className="text-xs text-error mt-1">{error}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => void reload()}
                            disabled={loading}
                            aria-label="Recharger les suggestions"
                            className="p-1.5 rounded-lg text-light-muted hover:text-brand hover:bg-light-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="text-xs text-light-muted hover:text-light-foreground px-2 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
                        >
                            Masquer
                        </button>
                    </div>
                </div>

                {data && data.suggestions.length > 0 && (
                    <ul className="grid sm:grid-cols-2 gap-2 mt-2">
                        {data.suggestions.slice(0, 4).map((s, i) => {
                            const slotId = s.id ?? `${s.lat}-${s.lng}-${i}`;
                            const isLoading = insertingId === slotId;
                            return (
                                <li
                                    key={slotId}
                                    className="flex items-center gap-3 bg-light-bg border border-light-border rounded-xl p-3"
                                >
                                    <span className="text-xl leading-none shrink-0" aria-hidden="true">
                                        {categoryEmoji(s.category)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-light-foreground truncate">{s.name}</p>
                                        <p className="text-xs text-light-muted">
                                            {s.distance_km.toFixed(1)} km ·{' '}
                                            <span className="text-brand/80">
                                                {s.walking_minutes <= 0 ? '< 1 min' : `${s.walking_minutes} min à pied`}
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void insert(s)}
                                        disabled={isLoading}
                                        aria-label={`Ajouter ${s.name} au jour ${day}`}
                                        className={cn(
                                            'shrink-0 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                            isLoading
                                                ? 'bg-brand/30 text-white cursor-wait'
                                                : 'bg-brand text-white hover:bg-brand-hover',
                                        )}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {data && data.has_free_time && data.suggestions.length === 0 && !loading && !error && (
                    <p className="text-xs text-light-muted mt-2">
                        Aucune suggestion à proximité — réessayez plus tard ou ajoutez manuellement une étape.
                    </p>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

function appendActivityToSnapshot(
    snapshot: PlanSnapshot,
    dayNumber: number,
    suggestion: FreeTimeSuggestion,
): PlanSnapshot {
    const days: PlanSnapshotDay[] = Array.isArray(snapshot.days) ? [...snapshot.days] : [];

    const targetIdx = days.findIndex((d, i) => {
        const dayIndex = d.dayIndex >= 1 ? d.dayIndex : i + 1;
        return dayIndex === dayNumber;
    });

    // Walking budget ≈ 30 minutes by default; round up to nearest 0.25h.
    const durationHours = Math.max(0.25, Math.round((30 + suggestion.walking_minutes) / 15) * 0.25);

    const newActivity: PlanSnapshotActivity = {
        title: suggestion.name,
        lat: suggestion.lat,
        lng: suggestion.lng,
        durationHours,
    };

    if (targetIdx >= 0) {
        const existing = days[targetIdx];
        days[targetIdx] = {
            ...existing,
            activities: [...existing.activities, newActivity],
        };
    } else {
        days.push({ dayIndex: dayNumber, activities: [newActivity] });
    }

    return { ...snapshot, days };
}
