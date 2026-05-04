// app/api/flights/search/route.ts
import { NextResponse } from 'next/server';
import { getAmadeusBaseUrl } from '@/lib/amadeus-config';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = getAmadeusBaseUrl();

export async function POST(request: Request) {
    try {
        // Vérification des variables d'environnement
        if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
            console.error('Variables manquantes: AMADEUS_CLIENT_ID et/ou AMADEUS_CLIENT_SECRET dans .env');
            return NextResponse.json(
                { error: 'Configuration serveur incomplète : AMADEUS_CLIENT_ID et AMADEUS_CLIENT_SECRET requis dans .env' },
                { status: 500 }
            );
        }

        // 1. Récupérer le JSON envoyé par ton frontend
        const body = await request.json();
        const normalizedBody = {
            ...body,
            currencyCode: 'EUR',
        };

        // 2. Obtenir le Token d'accès Amadeus (Auth)
        const authResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        });

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            console.error('Erreur auth Amadeus:', authResponse.status, authData);
            return NextResponse.json(
                {
                    error: 'Erreur authentification Amadeus',
                    details: authData?.error_description || authData?.error || authData,
                },
                { status: 500 }
            );
        }

        const accessToken = authData.access_token;

        // 3. Envoyer la recherche de vols à Amadeus
        const searchResponse = await fetch(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(normalizedBody),
        });

        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
            console.error('Erreur recherche Amadeus:', searchResponse.status, searchData);
            return NextResponse.json(
                {
                    error: 'Erreur recherche de vols Amadeus',
                    details: searchData?.errors || searchData,
                },
                { status: searchResponse.status }
            );
        }

        // 4. Renvoyer les résultats à ton frontend
        return NextResponse.json(searchData);

    } catch (error) {
        console.error('Erreur API Route:', error);
        return NextResponse.json(
            {
                error: 'Erreur lors de la recherche',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}