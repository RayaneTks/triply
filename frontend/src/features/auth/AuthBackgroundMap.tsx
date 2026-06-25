'use client';

import { WorldMap } from '@/src/components/Map/Map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function AuthBackgroundMap() {
  if (!MAPBOX_TOKEN) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.24),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.2),transparent_35%),#020617]" />;
  }

  return (
    <div className="absolute inset-0">
      <WorldMap
        accessToken={MAPBOX_TOKEN}
        initialLatitude={30}
        initialLongitude={2}
        initialZoom={1.6}
        mapStyle="mapbox://styles/mapbox/standard"
        mapConfig={{
          lightPreset: 'night',
          showPointOfInterestLabels: false,
          showTransitLabels: false,
        }}
        interactive={false}
        autoRotateSpeed={1.8}
        pitch={38}
        showAttribution
        showLogo
        showAirports={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/58" />
    </div>
  );
}
