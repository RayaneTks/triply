import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import ReactMarkdown from "react-markdown";
import { authClient } from "../../lib/auth-client";
import {
  sendChat,
  type AssistantMessage,
  type AssistantPlannerContext,
  type Step1FormPatch,
  type SuggestedActivity,
  type ActivityReplacement,
} from "../../lib/integrations/assistant";
import { ApiError, extractErrorMessage } from "../../lib/http";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export interface AssistantProps {
  isMobile?: boolean;
  plannerContext?: AssistantPlannerContext;
  onApplyStep1Patch?: (patch: Step1FormPatch) => void;
  onAddSuggestion?: (activity: SuggestedActivity) => void;
  onReplaceActivity?: (replacement: ActivityReplacement) => void;
}

export function Assistant({
  isMobile = false,
  plannerContext,
  onApplyStep1Patch,
  onAddSuggestion,
  onReplaceActivity,
}: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre copilote Triply. Où souhaitez-vous décoller aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSuggestions, setLastSuggestions] = useState<SuggestedActivity[]>([]);
  const [lastReplacement, setLastReplacement] = useState<ActivityReplacement | null>(null);
  const [hasSession, setHasSession] = useState(() => Boolean(authClient.getToken()));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setHasSession(Boolean(authClient.getToken()));
    window.addEventListener("storage", sync);
    window.addEventListener("triply-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("triply-auth-changed", sync);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, lastSuggestions]);

  const buildRequestMessages = (): AssistantMessage[] =>
    messages.map((m) => ({ role: m.role, content: m.content }));

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    if (!authClient.getToken()) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Pour utiliser l’assistant Triply, connectez-vous (menu **Connexion**) puis revenez sur le planificateur — le chat est réservé aux comptes Triply.",
        },
      ]);
      return;
    }
    const userText = input.trim();
    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLastSuggestions([]);
    setLastReplacement(null);
    setSending(true);

    const nextHistory: Message[] = [...messages, userMsg];
    const apiMessages: AssistantMessage[] = nextHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await sendChat({
        messages: apiMessages,
        destinationContext: plannerContext?.destinationContext ?? "",
        userPreferences: plannerContext?.userPreferences ?? [],
        chatMode: plannerContext?.chatMode ?? "itinerary",
        selectedDay: plannerContext?.selectedDay ?? 1,
        travelDays: plannerContext?.travelDays ?? 1,
        maxActivityHoursPerDay: plannerContext?.maxActivityHoursPerDay ?? 8,
        planningMode: plannerContext?.planningMode ?? "semi_ai",
        currentDayActivityTitles: plannerContext?.currentDayActivityTitles ?? [],
        requestFullItinerary: plannerContext?.requestFullItinerary ?? false,
        step1FormSnapshot: plannerContext?.step1FormSnapshot ?? {},
        step1HotelOptionLabels: plannerContext?.step1HotelOptionLabels ?? [],
        step1DietaryLabels: plannerContext?.step1DietaryLabels ?? [],
      });

      if (res.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.error }]);
        return;
      }

      const reply = res.reply?.trim() || "Je n'ai pas pu formuler de réponse.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (res.step1FormPatch && onApplyStep1Patch) {
        onApplyStep1Patch(res.step1FormPatch);
      }
      if (Array.isArray(res.suggestedActivities) && res.suggestedActivities.length > 0) {
        setLastSuggestions(res.suggestedActivities);
      }
      if (res.replacement && onReplaceActivity) {
        setLastReplacement(res.replacement);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? extractErrorMessage(err.body) ?? "Erreur réseau ou serveur."
          : "Erreur réseau ou serveur.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", isMobile ? "pt-0" : "border-l border-light-border")}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                msg.role === "user" ? "bg-light-bg text-light-muted" : "bg-brand text-white",
              )}
            >
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-light-bg text-light-foreground rounded-tr-none"
                  : "bg-white border border-light-border text-light-foreground rounded-tl-none shadow-sm",
              )}
            >
              <ReactMarkdown className="prose prose-sm prose-slate">{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {lastSuggestions.length > 0 && (
          <div className="pl-11 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {lastSuggestions.map((a, idx) => (
                <button
                  key={`${a.title}-${idx}`}
                  type="button"
                  disabled={!onAddSuggestion}
                  onClick={() => onAddSuggestion?.(a)}
                  className={cn(
                    "text-xs font-bold px-3 py-2 rounded-xl border transition-colors",
                    onAddSuggestion
                      ? "border-brand/30 bg-brand/5 text-brand hover:bg-brand/10"
                      : "border-light-border text-light-muted opacity-60",
                  )}
                >
                  {a.title}
                  {typeof a.day === "number" ? ` · J${a.day}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {lastReplacement && onReplaceActivity && (
          <div className="pl-11">
            <button
              type="button"
              onClick={() => onReplaceActivity(lastReplacement)}
              className="text-xs font-bold px-4 py-2 rounded-xl border border-brand bg-brand text-white hover:bg-brand-hover"
            >
              Remplacer l’activité : {lastReplacement.title}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-light-border bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void handleSend()}
            placeholder="Posez votre question..."
            disabled={sending}
            className="w-full bg-light-bg border border-light-border rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-sm disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="absolute right-2 p-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-sm shadow-brand/20 disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {!hasSession ? (
          <p className="mt-2 px-1 text-[10px] font-bold text-amber-800 uppercase tracking-widest">
            <Link to="/connexion" className="underline underline-offset-2 hover:text-brand">
              Connexion
            </Link>{" "}
            requise pour l’assistant Triply.
          </p>
        ) : (
          <p className="mt-2 px-1 text-[10px] font-bold text-light-muted uppercase tracking-widest">
            Conseils personnalisés selon votre formulaire de voyage.
          </p>
        )}
      </div>
    </div>
  );
}
