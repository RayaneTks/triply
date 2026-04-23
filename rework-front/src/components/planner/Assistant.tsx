import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function Assistant({ isMobile = false }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis votre copilote Triply. Où souhaitez-vous décoller aujourd'hui ?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // TODO: wire real API / LLM
    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "C'est noté. Je prépare les suggestions pour cette destination en tenant compte de votre style habituel." 
      }]);
    }, 1000);
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", isMobile ? "pt-0" : "border-l border-light-border")}>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              msg.role === "user" ? "bg-light-bg text-light-muted" : "bg-brand text-white"
            )}>
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === "user" 
                ? "bg-light-bg text-light-foreground rounded-tr-none" 
                : "bg-white border border-light-border text-light-foreground rounded-tl-none shadow-sm"
            )}>
              <ReactMarkdown className="prose prose-sm prose-slate">
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-light-border bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Posez votre question..."
            className="w-full bg-light-bg border border-light-border rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-sm"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 p-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-sm shadow-brand/20"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 px-1">
           <Sparkles size={12} className="text-brand" />
           <span className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Optimisé par Triply Intelligence</span>
        </div>
      </div>
    </div>
  );
}
