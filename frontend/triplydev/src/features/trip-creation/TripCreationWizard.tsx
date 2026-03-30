import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Truck, User, MapPin, Clock, MessageSquare, Menu, Calendar, ChevronDown, Banknote, AlertTriangle, ArrowDown, RefreshCw, Bike } from 'lucide-react';
import { TripConfigurationForm } from '@/src/components/TripConfigurationForm/TripConfigurationForm';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { UseTripConfigurationResult } from './useTripConfiguration';
import type { PlanningMode } from './planning-mode';
import type { MapboxPoiFeature } from '@/src/components/Map/Map';
import {
    PLAN_FORM_STEP_COUNT,
    PLAN_FORM_STEP_LAST,
    PLAN_FORM_STEP_LABELS,
    validatePlanFormStep,
    clampPlanFormStep,
} from './plan-form-wizard';

type PanelView = 'plan' | 'activity';

export type DayActivityPoi = MapboxPoiFeature & {
    lngLat: { lng: number; lat: number };
    _dragId?: string;
    /** Durée en heures (saisie utilisateur) ; sinon estimation selon le layer Mapbox */
    durationHours?: number;
};

function DaySelector({ selectedDay, travelDays, onSelect }: { selectedDay: number; travelDays: number; onSelect: (day: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const days = Array.from({ length: Math.max(1, travelDays) }, (_, i) => i + 1);

    return (
        <div className="flex items-center gap-2" ref={containerRef}>
            <Calendar className="h-5 w-5 shrink-0 text-cyan-400" />
            <div className="relative flex-1">
                <button
                    type="button"
                    onClick={() => setIsOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 py-2.5 pl-4 pr-10 text-[13px] font-semibold text-slate-100 outline-none transition-colors hover:bg-white/10 focus:border-cyan-500/60 focus:bg-cyan-500/10 focus:ring-2 focus:ring-cyan-500/30"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                >
                    <span>Jour {selectedDay}</span>
                    <ChevronDown className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div
                        className="absolute left-0 right-0 top-full z-50 mt-2 max-h-48 overflow-y-auto rounded-xl shadow-xl"
                        style={{
                            backgroundColor: 'var(--background, #222222)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        }}
                    >
                        {days.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => {
                                    onSelect(d);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center px-4 py-3 text-left text-[13px] font-medium transition-all duration-150 hover:bg-cyan-500/15 hover:text-cyan-300 ${
                                    d === selectedDay ? 'bg-cyan-500/15 text-cyan-400' : 'bg-transparent text-slate-100'
                                }`}
                            >
                                Jour {d}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

type DayPlanActionTone = 'emerald' | 'cyan' | 'neutral';

function dayPlanActionItemClass(tone: DayPlanActionTone): string {
    if (tone === 'emerald') {
        return 'text-emerald-100 hover:bg-emerald-500/15';
    }
    if (tone === 'cyan') {
        return 'text-cyan-100 hover:bg-cyan-500/15';
    }
    return 'text-slate-200 hover:bg-white/10';
}

/** Menu déroulant : actions vol / hôtel sur la journée (Étape 2). */
function DayPlanActionsDropdown({
    selectedHotel,
    onAppendHotelToDay,
    onOpenHotelSearch,
    isFirstTripDay,
    selectedFlight,
    onAppendAirportOutbound,
    onOpenFlightSearch,
    isLastTripDay,
    canAppendReturnAirport,
    onAppendAirportReturn,
    geocodeAppendPending,
}: {
    selectedHotel?: unknown;
    onAppendHotelToDay?: () => void;
    onOpenHotelSearch?: () => void;
    isFirstTripDay: boolean;
    selectedFlight?: unknown;
    onAppendAirportOutbound?: () => void;
    onOpenFlightSearch?: () => void;
    isLastTripDay: boolean;
    canAppendReturnAirport?: boolean;
    onAppendAirportReturn?: () => void;
    geocodeAppendPending?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    type Item = { key: string; label: string; onClick: () => void; disabled?: boolean; tone: DayPlanActionTone };
    const items: Item[] = [];
    if (selectedHotel && onAppendHotelToDay) {
        items.push({
            key: 'append-hotel',
            label: "Ajouter l'hôtel à la journée",
            onClick: () => {
                onAppendHotelToDay();
                setOpen(false);
            },
            disabled: geocodeAppendPending,
            tone: 'emerald',
        });
    }
    if (selectedHotel && onOpenHotelSearch) {
        items.push({
            key: 'change-hotel',
            label: "Changer d'hôtel",
            onClick: () => {
                onOpenHotelSearch();
                setOpen(false);
            },
            tone: 'neutral',
        });
    }
    if (isFirstTripDay && selectedFlight && onAppendAirportOutbound) {
        items.push({
            key: 'append-airport-out',
            label: "Ajouter l'aéroport d'arrivée",
            onClick: () => {
                onAppendAirportOutbound();
                setOpen(false);
            },
            disabled: geocodeAppendPending,
            tone: 'cyan',
        });
    }
    if (isFirstTripDay && selectedFlight && onOpenFlightSearch) {
        items.push({
            key: 'change-flight-out',
            label: 'Changer de vol (aller)',
            onClick: () => {
                onOpenFlightSearch();
                setOpen(false);
            },
            tone: 'neutral',
        });
    }
    if (isLastTripDay && selectedFlight && canAppendReturnAirport && onAppendAirportReturn) {
        items.push({
            key: 'append-airport-return',
            label: "Ajouter l'aéroport (vol retour)",
            onClick: () => {
                onAppendAirportReturn();
                setOpen(false);
            },
            disabled: geocodeAppendPending,
            tone: 'neutral',
        });
    }

    if (items.length === 0) return null;

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="relative flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 py-2.5 pl-4 pr-10 text-left text-[12px] font-semibold text-slate-100 outline-none transition-colors hover:bg-white/10 focus:border-cyan-500/60 focus:bg-cyan-500/10 focus:ring-2 focus:ring-cyan-500/30"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
            >
                <span>Vol et hébergement</span>
                <ChevronDown
                    className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                />
            </button>
            {open && (
                <div
                    role="menu"
                    aria-label="Actions vol et hébergement"
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl shadow-xl"
                    style={{
                        backgroundColor: 'var(--background, #222222)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    {items.map((it) => (
                        <button
                            key={it.key}
                            type="button"
                            role="menuitem"
                            disabled={it.disabled}
                            onClick={it.onClick}
                            className={`flex w-full px-4 py-3 text-left text-[12px] font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${dayPlanActionItemClass(it.tone)}`}
                        >
                            {it.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Durée estimée selon le type de POI (layer Mapbox) */
function getEstimatedDuration(layerId?: string): string {
    if (!layerId) return '~1h';
    const id = layerId.toLowerCase();
    if (id.includes('airport')) return '1h–2h';
    if (id.includes('hotel')) return '2h–3h';
    if (id.includes('restaurant') || id.includes('food') || id.includes('cafe') || id.includes('bar')) return '1h–2h';
    if (id.includes('museum') || id.includes('gallery') || id.includes('theater')) return '1h30–3h';
    if (id.includes('park') || id.includes('nature') || id.includes('garden')) return '1h–2h';
    if (id.includes('place-city') || id.includes('place-town')) return '2h–4h';
    if (id.includes('shop') || id.includes('store')) return '30min–1h';
    return '~1h';
}

/** Coût moyen estimé selon le type de POI (layer Mapbox + nom + class) */
function getEstimatedCost(layerId?: string, hint?: string): string {
    const id = [layerId, hint].filter(Boolean).join(' ').toLowerCase();
    if (!id) return '~15 €';
    if (id.includes('restaurant') || id.includes('food') || id.includes('cafe') || id.includes('bar') || id.includes('bistro')) return '15–40 €';
    if (id.includes('museum') || id.includes('musée') || id.includes('gallery') || id.includes('galerie') || id.includes('theater') || id.includes('théâtre')) return '10–20 €';
    if (id.includes('park') || id.includes('parc') || id.includes('nature') || id.includes('garden') || id.includes('jardin')) return 'Gratuit';
    if (id.includes('place-city') || id.includes('place-town') || id.includes('place-village')) return 'Gratuit';
    if (id.includes('shop') || id.includes('store') || id.includes('boutique')) return '20–100 €';
    return '~15 €';
}

/** Convertit la durée affichée en heures (nombre) pour le calcul de la barre de progression */
export function getEstimatedDurationHours(layerId?: string): number {
    const s = getEstimatedDuration(layerId);
    // "~1h" -> 1, "1h–2h" -> 1.5, "1h30–3h" -> 2.25, "30min–1h" -> 0.75, "2h–4h" -> 3
    const simple = s.match(/^~?(\d+(?:\.\d+)?)h$/);
    if (simple) return parseFloat(simple[1]);
    const minRange = s.match(/(\d+)\s*min\s*–\s*(\d+(?:\.\d+)?)h/);
    if (minRange) return (parseInt(minRange[1], 10) / 60 + parseFloat(minRange[2])) / 2;
    const hMinRange = s.match(/(\d+)h(\d+)\s*–\s*(\d+(?:\.\d+)?)h/);
    if (hMinRange) {
        const a = parseInt(hMinRange[1], 10) + parseInt(hMinRange[2], 10) / 60;
        const b = parseFloat(hMinRange[3]);
        return (a + b) / 2;
    }
    const rangeH = s.match(/(\d+(?:\.\d+)?)h?\s*–\s*(\d+(?:\.\d+)?)h/);
    if (rangeH) return (parseFloat(rangeH[1].replace('h', '')) + parseFloat(rangeH[2].replace('h', ''))) / 2;
    const minOnly = s.match(/(\d+)\s*min/);
    if (minOnly) return parseInt(minOnly[1], 10) / 60;
    return 1;
}

/** Durée d’une activité : override utilisateur ou estimation layer. */
export function getActivityDurationHours(poi: Pick<DayActivityPoi, 'layer' | 'durationHours'>): number {
    const lid = poi.layer?.id?.toLowerCase() ?? '';
    if (lid === 'hotel' || lid === 'airport') return 0;
    const o = poi.durationHours;
    if (o != null && Number.isFinite(o) && o > 0) return o;
    return getEstimatedDurationHours(poi.layer?.id);
}

export type DayActivityRouteLeg = { duration: number; distance: number; geometry?: GeoJSON.LineString };

export type DayActivityRouteInfo = {
    geometry: GeoJSON.LineString;
    duration: number;
    legs: DayActivityRouteLeg[];
};

export type ActivityRouteProfile = 'driving' | 'walking' | 'cycling';

function formatLegDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function activityPoiDisplayName(p: DayActivityPoi): string {
    return String(p.properties?.name ?? p.properties?.name_en ?? p.layer?.id ?? 'Lieu');
}

function ActivityCard({
    poi,
    index: activityIndex,
    onRemove,
    isTimeAlert = false,
    legFromPrevious,
    onDurationHoursChange,
    onRegenerateWithAi,
    regenerateLoading = false,
}: {
    poi: DayActivityPoi;
    index: number;
    onRemove?: () => void;
    /** Dernière activité ajoutée si le total dépasse le temps max du jour */
    isTimeAlert?: boolean;
    /** Trajet depuis l’activité précédente : choix du mode + durée Mapbox */
    legFromPrevious?: {
        legSegmentIndex: number;
        activeMode: ActivityRouteProfile;
        durationSec: number;
        dayRoutes: Partial<Record<ActivityRouteProfile, DayActivityRouteInfo>>;
        onModeChange?: (mode: ActivityRouteProfile) => void;
    } | null;
    onDurationHoursChange?: (hours: number | null) => void;
    onRegenerateWithAi?: () => void;
    regenerateLoading?: boolean;
}) {
    const name = activityPoiDisplayName(poi);
    const [address, setAddress] = useState<string | null>(null);
    const [addressLoading, setAddressLoading] = useState(true);
    const durationLabel =
        poi.durationHours != null && Number.isFinite(poi.durationHours) && poi.durationHours > 0
            ? `~${poi.durationHours} h`
            : getEstimatedDuration(poi.layer?.id);
    const costHint = [poi.properties?.class, name].filter(Boolean).join(' ');
    const cost = getEstimatedCost(poi.layer?.id, costHint);
    const dragControls = useDragControls();
    const hideActivityMeta =
        poi.layer?.id?.toLowerCase() === 'hotel' || poi.layer?.id?.toLowerCase() === 'airport';

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/geocode/reverse?lng=${poi.lngLat.lng}&lat=${poi.lngLat.lat}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data.address) setAddress(data.address);
            })
            .catch(() => {
                if (!cancelled) setAddress(null);
            })
            .finally(() => {
                if (!cancelled) setAddressLoading(false);
            });
        return () => { cancelled = true; };
    }, [poi.lngLat.lng, poi.lngLat.lat]);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.lngLat.lat},${poi.lngLat.lng}`;

    const legsModeLabels: Record<ActivityRouteProfile, string> = {
        driving: 'en voiture',
        walking: 'à pied',
        cycling: 'à vélo',
    };

    const profileTypes: ActivityRouteProfile[] = ['driving', 'walking', 'cycling'];

    return (
        <Reorder.Item
            value={poi}
            id={poi._dragId ?? `${poi.lngLat.lng}-${poi.lngLat.lat}-${String(name)}`}
            dragListener={false}
            dragControls={dragControls}
            className={`list-none rounded-xl border p-4 transition-colors ${
                isTimeAlert
                    ? 'border-red-500/70 bg-red-950/25 shadow-[0_0_0_1px_rgba(239,68,68,0.35)] hover:border-red-400/80 hover:bg-red-950/35'
                    : 'border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/8'
            }`}
            style={{ boxShadow: isTimeAlert ? '0 2px 16px rgba(239,68,68,0.15)' : '0 2px 8px rgba(0,0,0,0.15)' }}
        >
            {legFromPrevious && (
                <div
                    className="-mx-1 -mt-1 mb-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-200"
                    role="group"
                    aria-label="Trajet depuis l’activité précédente"
                >
                    <ArrowDown className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                    <span className="font-medium text-cyan-100">Trajet</span>
                    <div
                        className="flex shrink-0 items-center gap-0.5 rounded-lg border border-cyan-500/30 bg-black/20 p-0.5"
                        role="toolbar"
                        aria-label="Mode de transport pour ce trajet"
                    >
                        {profileTypes.map((type) => {
                            const leg = legFromPrevious.dayRoutes[type]?.legs?.[legFromPrevious.legSegmentIndex];
                            const available = !!leg && leg.duration > 0;
                            const active = legFromPrevious.activeMode === type;
                            const canSelect = !!legFromPrevious.onModeChange;
                            const label =
                                type === 'driving' ? 'Voiture' : type === 'walking' ? 'À pied' : 'Vélo';
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    disabled={!canSelect}
                                    onClick={() => legFromPrevious.onModeChange?.(type)}
                                    title={
                                        !legFromPrevious.onModeChange
                                            ? label
                                            : !available
                                              ? `${label} — pas d’estimation sur l’itinéraire complet ; calcul sur ce tronçon au clic`
                                              : `${label} — ${formatLegDuration(leg.duration)}`
                                    }
                                    aria-pressed={active}
                                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                                        !canSelect
                                            ? 'cursor-not-allowed text-slate-600 opacity-40'
                                            : !available
                                              ? 'text-cyan-200/70 opacity-80 hover:bg-white/10 hover:text-cyan-50'
                                              : active
                                                ? 'bg-cyan-500/40 text-cyan-50 ring-1 ring-cyan-400/60'
                                                : 'text-cyan-300/80 hover:bg-white/10 hover:text-cyan-100'
                                    }`}
                                >
                                    {type === 'driving' && <Truck className="h-4 w-4" aria-hidden />}
                                    {type === 'walking' && <User className="h-4 w-4" aria-hidden />}
                                    {type === 'cycling' && <Bike className="h-4 w-4" aria-hidden />}
                                </button>
                            );
                        })}
                    </div>
                    <span className="tabular-nums font-medium text-cyan-50">
                        {legFromPrevious.durationSec > 0
                            ? formatLegDuration(legFromPrevious.durationSec)
                            : '—'}
                    </span>
                    <span className="text-cyan-400/90">·</span>
                    <span className="text-cyan-300/90">{legsModeLabels[legFromPrevious.activeMode]}</span>
                </div>
            )}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300 touch-none"
                        style={{ touchAction: 'none' }}
                        title="Glisser pour réordonner"
                        aria-label="Glisser pour réordonner"
                    >
                        <Menu className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <h4
                                className={`text-[14px] font-semibold truncate ${isTimeAlert ? 'text-red-100' : 'text-slate-100'}`}
                            >
                                {String(name)}
                            </h4>
                            {isTimeAlert && (
                                <span
                                    className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300"
                                    role="alert"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    Alerte temps
                                </span>
                            )}
                        </div>
                    {!hideActivityMeta && (
                    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
                        <span
                            className={`flex items-center gap-1.5 ${isTimeAlert ? 'font-medium text-red-300' : 'text-cyan-400'}`}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            Temps : {durationLabel}
                        </span>
                        <span className="flex items-center gap-1.5 text-cyan-400">
                            <Banknote className="h-3.5 w-3.5" />
                            Coût moyen : {cost}
                        </span>
                    </div>
                    )}
                    <div className="flex items-start gap-2 text-[12px] text-slate-400">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        {addressLoading ? (
                            <span className="animate-pulse">Chargement de l&apos;adresse...</span>
                        ) : address ? (
                            <span className="line-clamp-2">{address}</span>
                        ) : (
                            <span className="italic">Adresse non disponible</span>
                        )}
                    </div>
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[12px] font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-500/40"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Laisser un avis
                        </a>
                        {onDurationHoursChange && !hideActivityMeta && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <label className="text-[11px] font-medium text-slate-400" htmlFor={`act-dur-${poi._dragId ?? activityIndex}`}>
                                    Durée (h)
                                </label>
                                <input
                                    id={`act-dur-${poi._dragId ?? activityIndex}`}
                                    type="number"
                                    min={0.25}
                                    max={24}
                                    step={0.25}
                                    value={poi.durationHours ?? ''}
                                    placeholder="auto"
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') {
                                            onDurationHoursChange(null);
                                            return;
                                        }
                                        const n = parseFloat(v);
                                        if (Number.isFinite(n) && n > 0) onDurationHoursChange(n);
                                    }}
                                    className="w-20 rounded-lg border border-white/15 bg-white/6 px-2 py-1.5 text-[12px] text-slate-100 outline-none focus:border-cyan-500/50"
                                />
                                {poi.durationHours != null && (
                                    <button
                                        type="button"
                                        onClick={() => onDurationHoursChange(null)}
                                        className="text-[11px] font-medium text-slate-500 underline decoration-slate-600 underline-offset-2 hover:text-cyan-400"
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {(onRegenerateWithAi && !hideActivityMeta) || onRemove ? (
                    <div className="flex shrink-0 items-start gap-0.5">
                        {onRegenerateWithAi && !hideActivityMeta && (
                            <button
                                type="button"
                                onClick={onRegenerateWithAi}
                                disabled={regenerateLoading}
                                className="rounded-lg p-2 text-cyan-400 transition-colors hover:bg-white/10 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Régénérer avec l’IA"
                                aria-label="Régénérer cette activité avec l’IA"
                            >
                                <RefreshCw
                                    className={`h-[18px] w-[18px] ${regenerateLoading ? 'animate-spin' : ''}`}
                                    aria-hidden
                                />
                            </button>
                        )}
                        {onRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
                                title="Retirer"
                                aria-label={`Retirer ${name}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : null}
            </div>
        </Reorder.Item>
    );
}

function PlanningModeLoginRequired({ onLoginClick }: { onLoginClick: () => void }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="my-auto flex w-full max-w-sm flex-col items-center self-center px-6 py-10 text-center">
                <h2 className="mb-3 w-full text-[15px] font-semibold text-slate-100">Connexion requise</h2>
                <p className="mb-6 w-full text-[12px] leading-relaxed text-slate-400">
                    Connectez-vous pour choisir votre mode de planification (pleine IA, semi-IA ou manuel) et créer un
                    voyage.
                </p>
                <button
                    type="button"
                    onClick={onLoginClick}
                    className="w-full max-w-55 rounded-xl border-0 bg-(--primary,#0096c7) px-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-(--background,#222222) active:scale-[0.98]"
                >
                    Se connecter
                </button>
            </div>
        </div>
    );
}

function PlanningModeCards({ onSelect }: { onSelect: (mode: PlanningMode) => void }) {
    const cards: { mode: PlanningMode; title: string; description: string }[] = [
        {
            mode: 'full_ai',
            title: 'Pleine IA',
            description: 'L’assistant vous accompagne tout au long : suggestions automatiques et chat ouvert en étape 2.',
        },
        {
            mode: 'semi_ai',
            title: 'Semi-IA',
            description: 'Vous construisez sur la carte ; l’IA reste disponible sur demande pour proposer des activités.',
        },
        {
            mode: 'manual',
            title: 'Manuel',
            description: 'Uniquement carte et liste d’activités, sans assistant (bouton masqué).',
        },
    ];
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
            <h2 className="mb-1 text-[15px] font-semibold text-slate-100">Mode de planification</h2>
            <p className="mb-4 text-[12px] leading-relaxed text-slate-400">
                Avant les informations du voyage, indiquez comment vous souhaitez utiliser l’IA.
            </p>
            <div className="flex flex-col gap-3">
                {cards.map(({ mode, title, description }) => (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onSelect(mode)}
                        className="rounded-2xl border border-white/15 bg-white/4 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 active:scale-[0.99]"
                    >
                        <span className="block text-[14px] font-semibold text-cyan-400">{title}</span>
                        <span className="mt-1 block text-[12px] leading-snug text-slate-400">{description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

interface TripCreationWizardProps {
    state: UseTripConfigurationResult;
    multiSelectOptions: string[];
    dietaryMultiSelectOptions: string[];
    selectedFlight: FlightOffer | null;
    selectedFlightCarrierName: string;
    selectedHotel: HotelOffer | null;
    isFlightModalOpen: boolean;
    isHotelModalOpen: boolean;
    onOpenFlightSearch: () => void;
    onCloseFlightSearch: () => void;
    onOpenHotelSearch: () => void;
    onCloseHotelSearch: () => void;
    onFlightCardClick: () => void;
    onRemoveFlight: () => void;
    onHotelCardClick: () => void;
    onRemoveHotel: () => void;
    selectedDay?: number;
    onSelectedDayChange?: (day: number) => void;
    travelDays?: number;
    dayActivities?: DayActivityPoi[];
    /** `_dragId` de la dernière activité ajoutée si dépassement du temps max du jour */
    activityTimeAlertDragId?: string | null;
    onRemoveDayActivity?: (index: number) => void;
    onReorderDayActivities?: (reordered: DayActivityPoi[]) => void;
    dayRoutes?: Partial<Record<'driving' | 'walking' | 'cycling', DayActivityRouteInfo>>;
    selectedRouteType?: 'driving' | 'walking' | 'cycling' | null;
    onSelectRouteType?: (type: 'driving' | 'walking' | 'cycling' | null) => void;
    /** Mode par tronçon (index 0 = entre activité 0 et 1), pour les bandeaux « Trajet » */
    legTransportModes?: ActivityRouteProfile[];
    onLegTransportChange?: (legIndex: number, mode: ActivityRouteProfile) => void;
    activeView?: PanelView;
    onActiveViewChange?: (view: PanelView) => void;
    onComplete?: () => void;
    /** Recentrage carte sur la destination sans changer d’étape */
    onValidateChoices?: () => void;
    onDestinationGeoSelect?: (payload: { latitude: number; longitude: number; iataCode: string; name: string }) => void;
    planningMode: PlanningMode | null;
    onPlanningModeChange: (mode: PlanningMode) => void;
    /** Réaffiche les cartes pleine IA / semi-IA / manuel et efface le mode mémorisé. */
    onBackToPlanningMode?: () => void;
    /** Sans connexion, la sélection du mode est bloquée. */
    isConnected: boolean;
    onLoginClick: () => void;
    onAppendHotelToDay?: () => void;
    onAppendAirportOutbound?: () => void;
    onAppendAirportReturn?: () => void;
    canAppendReturnAirport?: boolean;
    onRequestAiDaySuggestions?: () => void;
    onRequestAiAllDaysSuggestions?: () => void;
    showAiSuggestionButton?: boolean;
    aiSuggestionsLoading?: boolean;
    aiAllDaysSuggestionsLoading?: boolean;
    onOpenValidateTrip?: () => void;
    validateTripDisabled?: boolean;
    geocodeAppendPending?: boolean;
    /** Heures par activité pour le jour affiché (null = estimation auto) */
    onDayActivityDurationChange?: (activityIndex: number, hours: number | null) => void;
    onRegenerateDayActivity?: (activityIndex: number) => void | Promise<void>;
    /** Indique quelle activité du jour courant est en cours de régénération IA */
    regeneratingActivity?: { day: number; index: number } | null;
    /** Sous-étapes du formulaire Étape 1 (0…6), contrôlées par le parent pour le brouillon. */
    planFormStep: number;
    onPlanFormStepChange: (step: number) => void;
    planFormMaxVisited: number;
    onPlanFormMaxVisitedChange: (max: number) => void;
    onOpenAssistant?: () => void;
    /** Barre de fermeture visible sous `lg` (drawer itinéraire). */
    showPanelClose?: boolean;
    onClosePanel?: () => void;
}

export const TripCreationWizard: React.FC<TripCreationWizardProps> = ({
    state,
    multiSelectOptions,
    dietaryMultiSelectOptions,
    selectedFlight,
    selectedFlightCarrierName,
    selectedHotel,
    isFlightModalOpen,
    isHotelModalOpen,
    onOpenFlightSearch,
    onCloseFlightSearch,
    onOpenHotelSearch,
    onCloseHotelSearch,
    onFlightCardClick,
    onRemoveFlight,
    onHotelCardClick,
    onRemoveHotel,
    selectedDay = 1,
    onSelectedDayChange,
    travelDays = 1,
    dayActivities = [],
    activityTimeAlertDragId = null,
    onRemoveDayActivity,
    onReorderDayActivities,
    dayRoutes = {},
    selectedRouteType = null,
    onSelectRouteType,
    legTransportModes = [],
    onLegTransportChange,
    activeView,
    onActiveViewChange,
    onComplete,
    onValidateChoices,
    onDestinationGeoSelect,
    planningMode,
    onPlanningModeChange,
    onBackToPlanningMode,
    isConnected,
    onLoginClick,
    onAppendHotelToDay,
    onAppendAirportOutbound,
    onAppendAirportReturn,
    canAppendReturnAirport = false,
    onRequestAiDaySuggestions,
    onRequestAiAllDaysSuggestions,
    showAiSuggestionButton = false,
    aiSuggestionsLoading = false,
    aiAllDaysSuggestionsLoading = false,
    onOpenValidateTrip,
    validateTripDisabled = true,
    geocodeAppendPending = false,
    onDayActivityDurationChange,
    onRegenerateDayActivity,
    regeneratingActivity = null,
    planFormStep,
    onPlanFormStepChange,
    planFormMaxVisited,
    onPlanFormMaxVisitedChange,
    onOpenAssistant,
    showPanelClose = false,
    onClosePanel,
}) => {
    const requiredChecklist = useMemo(
        () => [
            { key: 'departure', valid: !!state.departureCity.trim() },
            { key: 'arrival', valid: !!state.arrivalCity.trim() },
            { key: 'outbound', valid: !!state.outboundDate },
            { key: 'return', valid: !!state.returnDate && state.returnDate >= state.outboundDate },
            { key: 'travelers', valid: state.travelerCount > 0 },
        ],
        [state.departureCity, state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount]
    );
    const requiredCompleted = requiredChecklist.filter((item) => item.valid).length;
    const hasMinimum = planningMode != null && requiredCompleted === requiredChecklist.length;
    /** En pleine IA, l’étape 2 reste accessible pour construire le plan même sans formulaire complet. */
    const canAccessStep2 = hasMinimum || planningMode === 'full_ai';
    const isFirstTripDay = selectedDay === 1;
    const isLastTripDay = selectedDay === travelDays && travelDays >= 1;
    const [internalActiveView, setInternalActiveView] = useState<PanelView>('plan');
    const resolvedActiveView = activeView ?? internalActiveView;

    const setResolvedView = (next: PanelView) => {
        onActiveViewChange?.(next);
        if (activeView === undefined) {
            setInternalActiveView(next);
        }
    };

    const planSnap = useMemo(
        () => ({
            departureCity: state.departureCity,
            arrivalCity: state.arrivalCity,
            outboundDate: state.outboundDate,
            returnDate: state.returnDate,
            travelerCount: state.travelerCount,
            travelDays: state.travelDays,
        }),
        [state.departureCity, state.arrivalCity, state.outboundDate, state.returnDate, state.travelerCount, state.travelDays]
    );

    const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
    /** Étapes requises pour lesquelles l’utilisateur a cliqué « Suivant » alors que la validation échouait. */
    const [attemptedInvalidStep, setAttemptedInvalidStep] = useState<boolean[]>(() => Array(PLAN_FORM_STEP_COUNT).fill(false));

    const planStep = clampPlanFormStep(planFormStep);
    const planMaxVisited = clampPlanFormStep(planFormMaxVisited);

    const stepInvalidHighlight = useMemo(
        () =>
            Array.from({ length: PLAN_FORM_STEP_COUNT }, (_, i) => {
                if (i > 2) return false;
                const inv = !validatePlanFormStep(i, planSnap);
                const fromAttempt = attemptedInvalidStep[i] && inv;
                const fromRecap = planStep === PLAN_FORM_STEP_LAST && !hasMinimum && inv;
                return fromAttempt || fromRecap;
            }),
        [attemptedInvalidStep, planSnap, planStep, hasMinimum]
    );

    const selectPlanStep = (i: number) => {
        const t = clampPlanFormStep(i);
        if (t <= planMaxVisited) {
            onPlanFormStepChange(t);
            setMobileStepsOpen(false);
        }
    };

    const goPlanNext = () => {
        if (!validatePlanFormStep(planStep, planSnap)) {
            setAttemptedInvalidStep((p) => {
                const n = [...p];
                n[planStep] = true;
                return n;
            });
            return;
        }
        const next = Math.min(planStep + 1, PLAN_FORM_STEP_LAST);
        onPlanFormStepChange(next);
        onPlanFormMaxVisitedChange(Math.max(planMaxVisited, next));
    };

    const goPlanPrev = () => {
        onPlanFormStepChange(Math.max(0, planStep - 1));
        setMobileStepsOpen(false);
    };

    const renderPlanStepNav = () => (
        <nav className="flex w-full min-w-0 flex-col gap-1" aria-label="Sommaire des étapes">
            {PLAN_FORM_STEP_LABELS.map((label, i) => {
                const active = i === planStep;
                const disabled = i > planMaxVisited;
                const warn = stepInvalidHighlight[i];
                return (
                    <button
                        key={label}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectPlanStep(i)}
                        className={`box-border flex min-h-0 min-w-0 w-full max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${
                            active
                                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                                : disabled
                                  ? 'cursor-not-allowed border-transparent text-slate-600'
                                  : 'border-white/10 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/6'
                        }`}
                    >
                        {warn ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden /> : null}
                        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            {showPanelClose && onClosePanel ? (
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 lg:hidden">
                    <span className="min-w-0 truncate text-[13px] font-semibold text-slate-100">Plan de voyage</span>
                    <button
                        type="button"
                        onClick={onClosePanel}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                        aria-label="Fermer le plan de voyage"
                    >
                        <span className="text-lg leading-none" aria-hidden>
                            ×
                        </span>
                    </button>
                </div>
            ) : null}
            {/* Tabs pour basculer entre les vues */}
            <div className="shrink-0 border-b border-white/10">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setResolvedView('plan')}
                        className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${
                            resolvedActiveView === 'plan'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Étape 1 · Informations essentielles
                    </button>
                    <button
                        type="button"
                        onClick={() => canAccessStep2 && setResolvedView('activity')}
                        disabled={!canAccessStep2}
                        className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${
                            resolvedActiveView === 'activity'
                                ? 'border-b-2 border-cyan-500 text-cyan-400'
                                : canAccessStep2
                                  ? 'text-slate-400 hover:text-slate-200'
                                  : 'cursor-not-allowed text-slate-600'
                        }`}
                    >
                        Étape 2 · Plan de journée
                    </button>
                </div>
            </div>

            {/* Contenu selon la vue active */}
            {resolvedActiveView === 'plan' ? (
                <>
                    {/* Form content - scrollable */}
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                        {planningMode == null ? (
                            isConnected ? (
                                <PlanningModeCards onSelect={onPlanningModeChange} />
                            ) : (
                                <PlanningModeLoginRequired onLoginClick={onLoginClick} />
                            )
                        ) : (
                            <>
                                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                                        <div className="flex shrink-0 items-center border-b border-white/5 px-3 py-2 lg:hidden">
                                            <button
                                                type="button"
                                                onClick={() => setMobileStepsOpen(true)}
                                                className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] font-semibold text-slate-200 transition-colors hover:bg-white/10"
                                            >
                                                <Menu className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                                Étapes du formulaire
                                            </button>
                                        </div>
                                        <TripConfigurationForm
                                            departureCity={state.departureCity}
                                            setDepartureCity={state.setDepartureCity}
                                            arrivalCity={state.arrivalCity}
                                            setArrivalCity={state.setArrivalCity}
                                            setArrivalCityName={state.setArrivalCityName}
                                            onArrivalGeoSelect={onDestinationGeoSelect}
                                            travelDays={state.travelDays}
                                            setTravelDays={state.setTravelDays}
                                            travelerCount={state.travelerCount}
                                            setTravelerCount={state.setTravelerCount}
                                            budget={state.budget}
                                            setBudget={state.setBudget}
                                            activityTime={state.activityTime}
                                            setActivityTime={state.setActivityTime}
                                            arrivalDate={state.outboundDate}
                                            setArrivalDate={state.setOutboundDate}
                                            departureDate={state.returnDate}
                                            setDepartureDate={state.setReturnDate}
                                            outboundDepartureTime={state.outboundDepartureTime}
                                            setOutboundDepartureTime={state.setOutboundDepartureTime}
                                            outboundArrivalTime={state.outboundArrivalTime}
                                            setOutboundArrivalTime={state.setOutboundArrivalTime}
                                            returnDepartureTime={state.returnDepartureTime}
                                            setReturnDepartureTime={state.setReturnDepartureTime}
                                            returnArrivalTime={state.returnArrivalTime}
                                            setReturnArrivalTime={state.setReturnArrivalTime}
                                            selectedOptions={state.selectedOptions}
                                            setSelectedOptions={state.setSelectedOptions}
                                            multiSelectOptions={multiSelectOptions}
                                            dietaryMultiSelectOptions={dietaryMultiSelectOptions}
                                            dietarySelections={state.dietarySelections}
                                            setDietarySelections={state.setDietarySelections}
                                            onOpenFlightSearch={onOpenFlightSearch}
                                            onCloseFlightSearch={onCloseFlightSearch}
                                            flightSearchChecked={isFlightModalOpen}
                                            selectedFlight={selectedFlight}
                                            selectedFlightCarrierName={selectedFlightCarrierName}
                                            onFlightCardClick={onFlightCardClick}
                                            onRemoveFlight={onRemoveFlight}
                                            onOpenHotelSearch={onOpenFlightSearch}
                                            onCloseHotelSearch={onCloseHotelSearch}
                                            hotelSearchChecked={isHotelModalOpen}
                                            selectedHotel={selectedHotel}
                                            onHotelCardClick={onHotelCardClick}
                                            onRemoveHotel={onRemoveHotel}
                                            onBackToPlanningMode={onBackToPlanningMode}
                                            manualFlightEntry={state.manualFlightEntry}
                                            setManualFlightEntry={state.setManualFlightEntry}
                                            manualFlightAirline={state.manualFlightAirline}
                                            setManualFlightAirline={state.setManualFlightAirline}
                                            manualFlightNumber={state.manualFlightNumber}
                                            setManualFlightNumber={state.setManualFlightNumber}
                                            manualFlightNumberReturn={state.manualFlightNumberReturn}
                                            setManualFlightNumberReturn={state.setManualFlightNumberReturn}
                                            manualHotelEntry={state.manualHotelEntry}
                                            setManualHotelEntry={state.setManualHotelEntry}
                                            manualHotelName={state.manualHotelName}
                                            setManualHotelName={state.setManualHotelName}
                                            manualHotelAddress={state.manualHotelAddress}
                                            setManualHotelAddress={state.setManualHotelAddress}
                                            manualHotelCheckIn={state.manualHotelCheckIn}
                                            setManualHotelCheckIn={state.setManualHotelCheckIn}
                                            manualHotelCheckOut={state.manualHotelCheckOut}
                                            setManualHotelCheckOut={state.setManualHotelCheckOut}
                                            planFormStep={planStep}
                                            planFormMaxVisited={planMaxVisited}
                                            onPlanFormStepSelect={selectPlanStep}
                                            stepInvalidHighlight={stepInvalidHighlight}
                                            onOpenAssistant={onOpenAssistant}
                                        />
                                    </div>
                                    {mobileStepsOpen && (
                                        <div className="fixed inset-0 z-[200] lg:hidden">
                                            <button
                                                type="button"
                                                className="absolute inset-0 bg-black/60"
                                                aria-label="Fermer le menu des étapes"
                                                onClick={() => setMobileStepsOpen(false)}
                                            />
                                            <div
                                                className="absolute left-0 top-0 flex h-full w-[min(100%,288px)] flex-col border-r border-white/15 shadow-2xl"
                                                style={{ backgroundColor: 'var(--background, #222222)' }}
                                            >
                                                <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
                                                    <span className="text-[13px] font-semibold text-slate-100">Étapes</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMobileStepsOpen(false)}
                                                        className="rounded-lg px-2 py-1 text-[12px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                                                    >
                                                        Fermer
                                                    </button>
                                                </div>
                                                <div className="min-h-0 flex-1 overflow-y-auto p-2">{renderPlanStepNav()}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* CTA Footer - Plan */}
                    {planningMode != null && (
                    <div className="shrink-0 border-t border-white/10 px-3 py-3">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={goPlanPrev}
                                disabled={planStep === 0}
                                className={`rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all sm:text-[13px] ${
                                    planStep === 0
                                        ? 'cursor-not-allowed border border-transparent bg-white/6 text-slate-600'
                                        : 'border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10 active:scale-[0.98]'
                                }`}
                            >
                                Précédent
                            </button>
                            {planStep < PLAN_FORM_STEP_LAST && (
                                <button
                                    type="button"
                                    onClick={goPlanNext}
                                    className="rounded-xl bg-cyan-500/90 px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-[0.98] sm:text-[13px]"
                                >
                                    Suivant
                                </button>
                            )}
                        </div>
                        {requiredCompleted > 0 && (
                            <div className="mb-2 flex items-center gap-1.5">
                                {Array.from({ length: requiredChecklist.length }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${i < requiredCompleted ? 'bg-cyan-500' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="mb-1 text-[11px] text-slate-400">
                            Champs essentiels complétés: {requiredCompleted}/{requiredChecklist.length}
                        </p>
                        {planStep < PLAN_FORM_STEP_LAST ? (
                            <p className="mb-2 text-[11px] text-slate-500">
                                Parcourez les étapes jusqu&apos;au récapitulatif pour valider sur la carte et générer l&apos;itinéraire. Vol,
                                hébergement et préférences restent facultatifs.
                            </p>
                        ) : (
                            <p className="mb-2 text-[11px] text-slate-500">
                                Récapitulatif : vous pouvez corriger une section via « Modifier » ou lancer la génération ci-dessous.
                            </p>
                        )}
                        {planStep === PLAN_FORM_STEP_LAST && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onValidateChoices}
                                    disabled={!state.arrivalCity.trim() || !onValidateChoices}
                                    className={`min-w-0 flex-1 rounded-xl py-2.5 text-[12px] font-semibold transition-all sm:text-[13px] ${
                                        state.arrivalCity.trim() && onValidateChoices
                                            ? 'border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10 active:scale-[0.98]'
                                            : 'cursor-not-allowed border border-transparent bg-white/6 text-slate-500'
                                    }`}
                                >
                                    Valider mes choix
                                </button>
                                <button
                                    type="button"
                                    onClick={onComplete}
                                    disabled={!hasMinimum || !onComplete}
                                    className={`min-w-0 flex-1 rounded-xl py-2.5 text-[12px] font-semibold transition-all sm:text-[13px] ${
                                        hasMinimum
                                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 active:scale-[0.98]'
                                            : 'cursor-not-allowed bg-white/6 text-slate-400'
                                    }`}
                                >
                                    {hasMinimum ? 'Générer mon itinéraire de base' : 'Complétez départ, destination, dates et voyageurs'}
                                </button>
                            </div>
                        )}
                    </div>
                    )}
                </>
            ) : (
                /* Activité de la journée - POIs sélectionnés sur la carte */
                <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                        {/* En-tête avec sélecteur de jour */}
                        <div className="mb-4 flex flex-col gap-3">
                            {onSelectedDayChange && travelDays > 0 && (
                                <DaySelector
                                    selectedDay={selectedDay}
                                    travelDays={travelDays}
                                    onSelect={onSelectedDayChange}
                                />
                            )}
                            <p className="text-[12px] text-slate-400">
                                Cliquez sur un lieu sur la carte pour l&apos;ajouter à votre journée.
                            </p>
                            {showAiSuggestionButton && (onRequestAiDaySuggestions || onRequestAiAllDaysSuggestions) && (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {onRequestAiDaySuggestions && (
                                        <button
                                            type="button"
                                            onClick={onRequestAiDaySuggestions}
                                            disabled={aiSuggestionsLoading}
                                            className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-left text-[12px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {aiSuggestionsLoading ? 'Suggestions en cours…' : 'Suggestions IA pour ce jour'}
                                        </button>
                                    )}
                                    {onRequestAiAllDaysSuggestions && (
                                        <button
                                            type="button"
                                            onClick={onRequestAiAllDaysSuggestions}
                                            disabled={aiAllDaysSuggestionsLoading}
                                            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-left text-[12px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {aiAllDaysSuggestionsLoading
                                                ? 'Génération du séjour en cours…'
                                                : 'Suggestions IA pour tout le séjour'}
                                        </button>
                                    )}
                                </div>
                            )}
                            <DayPlanActionsDropdown
                                selectedHotel={selectedHotel}
                                onAppendHotelToDay={onAppendHotelToDay}
                                onOpenHotelSearch={onOpenHotelSearch}
                                isFirstTripDay={isFirstTripDay}
                                selectedFlight={selectedFlight}
                                onAppendAirportOutbound={onAppendAirportOutbound}
                                onOpenFlightSearch={onOpenHotelSearch}
                                isLastTripDay={isLastTripDay}
                                canAppendReturnAirport={canAppendReturnAirport}
                                onAppendAirportReturn={onAppendAirportReturn}
                                geocodeAppendPending={geocodeAppendPending}
                            />
                        </div>
                        {dayActivities.length >= 2 && onSelectRouteType && (
                            <div className="mb-4">
                                <p className="mb-2 text-[11px] font-medium text-slate-500">
                                    Itinéraire sur la carte selon le mode choisi ici — chaque bandeau « Trajet » permet un autre mode pour la durée affichée.
                                </p>
                                <div className="flex w-full gap-2">
                                    {(['driving', 'walking', 'cycling'] as const).map((type) => {
                                        const labels = { driving: 'Voiture', walking: 'À pied', cycling: 'Vélo' };
                                        const isActive = selectedRouteType === type;
                                        const route = dayRoutes[type];
                                        const durationMin =
                                            route && route.duration > 0 ? Math.round(route.duration / 60) : null;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => onSelectRouteType(isActive ? null : type)}
                                                title={
                                                    durationMin == null
                                                        ? `${labels[type]} — durée globale indisponible ; le tracé par tronçon peut s’afficher`
                                                        : undefined
                                                }
                                                className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 min-w-0 transition-all active:scale-[0.98] ${
                                                    isActive
                                                        ? 'border-cyan-500/80 bg-cyan-500/20 shadow-md shadow-cyan-500/20'
                                                        : 'border-white/10 bg-slate-800/50 hover:border-white/20 hover:bg-slate-800/80'
                                                }`}
                                            >
                                                {type === 'driving' && (
                                                    <Truck className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                {type === 'walking' && (
                                                    <User className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                {type === 'cycling' && (
                                                    <Bike className={`h-6 w-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                )}
                                                <span className={`text-[11px] font-semibold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                                                    {labels[type]}
                                                </span>
                                                <span className={`text-[13px] font-bold tabular-nums ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                                    {durationMin != null ? `${durationMin} min` : '—'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {dayActivities.length === 0 ? (
                            <p className="text-[13px] text-slate-500 italic">
                                Aucune activité ajoutée.
                            </p>
                        ) : (
                            (() => (
                            <Reorder.Group
                                axis="y"
                                values={dayActivities}
                                onReorder={onReorderDayActivities ?? (() => {})}
                                className="flex flex-col gap-3"
                            >
                                {dayActivities.map((poi, index) => {
                                    const legIdx = index - 1;
                                    const hasRouteData = Object.keys(dayRoutes).length > 0;
                                    const prevLeg =
                                        index > 0 && hasRouteData
                                            ? (() => {
                                                  const activeMode =
                                                      legTransportModes[legIdx] ?? 'driving';
                                                  const dur =
                                                      dayRoutes[activeMode]?.legs?.[legIdx]?.duration ?? 0;
                                                  return {
                                                      legSegmentIndex: legIdx,
                                                      activeMode,
                                                      durationSec: dur,
                                                      dayRoutes,
                                                      onModeChange: onLegTransportChange
                                                          ? (mode: ActivityRouteProfile) =>
                                                                onLegTransportChange(legIdx, mode)
                                                          : undefined,
                                                  };
                                              })()
                                            : null;
                                    return (
                                    <ActivityCard
                                        key={poi._dragId ?? `${poi.lngLat.lng.toFixed(6)}-${poi.lngLat.lat.toFixed(6)}-${index}`}
                                        poi={poi}
                                        index={index}
                                        legFromPrevious={prevLeg}
                                        isTimeAlert={
                                            activityTimeAlertDragId != null &&
                                            poi._dragId === activityTimeAlertDragId
                                        }
                                        onRemove={onRemoveDayActivity ? () => onRemoveDayActivity(index) : undefined}
                                        onDurationHoursChange={
                                            onDayActivityDurationChange
                                                ? (h) => onDayActivityDurationChange(index, h)
                                                : undefined
                                        }
                                        onRegenerateWithAi={
                                            onRegenerateDayActivity ? () => void onRegenerateDayActivity(index) : undefined
                                        }
                                        regenerateLoading={
                                            regeneratingActivity != null &&
                                            regeneratingActivity.day === selectedDay &&
                                            regeneratingActivity.index === index
                                        }
                                    />
                                    );
                                })}
                            </Reorder.Group>
                            ))()
                        )}
                    </div>
                    {onOpenValidateTrip && (
                        <div className="shrink-0 border-t border-white/10 px-3 py-3">
                            <button
                                type="button"
                                onClick={onOpenValidateTrip}
                                disabled={validateTripDisabled}
                                className={`w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                                    validateTripDisabled
                                        ? 'cursor-not-allowed bg-white/6 text-slate-500'
                                        : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 active:scale-[0.98]'
                                }`}
                            >
                                Valider mon voyage
                            </button>
                            <p className="mt-1.5 text-center text-[10px] text-slate-500">
                                Enregistre votre itinéraire dans Mes voyages après confirmation.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
