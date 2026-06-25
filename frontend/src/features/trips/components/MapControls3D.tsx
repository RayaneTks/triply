'use client';

import { FC } from 'react';
import { Compass, Layers, Sun } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type MapVisualStyle = 'light' | 'standard' | 'dark';

interface MapControls3DProps {
    pitch: number;
    bearing: number;
    mapStyle: MapVisualStyle;
    onPitchChange: (pitch: number) => void;
    onBearingChange: (bearing: number) => void;
    onMapStyleChange: (style: MapVisualStyle) => void;
    className?: string;
}

const STYLE_OPTIONS: { id: MapVisualStyle; label: string }[] = [
    { id: 'light', label: 'Clair' },
    { id: 'standard', label: 'Defaut' },
    { id: 'dark', label: 'Sombre' },
];

export const MapControls3D: FC<MapControls3DProps> = ({
    pitch,
    bearing,
    mapStyle,
    onPitchChange,
    onBearingChange,
    onMapStyleChange,
    className,
}) => {
    const tones = mapStyle === 'light'
        ? {
            container: 'border-slate-300/80 bg-white/92',
            label: 'text-slate-600',
            optionActive: 'bg-slate-900/10 text-slate-900',
            optionBase: 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900',
            slider: 'text-slate-700',
        }
        : mapStyle === 'dark'
            ? {
                container: 'border-white/15 bg-slate-950/90',
                label: 'text-white/60',
                optionActive: 'bg-white/20 text-white',
                optionBase: 'text-white/70 hover:bg-white/10 hover:text-white',
                slider: 'text-white/80',
            }
            : {
                container: 'border-white/15 bg-slate-900/90',
                label: 'text-white/60',
                optionActive: 'bg-white/20 text-white',
                optionBase: 'text-white/70 hover:bg-white/10 hover:text-white',
                slider: 'text-white/80',
            };

    return (
        <div
            className={cn(
                'rounded-2xl backdrop-blur-md p-3 space-y-3 shadow-lg border',
                tones.container,
                className,
            )}
        >
        <div className={cn('flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest', tones.label)}>
            <Layers size={12} /> Carte
        </div>
        <div className="flex flex-wrap gap-1">
            {STYLE_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onMapStyleChange(opt.id)}
                    className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-bold transition-colors',
                        mapStyle === opt.id
                            ? tones.optionActive
                            : tones.optionBase,
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
        <label className={cn('flex items-center gap-2 text-xs', tones.slider)}>
            <Sun size={12} className="shrink-0" />
            <span className="w-8 font-bold">3D</span>
            <input
                type="range"
                min={0}
                max={60}
                value={pitch}
                onChange={(e) => onPitchChange(Number(e.target.value))}
                className="flex-1 accent-brand"
            />
            <span className="w-8 text-right font-mono text-[10px]">{pitch}°</span>
        </label>
        <label className={cn('flex items-center gap-2 text-xs', tones.slider)}>
            <Compass size={12} className="shrink-0" />
            <span className="w-8 font-bold">Rot.</span>
            <input
                type="range"
                min={0}
                max={360}
                value={bearing}
                onChange={(e) => onBearingChange(Number(e.target.value))}
                className="flex-1 accent-brand"
            />
            <span className="w-8 text-right font-mono text-[10px]">{bearing}°</span>
        </label>
        </div>
    );
};

export function mapStyleUrl(style: MapVisualStyle): string {
    // Keep Standard for all visual modes to preserve rich POI + smooth 3D.
    return 'mapbox://styles/mapbox/standard';
}

export function mapConfigForStyle(style: MapVisualStyle) {
    if (style === 'dark') {
        return {
            lightPreset: 'night' as const,
            theme: 'default' as const,
            showPlaceLabels: true,
            showPointOfInterestLabels: true,
            showRoadLabels: true,
            showTransitLabels: true,
        };
    }
    if (style === 'light') {
        return {
            lightPreset: 'day' as const,
            theme: 'default' as const,
            showPlaceLabels: true,
            showPointOfInterestLabels: true,
            showRoadLabels: true,
            showTransitLabels: true,
        };
    }
    return {
        lightPreset: 'dusk' as const,
        theme: 'default' as const,
        showPlaceLabels: true,
        showPointOfInterestLabels: true,
        showRoadLabels: true,
        showTransitLabels: true,
    };
}
