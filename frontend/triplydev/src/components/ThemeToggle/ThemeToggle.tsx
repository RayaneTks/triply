'use client';

import { useTheme } from '@/src/hooks/useTheme';

const SunIcon = () => (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
);

const MoonIcon = () => (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggle } = useTheme();
    const isLight = theme === 'light';

    return (
        <button
            type="button"
            onClick={toggle}
            title={isLight ? 'Mode sombre' : 'Mode clair'}
            aria-label={isLight ? 'Mode sombre' : 'Mode clair'}
            className={`relative flex items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${className}`}
            style={{
                width: '52px',
                height: '28px',
                backgroundColor: isLight ? '#0096C7' : 'rgba(255,255,255,0.15)',
                padding: '3px',
            }}
        >
            {/* Sun icon — left side */}
            <span
                className="flex items-center justify-center absolute"
                style={{
                    left: '7px',
                    color: isLight ? 'white' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.3s',
                }}
            >
                <SunIcon />
            </span>

            {/* Moon icon — right side */}
            <span
                className="flex items-center justify-center absolute"
                style={{
                    right: '7px',
                    color: isLight ? 'rgba(0,150,199,0.4)' : 'white',
                    transition: 'color 0.3s',
                }}
            >
                <MoonIcon />
            </span>

            {/* Sliding knob */}
            <span
                className="block rounded-full shadow-md"
                style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: 'white',
                    transform: isLight ? 'translateX(24px)' : 'translateX(0px)',
                    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                }}
            />
        </button>
    );
}
