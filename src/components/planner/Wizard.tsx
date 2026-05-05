import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Compass,
  Plane,
  Hotel,
  Check,
  Map,
  MapPin,
  Bot,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Assistant } from "./Assistant";
import { CopilotMobileSheet } from "../layout/CopilotMobileSheet";
import { CityAutocomplete } from "../CityAutocomplete/CityAutocomplete";
import { DataRangePicker } from "../DataRangePicker/DataRangePicker";
import { TravelerCounter } from "../TravelerCounter/TravelerCounter";
import type { PlanningNeeds } from "../../types/planning-needs";
import { appendTripFromWizard } from "../../lib/local-trips-store";
import { formatTripDateRange } from "../../lib/format-trip-dates";
import type { AssistantPlannerContext, Step1FormPatch } from "../../lib/integrations/assistant";

function travelDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const a = new Date(startDate);
  const b = new Date(endDate);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function stylesToPreferences(ids: string[]): string[] {
  const map: Record<string, string> = {
    relax: "detente",
    active: "aventure",
    luxury: "luxe",
    adventure: "aventure",
  };
  return ids.map((id) => map[id] ?? id);
}

type WizardStep = 'destination' | 'dates' | 'travelers' | 'budget' | 'styles' | 'needs' | 'review';

interface WizardFormState {
  destination: string;
  travelers: number;
  budget: number;
  selectedStyles: string[];
  needs: PlanningNeeds;
  startDate: string;
  endDate: string;
  datesFlexible: boolean;
}

interface WizardFormActions {
  setDestination: (v: string) => void;
  setTravelers: (v: number) => void;
  setBudget: (v: number) => void;
  setDateRange: (next: { startDate: string; endDate: string }) => void;
  setDatesFlexible: (v: boolean) => void;
  toggleStyle: (style: string) => void;
  toggleNeed: (need: keyof PlanningNeeds) => void;
}

export function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('destination');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(2500);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [needs, setNeeds] = useState<PlanningNeeds>({
    flights: true,
    hotels: true,
    activities: false,
    restaurants: false,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);

  const stepsOrder: WizardStep[] = ['destination', 'dates', 'travelers', 'budget', 'styles', 'needs', 'review'];
  const currentIndex = stepsOrder.indexOf(step);

  const next = () => {
    if (currentIndex === stepsOrder.length - 1) {
      appendTripFromWizard({
        destination: destination.trim() || "Destination à préciser",
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        datesFlexible,
        budget,
        travelers,
        styles: [...selectedStyles],
        needs: { ...needs },
        status: "planned",
      });
      navigate("/itineraire");
    } else {
      setStep(stepsOrder[currentIndex + 1]);
    }
  };
  const prev = () => setStep(stepsOrder[currentIndex - 1]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const setDateRange = (next: { startDate: string; endDate: string }) => {
    setStartDate(next.startDate);
    setEndDate(next.endDate);
  };

  const toggleNeed = (need: keyof PlanningNeeds) => {
    setNeeds((prev) => ({ ...prev, [need]: !prev[need] }));
  };

  const travelDays = useMemo(() => travelDaysBetween(startDate, endDate), [startDate, endDate]);
  const userPreferences = useMemo(() => stylesToPreferences(selectedStyles), [selectedStyles]);

  const plannerContext: AssistantPlannerContext = useMemo(
    () => ({
      destinationContext: destination.trim(),
      selectedDay: 1,
      travelDays,
      maxActivityHoursPerDay: 8,
      planningMode: "semi_ai",
      currentDayActivityTitles: [],
      step1FormSnapshot: {
        arrivalCityName: destination.trim() || undefined,
        travelerCount: travelers,
        budget: String(budget),
        outboundDate: startDate || undefined,
        returnDate: endDate || undefined,
        travelDays,
      },
      step1HotelOptionLabels: [],
      step1DietaryLabels: [],
      userPreferences,
      chatMode: "itinerary",
      /** Dès que le séjour > 1 jour, le backend renforce le programme sur toutes les journées (prompt). */
      requestFullItinerary: travelDays > 1,
    }),
    [destination, travelers, budget, startDate, endDate, travelDays, userPreferences],
  );

  const applyStep1Patch = useCallback((patch: Step1FormPatch) => {
    if (patch.arrivalCityName) setDestination(patch.arrivalCityName);
    if (typeof patch.travelerCount === "number" && patch.travelerCount >= 1) setTravelers(patch.travelerCount);
    if (patch.budget) {
      const digits = parseInt(patch.budget.replace(/[^\d]/g, ""), 10);
      if (!Number.isNaN(digits) && digits > 0) setBudget(digits);
    }
    if (patch.outboundDate) setStartDate(patch.outboundDate);
    if (patch.returnDate) setEndDate(patch.returnDate);
  }, []);

  const formState: WizardFormState = {
    destination,
    travelers,
    budget,
    selectedStyles,
    needs,
    startDate,
    endDate,
    datesFlexible,
  };

  const formActions: WizardFormActions = {
    setDestination,
    setTravelers,
    setBudget,
    setDateRange,
    setDatesFlexible,
    toggleStyle,
    toggleNeed,
  };

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
              <StepRenderer step={step} state={formState} actions={formActions} />
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Sticky Actions Bar */}
        <div className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 lg:left-auto lg:w-[calc(100%-350px)] lg:right-[350px] bg-white lg:bg-white/80 lg:backdrop-blur-md border-t border-light-border p-6 lg:p-8 flex items-center justify-between z-40">
           <button 
            onClick={prev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 font-bold text-light-muted hover:text-light-foreground disabled:opacity-0 transition-all px-4"
           >
             <ChevronLeft size={20} />
             Précédent
           </button>
           
           <button 
            onClick={next}
            className="btn-primary flex items-center gap-2"
           >
             {currentIndex === stepsOrder.length - 1 ? "Valider l'itinéraire" : currentIndex === stepsOrder.length - 2 ? "Voir le récap" : "Continuer"}
             <ChevronRight size={18} />
           </button>
        </div>
      </div>

      {/* Side Assistant Desktop */}
      <aside className="hidden lg:block w-[350px] bg-white border-l border-light-border">
         <Assistant plannerContext={plannerContext} onApplyStep1Patch={applyStep1Patch} />
      </aside>

      {/* Mobile Copilot Sheet */}
      <CopilotMobileSheet isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)}>
         <Assistant isMobile plannerContext={plannerContext} onApplyStep1Patch={applyStep1Patch} />
      </CopilotMobileSheet>
    </div>
  );
}

function StepRenderer({
  step,
  state,
  actions,
}: {
  step: WizardStep;
  state: WizardFormState;
  actions: WizardFormActions;
}) {
  switch (step) {
    case 'destination':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Où avez-vous envie d'aller ?</h1>
          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Destination</label>
             <CityAutocomplete value={state.destination} onChange={actions.setDestination} />
             <div className="flex flex-wrap gap-2 mt-4">
                {["Rome", "Lisbonne", "Tokyo", "Berlin"].map(city => (
                  <button 
                    key={city} 
                    onClick={() => actions.setDestination(city)}
                    className={cn(
                      "px-4 py-2 bg-white border rounded-full text-xs font-bold transition-all",
                      state.destination === city ? "border-brand text-brand opacity-100" : "border-light-border text-light-muted opacity-60 hover:opacity-100"
                    )}
                  >
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
          <DataRangePicker
            startDate={state.startDate}
            endDate={state.endDate}
            onChange={actions.setDateRange}
            flexible={state.datesFlexible}
            onFlexibleChange={actions.setDatesFlexible}
          />
        </div>
      );
    case 'travelers':
      return (
        <div className="space-y-8 text-center flex flex-col items-center">
          <h1 className="text-4xl font-display font-bold">Combien de voyageurs ?</h1>
          <div className="py-12">
            <TravelerCounter value={state.travelers} onChange={actions.setTravelers} />
          </div>
          <p className="text-light-muted font-bold uppercase text-[10px] tracking-widest max-w-xs leading-relaxed">
            Configurez le groupe pour que le copilote ajuste le rythme et les types de logements recommandés.
          </p>
        </div>
      );
    case 'budget':
        return (
          <div className="space-y-8">
            <h1 className="text-4xl font-display font-bold">Quel est votre budget ?</h1>
            <div className="space-y-6">
              <input 
                type="range" 
                className="w-full accent-brand py-4" 
                min="500" 
                max="10000" 
                step="100" 
                value={state.budget}
                onChange={(e) => actions.setBudget(parseInt(e.target.value))}
              />
              <div className="flex justify-between items-end border-b border-light-border pb-4">
                 <span className="text-light-muted font-bold">Enveloppe globale</span>
                 <span className="text-4xl font-display font-bold text-brand">{state.budget.toLocaleString()}€</span>
              </div>
            </div>
            <div className="p-6 bg-brand/5 rounded-2xl border border-brand/10 flex gap-4">
               <Bot size={24} className="text-brand shrink-0" />
               <p className="text-xs text-brand leading-relaxed font-bold">
                 Selon nos données, ce budget est suffisant pour {state.budget > 3000 ? "un séjour grand confort" : "une expérience équilibrée"} en Europe.
               </p>
            </div>
          </div>
        );
    case 'styles':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Quel rythme de voyage ?</h1>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 'relax', label: 'Détente & Slow', desc: 'Prendre le temps, un café en terrasse.', icon: Clock },
              { id: 'active', label: 'Actif & Découverte', desc: 'Beaucoup de visites et de marche.', icon: Compass },
              { id: 'luxury', label: 'Premium & Confort', desc: 'Hôtels étoilés et bonnes tables.', icon: Star },
              { id: 'adventure', label: 'Aventure & Nature', desc: 'Hors des sentiers battus.', icon: Map },
            ].map(style => (
              <button 
                key={style.id}
                onClick={() => actions.toggleStyle(style.id)}
                className={cn(
                  "p-6 text-left triply-card border-2 transition-all",
                  state.selectedStyles.includes(style.id) ? "border-brand bg-brand/5" : "border-transparent"
                )}
              >
                <style.icon className={cn("mb-4", state.selectedStyles.includes(style.id) ? "text-brand" : "text-light-muted")} size={24} />
                <h3 className="font-bold mb-1">{style.label}</h3>
                <p className="text-xs text-light-muted">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>
      );
    case 'needs':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">De quoi avez-vous besoin ?</h1>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'flights', label: 'Vols', icon: Plane },
              { id: 'hotels', label: 'Hôtels', icon: Hotel },
              { id: 'activities', label: 'Activités', icon: Check },
              { id: 'restaurants', label: 'Restaurants', icon: Users },
            ].map((need) => (
              <label
                key={need.id}
                className={cn(
                  "flex flex-col items-center gap-4 p-8 triply-card cursor-pointer transition-all border-2",
                  state.needs[need.id as keyof PlanningNeeds]
                    ? "border-brand bg-brand/5"
                    : "border-transparent"
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={state.needs[need.id as keyof PlanningNeeds]}
                  onChange={() => actions.toggleNeed(need.id as keyof PlanningNeeds)}
                />
                <need.icon
                  size={32}
                  className={
                    state.needs[need.id as keyof PlanningNeeds] ? "text-brand" : "text-light-muted"
                  }
                />
                <span
                  className={cn(
                    "font-bold text-sm",
                    state.needs[need.id as keyof PlanningNeeds] ? "text-brand" : "text-light-muted"
                  )}
                >
                  {need.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      );
    case 'review':
      return (
        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl font-display font-bold">Prêt pour le décollage ?</h1>
            <p className="text-light-muted font-bold text-lg leading-relaxed">Récapitulez votre projet avant de finaliser l&apos;itinéraire.</p>
          </header>

          <div className="triply-card p-8 lg:p-12 space-y-10">
             <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Destination</p>
                   <p className="text-2xl font-bold flex items-center gap-2">
                     {state.destination || "Non précisé"}{" "}
                     <MapPin size={20} className="text-brand shrink-0" aria-hidden />
                   </p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Enveloppe</p>
                   <p className="text-2xl font-bold text-brand">{state.budget.toLocaleString()}€</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                   <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Dates</p>
                   <p className="text-xl font-bold">
                     {formatTripDateRange(
                       state.startDate || undefined,
                       state.endDate || undefined
                     )}
                     {state.datesFlexible ? (
                       <span className="ml-2 text-xs font-bold text-brand">• flexibles</span>
                     ) : null}
                   </p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Voyageurs</p>
                   <p className="text-2xl font-bold">{state.travelers} personnes</p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Besoins</p>
                   <div className="flex flex-wrap gap-2">
                      {Object.entries(state.needs)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <div key={k} className="p-2 bg-light-bg rounded-lg" title={k}>
                            {k === "flights" && <Plane size={14} />}
                            {k === "hotels" && <Hotel size={14} />}
                            {k === "activities" && <Check size={14} />}
                            {k === "restaurants" && <Users size={14} />}
                          </div>
                        ))}
                   </div>
                </div>
                {state.selectedStyles.length > 0 ? (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest">Rythme</p>
                    <p className="text-sm font-bold text-light-foreground">
                      {state.selectedStyles.join(" · ")}
                    </p>
                  </div>
                ) : null}
             </div>

             <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 flex gap-6 items-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                   <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                   <h3 className="font-bold text-emerald-900">Tout est en ordre !</h3>
                   <p className="text-xs text-emerald-700 leading-relaxed font-bold">Triply mettra en cohérence vos envies, vos dates et votre budget pour proposer un parcours équilibré.</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 px-2">
             <Sparkles size={16} className="text-brand" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-light-muted leading-relaxed">
               L'itinéraire sera sauvegardé automatiquement dans vos voyages.
             </span>
          </div>
        </div>
      );
    default:
      return null;
  }
}
