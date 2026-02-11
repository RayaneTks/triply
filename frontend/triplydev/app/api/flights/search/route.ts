// app/api/flights/search/route.ts
import { NextResponse } from 'next/server';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
// Utilise 'test' pour le dev, 'production' pour le live
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

export async function POST(request: Request) {
    try {
        // 1. Récupérer le JSON envoyé par ton frontend
        const body = await request.json();

        // 2. Obtenir le Token d'accès Amadeus (Auth)
        const authResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        });

        if (!authResponse.ok) {
            throw new Error('Erreur authentification Amadeus');
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // 3. Envoyer la recherche de vols à Amadeus
        const searchResponse = await fetch(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body), // On transmet le JSON que ton utilitaire a créé
        });

        const searchData = await searchResponse.json();

        // 4. Renvoyer les résultats à ton frontend
        return NextResponse.json(searchData);

    } catch (error) {
        console.error('Erreur API Route:', error);
        return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 });
    }
}