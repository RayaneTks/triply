'use client';

import { FC } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { TripDetailDay } from '../../../lib/trip-view-adapter';

interface TripDayPreviewCardProps {
    day: TripDetailDay;
}

/**
 * Carte de jour affichée tant que l'itinéraire IA n'a pas encore d'activités
 * persistées. Reprend le vocabulaire visuel de `DayTimeline` (badge Jour,
 * titre, statut) sans afficher d'horaires fictifs.
 */
export const TripDayPreviewCard: FC<TripDayPreviewCardProps> = ({ day }) => (
    <div className="triply-card p-6 lg:p-8 group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand/10 transition-colors group-hover:bg-brand" />
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-3 min-w-0">
                <span className="inline-block text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Jour {String(day.id).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-bold leading-snug">{day.title}</h3>
                <span
                    className={cn(
                        'inline-flex px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                        day.status === 'Prêt' ? 'bg-brand/10 text-brand' : 'bg-amber-50 text-amber-600',
                    )}
                >
                    {day.status}
                </span>
            </div>
            <ChevronRight className="text-light-border group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0" />
        </div>
    </div>
);
