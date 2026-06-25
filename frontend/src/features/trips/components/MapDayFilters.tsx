'use client';

import { FC } from 'react';
import { cn } from '../../../lib/utils';
import { dayColor } from '../trip-map-constants';
import type { ActivityDayBucket } from '../../../lib/activities-client';
import type { MapVisualStyle } from './MapControls3D';

interface MapDayFiltersProps {
    activitiesByDay: ActivityDayBucket[];
    selectedMapDayIds: string[];
    onSelectedMapDayIdsChange: (ids: string[]) => void;
    mapRouteMode: 'full' | 'localOnly';
    onMapRouteModeChange: (mode: 'full' | 'localOnly') => void;
    mapStyle: MapVisualStyle;
    className?: string;
}

export const MapDayFilters: FC<MapDayFiltersProps> = ({
    activitiesByDay,
    selectedMapDayIds,
    onSelectedMapDayIdsChange,
    mapRouteMode,
    onMapRouteModeChange,
    mapStyle,
    className,
}) => {
    const tones = mapStyle === 'light'
        ? {
            label: 'text-slate-600',
            base: 'border-slate-300 bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900',
            active: 'border-slate-400 bg-slate-900/10 text-slate-900',
            activeOnDayText: 'text-slate-900',
        }
        : {
            label: 'text-white/70',
            base: 'border-white/20 bg-slate-900/60 text-white/80 hover:text-white',
            active: 'border-white/40 bg-white/20 text-white',
            activeOnDayText: 'text-white',
        };

    const daysWithGeo = activitiesByDay.filter((d) =>
        d.activities.some(
            (a) =>
                a.attributes.lat != null &&
                a.attributes.lng != null &&
                Number.isFinite(a.attributes.lat) &&
                Number.isFinite(a.attributes.lng),
        ),
    );

    if (daysWithGeo.length === 0) return null;

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-widest', tones.label)}>Afficher</span>
                <button
                    type="button"
                    onClick={() => onSelectedMapDayIdsChange([])}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md',
                        selectedMapDayIds.length === 0
                            ? tones.active
                            : tones.base,
                    )}
                >
                    Tous les jours
                </button>
                {daysWithGeo.map((day) => {
                    const on = selectedMapDayIds.includes(day.day_id);
                    const color = dayColor(day.index);
                    return (
                        <button
                            key={day.day_id}
                            type="button"
                            onClick={() => {
                                if (on) {
                                    onSelectedMapDayIdsChange(selectedMapDayIds.filter((id) => id !== day.day_id));
                                } else {
                                    onSelectedMapDayIdsChange([...selectedMapDayIds, day.day_id]);
                                }
                            }}
                            className={cn(
                                'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md',
                                on ? tones.activeOnDayText : tones.base,
                            )}
                            style={on ? { borderColor: color, backgroundColor: `${color}33` } : undefined}
                        >
                            Jour {day.index}
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-widest', tones.label)}>Trajets</span>
                <button
                    type="button"
                    onClick={() => onMapRouteModeChange('full')}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md',
                        mapRouteMode === 'full'
                            ? tones.active
                            : tones.base,
                    )}
                >
                    Trajet complet
                </button>
                <button
                    type="button"
                    onClick={() => onMapRouteModeChange('localOnly')}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md',
                        mapRouteMode === 'localOnly'
                            ? tones.active
                            : tones.base,
                    )}
                >
                    Sur place uniquement
                </button>
            </div>
        </div>
    );
};
