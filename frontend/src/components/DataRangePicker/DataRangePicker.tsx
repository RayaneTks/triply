'use client';

import { FC, useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalIsoDate } from '@/src/utils/date';

export interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onDatesChange?: (startDate: string, endDate: string) => void;
    className?: string;
    containerStyle?: React.CSSProperties;
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** Mon=0 ... Sun=6 (French week start). */
function firstDayMondayIndex(year: number, month: number): number {
    const jsDay = new Date(year, month, 1).getDay();
    return (jsDay + 6) % 7;
}

function isoFromYMD(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseInitialMonth(dateString: string): { month: number; year: number } {
    if (dateString) {
        const date = new Date(dateString);
        if (!Number.isNaN(date.getTime())) {
            return { month: date.getMonth(), year: date.getFullYear() };
        }
    }
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

function formatHuman(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CalendarIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const DateRangePicker: FC<DateRangePickerProps> = ({
    startDate: propStartDate = '',
    endDate: propEndDate = '',
    onDatesChange,
    className = '',
    containerStyle,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoverDate, setHoverDate] = useState<string | null>(null);

    const initial = parseInitialMonth(propStartDate);
    const [calMonth, setCalMonth] = useState(initial.month);
    const [calYear, setCalYear] = useState(initial.year);

    const startDate = propStartDate;
    const endDate = propEndDate;
    const today = useMemo(() => getLocalIsoDate(), []);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const computePosition = () => {
        if (!triggerRef.current) return { top: 0, left: 0 };
        const rect = triggerRef.current.getBoundingClientRect();
        const calendarWidth = 340;
        const calendarHeight = 440;
        const padding = 8;

        let top = rect.bottom + window.scrollY + padding;
        let left = rect.left + window.scrollX;

        if (top + calendarHeight > window.innerHeight + window.scrollY) {
            top = Math.max(window.scrollY + padding, rect.top + window.scrollY - calendarHeight - padding);
        }
        if (left + calendarWidth > window.innerWidth + window.scrollX) {
            left = Math.max(padding, window.innerWidth + window.scrollX - calendarWidth - padding);
        }
        return { top, left };
    };

    const openCalendar = () => {
        if (propStartDate) {
            const { month, year } = parseInitialMonth(propStartDate);
            setCalMonth(month);
            setCalYear(year);
        }
        setPosition(computePosition());
        setIsOpen(true);
    };

    const handleDayClick = (iso: string) => {
        if (iso < today) return;

        // Phase 1: no start selected → set start, clear end.
        if (!startDate || (startDate && endDate)) {
            onDatesChange?.(iso, '');
            setHoverDate(null);
            return;
        }

        // Phase 2: start selected, picking end.
        if (iso < startDate) {
            // Click before start → restart selection from this date.
            onDatesChange?.(iso, '');
            return;
        }

        onDatesChange?.(startDate, iso);
        setIsOpen(false);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (calMonth === 0) {
                setCalMonth(11);
                setCalYear(calYear - 1);
            } else {
                setCalMonth(calMonth - 1);
            }
        } else {
            if (calMonth === 11) {
                setCalMonth(0);
                setCalYear(calYear + 1);
            } else {
                setCalMonth(calMonth + 1);
            }
        }
    };

    const clear = () => {
        onDatesChange?.('', '');
        setHoverDate(null);
    };

    const isInRange = (iso: string): boolean => {
        if (!startDate) return false;
        if (endDate) return iso > startDate && iso < endDate;
        if (hoverDate && hoverDate > startDate) return iso > startDate && iso < hoverDate;
        return false;
    };

    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstWeekday = firstDayMondayIndex(calYear, calMonth);
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

    const helperText = !startDate
        ? 'Sélectionnez votre date de départ.'
        : !endDate
        ? 'Sélectionnez votre date de retour.'
        : 'Séjour confirmé.';

    const summaryLabel = startDate && endDate
        ? `${formatHuman(startDate)} → ${formatHuman(endDate)}`
        : startDate
        ? `${formatHuman(startDate)} → …`
        : 'Choisir les dates du séjour';

    return (
        <div className={`relative w-full ${className}`} style={containerStyle}>
            <button
                ref={triggerRef}
                type="button"
                onClick={openCalendar}
                className="input-assistant w-full flex items-center gap-3 text-left"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <span className="text-light-muted flex-shrink-0">{CalendarIcon}</span>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-light-muted">
                        Départ → Retour
                    </span>
                    <span className="text-sm font-bold truncate" style={{ color: containerStyle?.color ?? 'inherit' }}>
                        {summaryLabel}
                    </span>
                </div>
                {(startDate || endDate) && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); clear(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clear(); } }}
                        className="text-xs font-bold text-light-muted hover:text-error px-2 py-1 rounded-lg cursor-pointer"
                        aria-label="Réinitialiser les dates"
                    >
                        Réinitialiser
                    </span>
                )}
            </button>

            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                            />
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-label="Sélection des dates"
                                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                className="fixed z-[9999] rounded-2xl shadow-2xl overflow-hidden"
                                style={{
                                    backgroundColor: 'var(--background, #222222)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                                    top: `${position.top}px`,
                                    left: `${position.left}px`,
                                    width: 'min(340px, calc(100vw - 24px))',
                                }}
                            >
                                <div className="relative p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth('prev')}
                                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                                            style={{ color: 'var(--foreground, #ededed)' }}
                                            aria-label="Mois précédent"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--foreground, #ededed)' }}>
                                            {MONTH_NAMES[calMonth]} {calYear}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth('next')}
                                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                                            style={{ color: 'var(--foreground, #ededed)' }}
                                            aria-label="Mois suivant"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                                        {helperText}
                                    </p>
                                </div>

                                <div className="grid grid-cols-7 gap-1 px-3 pt-3 pb-2">
                                    {DAY_NAMES.map((d) => (
                                        <div key={d} className="text-xs font-semibold text-center py-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1 px-3 pb-3">
                                    {blanks.map((_, i) => <div key={`b-${i}`} className="aspect-square" />)}
                                    {dayCells.map((day) => {
                                        const iso = isoFromYMD(calYear, calMonth, day);
                                        const disabled = iso < today;
                                        const isStart = iso === startDate;
                                        const isEnd = iso === endDate;
                                        const inRange = isInRange(iso);

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => !disabled && handleDayClick(iso)}
                                                onMouseEnter={() => !disabled && setHoverDate(iso)}
                                                onMouseLeave={() => setHoverDate(null)}
                                                disabled={disabled}
                                                className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                                                    disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
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
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                    <button
                                        type="button"
                                        onClick={clear}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                    >
                                        Effacer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: 'var(--primary, #0096C7)',
                                            color: '#ffffff',
                                        }}
                                    >
                                        {startDate && endDate ? 'Valider' : 'Fermer'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
