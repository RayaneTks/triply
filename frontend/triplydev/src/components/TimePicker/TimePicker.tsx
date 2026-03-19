import { FC, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimePickerProps {
    value?: string;
    onChange?: (time: string) => void;
    className?: string;
    containerStyle?: React.CSSProperties;
    label?: string;
}

const ClockIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TimePicker: FC<TimePickerProps> = ({
    value: propValue = '',
    onChange,
    className = '',
    containerStyle,
    label,
}) => {
    const [internalValue, setInternalValue] = useState(propValue);
    const [isOpen, setIsOpen] = useState(false);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const hoursScrollRef = useRef<HTMLDivElement>(null);
    const minutesScrollRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, right: 0 });

    const value = propValue !== undefined ? propValue : internalValue;

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h || 0);
            setMinutes(m || 0);
        } else {
            const now = new Date();
            setHours(now.getHours());
            setMinutes(now.getMinutes());
        }
    }, [value]);

    useEffect(() => {
        if (isOpen) {
            // Centrer l'heure sélectionnée dans la liste
            setTimeout(() => {
                if (hoursScrollRef.current) {
                    const selectedElement = hoursScrollRef.current.querySelector(`[data-hour="${hours}"]`) as HTMLElement;
                    if (selectedElement) {
                        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                if (minutesScrollRef.current) {
                    const selectedElement = minutesScrollRef.current.querySelector(`[data-minute="${minutes}"]`) as HTMLElement;
                    if (selectedElement) {
                        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
        }
    }, [isOpen, hours, minutes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const clickedOnButton = buttonRef.current?.contains(target);
            const clickedOnModal = target?.closest('[data-time-modal]');
            const clickedOnOverlay = target?.closest('[data-time-overlay]');
            
            if (clickedOnOverlay) {
                setIsOpen(false);
                return;
            }
            
            if (!clickedOnButton && !clickedOnModal) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            
            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    const calculatePosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
        if (!buttonRef.current) return { top: 0, right: 0 };
        const rect = buttonRef.current.getBoundingClientRect();
        const modalWidth = 320;
        const modalHeight = 400;
        const padding = 8;
        
        let top = rect.bottom + window.scrollY + padding;
        let right = window.innerWidth - rect.right + window.scrollX;
        
        if (top + modalHeight > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - modalHeight - padding;
            if (top < window.scrollY) {
                top = window.scrollY + (window.innerHeight - modalHeight) / 2;
            }
        }
        
        if (right + modalWidth > window.innerWidth) {
            right = window.innerWidth - modalWidth - padding;
        }
        
        return { top, right };
    };

    const handleTimeSelect = (selectedHours: number, selectedMinutes: number, closeModal: boolean = false) => {
        const timeString = `${String(selectedHours).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`;
        setInternalValue(timeString);
        onChange?.(timeString);
        if (closeModal) {
            setIsOpen(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue);
        if (newValue) {
            const [h, m] = newValue.split(':').map(Number);
            setHours(h || 0);
            setMinutes(m || 0);
        }
    };

    const renderTimeModal = () => {
        const hourOptions = Array.from({ length: 24 }, (_, i) => i);
        const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

        return (
            <motion.div
                data-time-modal
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="fixed z-[9999] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                style={{
                    backgroundColor: 'var(--background, #222222)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    top: `${position.top}px`,
                    right: `${position.right}px`,
                    width: '320px',
                    position: 'fixed',
                }}
            >
                {/* En-tête */}
                <div 
                    className="relative p-5 border-b"
                    style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    }}
                >
                    <h3 className="text-lg font-semibold tracking-tight text-center" style={{ color: 'var(--foreground, #ededed)' }}>
                        Sélectionner l'heure
                    </h3>
                </div>

                {/* Sélecteurs d'heure et minutes */}
                <div className="p-6">
                    <div className="flex items-center justify-center gap-8 mb-6">
                        {/* Heures */}
                            <div className="flex flex-col items-center">
                            <label className="text-xs font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Heures
                            </label>
                            <div 
                                ref={hoursScrollRef}
                                className="overflow-y-auto max-h-48 rounded-xl"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                <style>{`
                                    [data-hours-scroll]::-webkit-scrollbar {
                                        display: none !important;
                                    }
                                `}</style>
                                <div data-hours-scroll className="flex flex-col gap-1 px-2">
                                    {hourOptions.map((h) => (
                                        <button
                                            key={h}
                                            data-hour={h}
                                            type="button"
                                            onClick={() => {
                                                setHours(h);
                                                handleTimeSelect(h, minutes, false);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                hours === h
                                                    ? 'bg-primary text-white'
                                                    : 'hover:bg-white/10 text-foreground'
                                            }`}
                                            style={{
                                                backgroundColor: hours === h
                                                    ? 'var(--primary, #0096C7)'
                                                    : 'transparent',
                                                color: hours === h
                                                    ? '#ffffff'
                                                    : 'var(--foreground, #ededed)',
                                                boxShadow: hours === h
                                                    ? '0 4px 12px rgba(0, 150, 199, 0.4)'
                                                    : 'none',
                                            }}
                                        >
                                            {String(h).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <span className="text-2xl font-bold" style={{ color: 'var(--foreground, #ededed)' }}>:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <label className="text-xs font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Minutes
                            </label>
                            <div 
                                ref={minutesScrollRef}
                                className="overflow-y-auto max-h-48 rounded-xl"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                <style>{`
                                    [data-minutes-scroll]::-webkit-scrollbar {
                                        display: none !important;
                                    }
                                `}</style>
                                <div data-minutes-scroll className="flex flex-col gap-1 px-2">
                                    {minuteOptions.map((m) => (
                                        <button
                                            key={m}
                                            data-minute={m}
                                            type="button"
                                            onClick={() => {
                                                setMinutes(m);
                                                handleTimeSelect(hours, m, false);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                minutes === m
                                                    ? 'bg-primary text-white'
                                                    : 'hover:bg-white/10 text-foreground'
                                            }`}
                                            style={{
                                                backgroundColor: minutes === m
                                                    ? 'var(--primary, #0096C7)'
                                                    : 'transparent',
                                                color: minutes === m
                                                    ? '#ffffff'
                                                    : 'var(--foreground, #ededed)',
                                                boxShadow: minutes === m
                                                    ? '0 4px 12px rgba(0, 150, 199, 0.4)'
                                                    : 'none',
                                            }}
                                        >
                                            {String(m).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Affichage de l'heure sélectionnée */}
                    <div className="text-center pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleTimeSelect(hours, minutes, true)}
                            className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                            style={{
                                backgroundColor: 'var(--primary, #0096C7)',
                                color: '#ffffff',
                                boxShadow: '0 4px 12px rgba(0, 150, 199, 0.4)',
                            }}
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label className="block text-xs mb-1.5 sm:mb-1" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>
                    {label}
                </label>
            )}
            <div className="input-assistant w-full">
                <input
                    type="time"
                    aria-label={label || "Heure"}
                    value={value}
                    onChange={handleInputChange}
                    className="flex-1 text-sm sm:text-base [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-calendar-picker-indicator]:appearance-none"
                    style={{ 
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                    }}
                />
                <button
                    ref={buttonRef}
                    type="button"
                    aria-label="Sélectionner l'heure"
                    onClick={() => {
                        if (!isOpen) {
                            const pos = calculatePosition(buttonRef);
                            setPosition(pos);
                        }
                        setIsOpen(!isOpen);
                    }}
                    className="ml-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}
                >
                    {ClockIcon}
                </button>
            </div>
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                key="overlay-time"
                                data-time-overlay
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                                style={{ position: 'fixed' }}
                            />
                            {renderTimeModal()}
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
