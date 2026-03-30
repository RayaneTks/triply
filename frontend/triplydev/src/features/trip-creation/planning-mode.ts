export type PlanningMode = 'full_ai' | 'semi_ai' | 'manual';
export type GuidanceMode = 'guided' | 'autonomous';

/** Cle historique (tous les comptes) - migree vers une cle par utilisateur */
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

/** Supprime la cle globale et, si fourni, la cle du compte. */
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

export function guidanceModeToPlanningMode(mode: GuidanceMode): PlanningMode {
    return mode === 'guided' ? 'full_ai' : 'semi_ai';
}

export function planningModeToGuidanceMode(mode: PlanningMode | null | undefined): GuidanceMode | null {
    if (mode === 'full_ai') return 'guided';
    if (mode === 'semi_ai' || mode === 'manual') return 'autonomous';
    return null;
}

export function getPlanningModeHeadline(mode: PlanningMode | null | undefined): string {
    if (mode === 'full_ai') return 'Triply construit avec vous';
    if (mode === 'semi_ai') return 'Vous gardez la main';
    if (mode === 'manual') return 'Preparation libre';
    return 'Choisissez votre facon d avancer';
}

export function getPlanningModeDescription(mode: PlanningMode | null | undefined): string {
    if (mode === 'full_ai') {
        return "Triply propose et organise avec vous.";
    }
    if (mode === 'semi_ai') {
        return "Vous gardez la main et utilisez Triply quand vous en avez besoin.";
    }
    if (mode === 'manual') {
        return "Le parcours reste simple et libre.";
    }
    return "Choisissez comment preparer ce voyage.";
}

export function getPlanningModeBadge(mode: PlanningMode | null | undefined): string {
    if (mode === 'full_ai') return 'Guide';
    if (mode === 'semi_ai') return 'Autonome';
    if (mode === 'manual') return 'Libre';
    return 'A definir';
}
