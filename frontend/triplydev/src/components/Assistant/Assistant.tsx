'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import MessageList from "@/src/components/Messages/MessageList";
import { SearchBar } from "@/src/components/Searchbar/Searchbar";
import { Button } from "@/src/components/Button/Button";

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
}

interface AssistantResponse {
    reply: string;
    locations: Location[];
}

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

        const newHistory = [...messages, userMessage];
        setMessages(newHistory);
        setMessage('');
        setLoading(true);

        try {
            const apiMessages = newHistory.map(({ role, content }) => ({
                role,
                content
            }));

            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                }),
            });

            if (!res.ok) throw new Error(res.statusText);

            const data: AssistantResponse = await res.json();

            const assistantMessage: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: data.reply,
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (data.locations && data.locations.length > 0 && onUpdateLocations) {
                onUpdateLocations(data.locations);
            }

        } catch (error) {
            console.error("Erreur API", error);
            const errorMessage: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: "Désolé, une erreur est survenue lors de la recherche des destinations."
            };
            setMessages(prev => [...prev, errorMessage]);
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
                    placeholder="Où souhaitez-vous aller ? (ex: Tokyo, Bali...)"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />

                <Button
                    label="Envoyer"
                    onClick={sendMessage}
                    disabled={loading}
                    className="h-full"
                />
            </div>
        </div>
    );
}