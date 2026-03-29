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

/**
 * Rappel court pour les prompts « suggestions activités » (jour / séjour entier),
 * afin que le modèle aligne les POI sur l’étape 1 (y compris vol/hôtel passés dans le snapshot).
 */
export function buildStep1ActivityConstraintsPromptFragment(snapshot: Record<string, unknown>): string {
    const bits: string[] = [];

    const arrName = snapshot.arrivalCityName;
    const arr = snapshot.arrivalCity;
    if (typeof arrName === 'string' && arrName.trim()) bits.push(`destination « ${arrName.trim()} »`);
    else if (typeof arr === 'string' && arr.trim()) bits.push(`destination (IATA) ${arr.trim().toUpperCase()}`);

    const dep = snapshot.departureCity;
    if (typeof dep === 'string' && dep.trim()) bits.push(`départ (IATA) ${dep.trim().toUpperCase()}`);

    const tc = snapshot.travelerCount;
    if (typeof tc === 'number' && tc > 0) bits.push(`${tc} voyageur(s)`);

    const bud = snapshot.budget;
    if (typeof bud === 'string' && bud.trim()) bits.push(`budget : ${bud.trim()}`);

    const at = snapshot.activityTime;
    if (typeof at === 'string' && at.trim()) bits.push(`environ ${at.trim()} h d'activités par jour (rythme)`);

    const od = snapshot.outboundDate;
    const rd = snapshot.returnDate;
    if (typeof od === 'string' && od && typeof rd === 'string' && rd) bits.push(`dates du séjour : ${od} → ${rd}`);

    const td = snapshot.travelDays;
    if (typeof td === 'number' && td > 0 && !(od && rd)) bits.push(`${td} jour(s) de séjour`);

    const opts = snapshot.selectedOptions;
    if (Array.isArray(opts) && opts.length) bits.push(`préférences hébergement / style : ${opts.join(', ')}`);

    const diet = snapshot.dietarySelections;
    if (Array.isArray(diet) && diet.length) bits.push(`régime alimentaire : ${diet.join(', ')}`);

    if (snapshot.manualFlightEntry === true) {
        const airline = snapshot.manualFlightAirline;
        const num = snapshot.manualFlightNumber;
        const chunks = [airline, num].filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        if (chunks.length) bits.push(`vol saisi : ${chunks.join(' ')}`);
    }

    if (snapshot.manualHotelEntry === true) {
        const hn = snapshot.manualHotelName;
        const ha = snapshot.manualHotelAddress;
        if (typeof hn === 'string' && hn.trim()) {
            const line =
                typeof ha === 'string' && ha.trim() ? `${hn.trim()} (${ha.trim()})` : hn.trim();
            bits.push(`hébergement saisi : ${line}`);
        }
    }

    const sf = snapshot.selectedFlightPlanning;
    if (sf && typeof sf === 'object' && !Array.isArray(sf)) {
        const o = sf as Record<string, unknown>;
        const carrier = typeof o.carrier === 'string' ? o.carrier.trim() : '';
        const from = typeof o.outboundFrom === 'string' ? o.outboundFrom.trim() : '';
        const to = typeof o.outboundTo === 'string' ? o.outboundTo.trim() : '';
        const route = from && to ? `${from} → ${to}` : '';
        const price = typeof o.price === 'string' ? o.price : '';
        const cur = typeof o.currency === 'string' ? o.currency : '';
        const priceNote = price && cur ? `${price} ${cur}` : price;
        const chunk = [carrier, route, priceNote].filter(Boolean).join(' · ');
        if (chunk) bits.push(`vol sélectionné : ${chunk}`);
    }

    const sh = snapshot.selectedHotelPlanning;
    if (sh && typeof sh === 'object' && !Array.isArray(sh)) {
        const o = sh as Record<string, unknown>;
        const name = typeof o.name === 'string' ? o.name.trim() : '';
        const cc = typeof o.cityCode === 'string' ? o.cityCode.trim() : '';
        const ci = typeof o.checkIn === 'string' ? o.checkIn : '';
        const co = typeof o.checkOut === 'string' ? o.checkOut : '';
        const dates = ci && co ? ` (${ci} → ${co})` : '';
        const loc = [name, cc].filter(Boolean).join(', ');
        if (loc) bits.push(`hôtel sélectionné : ${loc}${dates}`);
    }

    if (bits.length === 0) return '';
    return `Contraintes du formulaire voyage (étape 1) à respecter : ${bits.join(' ; ')}.`;
}
