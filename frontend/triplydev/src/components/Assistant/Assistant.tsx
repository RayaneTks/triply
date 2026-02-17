'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import MessageList from '@/src/components/Messages/MessageList';
import { SearchBar } from '@/src/components/Searchbar/Searchbar';
import { Button } from '@/src/components/Button/Button';
import { getStoredSession } from '@/src/lib/auth-client';

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
    destination?: string;
}

export default function Assistant({ onUpdateLocations, destination }: AssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, loading]);

    const placeholderText = destination
        ? `Rechercher des activites a ${destination}...`
        : 'Ou souhaitez-vous aller ? (ex: Tokyo...)';

    const sendMessage = async () => {
        if ((!message.trim() && !destination) || loading) return;

        const session = getStoredSession();
        if (!session?.token) {
            const authRequired: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: "Connexion requise pour utiliser l'assistant.",
            };
            setMessages((prev) => [...prev, authRequired]);
            return;
        }

        const currentMessageText = message.trim() || `Montre-moi les hotels et activites a ${destination}`;

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
            const apiMessages = newHistory.map(({ role, content }) => ({ role, content }));

            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    destinationContext: destination,
                }),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error(payload?.error || res.statusText || 'Erreur API');
            }

            const data: AssistantResponse = await res.json();

            const assistantMessage: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: data.reply,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (data.locations && data.locations.length > 0 && onUpdateLocations) {
                onUpdateLocations(data.locations);
            }
        } catch (error) {
            console.error('Erreur API', error);
            const errorMessage: ChatMessage = {
                id: uuid(),
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Desole, une erreur est survenue.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                <MessageList messages={messages} loading={loading} />
            </div>
            <div className="flex-shrink-0 p-4 pt-2 border-t flex gap-2" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <SearchBar
                    placeholder={placeholderText}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />
                <Button
                    label="Envoyer"
                    onClick={() => {
                        void sendMessage();
                    }}
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
