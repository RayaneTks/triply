import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';

export interface SlidingDoorCardProps {
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
    className?: string;
}

export const SlidingDoorCard: React.FC<SlidingDoorCardProps> = ({
                                                                    imageSrc,
                                                                    imageAlt,
                                                                    title,
                                                                    description,
                                                                    buttonText,
                                                                    onButtonClick,
                                                                    className = '',
                                                                }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            layout
            data-isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            transition={{ layout: { duration: 0.5, type: "spring", bounce: 0.15 } }}
            className={`relative bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer group ${className}`}
            style={{
                width: isOpen ? '600px' : '280px',
                height: '320px'
            }}
        >
            <div className="flex h-full w-full">
                <motion.div
                    layout="position"
                    className="relative h-full flex-shrink-0 overflow-hidden z-10"
                    style={{ width: isOpen ? '40%' : '100%' }}
                >
                    <motion.img
                        src={imageSrc}
                        alt={imageAlt}
                        className="w-full h-full object-cover"
                        animate={{ scale: isOpen ? 1.2 : 1 }}
                        transition={{ duration: 0.8 }}
                    />

                    {!isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center"
                        >
                            <h3 className="text-white text-xl font-bold drop-shadow-md">
                                {title}
                            </h3>
                            <span className="mt-2 text-white/80 text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                Ouvrir
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="flex-grow p-6 flex flex-col justify-between bg-white"
                        >
                            <div>
                                <motion.h3
                                    layout="position"
                                    className="text-2xl font-bold text-gray-800 mb-3"
                                >
                                    {title}
                                </motion.h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <div className="w-full mt-4" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    label={buttonText}
                                    onClick={onButtonClick}
                                    variant="light"
                                    tone="tone1"
                                    className="w-full"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
