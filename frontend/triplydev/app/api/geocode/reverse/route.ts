import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lng = searchParams.get('lng');
    const lat = searchParams.get('lat');

    if (!lng || !lat) {
        return NextResponse.json({ error: 'Paramètres lng et lat requis' }, { status: 400 });
    }

    if (!MAPBOX_TOKEN) {
        return NextResponse.json({ error: 'Mapbox non configuré' }, { status: 503 });
    }

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=fr&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.features?.length) {
            return NextResponse.json({ address: null });
        }

        const placeName = data.features[0].place_name as string;
        return NextResponse.json({ address: placeName });
    } catch (err) {
        console.error('Reverse geocode error:', err);
        return NextResponse.json({ error: 'Erreur géocodage', address: null }, { status: 500 });
    }
}
