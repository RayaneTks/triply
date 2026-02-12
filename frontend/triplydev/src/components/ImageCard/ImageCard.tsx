import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';

export interface ImageCardProps {
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: React.ReactNode;
    buttonText: string;
    onButtonClick: () => void;
    className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
                                                        imageSrc,
                                                        imageAlt,
                                                        title,
                                                        description,
                                                        buttonText,
                                                        onButtonClick,
                                                        className = '',
                                                    }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div
            className={`group w-64 bg-transparent [perspective:1000px] ${className}`}
        >
            <div
                className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 ease-in-out hover:shadow-xl"
            >
                {/* Image fixe - ne bouge jamais */}
                <div
                    className="w-full h-40 flex-shrink-0 overflow-hidden cursor-pointer z-20 relative"
                    onClick={toggleOpen}
                >
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                        {isOpen ? "Fermer" : "Ouvrir"}
                    </div>
                </div>

                {/* Layer qui s'ouvre en dessous - pousse les autres éléments */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                                height: "auto",
                                opacity: 1,
                                transition: {
                                    type: "spring",
                                    bounce: 0.3,
                                    duration: 0.6
                                }
                            }}
                            exit={{
                                height: 0,
                                opacity: 0,
                                transition: {
                                    duration: 0.4,
                                    ease: "easeInOut"
                                }
                            }}
                            className="flex flex-col bg-white origin-top overflow-hidden"
                        >
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {title}
                                </h3>
                                <div className="text-gray-600 text-sm flex-grow mb-4">
                                    {description}
                                </div>
                                <div className="mt-auto">
                                    <Button
                                        label={buttonText}
                                        onClick={onButtonClick}
                                        variant="light"
                                        tone="tone1"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
