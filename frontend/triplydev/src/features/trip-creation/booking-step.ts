export type BookingStepChoice = 'existing' | 'triply_search' | 'later';

export function resolveBookingStepChoice(params: {
    hasManualEntry: boolean;
    hasSelection: boolean;
}): BookingStepChoice {
    if (params.hasManualEntry) return 'existing';
    if (params.hasSelection) return 'triply_search';
    return 'later';
}
