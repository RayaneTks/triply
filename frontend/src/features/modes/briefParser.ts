/**
 * Heuristic parser for the "Mode libre" brief. Extracts destination, period,
 * budget, traveler count and detected highlights from a free-form prompt.
 *
 * The parser is intentionally lenient: it never throws, returns sensible
 * fallbacks, and only fills fields it can confidently detect. Frontend-only —
 * the assistant endpoint can later enrich the result.
 */

export interface ParsedBrief {
    destination: string;
    destinationRaw: string | null;
    travelDays: number | null;
    monthName: string | null;
    monthIndex: number | null;
    budget: number | null;
    travelers: number;
    highlights: string[];
    /** Lower-case bullet tags ("food", "train", "family", …) for routing. */
    tags: string[];
}

const MONTHS: Array<[string, number]> = [
    ['janvier', 0],
    ['février', 1], ['fevrier', 1],
    ['mars', 2],
    ['avril', 3],
    ['mai', 4],
    ['juin', 5],
    ['juillet', 6],
    ['août', 7], ['aout', 7],
    ['septembre', 8],
    ['octobre', 9],
    ['novembre', 10],
    ['décembre', 11], ['decembre', 11],
];

const KNOWN_DESTINATIONS: Array<[RegExp, string]> = [
    // Egypt
    [/hurghada/i, 'Hurghada'],
    [/le caire|cairo/i, 'Le Caire'],
    [/sharm el sheikh|sharm/i, 'Sharm el-Sheikh'],
    [/louxor|luxor/i, 'Louxor'],
    [/marsa alam/i, 'Marsa Alam'],
    // France
    [/paris/i, 'Paris'], [/marseille/i, 'Marseille'], [/lyon/i, 'Lyon'],
    [/nice/i, 'Nice'], [/toulouse/i, 'Toulouse'], [/bordeaux/i, 'Bordeaux'],
    [/nantes/i, 'Nantes'], [/strasbourg/i, 'Strasbourg'], [/corse|ajaccio/i, 'Corse'],
    // Iberia
    [/barcelone|barcelona/i, 'Barcelone'], [/madrid/i, 'Madrid'],
    [/seville|sevilla/i, 'Séville'], [/valence|valencia/i, 'Valence'],
    [/malaga/i, 'Málaga'], [/palma/i, 'Palma'],
    [/lisbonne|lisboa|lisbon/i, 'Lisbonne'], [/porto/i, 'Porto'], [/faro/i, 'Faro'],
    // Italy
    [/rome|roma/i, 'Rome'], [/milan|milano/i, 'Milan'],
    [/venise|venezia|venice/i, 'Venise'], [/naples|napoli/i, 'Naples'],
    [/florence|firenze/i, 'Florence'], [/sicile|sicilia|palerme/i, 'Sicile'],
    [/sardaigne|sardegna/i, 'Sardaigne'],
    // Other Europe
    [/londres|london/i, 'Londres'], [/edimbourg|edinburgh/i, 'Édimbourg'],
    [/dublin/i, 'Dublin'], [/berlin/i, 'Berlin'], [/munich/i, 'Munich'],
    [/amsterdam/i, 'Amsterdam'], [/bruxelles|brussels/i, 'Bruxelles'],
    [/zurich|geneve|genève/i, 'Suisse'],
    [/prague|praha/i, 'Prague'], [/budapest/i, 'Budapest'],
    [/vienne|vienna/i, 'Vienne'], [/copenhague|copenhagen/i, 'Copenhague'],
    [/stockholm/i, 'Stockholm'], [/oslo/i, 'Oslo'], [/helsinki/i, 'Helsinki'],
    [/athenes|athens/i, 'Athènes'], [/santorin|santorini/i, 'Santorin'],
    [/mykonos/i, 'Mykonos'], [/crete|krete|crète/i, 'Crète'],
    [/istanbul/i, 'Istanbul'], [/cappadoce|cappadocia/i, 'Cappadoce'],
    // Maghreb / Mediterranean
    [/marrakech/i, 'Marrakech'], [/casablanca/i, 'Casablanca'],
    [/agadir/i, 'Agadir'], [/tunis/i, 'Tunis'], [/djerba/i, 'Djerba'],
    [/alger/i, 'Alger'],
    // Americas
    [/new york|nyc/i, 'New York'], [/los angeles/i, 'Los Angeles'],
    [/miami/i, 'Miami'], [/san francisco/i, 'San Francisco'],
    [/chicago/i, 'Chicago'], [/montréal|montreal/i, 'Montréal'],
    [/toronto/i, 'Toronto'], [/vancouver/i, 'Vancouver'],
    [/mexico/i, 'Mexico'], [/cancun/i, 'Cancún'],
    [/sao paulo|são paulo/i, 'São Paulo'],
    [/rio( de janeiro)?/i, 'Rio de Janeiro'],
    [/buenos aires/i, 'Buenos Aires'], [/lima/i, 'Lima'],
    // Asia / Oceania
    [/dubai|dubaï/i, 'Dubaï'], [/abu dhabi/i, 'Abu Dhabi'],
    [/doha/i, 'Doha'], [/tel aviv/i, 'Tel-Aviv'],
    [/tokyo/i, 'Tokyo'], [/osaka/i, 'Osaka'], [/kyoto/i, 'Kyoto'],
    [/seoul|séoul/i, 'Séoul'], [/pekin|beijing/i, 'Pékin'],
    [/shanghai/i, 'Shanghai'], [/hong kong/i, 'Hong Kong'],
    [/singapour|singapore/i, 'Singapour'], [/bangkok/i, 'Bangkok'],
    [/phuket/i, 'Phuket'], [/bali|denpasar/i, 'Bali'],
    [/kuala lumpur/i, 'Kuala Lumpur'],
    [/sydney/i, 'Sydney'], [/melbourne/i, 'Melbourne'],
];

/**
 * Extract the destination from a brief. Strategy:
 * 1. Match against KNOWN_DESTINATIONS (most reliable).
 * 2. Fall back to capturing the noun following "à/au/aux/vers/en" + capitalize.
 */
function detectDestination(text: string): { display: string; raw: string | null } {
    for (const [pattern, label] of KNOWN_DESTINATIONS) {
        if (pattern.test(text)) {
            return { display: label, raw: label };
        }
    }
    const m = text.match(/\b(?:à|a|au|aux|vers|en|sur)\s+([A-ZÉÈÊÀÂÔÎ][\wÀ-ÿ\-' ]{2,40})/);
    if (m) {
        const raw = m[1].split(/[,.;]/)[0].trim();
        return { display: raw, raw };
    }
    return { display: '—', raw: null };
}

function detectTravelDays(text: string): number | null {
    // "1 semaine", "2 semaines"
    const weeks = text.match(/(\d+)\s*semaines?/i);
    if (weeks) return parseInt(weeks[1], 10) * 7;
    if (/\bune\s+semaine\b/i.test(text)) return 7;
    // "10 jours", "5 jours"
    const days = text.match(/(\d+)\s*jours?/i);
    if (days) return parseInt(days[1], 10);
    // "weekend" / "week-end"
    if (/\bweek[-\s]?end\b/i.test(text)) return 3;
    // "quinze jours" / "15 jours" / "quinzaine"
    if (/\bquinzaine\b/i.test(text)) return 15;
    return null;
}

function detectMonth(text: string): { name: string; index: number } | null {
    const lower = text.toLowerCase();
    for (const [name, idx] of MONTHS) {
        if (new RegExp(`\\b${name}\\b`).test(lower)) {
            const display = name.charAt(0).toUpperCase() + name.slice(1).replace('é', 'é');
            return { name: display, index: idx };
        }
    }
    return null;
}

function detectBudget(text: string): number | null {
    // "2000€", "2000 euros", "2 000€", "2k€"
    const direct = text.match(/(\d[\d\s]{0,7})\s*(?:€|euros?|eur)\b/i);
    if (direct) {
        const cleaned = direct[1].replace(/\s+/g, '');
        const n = parseInt(cleaned, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    const k = text.match(/(\d+(?:[.,]\d+)?)\s*k\s*(?:€|euros?)?/i);
    if (k) {
        const n = parseFloat(k[1].replace(',', '.')) * 1000;
        if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
    return null;
}

function detectTravelers(text: string): number {
    const match = text.match(/(\d+)\s*(?:personnes?|voyageurs?|adultes?|pax)/i);
    if (match) {
        const n = parseInt(match[1], 10);
        if (Number.isFinite(n) && n >= 1) return n;
    }
    if (/\bseul(?:e)?\b|\bsolo\b/i.test(text)) return 1;
    if (/\bcouple\b|\ben amoureux\b|\bduo\b/i.test(text)) return 2;
    if (/\bfamille\b|\bavec\s+(?:mes|nos|les)\s+enfants?\b/i.test(text)) return 4;
    return 2; // default
}

interface HighlightRule {
    test: RegExp;
    label: string;
    tag: string;
}

const HIGHLIGHT_RULES: HighlightRule[] = [
    { test: /resto(s)?|restaurant|gastronomie|cuisine|bouffe|food/i, label: 'Focus gastronomie locale', tag: 'food' },
    { test: /activit[ée]s?/i, label: 'Au moins une activité par jour', tag: 'activities' },
    { test: /plage|mer|baignade|snorkel|plong[ée]e/i, label: 'Plage & activités nautiques', tag: 'beach' },
    { test: /d[ée]sert|dune|safari/i, label: 'Excursions désert / nature', tag: 'desert' },
    { test: /mus[ée]es?|culture|patrimoine/i, label: 'Visites culturelles', tag: 'culture' },
    { test: /randonn[ée]e|trek|hike|montagne/i, label: 'Randonnée / nature', tag: 'hiking' },
    { test: /train|sncf|tgv|rail/i, label: 'Option train privilégiée', tag: 'train' },
    { test: /vol direct|sans escale|nonstop/i, label: 'Vol direct privilégié', tag: 'direct-flight' },
    { test: /enfants?|famille|kids/i, label: 'Voyage en famille', tag: 'family' },
    { test: /couple|amoureux|romantique|honeymoon/i, label: 'Escapade en couple', tag: 'romantic' },
    { test: /luxe|premium|cinq[\s-]?[ée]toiles|grand confort/i, label: 'Grand confort / premium', tag: 'luxury' },
    { test: /backpack|routard|budget serr[ée]/i, label: 'Style routard / budget serré', tag: 'backpacker' },
    { test: /nightlife|f[ée]tes?|bars?|clubs?/i, label: 'Vie nocturne', tag: 'nightlife' },
    { test: /spa|wellness|d[ée]tente|relax/i, label: 'Détente / spa', tag: 'wellness' },
    { test: /v[ée]g[ée]tarien|vegan|halal|casher/i, label: 'Préférences alimentaires spécifiques', tag: 'diet' },
    { test: /tout compris|all[\s-]?inclusive|forfait/i, label: 'Tout compris', tag: 'all-inclusive' },
];

function detectHighlights(text: string): { highlights: string[]; tags: string[] } {
    const highlights: string[] = [];
    const tags: string[] = [];
    for (const rule of HIGHLIGHT_RULES) {
        if (rule.test.test(text)) {
            highlights.push(rule.label);
            tags.push(rule.tag);
            if (highlights.length >= 5) break;
        }
    }
    return { highlights, tags };
}

export function parseBrief(brief: string): ParsedBrief {
    const text = brief.trim();
    const dest = detectDestination(text);
    const travelDays = detectTravelDays(text);
    const month = detectMonth(text);
    const budget = detectBudget(text);
    const travelers = detectTravelers(text);
    const { highlights, tags } = detectHighlights(text);

    return {
        destination: dest.display,
        destinationRaw: dest.raw,
        travelDays,
        monthName: month?.name ?? null,
        monthIndex: month?.index ?? null,
        budget,
        travelers,
        highlights,
        tags,
    };
}

/** Build a human-readable period label ("1 semaine en Octobre", "10 jours", "—"). */
export function formatPeriod(parsed: Pick<ParsedBrief, 'travelDays' | 'monthName'>): string {
    if (parsed.travelDays && parsed.monthName) {
        return `${parsed.travelDays} jour${parsed.travelDays > 1 ? 's' : ''} en ${parsed.monthName}`;
    }
    if (parsed.travelDays) {
        return `${parsed.travelDays} jour${parsed.travelDays > 1 ? 's' : ''}`;
    }
    if (parsed.monthName) {
        return `Période en ${parsed.monthName}`;
    }
    return 'Période à préciser';
}

export function formatBudget(parsed: Pick<ParsedBrief, 'budget'>): string {
    if (!parsed.budget) return 'Budget à préciser';
    return `${parsed.budget.toLocaleString('fr-FR')}€ total`;
}
