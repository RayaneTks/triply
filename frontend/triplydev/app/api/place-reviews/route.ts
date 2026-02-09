import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!name?.trim() || !lat || !lng) {
        return NextResponse.json(
            { error: 'Paramètres manquants: name, lat, lng' },
            { status: 400 }
        );
    }

    if (!GOOGLE_API_KEY) {
        return NextResponse.json(
            { error: 'GOOGLE_PLACES_API_KEY non configurée' },
            { status: 503 }
        );
    }

    try {
        const findUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
        findUrl.searchParams.set('input', name);
        findUrl.searchParams.set('inputtype', 'textquery');
        findUrl.searchParams.set('locationbias', `point:${lat},${lng}`);
        findUrl.searchParams.set('fields', 'place_id');
        findUrl.searchParams.set('key', GOOGLE_API_KEY);

        const findRes = await fetch(findUrl.toString());
        const findData = await findRes.json();

        if (findData.status !== 'OK' || !findData.candidates?.length) {
            return NextResponse.json({
                name,
                rating: null,
                reviews: [],
                url: null,
                error: 'Lieu non trouvé',
            });
        }

        const placeId = findData.candidates[0].place_id;

        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', placeId);
        detailsUrl.searchParams.set('fields', 'name,rating,reviews,url');
        detailsUrl.searchParams.set('language', 'fr');
        detailsUrl.searchParams.set('key', GOOGLE_API_KEY);

        const detailsRes = await fetch(detailsUrl.toString());
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK' || !detailsData.result) {
            return NextResponse.json({
                name: detailsData.result?.name ?? name,
                rating: null,
                reviews: [],
                url: null,
            });
        }

        const result = detailsData.result;
        const reviews = (result.reviews || []).map((r: { author_name: string; rating: number; text: string; relative_time_description: string }) => ({
            author_name: r.author_name,
            rating: r.rating,
            text: r.text,
            relative_time_description: r.relative_time_description,
        }));

        return NextResponse.json({
            name: result.name,
            rating: result.rating ?? null,
            reviews,
            url: result.url ?? null,
        });
    } catch (err) {
        console.error('place-reviews API error:', err);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des avis' },
            { status: 500 }
        );
    }
}
