import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Calendar, ChevronRight, Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export function TripsListView() {
  const [trips, setTrips] = useState<any[]>([
    { id: '1', destination: 'Rome', dates: '14 - 17 Mai 2026', status: 'planned' }
  ]);
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
        <div className="h-10 bg-slate-200 w-1/3 rounded-lg mb-12"></div>
        <div className="space-y-6">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl w-full"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-display font-bold">Mes voyages</h1>
        <Link to="/planifier" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
           <Plus size={16} /> Nouveau
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-32 bg-white border border-dashed border-light-border rounded-[40px] flex flex-col items-center gap-6">
           <div className="w-20 h-20 bg-light-bg rounded-full flex items-center justify-center text-light-muted">
              <Inbox size={40} />
           </div>
           <div>
              <p className="text-xl font-bold mb-2">Aucun voyage sauvegardé</p>
              <p className="text-light-muted">Le cockpit est vide. Prêt à programmer <br/> votre prochaine évasion ?</p>
           </div>
           <Link to="/planifier" className="btn-primary">Commencer le cadrage</Link>
        </div>
      ) : (
        <div className="grid gap-6">
           {trips.map(trip => (
             <Link 
              key={trip.id} 
              to="/itineraire"
              className="triply-card p-8 group flex items-center justify-between"
             >
                <div className="flex gap-8 items-center">
                   <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                      <MapPin size={32} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">Week-end à {trip.destination}</h2>
                      <div className="flex items-center gap-4 text-sm font-bold text-light-muted">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {trip.dates}</span>
                        <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] uppercase">Cadré</span>
                      </div>
                   </div>
                </div>
                <ChevronRight className="text-light-border group-hover:translate-x-2 group-hover:text-brand transition-all" />
             </Link>
           ))}
        </div>
      )}
    </div>
  );
}
