/** Nombre d etapes du formulaire Etape 1 (0..LAST inclus). */
export const PLAN_FORM_STEP_LAST = 6;
export const PLAN_FORM_STEP_COUNT = PLAN_FORM_STEP_LAST + 1;

export const PLAN_FORM_STEP_LABELS = [
    'Trajet',
    'Dates',
    'Voyageurs',
    'Transport',
    'Hebergement',
    'Style',
    'Verification',
] as const;

export type PlanFormStepFields = {
    departureCity: string;
    arrivalCity: string;
    outboundDate: string;
    returnDate: string;
    travelerCount: number;
    travelDays: number;
};

export function clampPlanFormStep(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(PLAN_FORM_STEP_LAST, Math.floor(n)));
}

/** Etapes 0-2 requises pour "Suivant" ; 3-5 toujours valides. */
export function validatePlanFormStep(step: number, s: PlanFormStepFields): boolean {
    const st = clampPlanFormStep(step);
    if (st <= 2) {
        if (st === 0) return !!s.departureCity.trim() && !!s.arrivalCity.trim();
        if (st === 1) return !!s.outboundDate && !!s.returnDate && s.returnDate >= s.outboundDate;
        if (st === 2) return s.travelerCount > 0 && s.travelDays >= 1;
    }
    return true;
}

export function validateAllRequiredPlanSteps(s: PlanFormStepFields): boolean {
    return validatePlanFormStep(0, s) && validatePlanFormStep(1, s) && validatePlanFormStep(2, s);
}
