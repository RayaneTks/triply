import { FC, InputHTMLAttributes } from 'react';

export interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
    placeholder?: string;
    className?: string;
}

export const SearchBar: FC<SearchBarProps> = ({
                                                  placeholder = 'Où voulez-vous aller ?',
                                                  className = '',
                                                  ...rest
                                              }) => {
    return (
        <div
            className={`input-assistant flex min-w-0 flex-1 items-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-100 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${className}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
                type="text"
                placeholder={placeholder}
                className="h-10 w-full min-w-0 flex-grow bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                {...rest}
            />
        </div>
    );
};
