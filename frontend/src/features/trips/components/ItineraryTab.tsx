'use client';

import { FC, useMemo } from 'react';
import { CalendarRange, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { ActivitiesSkeleton } from '../../../components/ui/Skeleton';
import type { ActivityDayBucket, ActivityResource, LikedState } from '../../../lib/activities-client';
import type { TripDetailDisplay } from '../../../lib/trip-view-adapter';
import { DayTimeline } from '../DayTimeline';
import { TripDayPreviewCard } from './TripDayPreviewCard';

interface ItineraryTabProps {
    tripId: string;
    trip: TripDetailDisplay;
    activitiesByDay: ActivityDayBucket[];
    activitiesLoading: boolean;
    activitiesError: string | null;
    cityGroups: Map<string, ActivityResource[]>;
    hasRealActivities: boolean;
    onLikedChange: (activityId: string, state: LikedState) => void;
    onDeleteActivity: (activity: ActivityResource) => void;
    onRequestCityDelete: (city: string) => void;
    onReorderDay?: (dayId: string, orderedIds: string[]) => void;
}

export const ItineraryTab: FC<ItineraryTabProps> = ({
    tripId,
    trip,
    activitiesByDay,
    activitiesLoading,
    activitiesError,
    cityGroups,
    hasRealActivities,
    onLikedChange,
    onDeleteActivity,
    onRequestCityDelete,
    onReorderDay,
}) => {
    const summary = useMemo(() => {
        const daysWithActivities = activitiesByDay.filter((d) => d.activities.length > 0);
        const totalActivities = daysWithActivities.reduce((sum, d) => sum + d.activities.length, 0);
        return {
            days: daysWithActivities.length,
            activities: totalActivities,
            cities: cityGroups.size,
        };
    }, [activitiesByDay, cityGroups]);

    return (
        <div className="space-y-8">
            {activitiesError && (
                <p className="text-sm text-error" role="alert">
                    {activitiesError}
                </p>
            )}

            {activitiesLoading && <ActivitiesSkeleton count={3} />}

            {hasRealActivities && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold" aria-label="Résumé de l'itinéraire">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1.5">
                        <CalendarRange size={12} /> {summary.days} jour{summary.days > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1.5">
                        <Sparkles size={12} /> {summary.activities} activité{summary.activities > 1 ? 's' : ''}
                    </span>
                    {summary.cities > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1.5">
                            <MapPin size={12} /> {summary.cities} ville{summary.cities > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {hasRealActivities && cityGroups.size > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-light-muted">
                        Villes du voyage
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(cityGroups.entries()).map(([city, items]) => (
                            <div
                                key={city}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 text-brand border border-brand/20 text-sm font-bold"
                            >
                                <MapPin size={12} />
                                <span>{city}</span>
                                <span className="text-xs opacity-70">{items.length}</span>
                                <button
                                    type="button"
                                    onClick={() => onRequestCityDelete(city)}
                                    className="ml-1 text-light-muted hover:text-error"
                                    aria-label={`Supprimer la ville ${city}`}
                                    title="Supprimer cette ville du voyage"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasRealActivities ? (
                activitiesByDay
                    .filter((day) => day.activities.length > 0)
                    .map((day) => {
                        return (
                            <div key={day.day_id} className="space-y-4">
                                <DayTimeline
                                    tripId={tripId}
                                    day={day}
                                    onLikedChange={onLikedChange}
                                    onDelete={onDeleteActivity}
                                    onReorder={
                                        onReorderDay
                                            ? (orderedIds) => onReorderDay(day.day_id, orderedIds)
                                            : undefined
                                    }
                                />
                            </div>
                        );
                    })
            ) : (
                !activitiesLoading && (
                    <div className="space-y-6">
                        {trip.days.map((day) => (
                            <TripDayPreviewCard key={day.id} day={day} />
                        ))}
                        <p className="text-xs text-light-muted font-bold">
                            Pas encore d’activités dans cet itinéraire. Dès que vous en ajoutez,
                            vous pourrez les aimer, les retirer ou les regrouper par ville.
                        </p>
                    </div>
                )
            )}
        </div>
    );
};
