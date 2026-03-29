import type { TripConfigurationState, UseTripConfigurationResult } from './useTripConfiguration';

const STORAGE_PREFIX = 'triply-trip-config-draft';

function scopedKey(userId: string | number | null | undefined): string {
    const id = userId != null && String(userId) !== '' ? String(userId) : 'anon';
    return `${STORAGE_PREFIX}:u:${id}`;
}

export type TripConfigDraftV1 = {
    v: 1;
    wizardView?: 'plan' | 'activity';
    selectedDay?: number;
    /** Index d’étape du formulaire Étape 1 (0 = Destination … 6 = Récap). */
    planFormStep?: number;
    /** Dernière étape débloquée pour navigation libre dans le sommaire. */
    planFormMaxVisited?: number;
    trip: Partial<TripConfigurationState>;
};

function isRecord(x: unknown): x is Record<string, unknown> {
    return x != null && typeof x === 'object' && !Array.isArray(x);
}

function normString(x: unknown): string | undefined {
    return typeof x === 'string' ? x : undefined;
}

function normNumber(x: unknown): number | undefined {
    return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
}

function normBool(x: unknown): boolean | undefined {
    return typeof x === 'boolean' ? x : undefined;
}

function normStringArray(x: unknown): string[] | undefined {
    if (!Array.isArray(x)) return undefined;
    const out = x.filter((i): i is string => typeof i === 'string');
    return out;
}

/** Normalise un brouillon lu depuis sessionStorage. */
export function parseTripConfigDraft(raw: unknown): TripConfigDraftV1 | null {
    if (!isRecord(raw) || raw.v !== 1) return null;
    const tripRaw = raw.trip;
    if (!isRecord(tripRaw)) return null;

    const trip: Partial<TripConfigurationState> = {};
    const s = (k: keyof TripConfigurationState) => tripRaw[k as string];

    const dep = normString(s('departureCity'));
    if (dep !== undefined) trip.departureCity = dep;
    const arr = normString(s('arrivalCity'));
    if (arr !== undefined) trip.arrivalCity = arr;
    const name = normString(s('arrivalCityName'));
    if (name !== undefined) trip.arrivalCityName = name;
    const td = normNumber(s('travelDays'));
    if (td !== undefined) trip.travelDays = td;
    const tc = normNumber(s('travelerCount'));
    if (tc !== undefined) trip.travelerCount = tc;
    const bud = normString(s('budget'));
    if (bud !== undefined) trip.budget = bud;
    const act = normString(s('activityTime'));
    if (act !== undefined) trip.activityTime = act;
    const od = normString(s('outboundDate'));
    if (od !== undefined) trip.outboundDate = od;
    const rd = normString(s('returnDate'));
    if (rd !== undefined) trip.returnDate = rd;
    const odt = normString(s('outboundDepartureTime'));
    if (odt !== undefined) trip.outboundDepartureTime = odt;
    const oat = normString(s('outboundArrivalTime'));
    if (oat !== undefined) trip.outboundArrivalTime = oat;
    const rdt = normString(s('returnDepartureTime'));
    if (rdt !== undefined) trip.returnDepartureTime = rdt;
    const rat = normString(s('returnArrivalTime'));
    if (rat !== undefined) trip.returnArrivalTime = rat;
    const so = normStringArray(s('selectedOptions'));
    if (so !== undefined) trip.selectedOptions = so;
    const ds = normStringArray(s('dietarySelections'));
    if (ds !== undefined) trip.dietarySelections = ds;
    const mfe = normBool(s('manualFlightEntry'));
    if (mfe !== undefined) trip.manualFlightEntry = mfe;
    const mfa = normString(s('manualFlightAirline'));
    if (mfa !== undefined) trip.manualFlightAirline = mfa;
    const mfn = normString(s('manualFlightNumber'));
    if (mfn !== undefined) trip.manualFlightNumber = mfn;
    const mfnr = normString(s('manualFlightNumberReturn'));
    if (mfnr !== undefined) trip.manualFlightNumberReturn = mfnr;
    const mhe = normBool(s('manualHotelEntry'));
    if (mhe !== undefined) trip.manualHotelEntry = mhe;
    const mhn = normString(s('manualHotelName'));
    if (mhn !== undefined) trip.manualHotelName = mhn;
    const mha = normString(s('manualHotelAddress'));
    if (mha !== undefined) trip.manualHotelAddress = mha;
    const mhci = normString(s('manualHotelCheckIn'));
    if (mhci !== undefined) trip.manualHotelCheckIn = mhci;
    const mhco = normString(s('manualHotelCheckOut'));
    if (mhco !== undefined) trip.manualHotelCheckOut = mhco;

    let wizardView: 'plan' | 'activity' | undefined;
    if (raw.wizardView === 'plan' || raw.wizardView === 'activity') wizardView = raw.wizardView;

    let selectedDay: number | undefined;
    const sd = normNumber(raw.selectedDay);
    if (sd != null && sd >= 1 && sd <= 366) selectedDay = Math.floor(sd);

    let planFormStep: number | undefined;
    const pfs = normNumber(raw.planFormStep);
    if (pfs != null && pfs >= 0 && pfs <= 6) planFormStep = Math.floor(pfs);

    let planFormMaxVisited: number | undefined;
    const pfmv = normNumber(raw.planFormMaxVisited);
    if (pfmv != null && pfmv >= 0 && pfmv <= 6) planFormMaxVisited = Math.floor(pfmv);

    return { v: 1, wizardView, selectedDay, planFormStep, planFormMaxVisited, trip };
}

export function loadTripConfigDraft(userId: string | number | null | undefined): TripConfigDraftV1 | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(scopedKey(userId));
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return parseTripConfigDraft(parsed);
    } catch {
        return null;
    }
}

export function saveTripConfigDraft(
    userId: string | number | null | undefined,
    payload: {
        wizardView: 'plan' | 'activity';
        selectedDay: number;
        trip: TripConfigurationState;
        planFormStep?: number;
        planFormMaxVisited?: number;
    }
): void {
    if (typeof window === 'undefined') return;
    try {
        const body: TripConfigDraftV1 = {
            v: 1,
            wizardView: payload.wizardView,
            selectedDay: payload.selectedDay,
            trip: payload.trip,
            ...(payload.planFormStep != null ? { planFormStep: payload.planFormStep } : {}),
            ...(payload.planFormMaxVisited != null ? { planFormMaxVisited: payload.planFormMaxVisited } : {}),
        };
        window.sessionStorage.setItem(scopedKey(userId), JSON.stringify(body));
    } catch {
        /* ignore quota / private mode */
    }
}

/** Applique un brouillon partiel sur le hook formulaire (sans toucher aux champs absents). */
export function applyTripConfigPartial(trip: Partial<TripConfigurationState>, cfg: UseTripConfigurationResult): void {
    if (trip.departureCity !== undefined) cfg.setDepartureCity(trip.departureCity);
    if (trip.arrivalCity !== undefined) cfg.setArrivalCity(trip.arrivalCity);
    if (trip.arrivalCityName !== undefined) cfg.setArrivalCityName(trip.arrivalCityName);
    if (trip.travelDays !== undefined) cfg.setTravelDays(trip.travelDays);
    if (trip.travelerCount !== undefined) cfg.setTravelerCount(trip.travelerCount);
    if (trip.budget !== undefined) cfg.setBudget(trip.budget);
    if (trip.activityTime !== undefined) cfg.setActivityTime(trip.activityTime);
    if (trip.outboundDate !== undefined) cfg.setOutboundDate(trip.outboundDate);
    if (trip.returnDate !== undefined) cfg.setReturnDate(trip.returnDate);
    if (trip.outboundDepartureTime !== undefined) cfg.setOutboundDepartureTime(trip.outboundDepartureTime);
    if (trip.outboundArrivalTime !== undefined) cfg.setOutboundArrivalTime(trip.outboundArrivalTime);
    if (trip.returnDepartureTime !== undefined) cfg.setReturnDepartureTime(trip.returnDepartureTime);
    if (trip.returnArrivalTime !== undefined) cfg.setReturnArrivalTime(trip.returnArrivalTime);
    if (trip.selectedOptions !== undefined) cfg.setSelectedOptions(trip.selectedOptions);
    if (trip.dietarySelections !== undefined) cfg.setDietarySelections(trip.dietarySelections);
    if (trip.manualFlightEntry !== undefined) cfg.setManualFlightEntry(trip.manualFlightEntry);
    if (trip.manualFlightAirline !== undefined) cfg.setManualFlightAirline(trip.manualFlightAirline);
    if (trip.manualFlightNumber !== undefined) cfg.setManualFlightNumber(trip.manualFlightNumber);
    if (trip.manualFlightNumberReturn !== undefined) cfg.setManualFlightNumberReturn(trip.manualFlightNumberReturn);
    if (trip.manualHotelEntry !== undefined) cfg.setManualHotelEntry(trip.manualHotelEntry);
    if (trip.manualHotelName !== undefined) cfg.setManualHotelName(trip.manualHotelName);
    if (trip.manualHotelAddress !== undefined) cfg.setManualHotelAddress(trip.manualHotelAddress);
    if (trip.manualHotelCheckIn !== undefined) cfg.setManualHotelCheckIn(trip.manualHotelCheckIn);
    if (trip.manualHotelCheckOut !== undefined) cfg.setManualHotelCheckOut(trip.manualHotelCheckOut);
}

/** Copie le brouillon anonyme vers le compte après connexion (une seule fois si la cible est vide). */
export function migrateTripConfigDraftAnonToUser(userId: string | number): void {
    if (typeof window === 'undefined') return;
    try {
        const anonKey = scopedKey(null);
        const userKey = scopedKey(userId);
        if (window.sessionStorage.getItem(userKey)) return;
        const raw = window.sessionStorage.getItem(anonKey);
        if (!raw) return;
        window.sessionStorage.setItem(userKey, raw);
    } catch {
        /* ignore */
    }
}

