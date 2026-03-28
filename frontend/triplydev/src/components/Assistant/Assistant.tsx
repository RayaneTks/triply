'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuid } from 'uuid';
import MessageList from '@/src/components/Messages/MessageList';
import { SearchBar } from '@/src/components/Searchbar/Searchbar';
import { Button } from '@/src/components/Button/Button';
import { getStoredSession, type UserPreferences } from '@/src/lib/auth-client';
import { PREFERENCES_STORAGE_KEY } from '@/src/lib/preferences-storage';
import {
    type AssistantStep1FormPatch,
    buildStep1ActivityConstraintsPromptFragment,
} from '@/src/features/trip-creation/step1-form-patch';

const LEGACY_CHAT_STORAGE_KEY = 'triply-assistant-chat';

function chatStorageKeyForUser(userId: string | number | null | undefined): string | null {
    if (userId == null || userId === '') return null;
    return `${LEGACY_CHAT_STORAGE_KEY}:user:${String(userId)}`;
}

export type AssistantChatMode = 'itinerary' | 'qa';

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
    step1FormPatch?: AssistantStep1FormPatch | null;
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
    /** Identifiant du compte connecté : historique du chat isolé par utilisateur (localStorage). */
    chatOwnerId: string | number | null;
    onUpdateLocations?: (locations: Location[]) => void;
    destination?: string;
    onClearChat?: () => void;
    planningContext?: AssistantPlanningContext | null;
    onSuggestedActivities?: (items: SuggestedActivityPin[]) => void;
    onSuggestedActivitiesForDay?: (day: number, items: SuggestedActivityPin[]) => void;
    onLoadingChange?: (loading: boolean) => void;
    step1FormSnapshot?: Record<string, unknown> | null;
    step1HotelOptionLabels?: string[];
    step1DietaryLabels?: string[];
    onApplyStep1Form?: (patch: AssistantStep1FormPatch) => void;
}

function loadStoredMessages(userId: string | number | null | undefined): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    const key = chatStorageKeyForUser(userId);
    if (!key) return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        const legacyRaw = window.localStorage.getItem(LEGACY_CHAT_STORAGE_KEY);
        if (legacyRaw) {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
                window.localStorage.setItem(key, legacyRaw);
                window.localStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
                return legacyParsed;
            }
        }
    } catch {
        return [];
    }
    return [];
}

function saveMessages(messages: ChatMessage[], userId: string | number | null | undefined) {
    if (typeof window === 'undefined') return;
    const key = chatStorageKeyForUser(userId);
    if (!key) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(messages));
    } catch {
        // ignore
    }
}

function clearStoredMessagesForUser(userId: string | number | null | undefined) {
    if (typeof window === 'undefined') return;
    const key = chatStorageKeyForUser(userId);
    if (!key) return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

function toAssistantPreferences(preferences: UserPreferences | string[] | null | undefined): string[] {
    if (Array.isArray(preferences)) {
        return [...new Set(preferences.filter((value): value is string => typeof value === 'string' && value.trim() !== ''))];
    }
    if (!preferences || typeof preferences !== 'object') {
        return [];
    }

    const values = [
        ...(preferences.environments ?? []),
        ...(preferences.interests ?? []),
        ...(preferences.diet ?? []),
        ...(preferences.visited_cities ?? []),
        preferences.traveler_profile,
        preferences.pace,
        preferences.food_preference,
    ];

    return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim() !== ''))];
}

const Assistant = forwardRef<AssistantHandle, AssistantProps>(function Assistant(
    {
        chatOwnerId,
        onUpdateLocations,
        destination,
        onClearChat,
        planningContext,
        onSuggestedActivities,
        onSuggestedActivitiesForDay,
        onLoadingChange,
        step1FormSnapshot,
        step1HotelOptionLabels,
        step1DietaryLabels,
        onApplyStep1Form,
    },
    ref
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingAssistantMessage, setPendingAssistantMessage] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<AssistantChatMode>('itinerary');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const planningContextRef = useRef(planningContext);
    planningContextRef.current = planningContext;
    const abortControllerRef = useRef<AbortController | null>(null);

    const step1ApiRef = useRef({
        snapshot: {} as Record<string, unknown>,
        hotelLabels: [] as string[],
        dietaryLabels: [] as string[],
    });
    step1ApiRef.current = {
        snapshot: step1FormSnapshot ?? {},
        hotelLabels: step1HotelOptionLabels ?? [],
        dietaryLabels: step1DietaryLabels ?? [],
    };

    useLayoutEffect(() => {
        setMessages(loadStoredMessages(chatOwnerId));
    }, [chatOwnerId]);

    useEffect(() => {
        if (chatOwnerId == null || chatOwnerId === '') return;
        if (messages.length > 0) {
            saveMessages(messages, chatOwnerId);
        }
    }, [messages, chatOwnerId]);

    const clearChat = () => {
        setMessages([]);
        clearStoredMessagesForUser(chatOwnerId);
        onClearChat?.();
    };

    useEffect(() => {
        scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, loading, pendingAssistantMessage]);

    const placeholderText =
        chatMode === 'qa'
            ? 'Posez votre question voyage…'
            : destination
              ? `Rechercher des activites a ${destination}...`
              : 'Ou souhaitez-vous aller ? (ex: Tokyo...)';

    const stopRequest = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    const undoLastExchange = useCallback(() => {
        if (loading) {
            stopRequest();
            return;
        }
        setMessages((prev) => {
            if (prev.length < 2) return prev;
            const last = prev[prev.length - 1];
            const prev2 = prev[prev.length - 2];
            if (last.role === 'assistant' && prev2.role === 'user') return prev.slice(0, -2);
            if (last.role === 'user') return prev.slice(0, -1);
            return prev;
        });
    }, [loading, stopRequest]);

    const postUserMessage = useCallback(
        async (currentMessageText: string, opts?: { forceItinerary?: boolean }, targetDay?: number) => {
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

            const effectiveMode: AssistantChatMode = opts?.forceItinerary ? 'itinerary' : chatMode;

            const ac = new AbortController();
            abortControllerRef.current = ac;

            try {
                const apiMessages = newHistory.map(({ role, content }) => ({ role, content }));

                const prefs: string[] = (() => {
                    try {
                        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PREFERENCES_STORAGE_KEY) : null;
                        if (!raw) return [];
                        const parsed: unknown = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            return toAssistantPreferences(parsed);
                        }
                        return toAssistantPreferences(parsed as UserPreferences);
                    } catch {
                        return [];
                    }
                })();

                const ctx = planningContextRef.current;
                const s1 = step1ApiRef.current;
                const requestSelectedDay = targetDay ?? ctx?.selectedDay;

                const res = await fetch('/api/assistant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                    signal: ac.signal,
                    body: JSON.stringify({
                        messages: apiMessages,
                        destinationContext: destination,
                        userPreferences: prefs,
                        chatMode: effectiveMode,
                        maxActivityHoursPerDay: ctx?.maxActivityHoursPerDay,
                        selectedDay: requestSelectedDay,
                        travelDays: ctx?.travelDays,
                        planningMode: ctx?.planningMode,
                        currentDayActivityTitles: ctx?.currentDayActivityTitles,
                        step1FormSnapshot: s1.snapshot,
                        step1HotelOptionLabels: s1.hotelLabels,
                        step1DietaryLabels: s1.dietaryLabels,
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

                const applyItineraryEffects = effectiveMode === 'itinerary';

                if (applyItineraryEffects && data.locations && data.locations.length > 0 && onUpdateLocations) {
                    onUpdateLocations(data.locations);
                }

                if (applyItineraryEffects && data.suggestedActivities && data.suggestedActivities.length > 0) {
                    if (targetDay != null && onSuggestedActivitiesForDay) {
                        onSuggestedActivitiesForDay(targetDay, data.suggestedActivities);
                    } else if (onSuggestedActivities) {
                        onSuggestedActivities(data.suggestedActivities);
                    }
                }

                if (applyItineraryEffects && data.step1FormPatch && onApplyStep1Form) {
                    onApplyStep1Form(data.step1FormPatch);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    setMessages((prev) => (prev.length > 0 && prev[prev.length - 1]?.role === 'user' ? prev.slice(0, -1) : prev));
                    return;
                }
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
                abortControllerRef.current = null;
                setLoading(false);
                onLoadingChange?.(false);
                setPendingAssistantMessage(null);
            }
        },
        [
            chatMode,
            destination,
            loading,
            messages,
            onApplyStep1Form,
            onLoadingChange,
            onSuggestedActivities,
            onSuggestedActivitiesForDay, onUpdateLocations,
        ]
    );

    useImperativeHandle(
        ref,
        () => ({
            suggestActivitiesForDay: () => {
                const dest = destination?.trim() || 'la destination';
                const ctx = planningContextRef.current;
                const day = ctx?.selectedDay ?? 1;
                const maxH = ctx && ctx.maxActivityHoursPerDay > 0 ? ctx.maxActivityHoursPerDay : 6;
                const step1Line = buildStep1ActivityConstraintsPromptFragment(step1ApiRef.current.snapshot);
                const prefix = step1Line ? `${step1Line} ` : '';
                void postUserMessage(
                    `${prefix}Propose-moi des activités concrètes pour le jour ${day} à ${dest}. Respecte environ ${maxH} h d'activités au total. Remplis suggestedActivities avec des coordonnées GPS réalistes.`,
                    undefined,
                    day
                );
            },
            suggestActivitiesForAllDays: async () => {
                const dest = destination?.trim() || 'la destination';
                const ctx = planningContextRef.current;
                const maxH = ctx && ctx.maxActivityHoursPerDay > 0 ? ctx.maxActivityHoursPerDay : 6;
                const travelDays = Math.max(1, ctx?.travelDays ?? 1);
                const dayIndexes = Array.from({ length: travelDays }, (_, i) => i + 1);
                const step1Line = buildStep1ActivityConstraintsPromptFragment(step1ApiRef.current.snapshot);
                const prefix = step1Line ? `${step1Line} ` : '';

                await dayIndexes.reduce(
                    (chain, day) =>
                        chain.then(() =>
                            postUserMessage(
                                `${prefix}Propose-moi des activités concrètes pour le jour ${day} à ${dest}. Respecte environ ${maxH} h d'activités au total. Remplis suggestedActivities avec des coordonnées GPS réalistes.`,
                                undefined,
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
        const currentMessageText =
            message.trim() ||
            (chatMode === 'qa'
                ? 'Bonjour, j’ai une question sur mon voyage.'
                : `Montre-moi les hotels et activites a ${destination}`);
        setMessage('');
        await postUserMessage(currentMessageText);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    const canUndo = messages.length >= 2 || loading;

    return (
        <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <div className="shrink-0 space-y-2 border-b border-white/10 px-4 py-2">
                <div className="flex gap-1 rounded-lg bg-white/6 p-0.5">
                    <button
                        type="button"
                        onClick={() => setChatMode('itinerary')}
                        className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                            chatMode === 'itinerary' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Itinéraire
                    </button>
                    <button
                        type="button"
                        onClick={() => setChatMode('qa')}
                        className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                            chatMode === 'qa' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Q&amp;A
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {loading && (
                        <button
                            type="button"
                            onClick={stopRequest}
                            className="rounded-md border border-red-500/40 bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/25"
                        >
                            Arrêter
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={undoLastExchange}
                        disabled={!canUndo}
                        className="rounded-md border border-white/15 bg-white/4 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Annuler le dernier échange ou arrêter la génération"
                    >
                        Annuler le dernier échange
                    </button>
                </div>
                {chatMode === 'qa' && (
                    <p className="text-[10px] leading-snug text-slate-500">
                        Questions uniquement : pas de mise à jour de la carte ni du formulaire.
                    </p>
                )}
            </div>
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
            <div
                className="flex shrink-0 flex-col gap-2 border-t border-white/10 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
                style={{ backgroundColor: 'var(--background, #222222)' }}
            >
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
