import { FC, InputHTMLAttributes } from 'react';

export interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
    placeholder?: string;
    className?: string;
}

export const SearchBar: FC<SearchBarProps> = ({
                                                  placeholder = 'Où voulez-vous aller?',
                                                  className = '',
                                                  ...rest
                                              }) => {
    return (
        <div
            className={`flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full max-w-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors ${className}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
                type="text"
                placeholder={placeholder}
                className="flex-grow text-gray-700 placeholder-gray-500 focus:outline-none"
                {...rest}
            />
        </div>
    );
};