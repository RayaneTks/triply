import React, { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import { default as MapGL, Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

export interface TriplyMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

export function Map({ center = DEFAULT_CENTER, zoom = 10, markers = [], className }: TriplyMapProps) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const initialView = useMemo(() => {
    if (markers.length > 0) {
      const m = markers[0];
      return { latitude: m.lat, longitude: m.lng, zoom: Math.max(zoom, 11) };
    }
    return { latitude: center.lat, longitude: center.lng, zoom };
  }, [center.lat, center.lng, zoom, markers]);

  if (!token?.trim()) {
    return (
      <div className={`w-full h-full bg-slate-900 relative flex items-center justify-center overflow-hidden ${className ?? ""}`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-dark-muted px-6 text-center">
          <MapIcon size={48} className="animate-pulse" />
          <p className="font-display font-bold uppercase tracking-widest text-xs">
            Définissez <code className="text-brand">VITE_MAPBOX_TOKEN</code> pour afficher la carte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[280px] ${className ?? ""}`}>
      <MapGL
        mapboxAccessToken={token}
        initialViewState={initialView}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-right" />
        {markers.map((m) => (
          <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="bottom">
            <div
              className="px-2 py-1 rounded-lg bg-brand text-white text-[10px] font-bold shadow-lg border border-white/30 max-w-[140px] truncate"
              title={m.title}
            >
              {m.title ?? "·"}
            </div>
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
