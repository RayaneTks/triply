import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper Auth (Dupliqué pour l'instant pour éviter les dépendances externes)
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
        return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const messages = body.messages || [];
        const destinationContext = body.destinationContext;

        // 1. OPENAI : Compréhension et Extraction
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant voyage. 
                    Contexte: "${destinationContext}".
                    Objectif: Extraire la ville cible si présente.
                    Si l'utilisateur demande des hôtels sans préciser la ville, utilise le contexte.
                    JSON attendu: { "reply": "Phrase de réponse", "targetCity": "Ville détectée ou null" }`
                },
                ...messages
            ],
        });

        const rawContent = completion.choices[0].message.content;
        const parsedAI = JSON.parse(rawContent || "{}");
        const targetCity = parsedAI.targetCity || destinationContext;

        let finalLocations: any[] = [];

        // 2. AMADEUS : Géocodage SEULEMENT (Le "Cerveau")
        // On récupère juste les coordonnées de la ville pour centrer la carte.
        // La récupération des hôtels (Le "Moteur") est déléguée à l'autre route API.
        if (targetCity) {
            try {
                const token = await getAmadeusToken();

                const geoUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(targetCity)}&page[limit]=1`;
                const geoRes = await fetch(geoUrl, { headers: { Authorization: `Bearer ${token}` } });
                const geoJson = await geoRes.json();
                const cityData = geoJson.data?.[0];

                if (cityData) {
                    const { latitude, longitude } = cityData.geoCode;

                    // On renvoie UNIQUEMENT le centre ville
                    finalLocations.push({
                        id: 'city-center',
                        title: cityData.name,
                        coordinates: { latitude, longitude },
                        type: 'city-center'
                    });

                    console.log(`📍 Ville trouvée par Assistant: ${cityData.name} (${latitude}, ${longitude})`);
                }
            } catch (err) {
                console.error("Erreur Amadeus Geocoding:", err);
            }
        }

        return NextResponse.json({
            reply: parsedAI.reply,
            locations: finalLocations // Contient seulement le centre ville pour l'instant
        });

    } catch (error: any) {
        console.error("Erreur Serveur Assistant:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}