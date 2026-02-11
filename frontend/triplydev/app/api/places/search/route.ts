import { NextResponse } from 'next/server';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com'; // Ou prod

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    if (!keyword || keyword.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // 1. Authentification (Idéalement à mettre en cache pour ne pas le refaire à chaque lettre)
        const authResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        });
        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // 2. Recherche des villes et aéroports via Amadeus
        // subType=CITY,AIRPORT permet de trouver "Paris" (CITY) et "Charles de Gaulle" (AIRPORT)
        const response = await fetch(
            `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${keyword}&page[limit]=10&view=LIGHT`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        const data = await response.json();

        // On renvoie directement les données Amadeus au front
        return NextResponse.json(data.data || []);

    } catch (error) {
        console.error('Erreur API Places:', error);
        return NextResponse.json([], { status: 500 });
    }
}