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