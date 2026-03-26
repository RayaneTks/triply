'use client';

import {useState, useCallback, JSX} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type IconName =
    | 'beach'
    | 'mountain'
    | 'city'
    | 'countryside'
    | 'adventurer'
    | 'epicurean'
    | 'contemplative'
    | 'partygoer'
    | 'hiking'
    | 'gastronomy'
    | 'culture'
    | 'watersports'
    | 'nightlife'
    | 'shopping'
    | 'planned'
    | 'spontaneous'
    | 'mixed'
    | 'streetfood'
    | 'finedining'
    | 'homecook'
    | 'adaptive';

function Icon({ name, size = 26 }: { name: IconName; size?: number }) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    const icons: Record<IconName, JSX.Element> = {
        beach: (
            <svg {...props}>
                <path d="M17.5 21H6.5C5.4 21 4.5 20.1 4.5 19V18L12 13L19.5 18V19C19.5 20.1 18.6 21 17.5 21Z" />
                <circle cx="17" cy="5" r="2.5" />
                <path d="M2 21h20" />
            </svg>
        ),
        mountain: (
            <svg {...props}>
                <path d="M8 21L1 21L8.5 7L12 14" />
                <path d="M23 21L11 21L16.5 10L23 21Z" />
                <path d="M16.5 10L14.5 14L18.5 14" />
            </svg>
        ),
        city: (
            <svg {...props}>
                <rect x="3" y="9" width="6" height="12" rx="0.5" />
                <rect x="9" y="3" width="6" height="18" rx="0.5" />
                <rect x="15" y="7" width="6" height="14" rx="0.5" />
                <line x1="5" y1="12" x2="7" y2="12" />
                <line x1="5" y1="15" x2="7" y2="15" />
                <line x1="11" y1="6" x2="13" y2="6" />
                <line x1="11" y1="9" x2="13" y2="9" />
                <line x1="11" y1="12" x2="13" y2="12" />
                <line x1="17" y1="10" x2="19" y2="10" />
                <line x1="17" y1="13" x2="19" y2="13" />
            </svg>
        ),
        countryside: (
            <svg {...props}>
                <path d="M3 21C3 21 5 15 8 15C11 15 9 18 12 18C15 18 13 13 16 13C19 13 21 21 21 21" />
                <path d="M12 6V3" />
                <path d="M12 6C12 6 9 8 9 11" />
                <path d="M12 6C12 6 15 8 15 11" />
                <path d="M12 9C12 9 10 10 10 12" />
                <line x1="2" y1="21" x2="22" y2="21" />
            </svg>
        ),
        adventurer: (
            <svg {...props}>
                <path d="M12 2L15 9H9L12 2Z" />
                <path d="M5 21L12 9L19 21" />
                <path d="M8 16H16" />
                <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
        epicurean: (
            <svg {...props}>
                <path d="M8 2V8C8 10.2 9.8 12 12 12C14.2 12 16 10.2 16 8V2" />
                <line x1="12" y1="12" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
                <line x1="8" y1="5" x2="16" y2="5" />
            </svg>
        ),
        contemplative: (
            <svg {...props}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7V12L15 15" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
        ),
        partygoer: (
            <svg {...props}>
                <path d="M4.5 5L8 21H10L12 10" />
                <path d="M19.5 5L16 21H14L12 10" />
                <path d="M2 5H10" />
                <path d="M14 5H22" />
                <circle cx="6" cy="3" r="1" fill="currentColor" stroke="none" />
                <circle cx="18" cy="3" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
        hiking: (
            <svg {...props}>
                <circle cx="12" cy="4" r="2" />
                <path d="M10 9L8 14L11 13L9 22" />
                <path d="M14 9L16 14L13 13L15 22" />
                <path d="M18 3V10" />
                <path d="M16 5H20" />
            </svg>
        ),
        gastronomy: (
            <svg {...props}>
                <path d="M3 12H21" />
                <path d="M5 12C5 8 8 5 12 5C16 5 19 8 19 12" />
                <path d="M4 15H20" />
                <line x1="12" y1="15" x2="12" y2="19" />
                <line x1="8" y1="19" x2="16" y2="19" />
            </svg>
        ),
        culture: (
            <svg {...props}>
                <path d="M2 20H22" />
                <path d="M4 20V10" />
                <path d="M20 20V10" />
                <path d="M12 3L2 10H22L12 3Z" />
                <line x1="8" y1="10" x2="8" y2="20" />
                <line x1="12" y1="10" x2="12" y2="20" />
                <line x1="16" y1="10" x2="16" y2="20" />
            </svg>
        ),
        watersports: (
            <svg {...props}>
                <path d="M2 18C4 16 6 16 8 18C10 20 12 20 14 18C16 16 18 16 20 18C22 20 22 20 22 20" />
                <path d="M12 14V5" />
                <path d="M12 5L18 9L12 12" />
            </svg>
        ),
        nightlife: (
            <svg {...props}>
                <path d="M12 3C8 3 5 6 5 9C5 12 7.5 14 7.5 18H16.5C16.5 14 19 12 19 9C19 6 16 3 12 3Z" />
                <line x1="9" y1="21" x2="15" y2="21" />
                <line x1="8" y1="18" x2="16" y2="18" />
                <path d="M10 9L12 7L14 9" />
            </svg>
        ),
        shopping: (
            <svg {...props}>
                <path d="M6 6H22L19 16H9L6 6Z" />
                <path d="M6 6L5 2H2" />
                <circle cx="11" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
            </svg>
        ),
        planned: (
            <svg {...props}>
                <rect x="4" y="3" width="16" height="18" rx="1.5" />
                <line x1="8" y1="7" x2="8" y2="7.01" strokeWidth="2" />
                <line x1="11" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="8" y2="11.01" strokeWidth="2" />
                <line x1="11" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="8" y2="15.01" strokeWidth="2" />
                <line x1="11" y1="15" x2="16" y2="15" />
            </svg>
        ),
        spontaneous: (
            <svg {...props}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
        mixed: (
            <svg {...props}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3V12L18.5 8" />
                <path d="M12 12L5.5 16" />
            </svg>
        ),
        streetfood: (
            <svg {...props}>
                <path d="M3 14H21" />
                <path d="M5 14L4 21H20L19 14" />
                <path d="M6 14C6 10 8 8 12 8C16 8 18 10 18 14" />
                <path d="M12 4V8" />
                <path d="M10 4H14" />
            </svg>
        ),
        finedining: (
            <svg {...props}>
                <circle cx="12" cy="13" r="7" />
                <path d="M12 6V3" />
                <path d="M8 3H16" />
                <circle cx="12" cy="13" r="3" />
            </svg>
        ),
        homecook: (
            <svg {...props}>
                <path d="M8 2V6" />
                <path d="M12 2V6" />
                <path d="M16 2V6" />
                <path d="M4 9H20V11C20 16 17 20 12 22C7 20 4 16 4 11V9Z" />
            </svg>
        ),
        adaptive: (
            <svg {...props}>
                <path d="M12 3L14 9H20L15 13L17 19L12 15L7 19L9 13L4 9H10L12 3Z" />
            </svg>
        ),
    };

    return icons[name] || null;
}

interface SlideOption {
    value: string;
    label: string;
    icon: IconName;
    tag: string;
}

interface Slide {
    id: string;
    title: string;
    subtitle: string;
    mode: 'single' | 'multi';
    maxSelect?: number;
    options: SlideOption[];
}

const SLIDES: Slide[] = [
    {
        id: 'environment',
        title: 'Votre décor idéal',
        subtitle: 'Plusieurs choix possibles',
        mode: 'multi',
        maxSelect: 2,
        options: [
            { value: 'beach', label: 'Plage', icon: 'beach', tag: 'plage' },
            { value: 'mountain', label: 'Montagne', icon: 'mountain', tag: 'montagne' },
            { value: 'city', label: 'Ville', icon: 'city', tag: 'ville' },
            { value: 'countryside', label: 'Campagne', icon: 'countryside', tag: 'campagne' },
        ],
    },
    {
        id: 'profile',
        title: 'Quel voyageur êtes-vous\u202F?',
        subtitle: 'Celui qui vous ressemble le plus',
        mode: 'single',
        options: [
            { value: 'adventurer', label: 'Aventurier', icon: 'adventurer', tag: 'aventurier' },
            { value: 'epicurean', label: 'Épicurien', icon: 'epicurean', tag: 'epicurien' },
            { value: 'contemplative', label: 'Contemplatif', icon: 'contemplative', tag: 'contemplatif' },
            { value: 'partygoer', label: 'Fêtard', icon: 'partygoer', tag: 'fetard' },
        ],
    },
    {
        id: 'activities',
        title: 'Vos activités favorites',
        subtitle: 'Choisissez jusqu\'à 3 activités',
        mode: 'multi',
        maxSelect: 3,
        options: [
            { value: 'hiking', label: 'Randonnée', icon: 'hiking', tag: 'randonnee' },
            { value: 'gastronomy', label: 'Gastronomie', icon: 'gastronomy', tag: 'gastronomie' },
            { value: 'culture', label: 'Musées & Culture', icon: 'culture', tag: 'culture' },
            { value: 'watersports', label: 'Sports nautiques', icon: 'watersports', tag: 'nautique' },
            { value: 'nightlife', label: 'Vie nocturne', icon: 'nightlife', tag: 'nightlife' },
            { value: 'shopping', label: 'Shopping', icon: 'shopping', tag: 'shopping' },
        ],
    },
    {
        id: 'pace',
        title: 'Votre rythme de voyage',
        subtitle: 'Comment vous organisez vos journées',
        mode: 'single',
        options: [
            { value: 'planned', label: 'Programme millimétré', icon: 'planned', tag: 'planifie' },
            { value: 'spontaneous', label: 'Au feeling', icon: 'spontaneous', tag: 'spontane' },
            { value: 'mixed', label: 'Un mix des deux', icon: 'mixed', tag: 'flexible' },
        ],
    },
    {
        id: 'food',
        title: 'Côté food\u202F?',
        subtitle: 'Votre approche culinaire en voyage',
        mode: 'single',
        options: [
            { value: 'streetfood', label: 'Street food locale', icon: 'streetfood', tag: 'streetfood' },
            { value: 'finedining', label: 'Restaurants gastro', icon: 'finedining', tag: 'gastro' },
            { value: 'homecook', label: 'Je cuisine sur place', icon: 'homecook', tag: 'homecook' },
            { value: 'adaptive', label: 'Je m\'adapte', icon: 'adaptive', tag: 'adaptable' },
        ],
    },
];

export interface PreferencesPayload {
    environments: string[];
    traveler_profile: string | null;
    interests: string[];
    pace: string | null;
    food_preference: string | null;
}

export { PREFERENCES_STORAGE_KEY } from '@/src/lib/preferences-storage';

export function preferencesPayloadToAssistantTags(p: PreferencesPayload): string[] {
    const out: string[] = [...(p.environments ?? [])];
    if (p.traveler_profile) out.push(p.traveler_profile);
    out.push(...(p.interests ?? []));
    if (p.pace) out.push(p.pace);
    if (p.food_preference) out.push(p.food_preference);
    return out;
}

export interface TuPreferesProps {
    visible: boolean;
    onComplete: (preferences: PreferencesPayload) => void;
    onSkip: () => void;
    initialValues?: Partial<PreferencesPayload>;
}

function tagsToValues(slideId: string, tags: string[]): string[] {
    const slideData = SLIDES.find((s) => s.id === slideId);
    if (!slideData) return [];
    return tags
        .map((tag) => slideData.options.find((o) => o.tag === tag)?.value)
        .filter((v): v is string => !!v);
}

function buildInitialSelections(values?: Partial<PreferencesPayload>): Record<string, string[]> {
    if (!values) return {};
    const result: Record<string, string[]> = {};

    if (values.environments?.length) {
        result.environment = tagsToValues('environment', values.environments);
    }
    if (values.traveler_profile) {
        result.profile = tagsToValues('profile', [values.traveler_profile]);
    }
    if (values.interests?.length) {
        result.activities = tagsToValues('activities', values.interests);
    }
    if (values.pace) {
        result.pace = tagsToValues('pace', [values.pace]);
    }
    if (values.food_preference) {
        result.food = tagsToValues('food', [values.food_preference]);
    }

    return result;
}

export function TuPreferes({ visible, onComplete, onSkip, initialValues }: TuPreferesProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);
    const [selections, setSelections] = useState<Record<string, string[]>>(buildInitialSelections(initialValues));

    const slide = SLIDES[currentSlide];
    const totalSlides = SLIDES.length;
    const currentSelections = selections[slide.id] || [];
    const canProceed = currentSelections.length > 0;

    const handleSelect = useCallback(
        (value: string) => {
            setSelections((prev) => {
                const current = prev[slide.id] || [];
                if (slide.mode === 'single') {
                    return { ...prev, [slide.id]: [value] };
                }
                if (current.includes(value)) {
                    return { ...prev, [slide.id]: current.filter((v) => v !== value) };
                }
                if (slide.maxSelect && current.length >= slide.maxSelect) {
                    return { ...prev, [slide.id]: [...current.slice(1), value] };
                }
                return { ...prev, [slide.id]: [...current, value] };
            });
        },
        [slide.id, slide.mode, slide.maxSelect],
    );

    const getTagsForSlide = useCallback(
        (slideId: string): string[] => {
            const selected = selections[slideId] || [];
            const slideData = SLIDES.find((s) => s.id === slideId);
            if (!slideData) return [];
            return selected
                .map((val) => slideData.options.find((o) => o.value === val)?.tag)
                .filter((t): t is string => !!t);
        },
        [selections],
    );

    const buildPayload = useCallback((): PreferencesPayload => {
        return {
            environments: getTagsForSlide('environment'),
            traveler_profile: getTagsForSlide('profile')[0] ?? null,
            interests: getTagsForSlide('activities'),
            pace: getTagsForSlide('pace')[0] ?? null,
            food_preference: getTagsForSlide('food')[0] ?? null,
        };
    }, [getTagsForSlide]);

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setDirection(1);
            setCurrentSlide((p) => p + 1);
        } else {
            onComplete(buildPayload());
        }
    };

    const handleBack = () => {
        if (currentSlide > 0) {
            setDirection(-1);
            setCurrentSlide((p) => p - 1);
        }
    };

    const handleSkipAll = () => {
        onComplete(buildPayload());
    };

    const handleSkipSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setDirection(1);
            setCurrentSlide((p) => p + 1);
        } else {
            handleSkipAll();
        }
    };

    if (!visible) return null;

    const slideVariants = {
        enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
    };

    const isLastSlide = currentSlide === totalSlides - 1;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                        className="w-full max-w-md overflow-hidden relative"
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                        }}
                    >
                        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {SLIDES.map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-1 rounded-full transition-all duration-500"
                                        style={{
                                            width: i === currentSlide ? '28px' : '8px',
                                            backgroundColor:
                                                i <= currentSlide
                                                    ? '#0096c7'
                                                    : 'rgba(255,255,255,0.12)',
                                        }}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleSkipAll}
                                className="text-xs tracking-wide uppercase transition-colors"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                            >
                                Tout passer
                            </button>
                        </div>

                        <div className="px-6" style={{ minHeight: '380px' }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={slide.id}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                >
                                    <div className="mb-6">
                                        <p
                                            className="text-xs uppercase tracking-widest mb-2"
                                            style={{ color: '#0096c7' }}
                                        >
                                            {currentSlide + 1}/{totalSlides}
                                        </p>
                                        <h2
                                            className="text-2xl font-semibold tracking-tight"
                                            style={{ color: '#ffffff' }}
                                        >
                                            {slide.title}
                                        </h2>
                                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {slide.subtitle}
                                        </p>
                                    </div>

                                    <div
                                        className={`grid gap-2.5 ${slide.options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}
                                    >
                                        {slide.options.map((option) => {
                                            const selected = currentSelections.includes(option.value);
                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleSelect(option.value)}
                                                    whileTap={{ scale: 0.96 }}
                                                    className="flex flex-col items-center justify-center gap-2.5 rounded-2xl transition-all duration-200"
                                                    style={{
                                                        padding: slide.options.length <= 4 ? '22px 12px' : '16px 8px',
                                                        backgroundColor: selected
                                                            ? 'rgba(0, 150, 199, 0.12)'
                                                            : 'rgba(255,255,255,0.03)',
                                                        border: `1.5px solid ${selected ? '#0096c7' : 'rgba(255,255,255,0.06)'}`,
                                                        color: selected ? '#ffffff' : 'rgba(255,255,255,0.45)',
                                                    }}
                                                >
                                                    <span
                                                        className="transition-all duration-200"
                                                        style={{
                                                            opacity: selected ? 1 : 0.7,
                                                            transform: selected ? 'scale(1.1)' : 'scale(1)',
                                                        }}
                                                    >
                                                        <Icon
                                                            name={option.icon}
                                                            size={slide.options.length <= 4 ? 28 : 22}
                                                        />
                                                    </span>
                                                    <span
                                                        className="font-medium leading-tight text-center"
                                                        style={{
                                                            fontSize: slide.options.length <= 4 ? '13px' : '11px',
                                                        }}
                                                    >
                                                        {option.label}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-center mt-4">
                                        <button
                                            type="button"
                                            onClick={handleSkipSlide}
                                            className="text-xs transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                                        >
                                            Passer cette question →
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="px-6 pb-6 pt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentSlide === 0}
                                className="h-11 w-11 flex items-center justify-center rounded-xl transition-colors"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: currentSlide === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                                    cursor: currentSlide === 0 ? 'default' : 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    if (currentSlide > 0) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!canProceed}
                                className="flex-1 h-11 rounded-xl font-medium text-sm transition-all duration-300"
                                style={{
                                    backgroundColor: canProceed ? '#0096c7' : 'rgba(255,255,255,0.05)',
                                    color: canProceed ? '#ffffff' : 'rgba(255,255,255,0.2)',
                                    cursor: canProceed ? 'pointer' : 'default',
                                    border: canProceed ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                {isLastSlide ? 'Découvrir mes recommandations' : 'Continuer'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}