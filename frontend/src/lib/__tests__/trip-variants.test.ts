import { describe, it, expect } from 'vitest';
import type { PlanSnapshot } from '../plan-snapshot';
import {
    diffVariant,
    getDayActivities,
    getForkableDays,
    mergeVariantIntoSnapshot,
    moveActivity,
    removeActivity,
    restoreActivity,
    toVariantActivities,
} from '../trip-variants';

function snapshot(): PlanSnapshot {
    return {
        days: [
            {
                dayIndex: 1,
                activities: [
                    { title: 'Colisée', lat: 41.89, lng: 12.49, durationHours: 2 },
                    { title: 'Forum', lat: 41.892, lng: 12.485, durationHours: 1.5 },
                    { title: 'Trastevere', lat: 41.889, lng: 12.469 },
                ],
            },
            {
                dayIndex: 2,
                activities: [{ title: 'Vatican', lat: 41.902, lng: 12.453, durationHours: 3 }],
            },
        ],
    };
}

describe('trip-variants', () => {
    it('liste uniquement les jours forkables (avec activités)', () => {
        const days = getForkableDays({ days: [{ dayIndex: 1, activities: [] }, ...snapshot().days] });
        expect(days.map((d) => d.dayNumber)).toEqual([1, 2]);
        expect(days[0].activityCount).toBe(3);
    });

    it('forke une journée avec des clés stables', () => {
        const variant = toVariantActivities(getDayActivities(snapshot(), 1));
        expect(variant.map((a) => a.key)).toEqual(['src-0', 'src-1', 'src-2']);
        expect(diffVariant(variant, variant).changed).toBe(false);
    });

    it('détecte un déplacement après réordonnancement', () => {
        const original = toVariantActivities(getDayActivities(snapshot(), 1));
        // Colisée (src-0) descend tout en bas : [Forum, Trastevere, Colisée].
        let moved = moveActivity(original, 'src-0', 'down');
        moved = moveActivity(moved, 'src-0', 'down');
        expect(moved.map((a) => a.key)).toEqual(['src-1', 'src-2', 'src-0']);

        const diff = diffVariant(original, moved);
        expect(diff.changed).toBe(true);
        expect(diff.removedKeys.size).toBe(0);
        expect(diff.movedKeys.has('src-0')).toBe(true);
    });

    it('gère retrait puis restauration à la position d’origine', () => {
        const original = toVariantActivities(getDayActivities(snapshot(), 1));
        const removed = removeActivity(original, 'src-1');
        expect(removed.map((a) => a.key)).toEqual(['src-0', 'src-2']);
        expect(diffVariant(original, removed).removedKeys.has('src-1')).toBe(true);

        const restored = restoreActivity(original, removed, 'src-1');
        expect(restored.map((a) => a.key)).toEqual(['src-0', 'src-1', 'src-2']);
        expect(diffVariant(original, restored).changed).toBe(false);
    });

    it('fusionne la variante dans le snapshot sans toucher les autres jours', () => {
        const base = snapshot();
        const original = toVariantActivities(getDayActivities(base, 1));
        const winner = moveActivity(removeActivity(original, 'src-0'), 'src-2', 'up');

        const merged = mergeVariantIntoSnapshot(base, 1, winner);

        // Jour 2 intact.
        expect(merged.days[1]).toEqual(base.days[1]);
        // Jour 1 réécrit dans le nouvel ordre, sans clé interne ni Colisée.
        expect(merged.days[0].activities.map((a) => a.title)).toEqual(['Trastevere', 'Forum']);
        expect((merged.days[0].activities[0] as Record<string, unknown>).key).toBeUndefined();
        // Immutabilité : la base n'est pas modifiée.
        expect(base.days[0].activities).toHaveLength(3);
    });
});
