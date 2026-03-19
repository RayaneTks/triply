import { FC, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onDatesChange?: (startDate: string, endDate: string) => void;
    className?: string;
    containerStyle?: React.CSSProperties;
}

const CalendarIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
};

export const DateRangePicker: FC<DateRangePickerProps> = ({
                                                              startDate: propStartDate = '',
                                                              endDate: propEndDate = '',
                                                              onDatesChange,
                                                              className = '',
                                                              containerStyle,
                                                          }) => {
    const [internalStartDate, setInternalStartDate] = useState(propStartDate);
    const [internalEndDate, setInternalEndDate] = useState(propEndDate);
    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
    
    const getInitialMonth = (dateString: string) => {
        if (dateString) {
            const date = new Date(dateString);
            return { month: date.getMonth(), year: date.getFullYear() };
        }
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    };
    
    const [startCalendarMonth, setStartCalendarMonth] = useState(getInitialMonth(propStartDate).month);
    const [startCalendarYear, setStartCalendarYear] = useState(getInitialMonth(propStartDate).year);
    const [endCalendarMonth, setEndCalendarMonth] = useState(getInitialMonth(propEndDate || propStartDate).month);
    const [endCalendarYear, setEndCalendarYear] = useState(getInitialMonth(propEndDate || propStartDate).year);
    const startButtonRef = useRef<HTMLButtonElement>(null);
    const endButtonRef = useRef<HTMLButtonElement>(null);
    const [startCalendarPosition, setStartCalendarPosition] = useState({ top: 0, right: 0 });
    const [endCalendarPosition, setEndCalendarPosition] = useState({ top: 0, right: 0 });
    
    const startDate = propStartDate !== undefined ? propStartDate : internalStartDate;
    const endDate = propEndDate !== undefined ? propEndDate : internalEndDate;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const clickedOnStartButton = startButtonRef.current?.contains(target);
            const clickedOnEndButton = endButtonRef.current?.contains(target);
            const clickedOnCalendar = target?.closest('[data-calendar-modal]');
            const clickedOnOverlay = target?.closest('[data-calendar-overlay]');
            
            // Si on clique sur l'overlay, fermer la modal
            if (clickedOnOverlay) {
                setIsStartCalendarOpen(false);
                setIsEndCalendarOpen(false);
                return;
            }
            
            // Si on clique ailleurs que sur les boutons ou la modal, fermer
            if (!clickedOnStartButton && !clickedOnEndButton && !clickedOnCalendar) {
                setIsStartCalendarOpen(false);
                setIsEndCalendarOpen(false);
            }
        };

        if (isStartCalendarOpen || isEndCalendarOpen) {
            // Utiliser un délai pour éviter que le clic d'ouverture ne ferme immédiatement
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            
            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isStartCalendarOpen, isEndCalendarOpen]);

    const handleChange = (type: 'start' | 'end', value: string) => {
        let newStartDate = startDate;
        let newEndDate = endDate;

        if (type === 'start') {
            newStartDate = value;
            setInternalStartDate(value);
        } else {
            newEndDate = value;
            setInternalEndDate(value);
        }

        onDatesChange?.(newStartDate, newEndDate);
    };

    const calculateCalendarPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
        if (!buttonRef.current) return { top: 0, right: 0 };
        const rect = buttonRef.current.getBoundingClientRect();
        const calendarWidth = 340;
        const calendarHeight = 420;
        const padding = 8;
        
        let top = rect.bottom + window.scrollY + padding;
        let right = window.innerWidth - rect.right + window.scrollX;
        
        if (top + calendarHeight > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - calendarHeight - padding;
            if (top < window.scrollY) {
                top = window.scrollY + (window.innerHeight - calendarHeight) / 2;
            }
        }
        
        if (right + calendarWidth > window.innerWidth) {
            right = window.innerWidth - calendarWidth - padding;
        }
        
        return { top, right };
    };

    const handleStartDateSelect = (day: number) => {
        const selectedDate = `${startCalendarYear}-${String(startCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate >= today) {
            handleChange('start', selectedDate);
            setIsStartCalendarOpen(false);
        }
    };

    const handleEndDateSelect = (day: number) => {
        const selectedDate = `${endCalendarYear}-${String(endCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate >= today && (!startDate || selectedDate >= startDate)) {
            handleChange('end', selectedDate);
            setIsEndCalendarOpen(false);
        }
    };

    const isDateInRange = (day: number, year: number, month: number): boolean => {
        if (!startDate || !endDate) return false;
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date >= startDate && date <= endDate;
    };

    const isStartDate = (day: number, year: number, month: number): boolean => {
        if (!startDate) return false;
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date === startDate;
    };

    const isEndDate = (day: number, year: number, month: number): boolean => {
        if (!endDate) return false;
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date === endDate;
    };

    const isDateDisabled = (day: number, year: number, month: number, isEndCalendar: boolean): boolean => {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        if (date < today) return true;
        if (isEndCalendar && startDate && date < startDate) return true;
        return false;
    };

    const navigateStartMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (startCalendarMonth === 0) {
                setStartCalendarMonth(11);
                setStartCalendarYear(startCalendarYear - 1);
            } else {
                setStartCalendarMonth(startCalendarMonth - 1);
            }
        } else {
            if (startCalendarMonth === 11) {
                setStartCalendarMonth(0);
                setStartCalendarYear(startCalendarYear + 1);
            } else {
                setStartCalendarMonth(startCalendarMonth + 1);
            }
        }
    };

    const navigateEndMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (endCalendarMonth === 0) {
                setEndCalendarMonth(11);
                setEndCalendarYear(endCalendarYear - 1);
            } else {
                setEndCalendarMonth(endCalendarMonth - 1);
            }
        } else {
            if (endCalendarMonth === 11) {
                setEndCalendarMonth(0);
                setEndCalendarYear(endCalendarYear + 1);
            } else {
                setEndCalendarMonth(endCalendarMonth + 1);
            }
        }
    };

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const renderCalendar = (
        year: number,
        month: number,
        isEndCalendar: boolean,
        onDateSelect: (day: number) => void,
        onNavigateMonth: (direction: 'prev' | 'next') => void,
        position: { top: number; right: number }
    ) => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

        return (
            <motion.div
                data-calendar-modal
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
                    width: 'min(340px, calc(100vw - 24px))',
                    maxWidth: '340px',
                    position: 'fixed',
                }}
            >
                {/* En-tête avec gradient */}
                <div 
                    className="relative p-5 border-b"
                    style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => onNavigateMonth('prev')}
                            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                            style={{ color: 'var(--foreground, #ededed)' }}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground, #ededed)' }}>
                            {monthNames[month]} {year}
                        </h3>
                        <button
                            type="button"
                            onClick={() => onNavigateMonth('next')}
                            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                            style={{ color: 'var(--foreground, #ededed)' }}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 px-3 pt-3 pb-2">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className="text-xs font-semibold text-center py-2.5"
                            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1.5 p-3">
                    {emptyDays.map((_, index) => (
                        <div key={`empty-${index}`} className="aspect-square" />
                    ))}
                    {days.map((day) => {
                        const disabled = isDateDisabled(day, year, month, isEndCalendar);
                        const inRange = isDateInRange(day, year, month);
                        const isStart = isStartDate(day, year, month);
                        const isEnd = isEndDate(day, year, month);
                        
                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => !disabled && onDateSelect(day)}
                                disabled={disabled}
                                className={`aspect-square rounded-xl text-sm font-medium transition-all duration-200 ${
                                    disabled
                                        ? 'opacity-20 cursor-not-allowed'
                                        : 'cursor-pointer hover:scale-110 active:scale-95'
                                }`}
                                style={{
                                    color: disabled
                                        ? 'rgba(255, 255, 255, 0.2)'
                                        : isStart || isEnd
                                        ? '#ffffff'
                                        : 'var(--foreground, #ededed)',
                                    backgroundColor: isStart || isEnd
                                        ? 'var(--primary, #0096C7)'
                                        : inRange
                                        ? 'rgba(0, 150, 199, 0.25)'
                                        : 'transparent',
                                    boxShadow: isStart || isEnd
                                        ? '0 4px 12px rgba(0, 150, 199, 0.4)'
                                        : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!disabled && !isStart && !isEnd) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!disabled && !isStart && !isEnd) {
                                        e.currentTarget.style.backgroundColor = inRange ? 'rgba(0, 150, 199, 0.25)' : 'transparent';
                                    }
                                }}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    const SmallCalendarIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );

    return (
        <div
            className={`input-assistant w-full overflow-hidden ${className}`}
            style={containerStyle}
        >
            <div className="flex-shrink-0 mr-2 md:mr-3" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="flex flex-grow justify-between items-center gap-2 md:gap-3 min-w-0 overflow-hidden">
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                    <label htmlFor="startDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Départ</label>
                    <div className="flex items-center">
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => handleChange('start', e.target.value)}
                            className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0 flex-1 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            style={{ 
                                color: 'var(--foreground, #ededed)', 
                                maxWidth: '100%',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield'
                            }}
                        />
                        <button
                            ref={startButtonRef}
                            type="button"
                            aria-label="Sélectionner la date de départ"
                            onClick={() => {
                                if (!isStartCalendarOpen) {
                                    if (startDate) {
                                        const date = new Date(startDate);
                                        setStartCalendarMonth(date.getMonth());
                                        setStartCalendarYear(date.getFullYear());
                                    }
                                    const pos = calculateCalendarPosition(startButtonRef);
                                    setStartCalendarPosition(pos);
                                }
                                setIsStartCalendarOpen(!isStartCalendarOpen);
                                setIsEndCalendarOpen(false);
                            }}
                            className="ml-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                            style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {SmallCalendarIcon}
                        </button>
                    </div>
                    {typeof window !== 'undefined' && createPortal(
                        <AnimatePresence>
                            {isStartCalendarOpen && (
                                <>
                                    <motion.div
                                        key="overlay-start"
                                        data-calendar-overlay
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsStartCalendarOpen(false)}
                                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                                        style={{ position: 'fixed' }}
                                    />
                                    {renderCalendar(
                                        startCalendarYear,
                                        startCalendarMonth,
                                        false,
                                        handleStartDateSelect,
                                        navigateStartMonth,
                                        startCalendarPosition
                                    )}
                                </>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </div>

                <span className="flex-shrink-0 px-1 text-xs md:text-sm" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}>→</span>

                <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                    <label htmlFor="endDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Retour</label>
                    <div className="flex items-center">
                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => handleChange('end', e.target.value)}
                            className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0 flex-1 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            style={{ 
                                color: 'var(--foreground, #ededed)', 
                                maxWidth: '100%',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield'
                            }}
                        />
                        <button
                            ref={endButtonRef}
                            type="button"
                            aria-label="Sélectionner la date de retour"
                            onClick={() => {
                                if (!isEndCalendarOpen) {
                                    if (endDate) {
                                        const date = new Date(endDate);
                                        setEndCalendarMonth(date.getMonth());
                                        setEndCalendarYear(date.getFullYear());
                                    } else if (startDate) {
                                        const date = new Date(startDate);
                                        setEndCalendarMonth(date.getMonth());
                                        setEndCalendarYear(date.getFullYear());
                                    }
                                    const pos = calculateCalendarPosition(endButtonRef);
                                    setEndCalendarPosition(pos);
                                }
                                setIsEndCalendarOpen(!isEndCalendarOpen);
                                setIsStartCalendarOpen(false);
                            }}
                            className="ml-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                            style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {SmallCalendarIcon}
                        </button>
                    </div>
                    {typeof window !== 'undefined' && createPortal(
                        <AnimatePresence>
                            {isEndCalendarOpen && (
                                <>
                                    <motion.div
                                        key="overlay-end"
                                        data-calendar-overlay
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsEndCalendarOpen(false)}
                                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                                        style={{ position: 'fixed' }}
                                    />
                                    {renderCalendar(
                                        endCalendarYear,
                                        endCalendarMonth,
                                        true,
                                        handleEndDateSelect,
                                        navigateEndMonth,
                                        endCalendarPosition
                                    )}
                                </>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </div>
            </div>
        </div>
    );
};