import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const messages = body.messages || [];

        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
                    Tu es Triply, un assistant de voyage.
                    Tu dois TOUJOURS répondre au format JSON valide.
                    Structure attendue :
                    {
                      "reply": "Ta réponse textuelle ici",
                      "locations": [
                        {
                          "id": "uuid",
                          "title": "Nom du lieu",
                          "coordinates": { "latitude": 0, "longitude": 0 }
                        }
                      ]
                    }
                    Si aucun lieu n'est demandé, "locations" est un tableau vide [].
                    Génère des coordonnées approximatives mais réalistes pour les villes demandées.
                    `
                },
                ...messages
            ],
        });

        const rawContent = completion.choices[0].message.content;

        if (!rawContent) throw new Error("Réponse vide");

        const parsedContent = JSON.parse(rawContent);

        return NextResponse.json(parsedContent);

    } catch (error: any) {
        console.error('ERREUR OPENAI:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}