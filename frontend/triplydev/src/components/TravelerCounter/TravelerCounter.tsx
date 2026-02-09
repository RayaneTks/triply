import { FC, useState } from 'react';

const PersonIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-primary mr-3 flex-shrink-0"
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
    onChange?: (count: number) => void;
    onClick?: () => void;
    className?: string;
    min?: number;
    max?: number;
}

export const TravelerCounter: FC<TravelerCounterProps> = ({
                                                              count: initialCount = 1,
                                                              onChange,
                                                              onClick,
                                                              className = '',
                                                              min = 1,
                                                              max = 20,
                                                          }) => {
    const [count, setCount] = useState(initialCount);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || min;
        const clampedValue = Math.max(min, Math.min(max, value));
        setCount(clampedValue);
        onChange?.(clampedValue);
    };

    return (
        <div
            onClick={onClick}
            className={`flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full ${className}`}
        >
            {PersonIcon}

            <input
                type="number"
                min={min}
                max={max}
                value={count}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className="flex-grow text-gray-700 font-medium focus:outline-none border-none bg-transparent"
                style={{ WebkitAppearance: 'textfield', MozAppearance: 'textfield' }}
            />

        </div>
    );
};