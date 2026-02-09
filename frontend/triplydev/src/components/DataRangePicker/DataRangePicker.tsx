import { FC, useState, useRef, useEffect } from 'react';
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

const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const calendarRef = useRef<HTMLDivElement>(null);
    
    const startDate = propStartDate !== undefined ? propStartDate : internalStartDate;
    const endDate = propEndDate !== undefined ? propEndDate : internalEndDate;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };

        if (isCalendarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isCalendarOpen]);

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

    const handleDateSelect = (day: number) => {
        const selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (!startDate || (startDate && endDate)) {
            // Si aucune date ou les deux dates sont sélectionnées, commencer par la date de départ
            handleChange('start', selectedDate);
            handleChange('end', '');
        } else if (startDate && !endDate) {
            // Si seule la date de départ est sélectionnée, sélectionner la date de retour
            if (selectedDate >= startDate) {
                handleChange('end', selectedDate);
                setIsCalendarOpen(false);
            } else {
                // Si la date sélectionnée est avant la date de départ, la remplacer
                handleChange('start', selectedDate);
                handleChange('end', '');
            }
        }
    };

    const isDateInRange = (day: number): boolean => {
        if (!startDate || !endDate) return false;
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date >= startDate && date <= endDate;
    };

    const isStartDate = (day: number): boolean => {
        if (!startDate) return false;
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date === startDate;
    };

    const isEndDate = (day: number): boolean => {
        if (!endDate) return false;
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return date === endDate;
    };

    const isDateDisabled = (day: number): boolean => {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        return date < today;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        }
    };

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

    return (
        <div className={`relative ${className}`} ref={calendarRef}>
            <div
                className="flex items-center bg-white border border-gray-300 rounded-lg py-2.5 px-3 md:px-4 shadow-sm w-full overflow-hidden"
                style={containerStyle}
            >
                <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex-shrink-0 mr-2 md:mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}
                >
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
                </button>

                <div className="flex flex-grow justify-between items-center gap-2 md:gap-3 min-w-0 overflow-hidden">
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        <label htmlFor="startDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Départ</label>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => handleChange('start', e.target.value)}
                            className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0"
                            style={{ color: 'var(--foreground, #ededed)', maxWidth: '100%' }}
                        />
                    </div>

                    <span className="flex-shrink-0 px-1 text-xs md:text-sm" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}>→</span>

                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        <label htmlFor="endDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Retour</label>
                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => handleChange('end', e.target.value)}
                            className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0"
                            style={{ color: 'var(--foreground, #ededed)', maxWidth: '100%' }}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isCalendarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCalendarOpen(false)}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            style={{ position: 'fixed' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-50 mt-2 rounded-lg shadow-2xl overflow-hidden"
                            style={{
                                backgroundColor: 'var(--background, #222222)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                                minWidth: '320px',
                                maxWidth: '90vw',
                            }}
                        >
                            {/* En-tête du calendrier */}
                            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                <button
                                    type="button"
                                    onClick={() => navigateMonth('prev')}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    style={{ color: 'var(--foreground, #ededed)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {monthNames[currentMonth]} {currentYear}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => navigateMonth('next')}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    style={{ color: 'var(--foreground, #ededed)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Jours de la semaine */}
                            <div className="grid grid-cols-7 gap-1 p-2">
                                {dayNames.map((day) => (
                                    <div
                                        key={day}
                                        className="text-xs font-medium text-center py-2"
                                        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Grille du calendrier */}
                            <div className="grid grid-cols-7 gap-1 p-2">
                                {emptyDays.map((_, index) => (
                                    <div key={`empty-${index}`} className="aspect-square" />
                                ))}
                                {days.map((day) => {
                                    const disabled = isDateDisabled(day);
                                    const inRange = isDateInRange(day);
                                    const isStart = isStartDate(day);
                                    const isEnd = isEndDate(day);
                                    
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => !disabled && handleDateSelect(day)}
                                            disabled={disabled}
                                            className={`aspect-square rounded-lg text-sm font-medium transition-all duration-150 ${
                                                disabled
                                                    ? 'opacity-30 cursor-not-allowed'
                                                    : 'cursor-pointer hover:opacity-80'
                                            }`}
                                            style={{
                                                color: disabled
                                                    ? 'rgba(255, 255, 255, 0.3)'
                                                    : isStart || isEnd
                                                    ? '#ffffff'
                                                    : 'var(--foreground, #ededed)',
                                                backgroundColor: isStart || isEnd
                                                    ? 'var(--primary, #0096C7)'
                                                    : inRange
                                                    ? 'rgba(0, 150, 199, 0.2)'
                                                    : 'transparent',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!disabled && !isStart && !isEnd) {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!disabled && !isStart && !isEnd) {
                                                    e.currentTarget.style.backgroundColor = inRange ? 'rgba(0, 150, 199, 0.2)' : 'transparent';
                                                }
                                            }}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCalendarOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        color: 'var(--foreground, #ededed)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};