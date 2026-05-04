import { NextResponse } from 'next/server';
import { getAmadeusBaseUrl } from '@/lib/amadeus-config';
import { placesFallbackSearch } from '@/lib/places-fallback';

const ALLOWED_SUB_TYPES = new Set(['CITY', 'AIRPORT']);

/** Format CSV attendu par Amadeus (collectionFormat: csv). Défaut : villes + aéroports. */
function resolveAmadeusSubTypes(searchParams: URLSearchParams): string {
    const raw = searchParams.get('subType')?.trim();
    if (!raw) {
        return 'CITY,AIRPORT';
    }
    const parts = raw
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => ALLOWED_SUB_TYPES.has(s));
    const unique = [...new Set(parts)];
    return unique.length > 0 ? unique.join(',') : 'CITY,AIRPORT';
}

async function getAmadeusToken(baseUrl: string): Promise<string> {
    const clientId = (process.env.AMADEUS_CLIENT_ID || '').trim();
    const clientSecret = (process.env.AMADEUS_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
        throw new Error('AMADEUS_CLIENT_ID et AMADEUS_CLIENT_SECRET requis');
    }

    const authResponse = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }).toString(),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) {
        console.error('Amadeus auth error:', authData);
        throw new Error(authData.error_description || 'Échec auth Amadeus');
    }
    return authData.access_token;
}

function normalizeLocation(loc: Record<string, unknown>): Record<string, unknown> {
    const address = (loc.address as Record<string, unknown>) || {};
    const cityName = (address.cityName as string) || (loc.cityName as string) || (loc.name as string);
    const countryName = (address.countryName as string) || (loc.countryName as string) || '';
    const rawGeo = loc.geoCode as Record<string, unknown> | undefined;
    const latRaw = rawGeo?.latitude;
    const lngRaw = rawGeo?.longitude;
    const lat = typeof latRaw === 'number' ? latRaw : latRaw != null ? Number(latRaw) : NaN;
    const lng = typeof lngRaw === 'number' ? lngRaw : lngRaw != null ? Number(lngRaw) : NaN;
    const geoCode = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

    const base: Record<string, unknown> = {
        id: loc.id || loc.iataCode || 'unknown',
        name: loc.name || cityName,
        iataCode: loc.iataCode || '',
        subType: loc.subType || 'CITY',
        address: { cityName, countryName },
    };
    if (geoCode) base.geoCode = geoCode;
    return base;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim();

    if (!keyword || keyword.length < 2) {
        return NextResponse.json([]);
    }

    const baseUrl = getAmadeusBaseUrl();

    try {
        const accessToken = await getAmadeusToken(baseUrl);
        const subType = resolveAmadeusSubTypes(searchParams);
        const url = `${baseUrl}/v1/reference-data/locations?subType=${subType}&keyword=${encodeURIComponent(keyword)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        const data = await response.json();
        const raw = data.data || [];

        if (!response.ok) {
            console.error('Amadeus locations error:', data);
            const code = data?.errors?.[0]?.code;
            if (code === 38189) {
                console.error(
                    '[places/search] Erreur interne Amadeus (38189). Vérifier que AMADEUS_API_BASE_URL correspond aux clés : test → https://test.api.amadeus.com , production → https://api.amadeus.com ; sinon APIs activées sur l’app Amadeus.',
                );
            }
            const fallback = await placesFallbackSearch(keyword);
            return NextResponse.json(fallback);
        }

        const normalized = raw.map((loc: Record<string, unknown>) => normalizeLocation(loc));
        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Erreur API Places:', error);
        const fallback = await placesFallbackSearch(keyword);
        return NextResponse.json(fallback);
    }
}
