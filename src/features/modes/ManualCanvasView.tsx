import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "../../components/ui/PageHeader";
import { cn } from "../../lib/utils";

export function ManualCanvasView() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const handleSynthesize = () => {
    if (!brief.trim()) return;
    setIsSynthesizing(true);
    
    setTimeout(() => {
      setIsSynthesizing(false);
      setSummary({
        destination: "Barcelone & Côte Espagnole",
        period: "10 jours en Septembre",
        budget: "2200€ total",
        constraintsCount: 4,
        highlights: ["Focus gastronomie locale", "Rythme de marche modéré", "Option train privilégiée"]
      });
    }, 2000);
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
                placeholder="Ex: Je veux partir à Barcelone 10 jours en septembre avec 2 enfants. Je privilégie le train. Budget max 2200€ tout compris. On adore la bouffe locale et on déteste les musées bondés..."
                className="w-full h-80 bg-white border-2 border-light-border rounded-[40px] p-10 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 shadow-sm transition-all resize-none text-lg leading-relaxed placeholder:text-light-muted/50"
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
              <span className="text-[10px] font-bold text-light-muted uppercase tracking-widest block w-full mb-2">Inspirations rapides</span>
              {["Roadtrip Toscane", "City Break Berlin", "Laponie en famille"].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setBrief(`Projet : ${tag}. Dates : Prochaines vacances. Budget : Flexible.`)}
                  className="px-5 py-2 bg-white border border-light-border rounded-full text-xs font-bold text-light-muted hover:border-brand hover:text-brand transition-all"
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
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
                           <p className="text-[10px] uppercase font-bold text-light-muted">Destination</p>
                           <p className="font-bold">{summary.destination}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Calendar size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-[10px] uppercase font-bold text-light-muted">Période détectée</p>
                           <p className="font-bold">{summary.period}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Wallet size={18} className="text-light-muted mt-1" />
                        <div>
                           <p className="text-[10px] uppercase font-bold text-light-muted">Contrainte Budget</p>
                           <p className="font-bold text-brand">{summary.budget}</p>
                        </div>
                     </div>
                  </div>

                  <ul className="space-y-3 pt-6 border-t border-brand/10">
                     {summary.highlights.map((h: string, i: number) => (
                       <li key={i} className="flex items-center gap-2 text-xs font-bold text-brand">
                          <CheckCircle2 size={14} /> {h}
                       </li>
                     ))}
                  </ul>

                  <div className="pt-6 space-y-3">
                     <button onClick={() => navigate("/planifier/wizard")} className="w-full btn-primary flex items-center justify-center gap-2">
                        Affiner dans le wizard <ChevronRight size={16} />
                     </button>
                     <button onClick={() => navigate("/itineraire")} className="w-full py-4 text-brand font-bold text-sm bg-white border border-brand/20 rounded-2xl hover:bg-white/80">
                        Voir le brouillon d'itinéraire
                     </button>
                  </div>
               </motion.div>
             ) : (
               <div className="triply-card p-8 bg-white border-2 border-dashed border-light-border text-center space-y-6">
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
                     <p className="text-[10px] font-bold text-emerald-700 leading-relaxed uppercase">Le budget détecté sera verrouillé comme contrainte dure.</p>
                  </div>
               </div>
             )}
           </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
