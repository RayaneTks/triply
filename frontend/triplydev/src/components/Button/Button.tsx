import React from 'react';

export interface ButtonProps {
    label: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'dark' | 'light';
    tone?: 'tone1' | 'tone2';
    className?: string;
    loading?: boolean;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    type = 'button',
    variant = 'dark',
    tone = 'tone2',
    className = '',
    loading = false,
    disabled = false,
}) => {
    const palette = {
        dark: {
            tone1: 'bg-[var(--primary)] text-white hover:bg-[var(--secondary)]',
            tone2: 'border border-white/10 bg-white/8 text-white hover:bg-white/12',
        },
        light: {
            tone1: 'bg-[var(--primary)] text-white hover:bg-[var(--secondary)]',
            tone2: 'border border-[var(--app-border)] bg-white/90 text-[color:var(--foreground)] hover:bg-white',
        },
    } as const;

    const validVariant = variant === 'light' ? 'light' : 'dark';
    const validTone = tone === 'tone1' ? 'tone1' : 'tone2';
    const visualClass = palette[validVariant][validTone];

    return (
        <div className={className}>
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 ${visualClass}`}
            >
                {loading ? 'Chargement...' : label}
            </button>
        </div>
    );
};
