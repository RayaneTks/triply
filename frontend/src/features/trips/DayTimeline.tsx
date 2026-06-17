'use client';

import { FC, useMemo, useState } from 'react';
import {
    Building,
    Camera,
    ChevronDown,
    Clock,
    Coffee,
    Compass,
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

export const DayTimeline: FC<DayTimelineProps> = ({ tripId, day, onLikedChange, onDelete }) => {
    const [expanded, setExpanded] = useState(day.index === 1);

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
        <section className="triply-card p-6 lg:p-8 space-y-4" aria-label={`Programme du jour ${day.index}`}>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-light-border pb-4 text-left rounded-lg -m-1 p-1 hover:bg-light-bg/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
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
                </div>
                <div className="flex items-center gap-4 text-xs text-light-muted font-bold shrink-0">
                    <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {formatDurationLabel(totalHours)}
                    </span>
                    <span>
                        {day.activities.length} activité{day.activities.length > 1 ? 's' : ''}
                    </span>
                </div>
            </button>

            {expanded && (
            <ol className="relative space-y-6 pl-8">
                <span
                    aria-hidden
                    className="absolute left-3 top-1 bottom-1 w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent"
                />
                {categorized.map(({ activity, category, Icon, startTime, endTime, durationLabel }, index) => (
                    <li key={activity.id} className="relative group">
                        <span
                            aria-hidden
                            className={cn(
                                'absolute -left-[1.875rem] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ring-2 ring-brand/30',
                                index === 0 ? 'bg-brand' : 'bg-brand/80',
                            )}
                        />
                        <div className="flex flex-col gap-3 rounded-2xl border border-light-border bg-light-bg/40 p-4 transition-colors group-hover:bg-light-bg">
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
                                    {category !== 'food' &&
                                        category !== 'drink' &&
                                        activity.attributes.lat != null &&
                                        activity.attributes.lng != null &&
                                        Number.isFinite(activity.attributes.lat) &&
                                        Number.isFinite(activity.attributes.lng) && (
                                            <NearbyRestaurants
                                                activityId={activity.id}
                                                activityTitle={activity.attributes.title}
                                            />
                                        )}
                                </div>
                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
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
                ))}
            </ol>
            )}
        </section>
    );
};
