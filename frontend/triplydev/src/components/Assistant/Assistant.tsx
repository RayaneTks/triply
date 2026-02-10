'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import MessageList from "@/src/components/Messages/MessageList";
import {SearchBar} from "@/src/components/Searchbar/Searchbar";
import {Button} from "@/src/components/Button/Button";

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
}

const MOCK_LOCATIONS = [
    {
        id: '1',
        title: 'Paris',
        coordinates: { latitude: 48.8566, longitude: 2.3522 }
    },
    {
        id: '2',
        title: 'Rome',
        coordinates: { latitude: 41.9028, longitude: 12.4964 }
    },
    {
        id: '3',
        title: 'Dublin',
        coordinates: { latitude: 53.3498, longitude: -6.2603 }
    }
];

export type Role = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
}

interface AssistantProps {
    onUpdateLocations?: (locations: Location[]) => void;
}

export default function Assistant({ onUpdateLocations }: AssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!message.trim() || loading) return;

        const currentMessageText = message;

        const userMessage: ChatMessage = {
            id: uuid(),
            role: 'user',
            content: currentMessageText,
        };

        setMessages(prev => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        const foundLocations = MOCK_LOCATIONS.filter(loc =>
            currentMessageText.toLowerCase().includes(loc.title.toLowerCase())
        );

        if (foundLocations.length > 0 && onUpdateLocations) {
            console.log("Assistant: Villes trouvées, envoi au parent...", foundLocations);
            onUpdateLocations(foundLocations);
        }

        try {
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });

            const data = await res.json();

            const assistantMessage: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: data.reply,
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Erreur API", error);
            if (foundLocations.length > 0) {
                const autoReply: ChatMessage = {
                    id: uuid(),
                    role: 'assistant',
                    content: `J'ai trouvé ${foundLocations.length} destination(s) : ${foundLocations.map(l => l.title).join(', ')}. Je centre la carte.`
                };
                setMessages(prev => [...prev, autoReply]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div
            className="p-6 rounded-lg flex flex-col min-h-[300px]"
            style={{
                backgroundColor: 'var(--background, #222)',
                boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            }}
        >
            <h2 className="text-lg font-semibold mb-4 text-white">
                Triply Assistant
            </h2>

            <MessageList messages={messages} loading={loading} />

            <div className="flex gap-2 mt-4">
                <SearchBar
                    placeholder="Posez votre question à l'assistant..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />

                <Button
                    label="Envoyer"
                    onClick={sendMessage}
                    variant="dark"
                    tone="tone1"
                    disabled={loading}
                    loading={loading}
                    className="h-full"
                />
            </div>
        </div>
    );
}
