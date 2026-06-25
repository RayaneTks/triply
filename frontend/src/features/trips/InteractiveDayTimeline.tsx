'use client';

import { FC, useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
    AlertTriangle,
    Building,
    Camera,
    ChevronDown,
    Clock,
    Coffee,
    Compass,
    GripVertical,
    Landmark,
    Leaf,
    MapPin,
    Music,
    RefreshCw,
    ShoppingBag,
    Trash2,
    Trees,
    UtensilsCrossed,
    Wine,
} from 'lucide-react';
import { LikeButtons } from '../../components/activities/LikeButtons';
import { NearbyRestaurants } from '../../components/activities/NearbyRestaurants';
import type { ActivityDayBucket, ActivityResource, LikedState } from '../../lib/activities-client';
import { cn } from '../../lib/utils';
import {
    ACTIVITY_TIME_ALERT_COLOR,
    formatDurationLabel,
    parseDurationHours,
    type DayTimeBudget,
} from './trip-time-utils';
import { dayColor } from './trip-map-constants';

interface InteractiveDayTimelineProps {
    tripId: string;
    day: ActivityDayBucket;
    selected?: boolean;
    onSelect?: () => void;
    timeBudget?: DayTimeBudget;
    onLikedChange: (activityId: string, state: LikedState) => void;
    onDelete: (activity: ActivityResource) => void;
    onReorder: (activityIds: string[]) => void;
    onRegenerateActivity: (activity: ActivityResource) => void;
    onRegenerateDay: () => void;
    regeneratingActivityId?: string | null;
    regeneratingDay?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    food: 'bg-amber-50 text-amber-700 border-amber-200',
    drink: 'bg-rose-50 text-rose-700 border-rose-200',
    museum: 'bg-violet-50 text-violet-700 border-violet-200',
    monument: 'bg-blue-50 text-blue-700 border-blue-200',
    nature: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shopping: 'bg-pink-50 text-pink-700 border-pink-200',
    nightlife: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    photo: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    walk: 'bg-teal-50 text-teal-700 border-teal-200',
    default: 'bg-brand/10 text-brand border-brand/20',
};

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Gastronomie',
    drink: 'Café / Bar',
    museum: 'Musée',
    monument: 'Monument',
    nature: 'Nature',
    shopping: 'Shopping',
    nightlife: 'Vie nocturne',
    photo: 'Panorama',
    walk: 'Balade',
    default: 'Activité',
};

function classifyActivity(title: string): { category: keyof typeof CATEGORY_COLORS; Icon: typeof Landmark } {
    const t = title.toLowerCase();
    if (/restaurant|déjeuner|dejeuner|dîner|diner|bistrot|trattoria|brunch|gastronomie|tapas/.test(t)) {
        return { category: 'food', Icon: UtensilsCrossed };
    }
    if (/café|coffee|bar à|bar a |bar\b|salon de thé|tea/.test(t)) {
        return { category: 'drink', Icon: Coffee };
    }
    if (/musée|musee|museum|galerie|gallery|exposition/.test(t)) {
        return { category: 'museum', Icon: Building };
    }
    if (/cathédrale|cathedrale|église|eglise|basilique|palais|château|chateau|monument|tour|arc /.test(t)) {
        return { category: 'monument', Icon: Landmark };
    }
    if (/parc|jardin|forêt|foret|montagne|plage|lac|nature|randonnée|randonnee|hike/.test(t)) {
        return { category: 'nature', Icon: Trees };
    }
    if (/marché|marche|boutique|shopping|magasin/.test(t)) {
        return { category: 'shopping', Icon: ShoppingBag };
    }
    if (/club|concert|spectacle|opéra|opera|théâtre|theatre|fado|nightlife|cabaret/.test(t)) {
        return { category: 'nightlife', Icon: Music };
    }
    if (/panorama|viewpoint|belvédère|belvedere|skyline|sunset|coucher de soleil/.test(t)) {
        return { category: 'photo', Icon: Camera };
    }
    if (/balade|promenade|stroll|walking tour|quartier/.test(t)) {
        return { category: 'walk', Icon: Compass };
    }
    if (/dégustation|degustation|cave|vignoble|winery|vin /.test(t)) {
        return { category: 'drink', Icon: Wine };
    }
    if (/bio|écologique|ecologique|herboriste|spa|wellness/.test(t)) {
        return { category: 'nature', Icon: Leaf };
    }
    return { category: 'default', Icon: MapPin };
}

function formatClock(totalMinutesFromMidnight: number): string {
    const wrapped = ((totalMinutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface DraggableActivityRowProps {
    tripId: string;
    activity: ActivityResource;
    index: number;
    isFirst: boolean;
    onLikedChange: (activityId: string, state: LikedState) => void;
    onDelete: (activity: ActivityResource) => void;
    onRegenerate: () => void;
    regenerating: boolean;
}

const DraggableActivityRow: FC<DraggableActivityRowProps> = ({
    tripId,
    activity,
    index,
    isFirst,
    onLikedChange,
    onDelete,
    onRegenerate,
    regenerating,
}) => {
    const dragControls = useDragControls();
    const { category, Icon } = classifyActivity(activity.attributes.title || '');
    const hours = parseDurationHours(activity.attributes.duration ?? null);
    const startMinutes = 9 * 60 + index * (hours * 60 + 30);
    const endMinutes = startMinutes + Math.round(hours * 60);
    const { lat, lng } = activity.attributes;
    const hasGeo = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    return (
        <Reorder.Item
            value={activity}
            dragListener={false}
            dragControls={dragControls}
            className="relative group list-none"
        >
            <span
                aria-hidden
                className={cn(
                    'absolute -left-[1.875rem] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ring-2 ring-brand/30',
                    isFirst ? 'bg-brand' : 'bg-brand/80',
                )}
            />
            <div className="flex flex-col gap-3 rounded-2xl border border-light-border bg-light-bg/40 p-4 transition-colors group-hover:bg-light-bg">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <button
                        type="button"
                        className="cursor-grab active:cursor-grabbing text-light-muted hover:text-brand p-0.5 -ml-1"
                        onPointerDown={(e) => dragControls.start(e)}
                        aria-label="Réordonner"
                    >
                        <GripVertical size={14} />
                    </button>
                    <span className="inline-flex items-center gap-1 text-brand">
                        <Clock size={12} /> {formatClock(startMinutes)} – {formatClock(endMinutes)}
                    </span>
                    <span className="text-light-muted">·</span>
                    <span className="text-light-muted">{formatDurationLabel(hours)}</span>
                    <span
                        className={cn(
                            'ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                            CATEGORY_COLORS[category],
                        )}
                    >
                        <Icon size={11} />
                        {CATEGORY_LABELS[category]}
                    </span>
                </div>

                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            'shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border',
                            CATEGORY_COLORS[category],
                        )}
                    >
                        <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-bold text-light-foreground text-base leading-snug">
                            {activity.attributes.title}
                        </p>
                        {(activity.attributes.city || activity.attributes.country) && (
                            <p className="inline-flex items-center gap-1 text-xs text-light-muted font-medium">
                                <MapPin size={10} />
                                {activity.attributes.city}
                                {activity.attributes.country ? `, ${activity.attributes.country}` : ''}
                            </p>
                        )}
                        {category !== 'food' && category !== 'drink' && hasGeo && (
                            <NearbyRestaurants
                                activityId={activity.id}
                                activityTitle={activity.attributes.title}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={onRegenerate}
                            disabled={regenerating}
                            aria-label="Régénérer avec l'IA"
                            title="Régénérer avec l'IA"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-brand hover:bg-brand/10 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                        </button>
                        <LikeButtons
                            tripId={tripId}
                            activityId={activity.id}
                            initialState={activity.attributes.liked_state}
                            onChange={(state) => onLikedChange(activity.id, state)}
                        />
                        <button
                            type="button"
                            onClick={() => onDelete(activity)}
                            aria-label={`Supprimer ${activity.attributes.title}`}
                            title="Supprimer"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-error hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
};

export const InteractiveDayTimeline: FC<InteractiveDayTimelineProps> = ({
    tripId,
    day,
    selected,
    onSelect,
    timeBudget,
    onLikedChange,
    onDelete,
    onReorder,
    onRegenerateActivity,
    onRegenerateDay,
    regeneratingActivityId,
    regeneratingDay,
}) => {
    const [expanded, setExpanded] = useState(day.index === 1);
    const color = dayColor(day.index);

    const totalHours = useMemo(
        () => day.activities.reduce((sum, a) => sum + parseDurationHours(a.attributes.duration ?? null), 0),
        [day.activities],
    );

    return (
        <section
            className={cn(
                'triply-card p-6 lg:p-8 transition-shadow',
                selected && 'ring-2 ring-brand/40 shadow-md',
            )}
            aria-label={`Programme du jour ${day.index}`}
            onClick={onSelect}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((v) => !v);
                    }}
                    aria-expanded={expanded}
                    className="flex flex-wrap items-center gap-3 text-left min-w-0"
                >
                    <ChevronDown
                        size={18}
                        className={cn(
                            'shrink-0 text-light-muted transition-transform duration-200',
                            expanded ? 'rotate-0' : '-rotate-90',
                        )}
                        aria-hidden
                    />
                    <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest text-white"
                        style={{ backgroundColor: color }}
                    >
                        Jour {String(day.index).padStart(2, '0')}
                    </span>
                    {day.date && (
                        <span className="text-xs text-light-muted font-bold capitalize">
                            {new Date(day.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </span>
                    )}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-light-muted font-bold">
                        {day.activities.length} activité{day.activities.length > 1 ? 's' : ''} ·{' '}
                        {formatDurationLabel(totalHours)}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegenerateDay();
                        }}
                        disabled={regeneratingDay}
                        className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand hover:bg-brand/10 disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={regeneratingDay ? 'animate-spin' : ''} />
                        Régénérer le jour
                    </button>
                </div>
            </div>

            {timeBudget?.overBudget && (
                <div
                    className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                    style={{
                        borderColor: `${ACTIVITY_TIME_ALERT_COLOR}55`,
                        backgroundColor: `${ACTIVITY_TIME_ALERT_COLOR}15`,
                        color: ACTIVITY_TIME_ALERT_COLOR,
                    }}
                >
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        Journée chargée : {formatDurationLabel(timeBudget.totalHours)} au total (
                        {formatDurationLabel(timeBudget.activityHours)} activités +{' '}
                        {formatDurationLabel(timeBudget.travelHours)} trajets) — budget conseillé{' '}
                        {formatDurationLabel(timeBudget.maxHours)}.
                    </span>
                </div>
            )}

            {expanded && (
                <Reorder.Group
                    axis="y"
                    values={day.activities}
                    onReorder={(reordered) => onReorder(reordered.map((a) => a.id))}
                    className="relative mt-4 space-y-6 pl-8 list-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span
                        aria-hidden
                        className="absolute left-3 top-5 bottom-1 w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent"
                    />
                    {day.activities.map((activity, index) => (
                        <DraggableActivityRow
                            key={activity.id}
                            tripId={tripId}
                            activity={activity}
                            index={index}
                            isFirst={index === 0}
                            onLikedChange={onLikedChange}
                            onDelete={onDelete}
                            onRegenerate={() => onRegenerateActivity(activity)}
                            regenerating={regeneratingActivityId === activity.id}
                        />
                    ))}
                </Reorder.Group>
            )}
        </section>
    );
};
