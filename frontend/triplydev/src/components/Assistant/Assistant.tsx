'use client';

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, forwardRef } from 'react';
import { v4 as uuid } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Send, Sparkles, StopCircle, Trash2 } from 'lucide-react';
import MessageList from '@/src/components/Messages/MessageList';
import { getStoredSession } from '@/src/lib/auth-client';
import { apiV1 } from '@/src/lib/api-base';
import type { AssistantStep1FormPatch } from '@/src/features/trip-creation/step1-form-patch';

const LEGACY_CHAT_STORAGE_KEY = 'triply-assistant-chat';

function chatStorageKeyForUser(userId: string | number | null | undefined): string | null {
    if (userId == null || userId === '') return null;
    return `${LEGACY_CHAT_STORAGE_KEY}:user:${String(userId)}`;
}

export type AssistantChatMode = 'itinerary' | 'qa';
interface Coordinates { latitude: number; longitude: number; }
interface Location { id: string; title: string; coordinates: Coordinates; }
export interface SuggestedActivityPin {
    title: string;
    lat: number;
    lng: number;
    durationHours?: number;
    /** Jour 1..n (séjour) — renseigné quand le backend renvoie un programme multi-jours. */
    day?: number;
}
interface AssistantResponse { reply: string; locations: Location[]; suggestedActivities?: SuggestedActivityPin[]; step1FormPatch?: AssistantStep1FormPatch | null; }
export type Role = 'user' | 'assistant';
export interface ChatMessage { id: string; role: Role; content: string; }
export interface AssistantPlanningContext {
    maxActivityHoursPerDay: number;
    selectedDay: number;
    travelDays: number;
    planningMode: string;
    currentDayActivityTitles: string[];
}
export type AssistantHandle = { suggestActivitiesForDay: () => void; suggestActivitiesForAllDays: () => Promise<void>; };

interface AssistantProps {
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

const Assistant = forwardRef<AssistantHandle, AssistantProps>(function Assistant(props, ref) {
    const {
        chatOwnerId,
        onUpdateLocations,
        destination,
        onClearChat,
        planningContext,
        onSuggestedActivities,
        onSuggestedActivitiesForDay,
        onLoadingChange,
        step1FormSnapshot,
        step1HotelOptionLabels = [],
        step1DietaryLabels = [],
        onApplyStep1Form,
    } = props;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingAssistantMessage, setPendingAssistantMessage] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<AssistantChatMode>('itinerary');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        const key = chatStorageKeyForUser(chatOwnerId);
        if (!key) return;
        const raw = window.localStorage.getItem(key);
        if (raw) setMessages(JSON.parse(raw));
    }, [chatOwnerId]);

    useEffect(() => {
        const key = chatStorageKeyForUser(chatOwnerId);
        if (!key || messages.length === 0) return;
        window.localStorage.setItem(key, JSON.stringify(messages));
    }, [messages, chatOwnerId]);

    useEffect(() => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }, [messages, loading, pendingAssistantMessage]);

    const postUserMessage = useCallback(async (
        text: string,
        opts?: { forceItinerary?: boolean; requestFullItinerary?: boolean },
        targetDay?: number,
    ) => {
        if (!text.trim() || loading) return;
        const session = getStoredSession();
        if (!session?.token) return;

        const userMsg: ChatMessage = { id: uuid(), role: 'user', content: text.trim() };
        const history = [...messages, userMsg];
        setMessages(history);
        setLoading(true);
        onLoadingChange?.(true);
        setPendingAssistantMessage(chatMode === 'qa' ? 'Triply clarifie votre question...' : 'Triply prepare une proposition...');

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await fetch(apiV1('/integrations/assistant'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: history.map(({ role, content }) => ({ role, content })),
                    destinationContext: destination,
                    chatMode: opts?.forceItinerary ? 'itinerary' : chatMode,
                    maxActivityHoursPerDay: planningContext?.maxActivityHoursPerDay,
                    selectedDay: targetDay ?? planningContext?.selectedDay,
                    travelDays: planningContext?.travelDays,
                    planningMode: planningContext?.planningMode,
                    currentDayActivityTitles: planningContext?.currentDayActivityTitles ?? [],
                    step1FormSnapshot,
                    step1HotelOptionLabels,
                    step1DietaryLabels,
                    requestFullItinerary: Boolean(opts?.requestFullItinerary),
                }),
            });

            const data: AssistantResponse = await res.json();
            setMessages((prev) => [...prev, { id: uuid(), role: 'assistant', content: data.reply }]);
            if (data.locations?.length) onUpdateLocations?.(data.locations);
            if (data.suggestedActivities?.length) {
                const items = data.suggestedActivities;
                const toPin = (raw: SuggestedActivityPin): SuggestedActivityPin => ({
                    title: raw.title,
                    lat: raw.lat,
                    lng: raw.lng,
                    ...(typeof raw.durationHours === 'number' ? { durationHours: raw.durationHours } : {}),
                });
                const hasDay = items.some((a) => typeof a.day === 'number');
                if (hasDay && onSuggestedActivitiesForDay) {
                    const map = new Map<number, SuggestedActivityPin[]>();
                    for (const raw of items) {
                        const d =
                            typeof raw.day === 'number'
                                ? raw.day
                                : targetDay ?? planningContext?.selectedDay ?? 1;
                        const list = map.get(d) ?? [];
                        list.push(toPin(raw));
                        map.set(d, list);
                    }
                    for (const [d, list] of map) onSuggestedActivitiesForDay(d, list);
                } else if (targetDay && onSuggestedActivitiesForDay) {
                    onSuggestedActivitiesForDay(targetDay, items.map(toPin));
                } else {
                    onSuggestedActivities?.(items.map(toPin));
                }
            }
            if (data.step1FormPatch && onApplyStep1Form) onApplyStep1Form(data.step1FormPatch);
        } catch (error) {
            const aborted = (error instanceof DOMException && error.name === 'AbortError') || (error instanceof Error && error.name === 'AbortError');
            if (!aborted) {
                setMessages((prev) => [...prev, { id: uuid(), role: 'assistant', content: 'Une erreur technique a interrompu la reponse. Reessayez dans un instant.' }]);
            }
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
            setPendingAssistantMessage(null);
        }
    }, [
        chatMode,
        destination,
        loading,
        messages,
        onApplyStep1Form,
        onLoadingChange,
        onSuggestedActivities,
        onSuggestedActivitiesForDay,
        onUpdateLocations,
        planningContext,
        step1DietaryLabels,
        step1FormSnapshot,
        step1HotelOptionLabels,
    ]);

    useImperativeHandle(ref, () => ({
        suggestActivitiesForDay: () => {
            const day = planningContext?.selectedDay ?? 1;
            void postUserMessage(`Propose-moi des activites pour le jour ${day} a ${destination || 'ma destination'}.`, { forceItinerary: true }, day);
        },
        suggestActivitiesForAllDays: async () => {
            const td = planningContext?.travelDays ?? 1;
            const h = planningContext?.maxActivityHoursPerDay ?? 8;
            const dest = destination || 'la destination';
            await postUserMessage(
                `Propose un programme d'activités pour les ${td} jour(s) complets du séjour à ${dest}, environ ${h} heures d'activités par jour, avec des idées variées (matin / après-midi). Couvre chaque jour numéroté de 1 à ${td}.`,
                { forceItinerary: true, requestFullItinerary: true },
            );
        },
    }), [destination, planningContext, postUserMessage]);

    const quickPrompts = chatMode === 'itinerary'
        ? [
            'Verifier le budget',
            'Que manque-t-il ?',
            `Des idees pour le jour ${planningContext?.selectedDay ?? 1}`,
        ]
        : [
            'Prochaine etape',
            'Information manquante',
            'Rester dans le budget',
        ];

    return (
        <div className="flex h-full flex-col bg-[#07131f] text-slate-100">
            <div className="border-b border-white/8 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
                        {chatMode === 'itinerary' ? <Sparkles size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Aide Triply</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {chatMode === 'itinerary'
                                ? 'Affinez ce voyage.'
                                : 'Posez une question sur votre voyage.'}
                        </p>
                    </div>
                </div>

                <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
                    <button type="button" onClick={() => setChatMode('itinerary')} className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${chatMode === 'itinerary' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        Mon voyage
                    </button>
                    <button type="button" onClick={() => setChatMode('qa')} className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${chatMode === 'qa' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        Questions
                    </button>
                </div>
            </div>

            <div className="border-b border-white/8 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                        <button key={prompt} type="button" onClick={() => void postUserMessage(prompt)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10">
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-400">
                        {chatMode === 'itinerary'
                            ? 'Decrivez votre objectif ou votre budget.'
                            : 'Posez une question simple.'}
                    </div>
                ) : null}
                <div className="mt-4">
                    <MessageList messages={messages} loading={loading} />
                </div>
                <AnimatePresence>
                    {pendingAssistantMessage ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs italic text-slate-400">
                            {pendingAssistantMessage}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <div className="border-t border-white/8 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            setMessages([]);
                            window.localStorage.removeItem(chatStorageKeyForUser(chatOwnerId) || '');
                            onClearChat?.();
                        }}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-red-300"
                    >
                        <Trash2 size={14} />
                        Effacer
                    </button>
                    {loading ? (
                        <button type="button" onClick={() => abortControllerRef.current?.abort()} className="inline-flex items-center gap-2 text-xs font-semibold text-red-300">
                            <StopCircle size={14} />
                            Arreter
                        </button>
                    ) : null}
                </div>

                <div className="flex items-end gap-3">
                    <div className="input-assistant flex-1">
                        <input
                            type="text"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void postUserMessage(message);
                                    setMessage('');
                                }
                            }}
                            placeholder={chatMode === 'qa' ? 'Votre question...' : 'Ce que vous voulez ajuster...'}
                            className="w-full"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void postUserMessage(message);
                            setMessage('');
                        }}
                        disabled={loading || !message.trim()}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default Assistant;
