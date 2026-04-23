import React from "react";
import { Map as MapIcon } from "lucide-react";

export function Map() {
  return (
    <div className="w-full h-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
      {/* TODO: wire Mapbox via import.meta.env.VITE_MAPBOX_TOKEN */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-dark-muted">
         <MapIcon size={48} className="animate-pulse" />
         <p className="font-display font-bold uppercase tracking-widest text-xs">Moteur de carte en attente</p>
      </div>
    </div>
  );
}
