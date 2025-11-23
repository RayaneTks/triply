import React from 'react';
import { motion, Variants } from 'framer-motion';
import { SlideDefinition, SlideDirection } from './types';
import { SlideNavButton } from './SlideNavButton';
import { SliderMenu } from './SliderMenu';

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
            className={`absolute top-0 left-0 w-full h-full bg-white shadow-xl overflow-hidden flex flex-col ${className}`}
        >
            {/* 1. Menu Burger - En haut à gauche */}
            {slides && onJumpTo && (
                // Le composant SliderMenu utilise 'fixed', mais à l'intérieur d'un élément transformé
                // (motion.div), il se comportera comme 'absolute', restant solidaire de la slide.
                <div className="absolute top-0 left-0 z-50">
                    <SliderMenu
                        slides={slides}
                        currentIndex={slideIndex}
                        onSelect={onJumpTo}
                    />
                </div>
            )}

            {/* 2. Contenu Central */}
            <div className="flex-grow w-full h-full overflow-y-auto relative z-0">
                {children}
            </div>

            {/* 3. Boutons de Navigation - En bas à droite (Grands) */}
            {(onPrev || onNext) && (
                <div className="absolute bottom-10 right-10 z-50 flex gap-4 items-center">
                    {onPrev && (
                        <SlideNavButton
                            direction="prev"
                            onClick={onPrev}
                            disabled={!canPrev}
                            className="scale-125 hover:scale-150" // "Assez grand"
                        />
                    )}
                    {onNext && (
                        <SlideNavButton
                            direction="next"
                            onClick={onNext}
                            disabled={!canNext}
                            className="scale-125 hover:scale-150" // "Assez grand"
                        />
                    )}
                </div>
            )}
        </motion.div>
    );
};