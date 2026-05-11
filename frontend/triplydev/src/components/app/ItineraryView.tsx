import React from "react";
import { Calendar, Users, Wallet, CheckCircle, Clock, MapPin, ExternalLink, Bot } from "lucide-react";
import { cn } from "../../lib/utils";

export function ItineraryView() {
  const needs = { flights: true, hotels: true, activities: false, restaurants: false };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* Colonne Principale */}
        <div className="lg:col-span-2 space-y-12">
          
          <header className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/5 px-3 py-1 rounded-full w-fit">
               <CheckCircle size={12} /> Cadrage terminé
            </div>
            <h1 className="text-5xl font-display font-bold">Week-end à Rome</h1>
            <div className="flex flex-wrap gap-6">
               <div className="flex items-center gap-2 text-light-muted">
                  <Calendar size={18} />
                  <span className="text-sm font-bold">14 - 17 Mai 2026</span>
               </div>
               <div className="flex items-center gap-2 text-light-muted">
                  <Users size={18} />
                  <span className="text-sm font-bold">2 Voyageurs</span>
               </div>
               <div className="flex items-center gap-2 text-light-muted">
                  <Wallet size={18} />
                  <span className="text-sm font-bold">2 500€</span>
               </div>
            </div>
          </header>

          {/* Planning Section */}
          <section className="space-y-8">
             <h2 className="text-2xl font-display font-bold border-b border-light-border pb-4">Itinéraire suggéré</h2>
             
             <div className="space-y-12">
               {[1, 2, 3].map(day => (
                 <div key={day} className="relative pl-8 border-l border-light-border">
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-brand rounded-full border-4 border-white shadow-sm" />
                    <h3 className="text-xl font-bold mb-6">Jour {day} — Exploration</h3>
                    
                    <div className="space-y-4">
                       <div className="p-6 triply-card bg-white flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-light-bg rounded-xl flex items-center justify-center text-light-muted">
                                <Clock size={18} />
                             </div>
                             <div>
                                <p className="font-bold">Colisée & Forum Romain</p>
                                <p className="text-xs text-light-muted">Prévoyez 3h de visite</p>
                             </div>
                          </div>
                          <ExternalLink size={16} className="text-light-border" />
                       </div>
                       <div className="p-4 bg-brand/5 rounded-xl border border-brand/10 flex items-center gap-3">
                          <Bot size={16} className="text-brand" />
                          <p className="text-xs text-brand font-bold">Mon avis : Réservation obligatoire pour éviter 2h d'attente.</p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        </div>

        {/* Sidebar Récap Besoins */}
        <aside className="space-y-8">
           <div className="triply-card p-8 sticky top-32">
              <h3 className="text-xl font-bold mb-6">Feuille de route</h3>
              <div className="space-y-6">
                {[
                  { id: 'flights', label: 'Vols', status: needs.flights ? 'todo' : 'done' },
                  { id: 'hotels', label: 'Hébergement', status: needs.hotels ? 'todo' : 'done' },
                  { id: 'activities', label: 'Activités', status: 'done' },
                  { id: 'restos', label: 'Restaurants', status: 'done' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                     <span className="text-sm font-bold text-light-foreground">{item.label}</span>
                     <span className={cn(
                       "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                       item.status === 'todo' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                     )}>
                       {item.status === 'todo' ? 'À creuser' : 'Cadré'}
                     </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-light-border space-y-4">
                 <button className="btn-primary w-full shadow-lg shadow-brand/20">Exporter le PDF</button>
                 <button className="btn-secondary w-full">Finaliser les réservations</button>
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}
