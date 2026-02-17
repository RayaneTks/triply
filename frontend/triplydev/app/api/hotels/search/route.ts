import { NextResponse } from 'next/server';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

async function getAmadeusToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', AMADEUS_CLIENT_ID!);
    params.append('client_secret', AMADEUS_CLIENT_SECRET!);

    const res = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!res.ok) throw new Error('Auth Failed');
    const data = await res.json();
    return data.access_token;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const ratings = searchParams.get('ratings'); // ex: "2,3,4" ou "4,5"

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Lat/Lng required' }, { status: 400 });
    }

    try {
        const token = await getAmadeusToken();

        let url = `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lng}&radius=15`;
        if (ratings && ratings.trim()) {
            url += `&ratings=${encodeURIComponent(ratings.trim())}`;
        }

        console.log("🏨 API Search Hotels:", lat, lng, ratings || 'tous');

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        if (!res.ok) {
            console.error("Amadeus Error:", await res.text());
            return NextResponse.json({ locations: [] });
        }

        const data = await res.json();

        const locations = (data.data || []).map((h: any) => {
            const geo = h.geoCode || {};
            const lat = geo.latitude ?? geo.lat ?? 0;
            const lng = geo.longitude ?? geo.lng ?? geo.lon ?? 0;
            return {
                id: h.hotelId ?? String(h.iataCode ?? Math.random()),
                title: h.name ?? 'Hôtel',
                coordinates: { latitude: lat, longitude: lng },
                type: 'hotel'
            };
        });

        return NextResponse.json({ locations });

    } catch (error: any) {
        console.error("Erreur Search Route:", error);
        return NextResponse.json({ error: error.message, locations: [] }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
            console.error('Variables manquantes: AMADEUS_CLIENT_ID et/ou AMADEUS_CLIENT_SECRET');
            return NextResponse.json(
                { error: 'Configuration serveur incomplète : AMADEUS_CLIENT_ID et AMADEUS_CLIENT_SECRET requis' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { cityCode, checkInDate, checkOutDate, adults = 1, roomQuantity = 1, maxPrice, preferences = [] } = body;

        if (!cityCode || !checkInDate || !checkOutDate) {
            return NextResponse.json(
                { error: 'Paramètres manquants : cityCode, checkInDate, checkOutDate requis' },
                { status: 400 }
            );
        }

        // 1. Récupérer le token Amadeus
        const authResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        });

        const authData = await authResponse.json();
        if (!authResponse.ok) {
            console.error('Erreur auth Amadeus:', authResponse.status, authData);
            return NextResponse.json(
                { error: 'Erreur authentification Amadeus', details: authData?.error_description || authData },
                { status: 500 }
            );
        }

        const accessToken = authData.access_token;

        // Mapping des préférences utilisateur vers paramètres Amadeus
        const prefSet = new Set<string>((preferences as string[]).map((p: string) => p.toLowerCase()));
        const amenities: string[] = [];
        let ratings: string | undefined;

        if (prefSet.has('spa/piscine')) amenities.push('SWIMMING_POOL', 'SAUNA');
        if (prefSet.has('plage')) amenities.push('BEACH');
        if (prefSet.has('animaux domestiques')) amenities.push('PETS_ALLOWED');
        if (prefSet.has('réservé aux adultes')) amenities.push('NO_KID_ALLOWED');
        if (prefSet.has('wi-fi') || prefSet.has('équipement')) amenities.push('WIFI');
        if (prefSet.has('équipement')) amenities.push('FITNESS_CENTER');
        if (prefSet.has('hôtel de luxe')) ratings = '5';

        // 2. Récupérer la liste des hôtels par ville
        const hotelListParams = new URLSearchParams({
            cityCode: String(cityCode),
            radius: '50',
            radiusUnit: 'KM',
        });
        if (amenities.length > 0) {
            hotelListParams.set('amenities', amenities.slice(0, 3).join(',')); // Amadeus limite
        }
        if (ratings) hotelListParams.set('ratings', ratings);

        const hotelListUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?${hotelListParams.toString()}`;
        const hotelListResponse = await fetch(hotelListUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const hotelListData = await hotelListResponse.json();

        if (!hotelListResponse.ok) {
            console.error('Erreur liste hôtels:', hotelListResponse.status, hotelListData);
            return NextResponse.json(
                { error: 'Erreur liste hôtels', details: hotelListData?.errors || hotelListData },
                { status: hotelListResponse.status }
            );
        }

        let hotels = hotelListData.data || [];
        let hotelIds = hotels.slice(0, 40).map((h: { hotelId?: string }) => h.hotelId).filter(Boolean);

        // Fallback : si filtre préférences trop restrictif, réessayer sans
        if (hotelIds.length === 0 && (amenities.length > 0 || ratings)) {
            const fallbackParams = new URLSearchParams({
                cityCode: String(cityCode),
                radius: '50',
                radiusUnit: 'KM',
            });
            const fallbackUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?${fallbackParams.toString()}`;
            const fallbackRes = await fetch(fallbackUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const fallbackData = await fallbackRes.json();
            hotels = fallbackData.data || [];
            hotelIds = hotels.slice(0, 40).map((h: { hotelId?: string }) => h.hotelId).filter(Boolean);
        }

        if (hotelIds.length === 0) {
            return NextResponse.json({ data: [], dictionaries: { hotels: {} } });
        }

        // 3. Rechercher les offres pour ces hôtels (approfondi : plus d'offres par hôtel)
        const params = new URLSearchParams({
            hotelIds: hotelIds.join(','),
            adults: String(adults),
            checkInDate,
            checkOutDate,
            roomQuantity: String(roomQuantity || 1),
            currency: 'EUR',
            bestRateOnly: 'false',
        });
        if (maxPrice && maxPrice > 0) {
            params.set('priceRange', `0-${maxPrice}`);
        }
        if (prefSet.has('petit déjeuner inclus')) {
            params.set('boardType', 'BREAKFAST');
        }

        const offersUrl = `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${params.toString()}`;
        const offersResponse = await fetch(offersUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const offersData = await offersResponse.json();

        if (!offersResponse.ok) {
            console.error('Erreur offres hôtels:', offersResponse.status, offersData);
            return NextResponse.json(
                { error: 'Erreur recherche hôtels', details: offersData?.errors || offersData },
                { status: offersResponse.status }
            );
        }

        return NextResponse.json(offersData);
    } catch (error) {
        console.error('Erreur API Hotels:', error);
        return NextResponse.json(
            {
                error: 'Erreur lors de la recherche',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
