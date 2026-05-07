'use client';

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark');

    // Garde un rendu initial SSR/client identique, puis synchronise le vrai thème après hydratation.
    useEffect(() => {
        if (typeof document !== 'undefined') {
            setTheme(getInitialTheme());
        }
    }, []);

    const toggle = () => {
        setTheme((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            if (next === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('triply-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('triply-theme', 'dark');
            }
            return next;
        });
    };

    return { theme, toggle };
}
