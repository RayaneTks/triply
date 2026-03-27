import type { TripConfigurationState } from './useTripConfiguration';

/** Champs optionnels renvoyés par l’assistant pour préremplir l’étape 1 */
export type AssistantStep1FormPatch = Partial<{
    departureCity: string;
    arrivalCity: string;
    arrivalCityName: string;
    travelerCount: number;
    budget: string;
    activityTime: string;
    outboundDate: string;
    returnDate: string;
    outboundDepartureTime: string;
    outboundArrivalTime: string;
    returnDepartureTime: string;
    returnArrivalTime: string;
    selectedOptions: string[];
    dietarySelections: string[];
    travelDays: number;
}>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^([01]?\d|2[0-3]):[0-5]\d$/;

function normIata(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim().toUpperCase();
    if (s.length === 3 && /^[A-Z]{3}$/.test(s)) return s;
    return undefined;
}

function normDate(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (!ISO_DATE.test(s)) return undefined;
    return s;
}

function normTime(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim().slice(0, 5);
    if (!HM.test(s)) return undefined;
    const [h, m] = s.split(':');
    return `${h!.padStart(2, '0')}:${m}`;
}

function normString(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    return s.length > 0 ? s : undefined;
}

function normInt1to50(v: unknown): number | undefined {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    if (!Number.isFinite(n) || n < 1 || n > 50) return undefined;
    return n;
}

function normTravelDays(v: unknown): number | undefined {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    if (!Number.isFinite(n) || n < 1 || n > 365) return undefined;
    return n;
}

function normStringArray(v: unknown, allowed: Set<string>): string[] | undefined {
    if (!Array.isArray(v)) return undefined;
    const out = v.filter((x): x is string => typeof x === 'string' && allowed.has(x.trim()));
    return out.length > 0 ? out : [];
}

export function normalizeAssistantStep1FormPatch(
    raw: unknown,
    allowedOptions: string[],
    allowedDietary: string[]
): AssistantStep1FormPatch | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const optSet = new Set(allowedOptions);
    const dietSet = new Set(allowedDietary);

    const patch: AssistantStep1FormPatch = {};

    const dep = normIata(o.departureCity);
    if (dep) patch.departureCity = dep;
    const arr = normIata(o.arrivalCity);
    if (arr) patch.arrivalCity = arr;
    const name = normString(o.arrivalCityName);
    if (name) patch.arrivalCityName = name;
    const tc = normInt1to50(o.travelerCount);
    if (tc != null) patch.travelerCount = tc;
    const bud = normString(o.budget);
    if (bud) patch.budget = bud;
    const act = normString(o.activityTime);
    if (act) patch.activityTime = act;
    const od = normDate(o.outboundDate);
    if (od) patch.outboundDate = od;
    const rd = normDate(o.returnDate);
    if (rd) patch.returnDate = rd;
    const odt = normTime(o.outboundDepartureTime);
    if (odt) patch.outboundDepartureTime = odt;
    const oat = normTime(o.outboundArrivalTime);
    if (oat) patch.outboundArrivalTime = oat;
    const rdt = normTime(o.returnDepartureTime);
    if (rdt) patch.returnDepartureTime = rdt;
    const rat = normTime(o.returnArrivalTime);
    if (rat) patch.returnArrivalTime = rat;
    const td = normTravelDays(o.travelDays);
    if (td != null) patch.travelDays = td;

    const so = normStringArray(o.selectedOptions, optSet);
    if (so && so.length > 0) patch.selectedOptions = so;
    const ds = normStringArray(o.dietarySelections, dietSet);
    if (ds && ds.length > 0) patch.dietarySelections = ds;

    if (Object.keys(patch).length === 0) return null;
    return patch;
}

export function buildStep1FormSnapshotForAssistant(state: TripConfigurationState & { travelDays: number }): Record<string, unknown> {
    return {
        departureCity: state.departureCity,
        arrivalCity: state.arrivalCity,
        arrivalCityName: state.arrivalCityName,
        travelerCount: state.travelerCount,
        budget: state.budget,
        activityTime: state.activityTime,
        outboundDate: state.outboundDate,
        returnDate: state.returnDate,
        outboundDepartureTime: state.outboundDepartureTime,
        outboundArrivalTime: state.outboundArrivalTime,
        returnDepartureTime: state.returnDepartureTime,
        returnArrivalTime: state.returnArrivalTime,
        selectedOptions: state.selectedOptions,
        dietarySelections: state.dietarySelections,
        travelDays: state.travelDays,
        manualFlightEntry: state.manualFlightEntry,
        manualFlightAirline: state.manualFlightAirline,
        manualFlightNumber: state.manualFlightNumber,
        manualFlightNumberReturn: state.manualFlightNumberReturn,
        manualHotelEntry: state.manualHotelEntry,
        manualHotelName: state.manualHotelName,
        manualHotelAddress: state.manualHotelAddress,
        manualHotelCheckIn: state.manualHotelCheckIn,
        manualHotelCheckOut: state.manualHotelCheckOut,
    };
}
