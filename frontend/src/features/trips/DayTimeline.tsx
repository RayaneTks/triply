'use client';

import { FC, useMemo, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
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

interface DayTimelineProps {
    tripId: string;
    day: ActivityDayBucket;
    onLikedChange: (activityId: string, state: LikedState) => void;
    onDelete: (activity: ActivityResource) => void;
    /** Réordonne les activités du jour (nouvel ordre d'ids). Optionnel : sans
     *  callback, le drag & drop est désactivé. */
    onReorder?: (orderedActivityIds: string[]) => void;
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

interface CategorizedActivity {
    activity: ActivityResource;
    category: keyof typeof CATEGORY_COLORS;
    Icon: typeof Landmark;
    startTime: string;
    endTime: string;
    durationLabel: string;
}

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

function parseDurationHours(raw: string | null | undefined): number {
    if (!raw) return 2;
    const match = raw.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return 2;
    const value = parseFloat(match[1].replace(',', '.'));
    return Number.isFinite(value) && value > 0 ? Math.min(8, value) : 2;
}

function formatClock(totalMinutesFromMidnight: number): string {
    const wrapped = ((totalMinutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDurationLabel(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m}`;
}

interface DayHeaderProps {
    index: number;
    date: string | null;
    totalHoursLabel: string;
    activityCount: number;
    expanded: boolean;
    onToggle: () => void;
}

const DayHeader: FC<DayHeaderProps> = ({
    index,
    date,
    totalHoursLabel,
    activityCount,
    expanded,
    onToggle,
}) => (
    <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
            'flex w-full flex-wrap items-center justify-between gap-3 text-left rounded-xl px-1 py-1 -mx-1 transition-colors',
            'hover:bg-light-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
            expanded ? 'mb-1' : 'pb-1',
        )}
    >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
            <ChevronDown
                size={18}
                className={cn(
                    'shrink-0 text-light-muted transition-transform duration-200',
                    expanded ? 'rotate-0' : '-rotate-90',
                )}
                aria-hidden
            />
            <span className="text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Jour {String(index).padStart(2, '0')}
            </span>
            {date && (
                <span className="text-xs text-light-muted font-bold capitalize">
                    {new Date(date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </span>
            )}
        </div>
        <div className="flex items-center gap-4 text-xs text-light-muted font-bold shrink-0">
            <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {totalHoursLabel}
            </span>
            <span>
                {activityCount} activité{activityCount > 1 ? 's' : ''}
            </span>
        </div>
    </button>
);

interface ActivityRowProps {
    tripId: string;
    item: CategorizedActivity;
    index: number;
    isFirst: boolean;
    activityCount: number;
    reorderable: boolean;
    dragIndex: number | null;
    overIndex: number | null;
    onLikedChange: (activityId: string, state: LikedState) => void;
    onDelete: (activity: ActivityResource) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: () => void;
    onDrop: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const ActivityRow: FC<ActivityRowProps> = ({
    tripId,
    item,
    index,
    isFirst,
    activityCount,
    reorderable,
    dragIndex,
    overIndex,
    onLikedChange,
    onDelete,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onMoveUp,
    onMoveDown,
}) => {
    const { activity, category, Icon, startTime, endTime, durationLabel } = item;
    const { lat, lng } = activity.attributes;
    const hasGeo = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    const { activity, category, Icon, startTime, endTime, durationLabel } = item;
    const { lat, lng } = activity.attributes;
    const hasGeo = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    return (
        <li
            className="relative group"
            onDragOver={reorderable ? (e) => { e.preventDefault(); onDragOver(); } : undefined}
            onDrop={reorderable ? (e) => { e.preventDefault(); onDrop(); } : undefined}
        >
            <span
                aria-hidden
                className={cn(
                    'absolute -left-[1.875rem] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ring-2 ring-brand/30',
                    isFirst ? 'bg-brand' : 'bg-brand/80',
                )}
            />
            <div
                className={cn(
                    'flex flex-col gap-3 rounded-2xl border border-light-border bg-light-bg/40 p-4 transition-colors group-hover:bg-light-bg',
                    dragIndex === index && 'opacity-50',
                    reorderable && overIndex === index && dragIndex !== null && dragIndex !== index && 'ring-2 ring-brand/50',
                )}
            >
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="inline-flex items-center gap-1 text-brand">
                        <Clock size={12} /> {startTime} – {endTime}
                    </span>
                    <span className="text-light-muted">·</span>
                    <span className="text-light-muted">{durationLabel}</span>
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
                        {reorderable && (
                            <>
                                <span
                                    draggable
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    role="button"
                                    aria-label={`Glisser pour déplacer ${activity.attributes.title}`}
                                    title="Glisser pour réordonner"
                                    className="hidden h-8 w-8 cursor-grab items-center justify-center rounded-full text-light-muted hover:bg-light-bg hover:text-brand active:cursor-grabbing sm:flex"
                                >
                                    <GripVertical size={14} />
                                </span>
                                <div className="flex flex-col sm:hidden">
                                    <button
                                        type="button"
                                        onClick={onMoveUp}
                                        disabled={index === 0}
                                        aria-label="Monter l'activité"
                                        className="flex h-5 w-7 items-center justify-center rounded text-light-muted hover:text-brand disabled:opacity-30"
                                    >
                                        <ArrowUp size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onMoveDown}
                                        disabled={index === activityCount - 1}
                                        aria-label="Descendre l'activité"
                                        className="flex h-5 w-7 items-center justify-center rounded text-light-muted hover:text-brand disabled:opacity-30"
                                    >
                                        <ArrowDown size={13} />
                                    </button>
                                </div>
                            </>
                        )}
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
        </li>
    );
};

export const DayTimeline: FC<DayTimelineProps> = ({ tripId, day, onLikedChange, onDelete, onReorder }) => {
    const [expanded, setExpanded] = useState(day.index === 1);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const reorderable = typeof onReorder === 'function' && day.activities.length > 1;

    /** Applique un déplacement de `from` vers `to` et émet le nouvel ordre. */
    const move = (from: number, to: number) => {
        if (!onReorder) return;
        const ids = day.activities.map((a) => a.id);
        if (from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) return;
        const next = [...ids];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onReorder(next);
    };

    const handleDrop = (to: number) => {
        if (dragIndex !== null) move(dragIndex, to);
        setDragIndex(null);
        setOverIndex(null);
    };

    const categorized = useMemo<CategorizedActivity[]>(() => {
        const startOfDay = 9 * 60; // 09:00
        const gap = 30; // minutes between activities
        const out: CategorizedActivity[] = [];
        let next = startOfDay;
        for (const activity of day.activities) {
            const { category, Icon } = classifyActivity(activity.attributes.title || '');
            const hours = parseDurationHours(activity.attributes.duration ?? null);
            const startMinutes = next;
            const endMinutes = startMinutes + Math.round(hours * 60);
            next = endMinutes + gap;
            out.push({
                activity,
                category,
                Icon,
                startTime: formatClock(startMinutes),
                endTime: formatClock(endMinutes),
                durationLabel: formatDurationLabel(hours),
            });
        }
        return out;
    }, [day.activities]);

    const totalHours = useMemo(() => {
        return day.activities.reduce((sum, a) => sum + parseDurationHours(a.attributes.duration ?? null), 0);
    }, [day.activities]);

    return (
        <section className="triply-card p-6 lg:p-8" aria-label={`Programme du jour ${day.index}`}>
            <DayHeader
                index={day.index}
                date={day.date}
                totalHoursLabel={formatDurationLabel(totalHours)}
                activityCount={day.activities.length}
                expanded={expanded}
                onToggle={() => setExpanded((v) => !v)}
            />

            {expanded && (
                <ol className="relative mt-4 space-y-6 pl-8">
                    <span
                        aria-hidden
                        className="absolute left-3 top-5 bottom-1 w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent"
                    />
                    {categorized.map((item, index) => (
                        <ActivityRow
                            key={item.activity.id}
                            tripId={tripId}
                            item={item}
                            index={index}
                            isFirst={index === 0}
                            activityCount={day.activities.length}
                            reorderable={reorderable}
                            dragIndex={dragIndex}
                            overIndex={overIndex}
                            onLikedChange={onLikedChange}
                            onDelete={onDelete}
                            onDragStart={() => setDragIndex(index)}
                            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                            onDragOver={() => setOverIndex(index)}
                            onDrop={() => handleDrop(index)}
                            onMoveUp={() => move(index, index - 1)}
                            onMoveDown={() => move(index, index + 1)}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
};
