'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Assistant } from './Assistant';
import type { AssistantProps } from './Assistant';

type AssistantBubbleProps = Omit<AssistantProps, 'isMobile'>;

export function AssistantBubble(props: AssistantBubbleProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      fabRef.current?.focus();
    }
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Assistant Triply"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[min(400px,calc(100vw-3rem))] h-[520px] rounded-2xl shadow-2xl border border-light-border overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--card, #fff)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-light-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                  <Bot size={14} className="text-white" aria-hidden />
                </div>
                <span className="text-sm font-semibold text-light-foreground">Copilote Triply</span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-light-bg transition-colors text-light-muted hover:text-light-foreground"
                aria-label="Fermer l'assistant"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Assistant {...props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-14 h-14 rounded-full bg-brand hover:bg-brand-hover text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant Triply"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
