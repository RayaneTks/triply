'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    containerStyle?: React.CSSProperties;
    /** Token Mapbox pour l'API Geocoding */
    mapboxToken: string;
}

interface MapboxFeature {
    id: string;
    place_name: string;
    text: string;
    place_type: string[];
}

export const CityAutocomplete: FC<CityAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Rechercher une ville...',
    label,
    className = '',
    containerStyle,
    mapboxToken,
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
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

    useEffect(() => {
        if (!inputValue.trim() || inputValue.length < 2) {
            setSuggestions([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            setLoading(true);
            fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?access_token=${mapboxToken}&types=place,locality&language=fr&limit=5`
            )
                .then((res) => res.json())
                .then((data) => {
                    setSuggestions(data.features || []);
                    setIsOpen(true);
                })
                .catch(() => setSuggestions([]))
                .finally(() => setLoading(false));
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [inputValue, mapboxToken]);

    const handleSelect = (feature: MapboxFeature) => {
        const name = feature.text || feature.place_name?.split(',')[0] || feature.place_name;
        setInputValue(name);
        onChange(name);
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
            <div
                className="relative rounded-lg border py-2.5 px-4 w-full"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full bg-transparent focus:outline-none text-sm"
                    style={{ color: 'var(--foreground, #ededed)' }}
                />
                <AnimatePresence>
                    {isOpen && (suggestions.length > 0 || loading) && (
                        <motion.ul
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 max-h-48 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--background, #2a2a2a)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        >
                            {loading ? (
                                <li className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    Recherche...
                                </li>
                            ) : (
                                suggestions.map((feature) => (
                                    <li
                                        key={feature.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSelect(feature);
                                        }}
                                        onClick={() => handleSelect(feature)}
                                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-white/10 transition-colors"
                                        style={{ color: 'var(--foreground, #ededed)' }}
                                    >
                                        {feature.text}
                                        {feature.place_name && feature.place_name !== feature.text && (
                                            <span className="block text-xs mt-0.5 opacity-70">
                                                {feature.place_name}
                                            </span>
                                        )}
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
