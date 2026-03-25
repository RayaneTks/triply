'use client';

import { FC, useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

// Interface pour la réponse d'Amadeus
interface AmadeusLocation {
    id: string;
    name: string;
    iataCode: string;
    subType: 'CITY' | 'AIRPORT';
    address?: {
        cityName?: string;
        countryName?: string;
    };
    geoCode?: { latitude: number; longitude: number };
}

export interface CityAutocompleteProps {
    value: string; // Code IATA (ex: "PAR")
    onChange: (iataCode: string) => void;

    // La prop magique pour remonter le nom à l'Assistant
    onSelectName?: (cityName: string) => void;

    /** Coordonnées Amadeus (view=FULL) pour recentrer la carte sur la destination */
    onSelectGeo?: (payload: { latitude: number; longitude: number; iataCode: string; name: string }) => void;

    placeholder?: string;
    label?: string;
    className?: string;
    containerStyle?: React.CSSProperties;
}

export const CityAutocomplete: FC<CityAutocompleteProps> = ({
                                                                value,
                                                                onChange,
                                                                onSelectName,
                                                                onSelectGeo,
                                                                placeholder = 'Rechercher une ville...',
                                                                label,
                                                                className = '',
                                                                containerStyle,
                                                            }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [suggestions, setSuggestions] = useState<AmadeusLocation[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const listboxId = useId();

    const updateDropdownPosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
    };

    useEffect(() => {
        if (isOpen && suggestions.length > 0) {
            updateDropdownPosition();
            const onScrollOrResize = () => updateDropdownPosition();
            window.addEventListener('scroll', onScrollOrResize, true);
            window.addEventListener('resize', onScrollOrResize);
            return () => {
                window.removeEventListener('scroll', onScrollOrResize, true);
                window.removeEventListener('resize', onScrollOrResize);
            };
        } else {
            queueMicrotask(() => setDropdownRect(null));
        }
    }, [isOpen, suggestions.length]);

    // Initialisation : Si le parent envoie une value (ex: FCO), on l'affiche
    // Sauf si on a déjà une valeur d'affichage plus jolie (ex: Rome (FCO))
    useEffect(() => {
        if (value && value !== displayValue && !displayValue.includes(value)) {
            queueMicrotask(() => setDisplayValue(value));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- On ne veut réagir qu'aux changements de value, pas de displayValue
    }, [value]);


    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
        };
    }, []);

    // Fermeture au clic dehors (container + dropdown porté)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inContainer = containerRef.current?.contains(target);
            const inDropdown = dropdownRef.current?.contains(target);
            if (!inContainer && !inDropdown) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // GESTION DE LA SAISIE (AUTOCOMPLETION)
    const handleInputChange = (text: string) => {
        setDisplayValue(text);

        if (!text.trim() || text.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        setIsOpen(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setLoading(true);
            const requestId = ++requestRef.current;
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const url = `/api/places/search?keyword=${encodeURIComponent(text)}`;
            fetch(url, { signal: controller.signal })
                .then((res) => {
                    if (!res.ok) throw new Error('Erreur API');
                    return res.json();
                })
                .then((data) => {
                    if (requestId !== requestRef.current) return;
                    const results = Array.isArray(data) ? data : (data.data || data || []);
                    const filtered = results.filter((r: AmadeusLocation) => r && r.iataCode);
                    setSuggestions(filtered);
                    setActiveIndex(filtered.length > 0 ? 0 : -1);
                })
                .catch((e) => {
                    if (controller.signal.aborted) return;
                    console.error(e);
                    setSuggestions([]);
                    setActiveIndex(-1);
                })
                .finally(() => {
                    if (requestId === requestRef.current) setLoading(false);
                });
        }, 300);
    };

    // GESTION DE LA SÉLECTION
    const handleSelect = (feature: AmadeusLocation) => {
        // 1. On construit le joli nom : "Rome (ROM)"
        const cityName = feature.address?.cityName || feature.name;
        const displayName = `${cityName} (${feature.iataCode})`;

        // 2. On met à jour l'affichage local
        setDisplayValue(displayName);

        // 3. On envoie le CODE IATA au formulaire (pour les vols)
        onChange(feature.iataCode);

        // 4. On envoie le NOM VILLE à l'Assistant (pour le chat)
        if (onSelectName) {
            onSelectName(cityName);
        }

        const g = feature.geoCode;
        if (onSelectGeo && g && typeof g.latitude === 'number' && typeof g.longitude === 'number') {
            onSelectGeo({
                latitude: g.latitude,
                longitude: g.longitude,
                iataCode: feature.iataCode,
                name: cityName,
            });
        }

        setIsOpen(false);
        setSuggestions([]);
        setActiveIndex(-1);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) {
            if (event.key === 'ArrowDown' && suggestions.length > 0) {
                setIsOpen(true);
                setActiveIndex(0);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((idx) => (idx + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((idx) => (idx <= 0 ? suggestions.length - 1 : idx - 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeIndex >= 0) handleSelect(suggestions[activeIndex]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div className={`flex min-w-0 w-full flex-col ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium mb-2" style={{ color: containerStyle?.color ?? 'var(--foreground, #ededed)' }}>
                    {label}
                </label>
            )}
            <div className="relative input-assistant w-full min-w-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => { if(suggestions.length > 0) setIsOpen(true); }}
                    onKeyDown={handleInputKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-transparent focus:outline-none text-sm placeholder-normal"
                    style={{ color: 'var(--foreground, #ededed)' }}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                />

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {isOpen && suggestions.length > 0 && dropdownRect && typeof document !== 'undefined' && createPortal(
                    <div ref={dropdownRef} className="fixed z-[99999]" style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}>
                        <ul
                            id={listboxId}
                            role="listbox"
                            className="rounded-lg overflow-hidden max-h-60 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--background, #222222)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        >
                                {suggestions.map((feature, index) => (
                                    <li
                                        key={feature.id}
                                        id={`${listboxId}-option-${index}`}
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelect(feature);
                                            inputRef.current?.focus();
                                        }}
                                        className={`px-4 py-2 text-sm cursor-pointer transition-colors border-b border-white/5 last:border-0 ${index === activeIndex ? 'bg-white/10' : 'hover:bg-white/10'}`}
                                        style={{ color: 'var(--foreground, #ededed)' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">
                                                {feature.address?.cityName || feature.name}
                                            </span>
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-blue-300">
                                                {feature.iataCode}
                                            </span>
                                        </div>
                                        <div className="text-xs opacity-60 flex gap-2">
                                            <span>{feature.subType === 'AIRPORT' ? '✈️ Aéroport' : '🏙️ Ville'}</span>
                                            <span>•</span>
                                            <span>{feature.address?.countryName}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>,
                        document.body
                    )}
            </div>
        </div>
    );
};
