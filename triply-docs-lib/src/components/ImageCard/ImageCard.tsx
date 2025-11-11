import React from 'react';

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
    return (
        <div
            className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out
                  flex flex-col w-64 h-auto overflow-hidden ${className}`}
        >
            <div className="w-full h-40 overflow-hidden">
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover"
                />
            </div>
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
        </div>
    );
};