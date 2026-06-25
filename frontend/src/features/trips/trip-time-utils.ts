import type { ActivityDayBucket } from '../../lib/activities-client';

export function parseDurationHours(raw: string | null | undefined): number {
    if (!raw) return 2;
    const match = raw.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return 2;
    const value = parseFloat(match[1].replace(',', '.'));
    return Number.isFinite(value) && value > 0 ? Math.min(8, value) : 2;
}

export function formatDurationLabel(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m}`;
}

export function formatClock(totalMinutesFromMidnight: number): string {
    const wrapped = ((totalMinutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface ScheduledActivity {
    title: string;
    city: string | null;
    cost: number | null;
    startTime: string;
    endTime: string;
    durationLabel: string;
}

/** Créneaux horaires séquentiels (09:00 + durée + 30 min entre activités). */
export function buildDayActivitySchedule(day: ActivityDayBucket): ScheduledActivity[] {
    const startOfDay = 9 * 60;
    const gapMinutes = 30;
    let next = startOfDay;

    return day.activities.map((activity) => {
        const hours = parseDurationHours(activity.attributes.duration ?? null);
        const startMinutes = next;
        const endMinutes = startMinutes + Math.round(hours * 60);
        next = endMinutes + gapMinutes;

        return {
            title: activity.attributes.title,
            city: activity.attributes.city,
            cost: activity.attributes.cost,
            startTime: formatClock(startMinutes),
            endTime: formatClock(endMinutes),
            durationLabel: formatDurationLabel(hours),
        };
    });
}

export interface DayTimeBudget {
    dayId: string;
    dayIndex: number;
    activityHours: number;
    travelHours: number;
    totalHours: number;
    maxHours: number;
    overBudget: boolean;
}

export function computeDayTimeBudgets(
    days: ActivityDayBucket[],
    legDurationsSecByDay: Record<string, number[]>,
    maxHoursPerDay = 10,
): DayTimeBudget[] {
    return days.map((day) => {
        const activityHours = day.activities.reduce(
            (sum, a) => sum + parseDurationHours(a.attributes.duration ?? null),
            0,
        );
        const travelSec = (legDurationsSecByDay[day.day_id] ?? []).reduce((s, d) => s + d, 0);
        const travelHours = travelSec / 3600;
        const totalHours = activityHours + travelHours;
        return {
            dayId: day.day_id,
            dayIndex: day.index,
            activityHours,
            travelHours,
            totalHours,
            maxHours: maxHoursPerDay,
            overBudget: totalHours > maxHoursPerDay,
        };
    });
}

export const ACTIVITY_TIME_ALERT_COLOR = '#f97316';
