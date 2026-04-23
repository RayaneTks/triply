import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Calendar, Users, Wallet, Compass, Plane, Hotel, Check, Map, Bot } from "lucide-react";
import { cn } from "../../lib/utils";
import { Assistant } from "./Assistant";
import { CopilotMobileSheet } from "../layout/CopilotMobileSheet";

type WizardStep = 'destination' | 'dates' | 'travelers' | 'budget' | 'styles' | 'needs' | 'review';

export function Wizard() {
  const [step, setStep] = useState<WizardStep>('destination');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  
  const stepsOrder: WizardStep[] = ['destination', 'dates', 'travelers', 'budget', 'styles', 'needs', 'review'];
  const currentIndex = stepsOrder.indexOf(step);

  const next = () => setStep(stepsOrder[currentIndex + 1]);
  const prev = () => setStep(stepsOrder[currentIndex - 1]);

  return (
    <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] bg-light-bg overflow-hidden relative">
      {/* Container Principal Wizard */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:p-8 scroll-smooth">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-32 px-6 lg:px-0">
          
          {/* Header Mobile / Tablet */}
          <div className="lg:hidden py-4 flex items-center justify-between sticky top-0 bg-light-bg z-10 border-b border-light-border mb-4">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Étape {currentIndex + 1} / {stepsOrder.length}</span>
             </div>
             <button 
                onClick={() => setIsCopilotOpen(true)}
                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
              >
                <Bot size={14} /> Aide
              </button>
          </div>

          {/* Stepper Desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-10">
            {stepsOrder.map((s, i) => (
              <React.Fragment key={s}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  i <= currentIndex ? "bg-brand" : "bg-light-border"
                )} />
                {i < stepsOrder.length - 1 && <div className="flex-1 h-px bg-light-border" />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <StepRenderer step={step} />
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Sticky Actions Bar */}
        <div className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 lg:left-auto lg:w-[calc(100%-350px)] lg:right-[350px] bg-white lg:bg-white/80 lg:backdrop-blur-md border-t border-light-border p-6 lg:p-8 flex items-center justify-between z-40">
           <button 
            onClick={prev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 font-bold text-light-muted hover:text-light-foreground disabled:opacity-0 transition-all"
           >
             <ChevronLeft size={20} />
             Précédent
           </button>
           
           <button 
            onClick={next}
            disabled={currentIndex === stepsOrder.length - 1}
            className="btn-primary flex items-center gap-2"
           >
             {currentIndex === stepsOrder.length - 2 ? "Voir le récap" : "Continuer"}
             <ChevronRight size={18} />
           </button>
        </div>
      </div>

      {/* Side Assistant Desktop */}
      <aside className="hidden lg:block w-[350px] bg-white border-l border-light-border">
         <Assistant />
      </aside>

      {/* Mobile Copilot Sheet */}
      <CopilotMobileSheet isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)}>
         <Assistant isMobile />
      </CopilotMobileSheet>
    </div>
  );
}

function StepRenderer({ step }: { step: WizardStep }) {
  switch (step) {
    case 'destination':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Où avez-vous envie d'aller ?</h1>
          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Destination</label>
             <input 
                type="text" 
                placeholder="Ex: Rome, Italie"
                className="w-full bg-white border border-light-border p-5 rounded-2xl text-xl font-bold shadow-sm focus:ring-2 focus:ring-brand outline-none"
             />
             <div className="flex flex-wrap gap-2 mt-4">
                {["Londres", "Lisbonne", "Tokyo", "Berlin"].map(city => (
                  <button key={city} className="px-4 py-2 bg-white border border-light-border rounded-full text-xs font-bold text-light-muted hover:border-brand hover:text-brand transition-colors">
                    {city}
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    case 'dates':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">À quelles dates ?</h1>
          <div className="p-8 triply-card flex flex-col items-center gap-6">
            <Calendar size={48} className="text-brand opacity-20" />
            <p className="text-light-muted font-bold">TODO: Intégrer DateRangePicker</p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border border-light-border rounded-xl">
             <input type="checkbox" className="w-5 h-5 accent-brand" />
             <span className="text-sm font-bold">Dates flexibles (+/- 3 jours)</span>
          </div>
        </div>
      );
    case 'travelers':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Combien de voyageurs ?</h1>
          <div className="flex items-center justify-center gap-8 py-12">
             <button className="w-14 h-14 bg-light-bg rounded-2xl flex items-center justify-center font-bold text-2xl">-</button>
             <span className="text-6xl font-display font-bold">2</span>
             <button className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-brand/20">+</button>
          </div>
          <p className="text-center text-light-muted font-bold uppercase text-[10px] tracking-widest">Adultes & Enfants</p>
        </div>
      );
    case 'budget':
        return (
          <div className="space-y-8">
            <h1 className="text-4xl font-display font-bold">Quel est votre budget ?</h1>
            <div className="space-y-6">
              <input type="range" className="w-full accent-brand py-4" min="500" max="10000" step="100" />
              <div className="flex justify-between items-end border-b border-light-border pb-4">
                 <span className="text-light-muted font-bold">Total estimé</span>
                 <span className="text-4xl font-display font-bold text-brand">2 500€</span>
              </div>
            </div>
            <div className="p-6 bg-brand/5 rounded-2xl border border-brand/10 flex gap-4">
               <Bot size={24} className="text-brand shrink-0" />
               <p className="text-xs text-brand leading-relaxed font-bold">
                 Selon nos données, ce budget est idéal pour 1 semaine en Europe.
               </p>
            </div>
          </div>
        );
    default:
      return (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Étape en cours de développement</h2>
          <p className="text-light-muted">Cette section sera disponible dans la version finale.</p>
        </div>
      );
  }
}
