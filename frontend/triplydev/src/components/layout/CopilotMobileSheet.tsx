import React from "react";
import { X, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CopilotMobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CopilotMobileSheet({ isOpen, onClose, children }: CopilotMobileSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[60] h-[85vh] lg:hidden flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-light-border">
              <div className="flex items-center gap-2">
                <Bot className="text-brand shrink-0" size={20} />
                <span className="font-display font-bold">Assistant Triply</span>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-light-bg rounded-full flex items-center justify-center text-light-muted"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
