import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
    TRIPLY_SYSTEM_PROMPT,
    quickGate,
    getGeoInstructions,
    getPreferencesInstructions,
    getTripPlanningAssistantContext,
} from '@/src/lib/triply';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const BACKEND_API_BASE_URL = (process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

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

function normalizeSuggestedActivities(raw: unknown): Array<{ title: string; lat: number; lng: number; durationHours?: number }> {
    if (!Array.isArray(raw)) return [];
    const out: Array<{ title: string; lat: number; lng: number; durationHours?: number }> = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const title = typeof o.title === 'string' ? o.title.trim() : '';
        const lat = typeof o.lat === 'number' ? o.lat : Number(o.lat);
        const lng = typeof o.lng === 'number' ? o.lng : Number(o.lng);
        if (!title || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
        const dh = o.durationHours;
        let durationHours: number | undefined;
        if (typeof dh === 'number' && dh > 0) durationHours = dh;
        else if (typeof dh === 'string') {
            const p = parseFloat(dh);
            if (p > 0) durationHours = p;
        }
        out.push({ title, lat, lng, ...(durationHours != null ? { durationHours } : {}) });
        if (out.length >= 8) break;
    }
    return out;
}

export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Cle API manquante.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
        const destinationContext = body.destinationContext || '';
        const userPreferences: string[] = body.userPreferences || [];
        const maxActivityHoursRaw = body.maxActivityHoursPerDay;
        const maxActivityHoursPerDay =
            typeof maxActivityHoursRaw === 'number' && Number.isFinite(maxActivityHoursRaw)
                ? maxActivityHoursRaw
                : parseFloat(String(maxActivityHoursRaw ?? '')) || 0;
        const selectedDay =
            typeof body.selectedDay === 'number' ? body.selectedDay : parseInt(String(body.selectedDay || 1), 10) || 1;
        const travelDays =
            typeof body.travelDays === 'number' ? body.travelDays : parseInt(String(body.travelDays || 1), 10) || 1;
        const planningMode = String(body.planningMode || 'semi_ai');
        const currentDayActivityTitles: string[] = Array.isArray(body.currentDayActivityTitles)
            ? body.currentDayActivityTitles.filter((x: unknown) => typeof x === 'string')
            : [];

        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        const userText = lastUserMessage?.content ?? '';

        const gate = quickGate(userText);
        if (!gate.allow) {
            return NextResponse.json({ reply: gate.response, locations: [], suggestedActivities: [] });
        }

        const planningBlock =
            destinationContext.trim().length > 0 || maxActivityHoursPerDay > 0
                ? getTripPlanningAssistantContext({
                      destinationContext,
                      maxActivityHoursPerDay: maxActivityHoursPerDay > 0 ? maxActivityHoursPerDay : 8,
                      selectedDay,
                      travelDays,
                      planningMode,
                      currentDayActivityTitles,
                  })
                : '';

        const systemContent =
            TRIPLY_SYSTEM_PROMPT +
            planningBlock +
            getGeoInstructions(destinationContext) +
            getPreferencesInstructions(userPreferences);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemContent },
                ...messages,
            ],
        });

        const rawContent = completion.choices[0].message.content;
        const parsedAI = JSON.parse(rawContent || "{}");

        const targetLocation = parsedAI.targetLocation || destinationContext;
        const aiCoordinates = parsedAI.coordinates;
        const aiZoom = parsedAI.suggestedZoom;

        let finalLat = aiCoordinates?.lat;
        let finalLng = aiCoordinates?.lng;
        let finalName = targetLocation;
        const finalZoom = aiZoom || 10;

        const finalLocations: Array<{
            id: string;
            title: string;
            coordinates: { latitude: number; longitude: number };
            type: string;
            zoom?: number;
        }> = [];

        if (targetLocation) {
            try {
                const token = await getAmadeusToken();
                const geoUrl = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(targetLocation)}&page[limit]=1`;
                const geoRes = await fetch(geoUrl, { headers: { Authorization: `Bearer ${token}` } });
                const geoJson = await geoRes.json();
                const cityData = geoJson.data?.[0];

                if (cityData) {
                    finalLat = cityData.geoCode.latitude;
                    finalLng = cityData.geoCode.longitude;
                    finalName = cityData.name;
                }
            } catch (err) {
                console.error("Erreur Amadeus:", err);
            }
        }

        if (finalLat && finalLng) {
            finalLocations.push({
                id: 'city-center',
                title: finalName || 'Destination',
                coordinates: { latitude: finalLat, longitude: finalLng },
                zoom: finalZoom,
                type: 'city-center'
            });
        }

        const suggestedActivities = normalizeSuggestedActivities(parsedAI.suggestedActivities);

        return NextResponse.json({
            reply: parsedAI.reply,
            locations: finalLocations,
            suggestedActivities,
        });

    } catch (error: unknown) {
        console.error('Erreur Serveur Assistant:', error);
        const message = error instanceof Error ? error.message : 'Erreur serveur.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}