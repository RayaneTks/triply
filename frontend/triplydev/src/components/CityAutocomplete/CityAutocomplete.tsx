'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
// AnimatePresence retiré : conflit possible avec createPortal

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
            const rect = containerRef.current?.getBoundingClientRect();
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:useEffect',message:'Portal position',data:{hasContainer:!!containerRef.current,rect:rect?{top:rect.top,bottom:rect.bottom,left:rect.left,width:rect.width}:null,suggestionsLen:suggestions.length},hypothesisId:'E',timestamp:Date.now()})}).catch(()=>{});
            // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:handleInputChange',message:'Early return: text too short',data:{text,length:text.length,trimmed:text.trim()},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsOpen(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setLoading(true);
            const url = `/api/places/search?keyword=${encodeURIComponent(text)}`;
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:fetch',message:'Fetch started',data:{url,keyword:text},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            fetch(url)
                .then((res) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:res',message:'API response',data:{ok:res.ok,status:res.status},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                    if (!res.ok) throw new Error('Erreur API');
                    return res.json();
                })
                .then((data) => {
                    const results = Array.isArray(data) ? data : (data.data || data || []);
                    const filtered = results.filter((r: AmadeusLocation) => r && r.iataCode);
                    const firstRaw = results[0];
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:data',message:'API data received',data:{rawCount:results.length,filteredCount:filtered.length,firstRawKeys:firstRaw?Object.keys(firstRaw):[],firstRawIata:firstRaw?.iataCode??firstRaw?.iata_code},hypothesisId:'C,D',timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                    setSuggestions(filtered);
                })
                .catch((e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:catch',message:'Fetch error',data:{error:String(e)},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
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

                {(() => {
                    const willRender = isOpen && suggestions.length > 0 && dropdownRect && typeof document !== 'undefined';
                    // #region agent log
                    if (isOpen && suggestions.length > 0) fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityAutocomplete.tsx:render',message:'Portal render check',data:{isOpen,suggestionsLen:suggestions.length,hasDropdownRect:!!dropdownRect,willRender},hypothesisId:'E',timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                    return willRender && createPortal(
                    <div ref={dropdownRef} className="fixed z-[99999]" style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}>
                        <ul
                            className="rounded-lg overflow-hidden max-h-60 overflow-y-auto"
                            style={{
                                backgroundColor: '#2a2a2a',
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
                    );
                })()}
            </div>
        </div>
    );
};