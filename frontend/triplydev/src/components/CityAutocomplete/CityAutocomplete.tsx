import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchPlaces, type AmadeusLocation } from "../../lib/integrations/amadeus";
import { ApiError, extractErrorMessage } from "../../lib/http";

function formatCityLabel(loc: AmadeusLocation): string {
  const city = loc.address?.cityName ?? "";
  const country = loc.address?.countryName ?? "";
  if (city && country) return `${city}, ${country}`;
  return loc.name || city || country || loc.iataCode || "";
}

export interface CityAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  /** Sélection d'une suggestion Amadeus (optionnel). */
  onSelectLocation?: (loc: AmadeusLocation) => void;
}

export function CityAutocomplete({ value, onChange, onSelectLocation }: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AmadeusLocation[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    void searchPlaces(q.trim(), ac.signal)
      .then((rows) => {
        if (!ac.signal.aborted) {
          setSearchError(null);
          setSuggestions(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((err) => {
        if (!ac.signal.aborted) {
          setSuggestions([]);
          const msg =
            err instanceof ApiError ? extractErrorMessage(err.body) ?? err.message : "Recherche indisponible.";
          setSearchError(msg);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value.length > 1 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Où souhaitez-vous décoller ?"
        className="w-full bg-white border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
        autoComplete="off"
      />
      {open && value.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-border rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          {loading && (
            <div className="px-6 py-4 text-xs font-bold text-light-muted">Recherche…</div>
          )}
          {!loading && searchError && (
            <div className="px-6 py-4 text-xs font-bold text-amber-800 leading-snug">{searchError}</div>
          )}
          {!loading && !searchError && suggestions.length === 0 && (
            <div className="px-6 py-4 text-xs font-bold text-light-muted">Aucun résultat</div>
          )}
          {!loading && !searchError &&
            suggestions.map((loc) => {
              const label = formatCityLabel(loc);
              return (
                <button
                  key={`${loc.id}-${loc.iataCode}`}
                  type="button"
                  className="w-full text-left px-6 py-4 hover:bg-light-bg text-sm font-bold transition-colors border-b border-light-border last:border-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(label);
                    onSelectLocation?.(loc);
                    setOpen(false);
                  }}
                >
                  <span className="block">{label}</span>
                  {loc.subType && (
                    <span className="text-[10px] font-bold uppercase text-light-muted tracking-wider">
                      {loc.subType}
                      {loc.iataCode ? ` · ${loc.iataCode}` : ""}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
