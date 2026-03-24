import { FC, useState, useRef, useEffect } from 'react';

export interface MultiSelectProps {
    options: string[];
    selectedValues?: string[];
    onChange?: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    /** Même look que les inputs du formulaire voyage (bordure, fond, hauteur) */
    variant?: 'default' | 'tripForm';
}

export const MultiSelect: FC<MultiSelectProps> = ({
    options,
    selectedValues = [],
    onChange,
    placeholder = 'Sélectionner...',
    className = '',
    variant = 'default',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(selectedValues);
    const [activeIndex, setActiveIndex] = useState(0);
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

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(0);
        }
    }, [isOpen]);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const removeOption = (option: string, e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const newSelected = selected.filter(item => item !== option);
        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(0);
        }
    };

    const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isOpen || options.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((idx) => (idx + 1) % options.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((idx) => (idx <= 0 ? options.length - 1 : idx - 1));
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const option = options[activeIndex];
            if (option) toggleOption(option);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const ChevronIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 transition-transform duration-200 ${variant === 'tripForm' ? 'h-4 w-4 text-slate-400' : 'h-5 w-5'} ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={variant === 'default' ? { color: 'rgba(255, 255, 255, 0.7)' } : undefined}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );

    const tripFormButtonCls =
        'flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-left text-[13px] text-slate-100 outline-none transition-colors focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30';
    const tripFormOpenBorder = isOpen ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : '';

    return (
        <div className={`relative min-w-0 w-full ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={onTriggerKeyDown}
                className={
                    variant === 'tripForm'
                        ? `${tripFormButtonCls} ${tripFormOpenBorder}`
                        : 'w-full flex items-center justify-between rounded-lg py-2.5 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer'
                }
                style={
                    variant === 'default'
                        ? {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: `1px solid ${isOpen ? 'rgba(0, 150, 199, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                              color: 'var(--foreground, #ededed)',
                          }
                        : undefined
                }
            >
                <div className={`flex min-h-[24px] flex-1 flex-wrap items-center gap-2 ${variant === 'tripForm' ? 'min-h-0' : ''}`}>
                    {selected.length === 0 ? (
                        <span
                            className={variant === 'tripForm' ? 'text-[13px] text-slate-600' : 'text-sm'}
                            style={variant === 'default' ? { color: 'rgba(255, 255, 255, 0.5)' } : undefined}
                        >
                            {placeholder}
                        </span>
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
                                                    removeOption(option, e);
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
                    role="listbox"
                    aria-multiselectable="true"
                    tabIndex={0}
                    onKeyDown={onListKeyDown}
                    className="mt-2 w-full rounded-lg shadow-xl max-h-60 overflow-hidden"
                    style={{
                        backgroundColor: 'var(--background, #222222)',
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
                        {options.map((option, idx) => {
                            const isSelected = selected.includes(option);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`flex w-full items-center px-4 py-3 cursor-pointer transition-colors duration-150 text-left ${activeIndex === idx ? 'ring-1 ring-cyan-500/40' : ''}`}
                                    style={{
                                        color: 'var(--foreground, #ededed)',
                                        backgroundColor: isSelected ? 'rgba(0, 150, 199, 0.15)' : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor =
                                                variant === 'tripForm' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.05)';
                                        }
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
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
