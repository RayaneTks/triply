'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuid } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Trash2, RotateCcw, StopCircle, MessageSquare, Map as MapIcon } from 'lucide-react';
import MessageList from '@/src/components/Messages/MessageList';
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

interface Coordinates { latitude: number; longitude: number; }
interface Location { id: string; title: string; coordinates: Coordinates; }

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
export interface ChatMessage { id: string; role: Role; content: string; }

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
        chatOwnerId, onUpdateLocations, destination, onClearChat, planningContext,
        onSuggestedActivities, onSuggestedActivitiesForDay, onLoadingChange,
        step1FormSnapshot, step1HotelOptionLabels, step1DietaryLabels, onApplyStep1Form
    } = props;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingAssistantMessage, setPendingAssistantMessage] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<AssistantChatMode>('itinerary');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const key = chatStorageKeyForUser(chatOwnerId);
            if (key) {
                const raw = window.localStorage.getItem(key);
                if (raw) setMessages(JSON.parse(raw));
            }
        }
    }, [chatOwnerId]);

    useEffect(() => {
        const key = chatStorageKeyForUser(chatOwnerId);
        if (key && messages.length > 0) {
            window.localStorage.setItem(key, JSON.stringify(messages));
        }
    }, [messages, chatOwnerId]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages, loading, pendingAssistantMessage]);

    const postUserMessage = useCallback(async (text: string, opts?: { forceItinerary?: boolean }, targetDay?: number) => {
        if (!text.trim() || loading) return;
        const session = getStoredSession();
        if (!session?.token) return;

        const userMsg: ChatMessage = { id: uuid(), role: 'user', content: text.trim() };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setLoading(true);
        onLoadingChange?.(true);
        setPendingAssistantMessage("Analyse de votre demande...");

        const ac = new AbortController();
        abortControllerRef.current = ac;

        try {
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
                signal: ac.signal,
                body: JSON.stringify({
                    messages: newHistory.map(({ role, content }) => ({ role, content })),
                    destinationContext: destination,
                    chatMode: opts?.forceItinerary ? 'itinerary' : chatMode,
                    maxActivityHoursPerDay: planningContext?.maxActivityHoursPerDay,
                    selectedDay: targetDay ?? planningContext?.selectedDay,
                    travelDays: planningContext?.travelDays,
                    planningMode: planningContext?.planningMode,
                    step1FormSnapshot
                }),
            });

            const data: AssistantResponse = await res.json();
            setMessages(prev => [...prev, { id: uuid(), role: 'assistant', content: data.reply }]);

            if (data.locations?.length && onUpdateLocations) onUpdateLocations(data.locations);
            if (data.suggestedActivities?.length) {
                if (targetDay && onSuggestedActivitiesForDay) onSuggestedActivitiesForDay(targetDay, data.suggestedActivities);
                else if (onSuggestedActivities) onSuggestedActivities(data.suggestedActivities);
            }
            if (data.step1FormPatch && onApplyStep1Form) onApplyStep1Form(data.step1FormPatch);

        } catch (e) {
            const isAbortError =
                (e instanceof DOMException && e.name === 'AbortError') ||
                (e instanceof Error && e.name === 'AbortError');
            if (!isAbortError) {
                setMessages(prev => [...prev, { id: uuid(), role: 'assistant', content: "Désolé, je rencontre une petite turbulence technique." }]);
            }
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
            setPendingAssistantMessage(null);
        }
    }, [messages, loading, chatMode, destination, planningContext, step1FormSnapshot, onLoadingChange, onUpdateLocations, onSuggestedActivities, onSuggestedActivitiesForDay, onApplyStep1Form]);

    useImperativeHandle(ref, () => ({
        suggestActivitiesForDay: () => {
            const day = planningContext?.selectedDay ?? 1;
            postUserMessage(`Propose-moi des activités pour le jour ${day} à ${destination || 'ma destination'}.`, { forceItinerary: true }, day);
        },
        suggestActivitiesForAllDays: async () => {
            const days = Array.from({ length: planningContext?.travelDays ?? 1 }, (_, i) => i + 1);
            for (const d of days) {
                await postUserMessage(`Activités Jour ${d}`, { forceItinerary: true }, d);
            }
        }
    }), [destination, planningContext, postUserMessage]);

    return (
        <div className="flex h-full flex-col bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Sparkles size={18} />
                    </div>
                    <span className="text-sm font-bold text-white">Assistant Triply</span>
                </div>
                <div className="flex gap-1 rounded-lg bg-white/5 p-1">
                    <button 
                        onClick={() => setChatMode('itinerary')}
                        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-all ${chatMode === 'itinerary' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Plan
                    </button>
                    <button 
                        onClick={() => setChatMode('qa')}
                        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-all ${chatMode === 'qa' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Aide
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                <MessageList messages={messages} loading={loading} />
                <AnimatePresence>
                    {pendingAssistantMessage && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 animate-pulse">
                                <Sparkles size={14} />
                            </div>
                            <div className="rounded-2xl bg-white/5 p-3 text-xs text-slate-400 italic">
                                {pendingAssistantMessage}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/5 p-4 bg-[#020617]/50 backdrop-blur-md">
                <div className="mb-3 flex justify-between">
                    <button 
                        onClick={() => { setMessages([]); window.localStorage.removeItem(chatStorageKeyForUser(chatOwnerId) || ''); onClearChat?.(); }}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={12} /> Effacer
                    </button>
                    {loading && (
                        <button onClick={() => abortControllerRef.current?.abort()} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                            <StopCircle size={12} /> Arrêter
                        </button>
                    )}
                </div>
                <div className="relative flex items-center">
                    <input
                        type="text" value={message} onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && postUserMessage(message)}
                        placeholder={chatMode === 'qa' ? "Posez une question..." : "Une destination, une envie ?"}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                    <button 
                        onClick={() => { postUserMessage(message); setMessage(''); }}
                        disabled={loading || !message.trim()}
                        className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg hover:bg-cyan-400 disabled:opacity-30 transition-all active:scale-90"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default Assistant;
