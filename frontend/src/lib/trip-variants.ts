/**
 * P4.3 — Plan Variants A/B.
 *
 * Helpers purs (sans état React) pour forker une journée du `plan_snapshot`,
 * éditer une variante en mémoire (réordonner / retirer / restaurer une étape),
 * calculer les différences A vs B, puis fusionner la variante gagnante de
 * retour dans le snapshot.
 *
 * Aucune persistance dédiée : on s'appuie entièrement sur le round-trip existant
 * `plan_snapshot` ↔ tables structurées (SnapshotSyncService). L'ordre des
 * activités est déterministe côté backend (`ordre = idx + 1`), donc réordonner
 * le tableau `activities` suffit à persister un nouvel ordre via
 * `tripsClient.update`.
 */
import type { PlanSnapshot, PlanSnapshotActivity, PlanSnapshotDay } from './plan-snapshot';

/** Activité enrichie d'une clé stable pour suivre déplacements/retraits A↔B. */
export interface VariantActivity extends PlanSnapshotActivity {
    /** Identité stable issue de la position d'origine dans la journée source (ex. "src-2"). */
    key: string;
}

/** Numéro de jour (1-based) tel que dérivé de `dayIndex` ou de la position. */
export function resolveDayNumber(day: PlanSnapshotDay, fallbackIndex: number): number {
    return day.dayIndex >= 1 ? day.dayIndex : fallbackIndex + 1;
}

/** Liste des jours forkables (au moins une activité) avec leur effectif. */
export function getForkableDays(
    snapshot: PlanSnapshot | null | undefined,
): Array<{ dayNumber: number; activityCount: number; title: string }> {
    const days = Array.isArray(snapshot?.days) ? snapshot!.days : [];
    return days
        .map((day, idx) => {
            const activities = Array.isArray(day.activities) ? day.activities : [];
            return {
                dayNumber: resolveDayNumber(day, idx),
                activityCount: activities.length,
                title: activities[0]?.title ?? '',
            };
        })
        .filter((d) => d.activityCount > 0)
        .sort((a, b) => a.dayNumber - b.dayNumber);
}

/** Retourne les activités brutes d'une journée donnée (par numéro de jour). */
export function getDayActivities(
    snapshot: PlanSnapshot | null | undefined,
    dayNumber: number,
): PlanSnapshotActivity[] {
    const days = Array.isArray(snapshot?.days) ? snapshot!.days : [];
    const target = days.find((day, idx) => resolveDayNumber(day, idx) === dayNumber);
    return Array.isArray(target?.activities) ? [...target!.activities] : [];
}

/** Convertit des activités snapshot en activités de variante (clés stables `src-i`). */
export function toVariantActivities(activities: PlanSnapshotActivity[]): VariantActivity[] {
    return activities.map((activity, i) => ({ ...activity, key: `src-${i}` }));
}

/** Déplace une activité d'un cran (haut/bas) sans muter l'entrée passée. */
export function moveActivity(
    list: VariantActivity[],
    key: string,
    direction: 'up' | 'down',
): VariantActivity[] {
    const idx = list.findIndex((a) => a.key === key);
    if (idx < 0) return list;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
}

/** Retire une activité de la variante (réversible via `restoreActivity`). */
export function removeActivity(list: VariantActivity[], key: string): VariantActivity[] {
    return list.filter((a) => a.key !== key);
}

/**
 * Réinsère une activité précédemment retirée, en respectant au mieux sa position
 * d'origine relative aux autres activités source encore présentes.
 */
export function restoreActivity(
    original: VariantActivity[],
    current: VariantActivity[],
    key: string,
): VariantActivity[] {
    if (current.some((a) => a.key === key)) return current;
    const restored = original.find((a) => a.key === key);
    if (!restored) return current;

    const originalOrder = new Map(original.map((a, i) => [a.key, i]));
    const targetRank = originalOrder.get(key) ?? Number.MAX_SAFE_INTEGER;

    const next = [...current];
    const insertAt = next.findIndex((a) => (originalOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) > targetRank);
    if (insertAt < 0) next.push(restored);
    else next.splice(insertAt, 0, restored);
    return next;
}

export interface VariantDiff {
    /** Clés présentes dans A mais absentes de B. */
    removedKeys: Set<string>;
    /** Clés présentes dans B mais absentes de A (étapes ajoutées). */
    addedKeys: Set<string>;
    /** Clés communes dont la position relative a changé (hors plus longue sous-séquence commune). */
    movedKeys: Set<string>;
    /** `true` si A et B diffèrent (ordre et/ou composition). */
    changed: boolean;
}

/** Plus longue sous-séquence commune (par clé) — sert à isoler les vrais déplacements. */
function longestCommonSubsequence(a: string[], b: string[]): Set<string> {
    const n = a.length;
    const m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const keep = new Set<string>();
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            keep.add(a[i]);
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            i++;
        } else {
            j++;
        }
    }
    return keep;
}

/** Calcule les différences entre la version d'origine (A) et la variante (B). */
export function diffVariant(original: VariantActivity[], variant: VariantActivity[]): VariantDiff {
    const originalKeys = original.map((a) => a.key);
    const variantKeys = variant.map((a) => a.key);
    const originalSet = new Set(originalKeys);
    const variantSet = new Set(variantKeys);

    const removedKeys = new Set(originalKeys.filter((k) => !variantSet.has(k)));
    const addedKeys = new Set(variantKeys.filter((k) => !originalSet.has(k)));

    // Pour détecter les déplacements, on compare l'ordre des clés communes.
    const commonOriginal = originalKeys.filter((k) => variantSet.has(k));
    const commonVariant = variantKeys.filter((k) => originalSet.has(k));
    const stable = longestCommonSubsequence(commonOriginal, commonVariant);
    const movedKeys = new Set(commonVariant.filter((k) => !stable.has(k)));

    const changed = removedKeys.size > 0 || addedKeys.size > 0 || movedKeys.size > 0;
    return { removedKeys, addedKeys, movedKeys, changed };
}

/** Retire la clé interne avant de réécrire dans le snapshot. */
function stripKey(activity: VariantActivity): PlanSnapshotActivity {
    const { key: _key, ...rest } = activity;
    void _key;
    const cleaned: PlanSnapshotActivity = { title: rest.title, lat: rest.lat, lng: rest.lng };
    if (typeof rest.durationHours === 'number') cleaned.durationHours = rest.durationHours;
    if (typeof rest.layerId === 'string') cleaned.layerId = rest.layerId;
    return cleaned;
}

/**
 * Fusionne la variante gagnante dans le snapshot : remplace les activités du jour
 * ciblé tout en laissant les autres jours intacts. Renvoie un nouveau snapshot
 * (immutable) prêt pour `tripsClient.update`.
 */
export function mergeVariantIntoSnapshot(
    snapshot: PlanSnapshot | null | undefined,
    dayNumber: number,
    variant: VariantActivity[],
): PlanSnapshot {
    const base: PlanSnapshot = snapshot ?? { days: [] };
    const days: PlanSnapshotDay[] = Array.isArray(base.days) ? [...base.days] : [];
    const activities = variant.map(stripKey);

    const targetIdx = days.findIndex((day, idx) => resolveDayNumber(day, idx) === dayNumber);
    if (targetIdx >= 0) {
        days[targetIdx] = { ...days[targetIdx], activities };
    } else {
        days.push({ dayIndex: dayNumber, activities });
    }

    return { ...base, days };
}
