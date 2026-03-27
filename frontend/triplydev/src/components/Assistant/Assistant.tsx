'use client';

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuid } from 'uuid';
import MessageList from '@/src/components/Messages/MessageList';
import { SearchBar } from '@/src/components/Searchbar/Searchbar';
import { Button } from '@/src/components/Button/Button';
import { getStoredSession } from '@/src/lib/auth-client';
import { PREFERENCES_STORAGE_KEY } from '@/src/lib/preferences-storage';

const CHAT_STORAGE_KEY = 'triply-assistant-chat';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
}

export interface SuggestedActivityPin {
    title: string;
    lat: number;
    lng: number;
    durationHours?: number;
}

interface AssistantResponse {
    reply: string;
    locations: Location[];
    suggestedActivities?: SuggestedActivityPin[];
}

export type Role = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
}

export interface AssistantPlanningContext {
    maxActivityHoursPerDay: number;
    selectedDay: number;
    travelDays: number;
    planningMode: string;
    currentDayActivityTitles: string[];
}

export type AssistantHandle = {
    suggestActivitiesForDay: () => void;
    suggestActivitiesForAllDays: () => Promise<void>;
};

interface AssistantProps {
    onUpdateLocations?: (locations: Location[]) => void;
    destination?: string;
    onClearChat?: () => void;
    planningContext?: AssistantPlanningContext | null;
    onSuggestedActivities?: (items: SuggestedActivityPin[]) => void;
    onSuggestedActivitiesForDay?: (day: number, items: SuggestedActivityPin[]) => void;
    onLoadingChange?: (loading: boolean) => void;
}

function loadStoredMessages(): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMessages(messages: ChatMessage[]) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
        // ignore
    }
}

const Assistant = forwardRef<AssistantHandle, AssistantProps>(function Assistant(
    {
        onUpdateLocations,
        destination,
        onClearChat,
        planningContext,
        onSuggestedActivities,
        onSuggestedActivitiesForDay,
        onLoadingChange,
    },
    ref
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingAssistantMessage, setPendingAssistantMessage] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const planningContextRef = useRef(planningContext);
    planningContextRef.current = planningContext;

    useEffect(() => {
        setMessages(loadStoredMessages());
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            saveMessages(messages);
        }
    }, [messages]);

    const clearChat = () => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(CHAT_STORAGE_KEY);
        }
        onClearChat?.();
    };

    useEffect(() => {
        scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, loading, pendingAssistantMessage]);

    const placeholderText = destination
        ? `Rechercher des activites a ${destination}...`
        : 'Ou souhaitez-vous aller ? (ex: Tokyo...)';

    const postUserMessage = useCallback(
        async (currentMessageText: string, targetDay?: number) => {
            if (!currentMessageText.trim() || loading) return;

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

            const userMessage: ChatMessage = {
                id: uuid(),
                role: 'user',
                content: currentMessageText.trim(),
            };

            const newHistory = [...messages, userMessage];
            setMessages(newHistory);
            setLoading(true);
            onLoadingChange?.(true);
            setPendingAssistantMessage("Triply réfléchit à la meilleure façon d'organiser votre voyage...");

            try {
                const apiMessages = newHistory.map(({ role, content }) => ({ role, content }));

                const prefs: string[] = (() => {
                    try {
                        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PREFERENCES_STORAGE_KEY) : null;
                        if (!raw) return [];
                        const parsed = JSON.parse(raw);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                })();

                const ctx = planningContextRef.current;
                const requestSelectedDay = targetDay ?? ctx?.selectedDay;

                const res = await fetch('/api/assistant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                    body: JSON.stringify({
                        messages: apiMessages,
                        destinationContext: destination,
                        userPreferences: prefs,
                        maxActivityHoursPerDay: ctx?.maxActivityHoursPerDay,
                        selectedDay: requestSelectedDay,
                        travelDays: ctx?.travelDays,
                        planningMode: ctx?.planningMode,
                        currentDayActivityTitles: ctx?.currentDayActivityTitles,
                    }),
                });

                const payload = await res.json().catch(() => null);

                if (!res.ok) {
                    const errorText =
                        payload?.error ||
                        payload?.message ||
                        'Désolé, une erreur est survenue. Réessaie dans un instant.';
                    throw new Error(errorText);
                }

                const data: AssistantResponse = payload;

                const assistantMessage: ChatMessage = {
                    id: uuid(),
                    role: 'assistant',
                    content: data.reply,
                };

                setMessages((prev) => [...prev, assistantMessage]);

                if (data.locations && data.locations.length > 0 && onUpdateLocations) {
                    onUpdateLocations(data.locations);
                }

                if (data.suggestedActivities && data.suggestedActivities.length > 0) {
                    if (targetDay != null && onSuggestedActivitiesForDay) {
                        onSuggestedActivitiesForDay(targetDay, data.suggestedActivities);
                    } else if (onSuggestedActivities) {
                        onSuggestedActivities(data.suggestedActivities);
                    }
                }
            } catch (error) {
                console.error('Erreur API', error);
                const errorMessage: ChatMessage = {
                    id: uuid(),
                    role: 'assistant',
                    content:
                        error instanceof Error
                            ? error.message
                            : 'Désolé, une erreur est survenue. Réessaie dans un instant.',
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setLoading(false);
                onLoadingChange?.(false);
                setPendingAssistantMessage(null);
            }
        },
        [destination, loading, messages, onLoadingChange, onSuggestedActivities, onSuggestedActivitiesForDay, onUpdateLocations]
    );

    useImperativeHandle(
        ref,
        () => ({
            suggestActivitiesForDay: () => {
                const dest = destination?.trim() || 'la destination';
                const ctx = planningContextRef.current;
                const day = ctx?.selectedDay ?? 1;
                const maxH = ctx && ctx.maxActivityHoursPerDay > 0 ? ctx.maxActivityHoursPerDay : 6;
                void postUserMessage(
                    `Propose-moi des activités concrètes pour le jour ${day} à ${dest}. Respecte environ ${maxH} h d'activités au total. Remplis suggestedActivities avec des coordonnées GPS réalistes.`,
                    day
                );
            },
            suggestActivitiesForAllDays: async () => {
                const dest = destination?.trim() || 'la destination';
                const ctx = planningContextRef.current;
                const maxH = ctx && ctx.maxActivityHoursPerDay > 0 ? ctx.maxActivityHoursPerDay : 6;
                const travelDays = Math.max(1, ctx?.travelDays ?? 1);
                const dayIndexes = Array.from({ length: travelDays }, (_, i) => i + 1);

                await dayIndexes.reduce(
                    (chain, day) =>
                        chain.then(() =>
                            postUserMessage(
                                `Propose-moi des activités concrètes pour le jour ${day} à ${dest}. Respecte environ ${maxH} h d'activités au total. Remplis suggestedActivities avec des coordonnées GPS réalistes.`,
                                day
                            )
                        ),
                    Promise.resolve()
                );
            },
        }),
        [destination, postUserMessage]
    );

    const sendMessage = async () => {
        if ((!message.trim() && !destination) || loading) return;
        const currentMessageText = message.trim() || `Montre-moi les hotels et activites a ${destination}`;
        setMessage('');
        await postUserMessage(currentMessageText);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <div
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                aria-label="Historique de la conversation avec Triply Assistant"
            >
                <MessageList messages={messages} loading={loading} />
                {pendingAssistantMessage && (
                    <div className="mt-1">
                        <MessageList
                            messages={[
                                {
                                    id: 'pending-assistant',
                                    role: 'assistant',
                                    content: pendingAssistantMessage,
                                },
                            ]}
                            loading={false}
                        />
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 border-t border-white/10 px-4 pb-4 pt-2 flex flex-col gap-2" style={{ backgroundColor: 'var(--background, #222222)' }}>
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={clearChat}
                        className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        title="Effacer l'historique de la conversation"
                    >
                        Nettoyer le chat
                    </button>
                </div>
                <div className="flex gap-2 items-end">
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
                        className="h-11 px-4"
                    />
                </div>
            </div>
        </div>
    );
});

export default Assistant;
