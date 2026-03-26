export type PlanningMode = 'full_ai' | 'semi_ai' | 'manual';

export const PLANNING_MODE_STORAGE_KEY = 'triply-planning-mode';

export function loadStoredPlanningMode(): PlanningMode | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(PLANNING_MODE_STORAGE_KEY);
        if (raw === 'full_ai' || raw === 'semi_ai' || raw === 'manual') return raw;
        return null;
    } catch {
        return null;
    }
}

export function savePlanningMode(mode: PlanningMode) {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(PLANNING_MODE_STORAGE_KEY, mode);
    } catch {
        /* ignore */
    }
}

export function clearPlanningModeStorage() {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(PLANNING_MODE_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}
