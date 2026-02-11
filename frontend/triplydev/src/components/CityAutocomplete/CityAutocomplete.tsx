'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    value: string; // Ce sera le code IATA (ex: "PAR")
    onChange: (iataCode: string) => void; // On renvoie le code IATA
    placeholder?: string;
    label?: string;
    className?: string;
    containerStyle?: React.CSSProperties;
    // Plus besoin de mapboxToken ici
}

export const CityAutocomplete: FC<CityAutocompleteProps> = ({
                                                                value,
                                                                onChange,
                                                                placeholder = 'Rechercher une ville...',
                                                                label,
                                                                className = '',
                                                                containerStyle,
                                                            }) => {
    // displayValue est ce que l'utilisateur voit (ex: "Paris")
    // value est ce que le code utilise (ex: "PAR")
    const [displayValue, setDisplayValue] = useState('');
    const [suggestions, setSuggestions] = useState<AmadeusLocation[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialisation : Si on a un code "PAR", on l'affiche tel quel au début
    // (Pour faire mieux, il faudrait une prop "initialDisplayName" ou faire un fetch inverse)
    useEffect(() => {
        if (value && !displayValue) {
            setDisplayValue(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fonction de recherche déclenchée par la frappe
    const handleInputChange = (text: string) => {
        setDisplayValue(text);

        if (!text.trim() || text.length < 2) {
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setLoading(true);
            // Appel à TON API locale créée à l'étape 1
            fetch(`/api/places/search?keyword=${encodeURIComponent(text)}`)
                .then((res) => res.json())
                .then((data) => {
                    setSuggestions(data || []);
                    setIsOpen(true);
                })
                .catch(() => setSuggestions([]))
                .finally(() => setLoading(false));
        }, 300);
    };

    const handleSelect = (feature: AmadeusLocation) => {
        // On affiche "Paris (PAR)" dans le champ
        const displayName = `${feature.name} (${feature.iataCode})`;
        setDisplayValue(displayName);

        // MAIS on envoie uniquement "PAR" au parent !
        onChange(feature.iataCode);

        setIsOpen(false);
        setSuggestions([]);
    };

    return (
        <div className={`flex flex-col ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium mb-2" style={{ color: containerStyle?.color ?? 'var(--foreground, #ededed)' }}>
                    {label}
                </label>
            )}
            <div className="relative input-assistant w-full">
                <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full bg-transparent focus:outline-none text-sm uppercase placeholder-normal" // Uppercase pour le style aéroport
                    style={{ color: 'var(--foreground, #ededed)' }}
                />
                <AnimatePresence>
                    {isOpen && (suggestions.length > 0 || loading) && (
                        <motion.ul
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 max-h-60 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--background, #2a2a2a)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        >
                            {loading ? (
                                <li className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    Recherche vols...
                                </li>
                            ) : (
                                suggestions.map((feature) => (
                                    <li
                                        key={feature.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleSelect(feature)}
                                        className="px-4 py-2 text-sm cursor-pointer hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                                        style={{ color: 'var(--foreground, #ededed)' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">{feature.address?.cityName || feature.name}</span>
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
                                ))
                            )}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};