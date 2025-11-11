import { FC } from 'react';

const PersonIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export interface TravelerCounterProps {
    count?: number;
    onClick?: () => void;
    className?: string;
}

export const TravelerCounter: FC<TravelerCounterProps> = ({
                                                              count = 2, // Par défaut à 2 pour correspondre à l'image
                                                              onClick,
                                                              className = '',
                                                          }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full cursor-pointer ${className}`}
        >
            {PersonIcon}

            <span className="text-gray-700 font-medium">
                {count}
            </span>

        </div>
    );
};