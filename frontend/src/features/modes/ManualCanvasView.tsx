'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  MapPin,
  Sparkles,
  ChevronRight,
  Wallet,
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  Bot,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "../../components/ui/PageHeader";
import { parseBrief, formatPeriod, formatBudget, type ParsedBrief } from "./briefParser";

const WIZARD_SEED_KEY = "triply_wizard_seed_v1";

/**
 * Sessionstorage payload picked up by the Wizard on mount when the user is
 * forwarded from the "Mode libre" synthesis page. Keep the shape narrow: only
 * what the wizard needs to pre-fill its first steps.
 */
export interface WizardSeed {
    destination?: string;
    travelDays?: number;
    monthIndex?: number;
    budget?: number;
    travelers?: number;
    tags?: string[];
    rawBrief?: string;
}

function persistSeed(seed: WizardSeed): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WIZARD_SEED_KEY, JSON.stringify(seed));
  } catch {
    /* storage disabled — silently ignore */
  }
}

export function ManualCanvasView() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [summary, setSummary] = useState<ParsedBrief | null>(null);

  const handleSynthesize = () => {
    const text = brief.trim();
    if (!text) return;
    setIsSynthesizing(true);

    // Short paced delay keeps the "Analyse" feedback visible. Parsing itself
    // is synchronous and cheap.
    setTimeout(() => {
      setSummary(parseBrief(text));
      setIsSynthesizing(false);
    }, 800);
  };

  const handleRefineInWizard = () => {
    if (!summary) return;
    persistSeed({
      destination: summary.destinationRaw ?? undefined,
      travelDays: summary.travelDays ?? undefined,
      monthIndex: summary.monthIndex ?? undefined,
      budget: summary.budget ?? undefined,
      travelers: summary.travelers,
      tags: summary.tags,
      rawBrief: brief.trim(),
    });
    router.push('/planifier/wizard');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
      <PageHeader
        title="Mode Libre"
        subtitle="Décrivez votre projet avec vos mots. Triply en extrait les grandes lignes et les contraintes budgétaires."
      />

      <div className="mt-12 grid lg:grid-cols-3 gap-12">
        {/* Editor Area */}
        <div className="lg:col-span-2 space-y-8">
           <div className="relative group">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ex: Je veux partir à Hurghada en Égypte en partant de Marseille, au moins une activité et un resto par jour, 1 semaine en octobre, budget 2000€ tout compris."
                className="w-full h-80 bg-card border-2 border-light-border rounded-[40px] p-10 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 shadow-sm transition-all resize-none text-lg leading-relaxed placeholder:text-light-muted/50 text-foreground"
              />
              <div className="absolute bottom-10 right-10 flex gap-4">
                 <button className="w-12 h-12 bg-light-bg text-light-muted rounded-2xl flex items-center justify-center hover:bg-light-border transition-colors border border-light-border">
                    <Upload size={20} />
                 </button>
                 <button
                  onClick={handleSynthesize}
                  disabled={!brief.trim() || isSynthesizing}
                  className="bg-brand text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-brand/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                 >
                    {isSynthesizing ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="animate-spin" size={18} /> Analyse...
                      </span>
                    ) : (
                      <>
                        Envoyer au copilote <Send size={18} />
                      </>
                    )}
                 </button>
              </div>
           </div>

           <div className="flex flex-wrap gap-3">
              <span className="text-xs font-bold text-light-muted uppercase tracking-widest block w-full mb-2">Inspirations rapides</span>
              {[
                "Roadtrip Toscane 10 jours en mai, 2 personnes, budget 2500€",
                "City break Berlin 4 jours en septembre, train, 800€",
                "Laponie en famille 1 semaine en février, 2 adultes 2 enfants, 4500€",
              ].map(tag => (
                <button
                  key={tag}
                  onClick={() => setBrief(tag)}
                  className="px-5 py-2 bg-card border border-light-border rounded-full text-xs font-bold text-light-muted hover:border-brand hover:text-brand transition-all"
                >
                  {tag}
                </button>
              ))}
           </div>
        </div>

        {/* Résumé */}
        <aside className="space-y-8">
           <AnimatePresence mode="wait">
             {summary ? (
               <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="triply-card p-8 border-2 border-brand/20 bg-brand/5 space-y-8"
               >
                  <header className="flex items-center gap-3 text-brand">
                     <Bot size={24} />
                     <h3 className="font-bold">Synthèse de votre brief</h3>
                  </header>

                  <div className="space-y-6">
                     <div className="flex items-start gap-4">
                        <MapPin size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-xs uppercase font-bold text-light-muted">Destination</p>
                           <p className="font-bold">{summary.destination}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Calendar size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-xs uppercase font-bold text-light-muted">Période détectée</p>
                           <p className="font-bold">{formatPeriod(summary)}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Wallet size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-xs uppercase font-bold text-light-muted">Contrainte budget</p>
                           <p className="font-bold text-brand">{formatBudget(summary)}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Users size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-xs uppercase font-bold text-light-muted">Voyageurs</p>
                           <p className="font-bold">{summary.travelers} personne{summary.travelers > 1 ? 's' : ''}</p>
                        </div>
                     </div>
                  </div>

                  {summary.highlights.length > 0 ? (
                    <ul className="space-y-3 pt-6 border-t border-brand/10">
                       {summary.highlights.map((h, i) => (
                         <li key={i} className="flex items-center gap-2 text-xs font-bold text-brand">
                            <CheckCircle2 size={14} /> {h}
                         </li>
                       ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-light-muted font-bold pt-6 border-t border-brand/10">
                      Aucune contrainte spécifique détectée. Vous pourrez les ajuster dans le wizard.
                    </p>
                  )}

                  <div className="pt-6 space-y-3">
                     <button onClick={handleRefineInWizard} className="w-full btn-primary flex items-center justify-center gap-2">
                        Affiner dans le wizard <ChevronRight size={16} />
                     </button>
                     <button onClick={() => router.push("/itineraire")} className="w-full py-4 text-brand font-bold text-sm bg-card border border-brand/20 rounded-2xl hover:bg-light-bg">
                        Voir le brouillon d'itinéraire
                     </button>
                  </div>
               </motion.div>
             ) : (
               <div className="triply-card p-8 border-2 border-dashed border-light-border text-center space-y-6">
                  <div className="w-16 h-16 bg-light-bg rounded-full flex items-center justify-center mx-auto text-light-muted">
                     <FileText size={28} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="font-bold">En attente de saisie</h3>
                     <p className="text-xs text-light-muted leading-relaxed">
                       Tapez votre texte à gauche. Triply repère vos contraintes et prépare les arbitrages budgétaires.
                     </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl flex gap-3 text-left">
                     <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                     <p className="text-xs font-bold text-emerald-700 leading-relaxed uppercase">Le budget détecté sera verrouillé comme contrainte dure.</p>
                  </div>
               </div>
             )}
           </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
