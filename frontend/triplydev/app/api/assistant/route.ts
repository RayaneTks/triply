import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const BACKEND_API_BASE_URL = (process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper Auth
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
        // --- AUTHENTIFICATION ---
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
        // ------------------------

        const body = await req.json();
        const messages = body.messages || [];
        const destinationContext = body.destinationContext;

        // 1. OPENAI : Extraction + Estimation GPS
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant voyage expert en géographie. 
                    Contexte actuel: "${destinationContext}".
                    
                    Ta mission :
                    1. Identifier le lieu mentionné (Ville, Pays, Région).
                    2. Fournir les coordonnées GPS.
                    3. Définir un niveau de zoom adapté ("suggestedZoom") :
                       - Pour un PAYS (ex: Niger, France) -> entre 4 et 6.
                       - Pour une VILLE (ex: Niamey, Paris) -> entre 11 et 13.

                    Format JSON STRICT attendu :
                    { 
                        "reply": "Ta réponse conversationnelle...", 
                        "targetLocation": "Nom du lieu ou null",
                        "coordinates": { "lat": number, "lng": number } or null,
                        "suggestedZoom": number (ex: 5 ou 12)
                    }`
                },
                ...messages,
            ],
        });

        const rawContent = completion.choices[0].message.content;
        const parsedAI = JSON.parse(rawContent || "{}");

        const targetLocation = parsedAI.targetLocation || destinationContext;
        const aiCoordinates = parsedAI.coordinates;
        const aiZoom = parsedAI.suggestedZoom;

        // Initialisation des variables finales
        let finalLat = aiCoordinates?.lat;
        let finalLng = aiCoordinates?.lng;
        let finalName = targetLocation;

        // Gestion du Zoom : Si l'IA n'a pas donné de zoom, on met 10, sinon on respecte son choix.
        let finalZoom = aiZoom || 10;

        const finalLocations: Array<{
            id: string;
            title: string;
            coordinates: { latitude: number; longitude: number };
            type: string;
            zoom?: number; // Ajout du type zoom
        }> = [];

        // 2. AMADEUS (Affinement)
        if (targetLocation) {
            try {
                const token = await getAmadeusToken();
                const geoUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(targetLocation)}&page[limit]=1`;
                const geoRes = await fetch(geoUrl, { headers: { Authorization: `Bearer ${token}` } });
                const geoJson = await geoRes.json();
                const cityData = geoJson.data?.[0];

                if (cityData) {
                    // On met à jour les coordonnées pour être plus précis
                    finalLat = cityData.geoCode.latitude;
                    finalLng = cityData.geoCode.longitude;
                    finalName = cityData.name;

                    console.log(`✅ Amadeus a affiné les coordonnées, mais on garde le zoom IA : ${finalZoom}`);
                }
            } catch (err) {
                console.error("Erreur Amadeus:", err);
                // On ne throw pas ici, on continue avec les coordonnées OpenAI si Amadeus échoue
            }
        }

        // 3. CONSTRUCTION DE LA RÉPONSE
        if (finalLat && finalLng) {
            finalLocations.push({
                id: 'city-center',
                title: finalName || 'Destination',
                coordinates: { latitude: finalLat, longitude: finalLng },
                zoom: finalZoom,
                type: 'city-center'
            });
        }

        return NextResponse.json({
            reply: parsedAI.reply,
            locations: finalLocations
        });

    } catch (error: any) {
        console.error('Erreur Serveur Assistant:', error);
        const message = error instanceof Error ? error.message : 'Erreur serveur.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}