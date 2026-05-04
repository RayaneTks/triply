import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
    TRIPLY_SYSTEM_PROMPT,
    quickGate,
    getGeoInstructions,
    getPreferencesInstructions,
    getTripPlanningAssistantContext,
    getStep1FormAssistantInstructions,
    getQaOnlyInstructions,
    getRegenerateActivityInstructions,
} from '@/src/lib/triply';
import { normalizeAssistantStep1FormPatch } from '@/src/features/trip-creation/step1-form-patch';
import { getAmadeusBaseUrl } from '@/lib/amadeus-config';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = getAmadeusBaseUrl();
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

function normalizeReplacement(raw: unknown): {
    title: string;
    lat: number;
    lng: number;
    durationHours?: number;
} | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const lat = typeof o.lat === 'number' ? o.lat : Number(o.lat);
    const lng = typeof o.lng === 'number' ? o.lng : Number(o.lng);
    if (!title || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    const dh = o.durationHours;
    let durationHours: number | undefined;
    if (typeof dh === 'number' && dh > 0) durationHours = dh;
    else if (typeof dh === 'string') {
        const p = parseFloat(dh);
        if (p > 0) durationHours = p;
    }
    return { title, lat, lng, ...(durationHours != null ? { durationHours } : {}) };
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
        const chatMode = body.chatMode === 'qa' ? 'qa' : 'itinerary';
        const intent = typeof body.intent === 'string' ? body.intent : '';

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

        const step1FormSnapshot =
            body.step1FormSnapshot && typeof body.step1FormSnapshot === 'object' && !Array.isArray(body.step1FormSnapshot)
                ? (body.step1FormSnapshot as Record<string, unknown>)
                : {};
        const step1HotelOptionLabels: string[] = Array.isArray(body.step1HotelOptionLabels)
            ? body.step1HotelOptionLabels.filter((x: unknown) => typeof x === 'string')
            : [];
        const step1DietaryLabels: string[] = Array.isArray(body.step1DietaryLabels)
            ? body.step1DietaryLabels.filter((x: unknown) => typeof x === 'string')
            : [];

        /** Régénération d’activité : prompt dédié, pas de gate sur le texte utilisateur */
        if (intent === 'regenerate_activity') {
            const ra = body.regenerateActivity;
            if (!ra || typeof ra !== 'object') {
                return NextResponse.json({ error: 'regenerateActivity requis.' }, { status: 400 });
            }
            const o = ra as Record<string, unknown>;
            const title = typeof o.title === 'string' ? o.title.trim() : '';
            const lat = typeof o.lat === 'number' ? o.lat : Number(o.lat);
            const lng = typeof o.lng === 'number' ? o.lng : Number(o.lng);
            const dayIndex =
                typeof o.dayIndex === 'number' ? o.dayIndex : parseInt(String(o.dayIndex || selectedDay), 10) || 1;
            if (!title || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                return NextResponse.json({ error: 'title, lat, lng invalides.' }, { status: 400 });
            }

            const regenSystem =
                TRIPLY_SYSTEM_PROMPT +
                getRegenerateActivityInstructions({
                    title,
                    lat,
                    lng,
                    dayIndex,
                    destinationContext: typeof o.destinationContext === 'string' ? o.destinationContext : destinationContext,
                }) +
                getPreferencesInstructions(userPreferences);

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: regenSystem },
                    {
                        role: 'user',
                        content: 'Propose une alternative concrète pour remplacer cette activité. Réponds uniquement en JSON.',
                    },
                ],
            });

            const rawContent = completion.choices[0].message.content;
            const parsedAI = JSON.parse(rawContent || '{}');
            const replacement = normalizeReplacement(parsedAI.replacement);

            return NextResponse.json({
                reply: typeof parsedAI.reply === 'string' ? parsedAI.reply : '',
                replacement,
                locations: [],
                suggestedActivities: [],
                step1FormPatch: null,
            });
        }

        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        const userText = lastUserMessage?.content ?? '';

        const gate = quickGate(userText);
        if (!gate.allow) {
            return NextResponse.json({
                reply: gate.response,
                locations: [],
                suggestedActivities: [],
                step1FormPatch: null,
            });
        }

        const planningBlock =
            chatMode === 'qa'
                ? ''
                : destinationContext.trim().length > 0 || maxActivityHoursPerDay > 0
                  ? getTripPlanningAssistantContext({
                        destinationContext,
                        maxActivityHoursPerDay: maxActivityHoursPerDay > 0 ? maxActivityHoursPerDay : 8,
                        selectedDay,
                        travelDays,
                        planningMode,
                        currentDayActivityTitles,
                    })
                  : '';

        const step1Block = chatMode === 'qa' ? '' : getStep1FormAssistantInstructions({
            snapshot: step1FormSnapshot,
            hotelPreferenceLabels: step1HotelOptionLabels,
            dietaryLabels: step1DietaryLabels,
        });

        const geoBlock = chatMode === 'qa' ? '' : getGeoInstructions(destinationContext);

        const qaBlock = chatMode === 'qa' ? getQaOnlyInstructions() : '';

        const systemContent =
            TRIPLY_SYSTEM_PROMPT +
            planningBlock +
            step1Block +
            geoBlock +
            qaBlock +
            getPreferencesInstructions(userPreferences);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: systemContent }, ...messages],
        });

        const rawContent = completion.choices[0].message.content;
        const parsedAI = JSON.parse(rawContent || '{}');

        let finalLocations: Array<{
            id: string;
            title: string;
            coordinates: { latitude: number; longitude: number };
            type: string;
            zoom?: number;
        }> = [];

        let suggestedActivities = normalizeSuggestedActivities(parsedAI.suggestedActivities);
        let step1FormPatch = normalizeAssistantStep1FormPatch(
            parsedAI.step1FormPatch,
            step1HotelOptionLabels,
            step1DietaryLabels
        );

        if (chatMode === 'qa') {
            finalLocations = [];
            suggestedActivities = [];
            step1FormPatch = null;
        } else {
            const targetLocation = parsedAI.targetLocation || destinationContext;
            const aiCoordinates = parsedAI.coordinates;
            const aiZoom = parsedAI.suggestedZoom;

            let finalLat = aiCoordinates?.lat;
            let finalLng = aiCoordinates?.lng;
            let finalName = targetLocation;
            const finalZoom = aiZoom || 10;

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
                    console.error('Erreur Amadeus:', err);
                }
            }

            if (finalLat && finalLng) {
                finalLocations.push({
                    id: 'city-center',
                    title: finalName || 'Destination',
                    coordinates: { latitude: finalLat, longitude: finalLng },
                    zoom: finalZoom,
                    type: 'city-center',
                });
            }
        }

        return NextResponse.json({
            reply: parsedAI.reply,
            locations: finalLocations,
            suggestedActivities,
            step1FormPatch,
            replacement: null,
        });
    } catch (error: unknown) {
        console.error('Erreur Serveur Assistant:', error);
        const message = error instanceof Error ? error.message : 'Erreur serveur.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
