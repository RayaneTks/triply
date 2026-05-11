import React, { useState } from "react";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Globe,
  Clock,
  LayoutGrid,
  Mail
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PageHeader } from "../../components/ui/PageHeader";
import { motion, AnimatePresence } from "motion/react";

export function ProfileView() {
  const [activeTab, setActiveTab] = useState("compte");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tabs = [
    { id: "compte", label: "Compte", icon: User },
    { id: "preferences", label: "Préférences", icon: Settings },
    { id: "notifications", label: "Alertes", icon: Bell },
    { id: "securite", label: "Sécurité", icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
      <PageHeader 
        title="Mon Espace" 
        subtitle="Gérez votre profil, vos préférences de voyage et vos accès en un seul endroit." 
      />

      <div className="flex flex-col lg:flex-row gap-12 mt-12">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-brand text-white shadow-lg shadow-brand/20 translate-x-2" 
                  : "text-light-muted hover:bg-light-bg"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-light-border">
             <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-error hover:bg-red-50 transition-all">
                <LogOut size={20} />
                Déconnexion
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white triply-card p-8 lg:p-12 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-12"
            >
              {activeTab === "compte" && (
                <div className="space-y-10">
                   <header className="flex flex-col md:flex-row gap-8 items-center border-b border-light-border pb-10">
                      <div className="w-24 h-24 bg-brand/10 border-2 border-brand/20 rounded-full flex items-center justify-center text-brand font-display text-3xl font-bold">
                        JM
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                         <h3 className="text-2xl font-bold">Julien Martin</h3>
                         <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <span className="bg-light-bg px-3 py-1 rounded-full text-xs font-bold text-light-muted flex items-center gap-2 border border-light-border">
                               <Mail size={12} /> julien.martin@example.com
                            </span>
                            <span className="bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold text-emerald-600 flex items-center gap-2 border border-emerald-100">
                               <CreditCard size={12} /> Plan Silver
                            </span>
                         </div>
                      </div>
                      <button className="btn-secondary py-2 text-xs">Modifier l'avatar</button>
                   </header>

                   <form className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Prénom</label>
                        <input className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium" defaultValue="Julien" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">Nom de famille</label>
                        <input className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium" defaultValue="Martin" />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                         <button type="button" className="btn-primary py-2 px-8">Enregistrer</button>
                      </div>
                   </form>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-12">
                   <div className="space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                         <Globe size={20} className="text-brand" /> Style de voyage
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                         {[
                            { label: "Rythme du séjour", val: "Planifié & dense", icon: Clock },
                            { label: "Type d'hébergement", val: "Hôtels Premium / Boutique", icon: LayoutGrid },
                            { label: "Budget par défaut", val: "200€ / jour", icon: CreditCard },
                            { label: "Mode favori", val: "Copilote assisté", icon: Globe },
                         ].map((pref, i) => (
                           <button key={i} className="flex items-center justify-between p-6 bg-light-bg border border-light-border rounded-2xl hover:border-brand/40 transition-all text-left group">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-light-muted">{pref.label}</p>
                                 <p className="text-sm font-bold text-light-foreground">{pref.val}</p>
                              </div>
                              <pref.icon size={18} className="text-light-border group-hover:text-brand transition-colors" />
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="p-8 bg-amber-50 border border-amber-100 rounded-3xl flex gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                         <Globe size={24} />
                      </div>
                      <div className="space-y-2">
                         <h4 className="font-bold text-amber-900">Astuce Voyage</h4>
                         <p className="text-sm text-amber-800 leading-relaxed">Vos préférences aident Triply à proposer des arbitrages budgétaires cohérents sans vous redemander les mêmes informations.</p>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === "securite" && (
                 <div className="space-y-12">
                    <div className="p-10 border border-red-100 bg-red-50/30 rounded-[32px] space-y-6">
                       <header>
                          <h3 className="text-xl font-bold text-error flex items-center gap-2">
                             <Trash2 size={20} /> Zone de danger
                          </h3>
                          <p className="text-sm text-red-700/70 mt-2">Supprimer votre compte Triply entraînera la perte définitive de tout vos itinéraires et brouillons.</p>
                       </header>
                       <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="py-3 px-6 bg-white border border-red-200 text-error font-bold rounded-xl hover:bg-error hover:text-white transition-all shadow-sm"
                       >
                         Effacer toutes mes données
                       </button>
                    </div>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-bg/80 backdrop-blur-sm">
           <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-white rounded-[40px] p-10 space-y-8 shadow-2xl"
           >
              <div className="w-16 h-16 bg-red-50 text-error rounded-2xl flex items-center justify-center">
                 <AlertTriangle size={32} />
              </div>
              <div className="space-y-4 text-left">
                <h3 className="text-2xl font-display font-bold">Êtes-vous certain ?</h3>
                <p className="text-light-muted leading-relaxed">Cette action est irréversible. Toutes vos réservations fictives et vos itinéraires seront supprimés immédiatement.</p>
              </div>
              <div className="flex flex-col gap-3">
                 <button className="bg-error text-white font-bold py-4 rounded-2xl shadow-lg shadow-error/20">Oui, supprimer mon compte</button>
                 <button onClick={() => setShowDeleteModal(false)} className="text-light-muted font-bold py-4 rounded-2xl hover:bg-light-bg">Annuler</button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

const AlertTriangle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)
