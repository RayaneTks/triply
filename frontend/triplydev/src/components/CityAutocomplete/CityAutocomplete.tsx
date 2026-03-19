'use client';

import { FC, useState, useRef, useEffect } from 'react';
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
}

export interface CityAutocompleteProps {
    value: string; // Code IATA (ex: "PAR")
    onChange: (iataCode: string) => void;

    // La prop magique pour remonter le nom à l'Assistant
    onSelectName?: (cityName: string) => void;

    placeholder?: string;
    label?: string;
    className?: string;
    containerStyle?: React.CSSProperties;
}

export const CityAutocomplete: FC<CityAutocompleteProps> = ({
                                                                value,
                                                                onChange,
                                                                onSelectName,
                                                                placeholder = 'Rechercher une ville...',
                                                                label,
                                                                className = '',
                                                                containerStyle,
                                                            }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [suggestions, setSuggestions] = useState<AmadeusLocation[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

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
            setDropdownRect(null);
        }
    }, [isOpen, suggestions.length]);

    // Initialisation : Si le parent envoie une value (ex: FCO), on l'affiche
    // Sauf si on a déjà une valeur d'affichage plus jolie (ex: Rome (FCO))
    useEffect(() => {
        if (value && value !== displayValue && !displayValue.includes(value)) {
            setDisplayValue(value);
        }
    }, [value]);

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
            return;
        }

        setIsOpen(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setLoading(true);
            const url = `/api/places/search?keyword=${encodeURIComponent(text)}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) throw new Error('Erreur API');
                    return res.json();
                })
                .then((data) => {
                    const results = Array.isArray(data) ? data : (data.data || data || []);
                    const filtered = results.filter((r: AmadeusLocation) => r && r.iataCode);
                    setSuggestions(filtered);
                })
                .catch((e) => {
                    console.error(e);
                    setSuggestions([]);
                })
                .finally(() => setLoading(false));
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

        setIsOpen(false);
        setSuggestions([]);
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
                    type="text"
                    value={displayValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => { if(suggestions.length > 0) setIsOpen(true); }}
                    placeholder={placeholder}
                    className="w-full bg-transparent focus:outline-none text-sm placeholder-normal uppercase"
                    style={{ color: 'var(--foreground, #ededed)' }}
                />

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {isOpen && suggestions.length > 0 && dropdownRect && typeof document !== 'undefined' && createPortal(
                    <div ref={dropdownRef} className="fixed z-[99999]" style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}>
                        <ul
                            className="rounded-lg overflow-hidden max-h-60 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--background, #222222)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        >
                                {suggestions.map((feature) => (
                                    <li
                                        key={feature.id}
                                        onClick={() => handleSelect(feature)}
                                        className="px-4 py-2 text-sm cursor-pointer hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
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