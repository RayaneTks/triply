import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ImageCardProps {
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
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
            className={`group w-64 h-auto bg-transparent [perspective:1000px] ${className}`}
        >
            <div
                className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 ease-in-out hover:shadow-xl"
            >
                <div
                    className="w-full h-40 overflow-hidden cursor-pointer z-20 relative"
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

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, rotateX: -90 }}
                            animate={{
                                height: "auto",
                                opacity: 1,
                                rotateX: 0,
                                transition: {
                                    type: "spring",
                                    bounce: 0.3,
                                    duration: 0.6
                                }
                            }}
                            exit={{
                                height: 0,
                                opacity: 0,
                                rotateX: -90,
                                transition: {
                                    duration: 0.4,
                                    ease: "easeInOut"
                                }
                            }}
                            style={{ transformOrigin: "top" }}
                            className="flex flex-col bg-white origin-top overflow-hidden"
                        >
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {title}
                                </h3>
                                <p className="text-gray-600 text-sm flex-grow mb-4">
                                    {description}
                                </p>
                                <button
                                    onClick={onButtonClick}
                                    className="mt-auto bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
                                >
                                    {buttonText}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};