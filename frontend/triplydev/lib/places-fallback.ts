/** Codes métropolitains / villes courantes pour secours quand Amadeus est indisponible (ex. 38189). */

export interface PlacesFallbackRow {
    iataCode: string;
    name: string;
    cityName: string;
    countryName: string;
    subType: 'CITY' | 'AIRPORT';
}

const ROWS: PlacesFallbackRow[] = [
    // France / Belgique / CH
    { iataCode: 'PAR', subType: 'CITY', cityName: 'Paris', countryName: 'France', name: 'Paris' },
    { iataCode: 'ORY', subType: 'AIRPORT', cityName: 'Paris', countryName: 'France', name: 'Paris Orly' },
    { iataCode: 'CDG', subType: 'AIRPORT', cityName: 'Paris', countryName: 'France', name: 'Paris Charles de Gaulle' },
    { iataCode: 'LYS', subType: 'CITY', cityName: 'Lyon', countryName: 'France', name: 'Lyon' },
    { iataCode: 'NCE', subType: 'CITY', cityName: 'Nice', countryName: 'France', name: 'Nice' },
    { iataCode: 'MRS', subType: 'CITY', cityName: 'Marseille', countryName: 'France', name: 'Marseille' },
    { iataCode: 'TLS', subType: 'CITY', cityName: 'Toulouse', countryName: 'France', name: 'Toulouse' },
    { iataCode: 'BOD', subType: 'CITY', cityName: 'Bordeaux', countryName: 'France', name: 'Bordeaux' },
    { iataCode: 'NTE', subType: 'CITY', cityName: 'Nantes', countryName: 'France', name: 'Nantes' },
    { iataCode: 'SXB', subType: 'CITY', cityName: 'Strasbourg', countryName: 'France', name: 'Strasbourg' },
    { iataCode: 'BRU', subType: 'CITY', cityName: 'Bruxelles', countryName: 'Belgique', name: 'Bruxelles' },
    { iataCode: 'GVA', subType: 'CITY', cityName: 'Genève', countryName: 'Suisse', name: 'Genève' },
    { iataCode: 'ZRH', subType: 'CITY', cityName: 'Zurich', countryName: 'Suisse', name: 'Zurich' },
    // Europe
    { iataCode: 'LON', subType: 'CITY', cityName: 'Londres', countryName: 'Royaume-Uni', name: 'Londres' },
    { iataCode: 'LHR', subType: 'AIRPORT', cityName: 'Londres', countryName: 'Royaume-Uni', name: 'London Heathrow' },
    { iataCode: 'LGW', subType: 'AIRPORT', cityName: 'Londres', countryName: 'Royaume-Uni', name: 'London Gatwick' },
    { iataCode: 'AMS', subType: 'CITY', cityName: 'Amsterdam', countryName: 'Pays-Bas', name: 'Amsterdam' },
    { iataCode: 'BCN', subType: 'CITY', cityName: 'Barcelone', countryName: 'Espagne', name: 'Barcelone' },
    { iataCode: 'MAD', subType: 'CITY', cityName: 'Madrid', countryName: 'Espagne', name: 'Madrid' },
    { iataCode: 'ROM', subType: 'CITY', cityName: 'Rome', countryName: 'Italie', name: 'Rome' },
    { iataCode: 'FCO', subType: 'AIRPORT', cityName: 'Rome', countryName: 'Italie', name: 'Rome Fiumicino' },
    { iataCode: 'MXP', subType: 'AIRPORT', cityName: 'Milan', countryName: 'Italie', name: 'Milan Malpensa' },
    { iataCode: 'MIL', subType: 'CITY', cityName: 'Milan', countryName: 'Italie', name: 'Milan' },
    { iataCode: 'BER', subType: 'CITY', cityName: 'Berlin', countryName: 'Allemagne', name: 'Berlin' },
    { iataCode: 'MUC', subType: 'CITY', cityName: 'Munich', countryName: 'Allemagne', name: 'Munich' },
    { iataCode: 'FRA', subType: 'CITY', cityName: 'Francfort', countryName: 'Allemagne', name: 'Francfort' },
    { iataCode: 'VIE', subType: 'CITY', cityName: 'Vienne', countryName: 'Autriche', name: 'Vienne' },
    { iataCode: 'PRG', subType: 'CITY', cityName: 'Prague', countryName: 'République tchèque', name: 'Prague' },
    { iataCode: 'LIS', subType: 'CITY', cityName: 'Lisbonne', countryName: 'Portugal', name: 'Lisbonne' },
    { iataCode: 'OPO', subType: 'CITY', cityName: 'Porto', countryName: 'Portugal', name: 'Porto' },
    { iataCode: 'ATH', subType: 'CITY', cityName: 'Athènes', countryName: 'Grèce', name: 'Athènes' },
    { iataCode: 'IST', subType: 'CITY', cityName: 'Istanbul', countryName: 'Turquie', name: 'Istanbul' },
    { iataCode: 'DUB', subType: 'CITY', cityName: 'Dublin', countryName: 'Irlande', name: 'Dublin' },
    { iataCode: 'OSL', subType: 'CITY', cityName: 'Oslo', countryName: 'Norvège', name: 'Oslo' },
    { iataCode: 'ARN', subType: 'CITY', cityName: 'Stockholm', countryName: 'Suède', name: 'Stockholm' },
    { iataCode: 'CPH', subType: 'CITY', cityName: 'Copenhague', countryName: 'Danemark', name: 'Copenhague' },
    { iataCode: 'HEL', subType: 'CITY', cityName: 'Helsinki', countryName: 'Finlande', name: 'Helsinki' },
    // Amériques / autres hubs
    { iataCode: 'NYC', subType: 'CITY', cityName: 'New York', countryName: 'États-Unis', name: 'New York' },
    { iataCode: 'JFK', subType: 'AIRPORT', cityName: 'New York', countryName: 'États-Unis', name: 'New York JFK' },
    { iataCode: 'LAX', subType: 'CITY', cityName: 'Los Angeles', countryName: 'États-Unis', name: 'Los Angeles' },
    { iataCode: 'SFO', subType: 'CITY', cityName: 'San Francisco', countryName: 'États-Unis', name: 'San Francisco' },
    { iataCode: 'MIA', subType: 'CITY', cityName: 'Miami', countryName: 'États-Unis', name: 'Miami' },
    { iataCode: 'YUL', subType: 'CITY', cityName: 'Montréal', countryName: 'Canada', name: 'Montréal' },
    { iataCode: 'YYZ', subType: 'CITY', cityName: 'Toronto', countryName: 'Canada', name: 'Toronto' },
    { iataCode: 'MEX', subType: 'CITY', cityName: 'Mexico', countryName: 'Mexique', name: 'Mexico' },
    { iataCode: 'TYO', subType: 'CITY', cityName: 'Tokyo', countryName: 'Japon', name: 'Tokyo' },
    { iataCode: 'NRT', subType: 'AIRPORT', cityName: 'Tokyo', countryName: 'Japon', name: 'Tokyo Narita' },
    { iataCode: 'SEL', subType: 'CITY', cityName: 'Séoul', countryName: 'Corée du Sud', name: 'Séoul' },
    { iataCode: 'ICN', subType: 'AIRPORT', cityName: 'Séoul', countryName: 'Corée du Sud', name: 'Séoul Incheon' },
    { iataCode: 'BJS', subType: 'CITY', cityName: 'Pékin', countryName: 'Chine', name: 'Pékin' },
    { iataCode: 'SHA', subType: 'CITY', cityName: 'Shanghai', countryName: 'Chine', name: 'Shanghai' },
    { iataCode: 'HKG', subType: 'CITY', cityName: 'Hong Kong', countryName: 'Hong Kong', name: 'Hong Kong' },
    { iataCode: 'SIN', subType: 'CITY', cityName: 'Singapour', countryName: 'Singapour', name: 'Singapour' },
    { iataCode: 'BKK', subType: 'CITY', cityName: 'Bangkok', countryName: 'Thaïlande', name: 'Bangkok' },
    { iataCode: 'SYD', subType: 'CITY', cityName: 'Sydney', countryName: 'Australie', name: 'Sydney' },
    { iataCode: 'DXB', subType: 'CITY', cityName: 'Dubai', countryName: 'Émirats arabes unis', name: 'Dubai' },
    { iataCode: 'TLV', subType: 'CITY', cityName: 'Tel Aviv', countryName: 'Israël', name: 'Tel Aviv' },
];

/** Variantes de pays : Mapbox renvoie souvent l’anglais ; nos lignes seed sont en français. */
const COUNTRY_ALIASES: Record<string, string[]> = {
    Belgique: ['Belgium'],
    Suisse: ['Switzerland'],
    'Royaume-Uni': ['United Kingdom'],
    'Pays-Bas': ['Netherlands'],
    Espagne: ['Spain'],
    Italie: ['Italy'],
    Allemagne: ['Germany'],
    Autriche: ['Austria'],
    'République tchèque': ['Czech Republic'],
    Portugal: ['Portugal'],
    Grèce: ['Greece'],
    Turquie: ['Turkey'],
    Irlande: ['Ireland'],
    Norvège: ['Norway'],
    Suède: ['Sweden'],
    Danemark: ['Denmark'],
    Finlande: ['Finland'],
    'États-Unis': ['United States'],
    Canada: ['Canada'],
    Mexique: ['Mexico'],
    Japon: ['Japan'],
    'Corée du Sud': ['South Korea'],
    Chine: ['China'],
    Singapour: ['Singapore'],
    Thaïlande: ['Thailand'],
    Australie: ['Australia'],
    'Émirats arabes unis': ['United Arab Emirates'],
    Israël: ['Israel'],
};

/** Correspondance ville + pays → code métropolitain Amadeus (secours Mapbox). */
const METRO_BY_CITY_COUNTRY = new Map<string, string>();
for (const r of ROWS) {
    if (r.subType !== 'CITY') continue;
    const aliases = [r.countryName, ...(COUNTRY_ALIASES[r.countryName] || [])];
    for (const c of aliases) {
        METRO_BY_CITY_COUNTRY.set(`${norm(r.cityName)}|${norm(c)}`, r.iataCode);
    }
}

function norm(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '');
}

export function searchPlacesSeed(keyword: string, limit = 12): Record<string, unknown>[] {
    const kw = keyword.trim();
    if (kw.length < 2) return [];

    const lower = norm(kw);
    const upper = kw.toUpperCase();

    const scored: { row: PlacesFallbackRow; score: number }[] = [];

    for (const row of ROWS) {
        const iata = row.iataCode;
        const city = norm(row.cityName);
        const country = norm(row.countryName);
        const label = norm(`${row.cityName} ${row.name}`);

        let score = 0;
        if (iata === upper) score = 100;
        else if (iata.startsWith(upper) && upper.length >= 2) score = 80;
        else if (city.startsWith(lower)) score = 60;
        else if (label.includes(lower)) score = 40;
        else if (country.startsWith(lower)) score = 25;

        if (score > 0) scored.push({ row, score });
    }

    scored.sort((a, b) => b.score - a.score || a.row.cityName.localeCompare(b.row.cityName));

    const seen = new Set<string>();
    const out: Record<string, unknown>[] = [];
    for (const { row } of scored) {
        if (seen.has(row.iataCode)) continue;
        seen.add(row.iataCode);
        out.push(seedRowToNormalized(row));
        if (out.length >= limit) break;
    }
    return out;
}

function seedRowToNormalized(row: PlacesFallbackRow): Record<string, unknown> {
    return {
        id: `seed-${row.iataCode}`,
        name: row.name,
        iataCode: row.iataCode,
        subType: row.subType,
        address: { cityName: row.cityName, countryName: row.countryName },
    };
}

interface MapboxFeature {
    id: string;
    text: string;
    place_name: string;
    center?: [number, number];
    context?: { text: string }[];
}

export async function searchPlacesMapbox(keyword: string, limit = 6): Promise<Record<string, unknown>[]> {
    const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '').trim();
    if (!token || keyword.trim().length < 2) return [];

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(keyword.trim())}.json?types=place&limit=${limit}&language=fr&access_token=${encodeURIComponent(token)}`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: MapboxFeature[] };
    const features = data.features || [];

    const out: Record<string, unknown>[] = [];
    for (const f of features) {
        const country = f.context?.length ? f.context[f.context.length - 1]?.text || '' : '';
        const metroKey = `${norm(f.text)}|${norm(country)}`;
        const iata = METRO_BY_CITY_COUNTRY.get(metroKey);
        if (!iata) continue;

        const [lng, lat] = f.center || [];
        const base: Record<string, unknown> = {
            id: `mapbox-${f.id}`,
            name: f.text,
            iataCode: iata,
            subType: 'CITY',
            address: { cityName: f.text, countryName: country },
        };
        if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
            base.geoCode = { latitude: lat, longitude: lng };
        }
        out.push(base);
    }
    return out;
}

/** Fusionne seed + Mapbox sans doublons sur iataCode (seed en premier). */
export async function placesFallbackSearch(keyword: string): Promise<Record<string, unknown>[]> {
    const seed = searchPlacesSeed(keyword);
    const box = await searchPlacesMapbox(keyword);
    const seen = new Set<string>();
    const merged: Record<string, unknown>[] = [];
    for (const row of [...seed, ...box]) {
        const code = String((row as { iataCode?: string }).iataCode || '');
        if (!code || seen.has(code)) continue;
        seen.add(code);
        merged.push(row);
    }
    return merged;
}
