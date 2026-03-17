import { FC, useState, useRef, useEffect } from 'react';

export interface MultiSelectProps {
    options: string[];
    selectedValues?: string[];
    onChange?: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export const MultiSelect: FC<MultiSelectProps> = ({
    options,
    selectedValues = [],
    onChange,
    placeholder = 'Sélectionner...',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(selectedValues);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelected(selectedValues);
    }, [selectedValues]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const removeOption = (option: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = selected.filter(item => item !== option);
        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const ChevronIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );

    return (
        <div className={`relative min-w-0 w-full ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-lg py-2.5 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${isOpen ? 'rgba(0, 150, 199, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: 'var(--foreground, #ededed)',
                }}
            >
                <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[24px]">
                    {selected.length === 0 ? (
                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{placeholder}</span>
                    ) : (
                        <>
                            {selected.slice(0, 2).map((option) => (
                                    <span
                                        key={option}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                                        style={{
                                            backgroundColor: 'rgba(0, 150, 199, 0.2)',
                                            color: 'var(--foreground, #ededed)',
                                            border: '1px solid rgba(0, 150, 199, 0.3)',
                                        }}
                                    >
                                        <span className="truncate max-w-[80px] sm:max-w-[120px]">{option}</span>
                                        <span
                                            onClick={(e) => removeOption(option, e)}
                                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                                            style={{ color: 'var(--foreground, #ededed)' }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    removeOption(option, e as any);
                                                }
                                            }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </span>
                                    </span>
                            ))}
                            {selected.length > 2 && (
                                <span className="text-xs px-2 py-1 rounded-md" style={{ color: 'rgba(255, 255, 255, 0.7)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    +{selected.length - 2}
                                </span>
                            )}
                        </>
                    )}
                </div>
                {ChevronIcon}
            </button>

            {isOpen && (
                <div
                    className="mt-2 w-full rounded-lg shadow-xl max-h-60 overflow-hidden"
                    style={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <div
                        className="max-h-60 overflow-y-auto multi-select-scroll"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style>{`
                            .multi-select-scroll::-webkit-scrollbar { display: none !important; }
                        `}</style>
                        {options.map((option) => {
                            const isSelected = selected.includes(option);
                            return (
                                <label
                                    key={option}
                                    className="flex items-center px-4 py-3 cursor-pointer transition-colors duration-150"
                                    style={{
                                        color: 'var(--foreground, #ededed)',
                                        backgroundColor: isSelected ? 'rgba(0, 150, 199, 0.15)' : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleOption(option);
                                    }}
                                >
                                    <div className="relative mr-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleOption(option)}
                                            className="sr-only"
                                            tabIndex={-1}
                                        />
                                        <div
                                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150"
                                            style={{
                                                borderColor: isSelected ? 'var(--primary, #0096C7)' : 'rgba(255, 255, 255, 0.3)',
                                                backgroundColor: isSelected ? 'var(--primary, #0096C7)' : 'transparent',
                                            }}
                                        >
                                            {isSelected && (
                                                <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm flex-1">{option}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
