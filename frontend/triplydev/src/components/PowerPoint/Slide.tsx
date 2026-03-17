import React, { createContext, useContext } from 'react';
import { motion, Variants } from 'framer-motion';
import { SlideDefinition, SlideDirection } from './types';
import { SliderMenu } from './SliderMenu';

// Contexte pour la dernière slide
interface SlideContextType {
    isLastSlide: boolean;
}

const SlideContext = createContext<SlideContextType>({ isLastSlide: false });
export const useSlideContext = () => useContext(SlideContext);

interface SlideProps {
    children: React.ReactNode;
    direction: SlideDirection;
    className?: string;

    // Props de Navigation
    onNext?: () => void;
    onPrev?: () => void;
    canNext?: boolean;
    canPrev?: boolean;

    // Props du Menu
    slides?: SlideDefinition[];
    slideIndex?: number;
    onJumpTo?: (index: number) => void;
}

const variants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
        zIndex: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
    })
};

export const Slide: React.FC<SlideProps> = ({
                                                children,
                                                direction,
                                                className = '',
                                                onNext,
                                                onPrev,
                                                canNext = true,
                                                canPrev = true,
                                                slides,
                                                slideIndex = 0,
                                                onJumpTo
                                            }) => {
    // Détecter si c'est la dernière slide
    const isLastSlide: boolean = canNext === false || (slides !== undefined && slideIndex === slides.length - 1);
    const isFirstSlide = slideIndex === 0;
    const bgColor = 'var(--background, #222222)';
    const useLastSlideTextStyle = false; // Toutes les slides utilisent le fond sombre
    
    return (
        <motion.div
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.4 }
            }}
            className={`absolute top-0 left-0 w-full h-full shadow-xl overflow-x-hidden overflow-y-hidden flex flex-col min-w-0 ${className}`}
            style={{ backgroundColor: bgColor }}
        >
            {/* 1. Menu Burger - En haut à gauche */}
            {slides && onJumpTo && (
                <div className="absolute top-0 left-0 z-[100] pointer-events-none">
                    <div className="pointer-events-auto">
                        <SliderMenu
                            slides={slides}
                            currentIndex={slideIndex}
                            onSelect={onJumpTo}
                        />
                    </div>
                </div>
            )}

            {/* 2. Contenu Central */}
            <SlideContext.Provider value={{ isLastSlide }}>
                {useLastSlideTextStyle && (
                    <style>{`
                        [data-last-slide="true"],
                        [data-last-slide="true"] *,
                        [data-last-slide="true"] h1,
                        [data-last-slide="true"] h2,
                        [data-last-slide="true"] h3,
                        [data-last-slide="true"] h4,
                        [data-last-slide="true"] h5,
                        [data-last-slide="true"] h6,
                        [data-last-slide="true"] p,
                        [data-last-slide="true"] span,
                        [data-last-slide="true"] div,
                        [data-last-slide="true"] a,
                        [data-last-slide="true"] button,
                        [data-last-slide="true"] label {
                            color: #222222 !important;
                        }
                    `}</style>
                )}
                <div 
                    className="flex-grow w-full h-full min-w-0 overflow-x-hidden overflow-y-auto relative z-0 slide-scroll"
                    data-last-slide={useLastSlideTextStyle.toString()}
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style>{`
                        .slide-scroll::-webkit-scrollbar {
                            display: none !important;
                        }
                    `}</style>
                    {children}
                </div>
            </SlideContext.Provider>

            {/* 3. Bouton de Navigation - En haut à droite */}
            {(onNext || onPrev) && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={useLastSlideTextStyle && onPrev ? onPrev : onNext}
                        disabled={useLastSlideTextStyle ? !canPrev : !canNext}
                        className={`
                            p-2 rounded-full flex items-center justify-center transition-colors
                            disabled:opacity-30 disabled:cursor-not-allowed
                            ${useLastSlideTextStyle ? 'text-slate-800' : 'text-white'}
                            hover:bg-white/10
                        `}
                        style={{
                            backgroundColor: useLastSlideTextStyle ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        }}
                        aria-label={useLastSlideTextStyle ? "Précédent" : "Suivant"}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={useLastSlideTextStyle ? "transform rotate-180" : ""}
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};