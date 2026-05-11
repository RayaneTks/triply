import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { SlideDefinition } from './types';

interface SliderMenuProps {
    slides: SlideDefinition[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

export const SliderMenu: React.FC<SliderMenuProps> = ({
                                                          slides,
                                                          currentIndex,
                                                          onSelect,
                                                      }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const menuVariants: Variants = {
        closed: {
            x: "-100%",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                when: "afterChildren",
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        },
        open: {
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                delayChildren: 0.2,
                staggerChildren: 0.07
            }
        }
    };

    const itemVariants: Variants = {
        closed: { x: -20, opacity: 0 },
        open: { x: 0, opacity: 1 }
    };

    return (
        <>
            <motion.button
                className="fixed top-4 left-4 z-[100] p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md border border-slate-200"
                onClick={toggleMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Menu des slides"
                style={{ position: 'fixed' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMenu}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]"
                            style={{ position: 'fixed' }}
                        />

                        <motion.div
                            variants={menuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[100] p-6 flex flex-col"
                            style={{ position: 'fixed' }}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <motion.h2
                                    variants={itemVariants}
                                    className="text-xl font-bold text-slate-800"
                                >
                                    Sommaire
                                </motion.h2>
                                <button onClick={toggleMenu} className="text-slate-500 hover:text-slate-800">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2">
                                {slides.map((slide, index) => (
                                    <motion.button
                                        key={slide.id}
                                        variants={itemVariants}
                                        onClick={() => {
                                            onSelect(index);
                                            setIsOpen(false);
                                        }}
                                        whileHover={{ x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium
                                            ${index === currentIndex
                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                            : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                                        }
                                        `}
                                    >
                                        <span className="opacity-50 mr-2 text-xs">{(index + 1).toString().padStart(2, '0')}</span>
                                        {slide.title}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};