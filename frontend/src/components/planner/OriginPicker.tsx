'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Plane, AlertTriangle } from 'lucide-react';
import { CityAutocomplete } from '../CityAutocomplete/CityAutocomplete';
import { lookupIata, type AmadeusLocation } from '../../lib/integrations/amadeus';
import { cn } from '../../lib/utils';

export interface OriginValue {
    cityName: string;
    iataCode: string;
    airportName?: string;
    countryName?: string;
    lat?: number;
    lng?: number;
}

interface OriginPickerProps {
    value: OriginValue | null;
    onChange: (value: OriginValue | null) => void;
    /** Free-text input shown in the autocomplete. Tracked separately so the user
     *  can edit before re-selecting (parent owns it). */
    inputValue: string;
    onInputChange: (text: string) => void;
}

/**
 * Wizard step: pick the user's departure city and resolve it to an IATA airport
 * code via the backend lookup (Amadeus → static fallback). Surfaces a clear
 * pill once resolved so the user can confirm the airport before continuing.
 */
export const OriginPicker: FC<OriginPickerProps> = ({ value, onChange, inputValue, onInputChange }) => {
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => () => abortRef.current?.abort(), []);

    const resolveFromKeyword = useCallback(async (keyword: string) => {
        const trimmed = keyword.trim();
        if (trimmed.length < 2) {
            onChange(null);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setResolving(true);
        setError(null);

        try {
            const matches = await lookupIata(trimmed, 'AIRPORT,CITY', controller.signal);
            const first = matches.find((m) => m.iataCode && m.iataCode.length === 3);
            if (!first) {
                onChange(null);
                setError(`Aucun aéroport principal trouvé pour « ${trimmed} ». Essayez un code IATA (CDG, LIS…).`);
                return;
            }
            onChange(mapLocationToValue(first, trimmed));
        } catch (err) {
            if ((err as { name?: string })?.name === 'AbortError') return;
            onChange(null);
            setError('Service de recherche temporairement indisponible. Réessayez dans un instant.');
        } finally {
            setResolving(false);
        }
    }, [onChange]);

    const handleSelectName = useCallback(
        (name: string) => {
            onInputChange(name);
            void resolveFromKeyword(name);
        },
        [onInputChange, resolveFromKeyword],
    );

    return (
        <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-light-muted">Ville de départ</label>
            <CityAutocomplete
                value={inputValue}
                selected={Boolean(value?.iataCode)}
                placeholder="Paris, Lyon, Marseille…"
                onChange={(name) => {
                    onInputChange(name);
                    void resolveFromKeyword(name);
                }}
                onInputChange={(text) => {
                    onInputChange(text);
                    if (value) onChange(null);
                    setError(null);
                }}
                onSelectName={handleSelectName}
            />

            {resolving && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-brand/10 text-brand text-xs font-bold">
                    <Loader2 size={14} className="animate-spin" />
                    Résolution de l’aéroport…
                </div>
            )}

            {!resolving && value && (
                <div
                    role="status"
                    className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-full',
                        'bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold',
                    )}
                >
                    <CheckCircle2 size={14} strokeWidth={2.5} className="text-emerald-600" />
                    <Plane size={14} className="text-emerald-700" />
                    <span>
                        {value.iataCode}
                        {value.airportName ? ` · ${value.airportName}` : ''}
                    </span>
                </div>
            )}

            {!resolving && !value && error && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>{error}</span>
                </div>
            )}

            <p className="text-xs text-light-muted leading-relaxed">
                Triply utilise cette ville pour pré-remplir la recherche de vols dans votre voyage.
            </p>
        </div>
    );
};

function mapLocationToValue(loc: AmadeusLocation, fallbackName: string): OriginValue {
    const cityName = loc.address?.cityName?.trim() || loc.name?.trim() || fallbackName;
    return {
        cityName,
        iataCode: loc.iataCode,
        airportName: loc.name,
        countryName: loc.address?.countryName,
        lat: loc.geoCode?.latitude,
        lng: loc.geoCode?.longitude,
    };
}
