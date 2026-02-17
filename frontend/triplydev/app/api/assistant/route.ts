import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const BACKEND_API_BASE_URL = (process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    if (!res.ok) throw new Error('Auth Amadeus Failed');
    const data = await res.json();
    return data.access_token;
}

export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Cle API manquante.' }, { status: 500 });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentification requise pour utiliser le LLM.' }, { status: 401 });
        }

        const authRes = await fetch(`${BACKEND_API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: authHeader,
            },
        });

        if (!authRes.ok) {
            return NextResponse.json({ error: 'Session invalide. Merci de vous reconnecter.' }, { status: 401 });
        }

        const body = await req.json();
        const messages = body.messages || [];
        const destinationContext = body.destinationContext;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant voyage.
Contexte: "${destinationContext}".
Objectif: Extraire la ville cible si presente.
Si l'utilisateur demande des hotels sans preciser la ville, utilise le contexte.
JSON attendu: { "reply": "Phrase de reponse", "targetCity": "Ville detectee ou null" }`,
                },
                ...messages,
            ],
        });

        const rawContent = completion.choices[0].message.content;
        const parsedAI = JSON.parse(rawContent || '{}');
        const targetCity = parsedAI.targetCity || destinationContext;

        const finalLocations: Array<{
            id: string;
            title: string;
            coordinates: { latitude: number; longitude: number };
            type: string;
        }> = [];

        if (targetCity) {
            try {
                const token = await getAmadeusToken();

                const geoUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(targetCity)}&page[limit]=1`;
                const geoRes = await fetch(geoUrl, { headers: { Authorization: `Bearer ${token}` } });
                const geoJson = await geoRes.json();
                const cityData = geoJson.data?.[0];

                if (cityData) {
                    const { latitude, longitude } = cityData.geoCode;

                    finalLocations.push({
                        id: 'city-center',
                        title: cityData.name,
                        coordinates: { latitude, longitude },
                        type: 'city-center',
                    });
                }
            } catch (err) {
                console.error('Erreur Amadeus Geocoding:', err);
            }
        }

        return NextResponse.json({
            reply: parsedAI.reply,
            locations: finalLocations,
        });
    } catch (error: unknown) {
        console.error('Erreur Serveur Assistant:', error);
        const message = error instanceof Error ? error.message : 'Erreur serveur.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
