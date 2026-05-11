export type PlanningMode = 'full_ai' | 'semi_ai' | 'manual';

/** Clé historique (tous les comptes) — migrée vers une clé par utilisateur */
export const PLANNING_MODE_STORAGE_KEY = 'triply-planning-mode';

function scopedKey(userId: string | number): string {
    return `${PLANNING_MODE_STORAGE_KEY}:u:${String(userId)}`;
}

export function loadStoredPlanningMode(userId?: string | number | null): PlanningMode | null {
    if (typeof window === 'undefined') return null;
    if (userId == null || String(userId) === '') return null;
    try {
        let raw = window.sessionStorage.getItem(scopedKey(userId));
        if (!raw) {
            const legacy = window.sessionStorage.getItem(PLANNING_MODE_STORAGE_KEY);
            if (legacy === 'full_ai' || legacy === 'semi_ai' || legacy === 'manual') {
                window.sessionStorage.setItem(scopedKey(userId), legacy);
                window.sessionStorage.removeItem(PLANNING_MODE_STORAGE_KEY);
                raw = legacy;
            }
        }
        if (raw === 'full_ai' || raw === 'semi_ai' || raw === 'manual') return raw;
        return null;
    } catch {
        return null;
    }
}

export function savePlanningMode(mode: PlanningMode, userId: string | number) {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(scopedKey(userId), mode);
        window.sessionStorage.removeItem(PLANNING_MODE_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

/** Supprime la clé globale et, si fourni, la clé du compte. */
export function clearPlanningModeStorage(userId?: string | number | null) {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(PLANNING_MODE_STORAGE_KEY);
        if (userId != null && String(userId) !== '') {
            window.sessionStorage.removeItem(scopedKey(userId));
        }
    } catch {
        /* ignore */
    }
}
