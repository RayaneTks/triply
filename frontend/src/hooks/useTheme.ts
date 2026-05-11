'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const THEME_EVENT = 'triply-theme-changed';
const STORAGE_KEY = 'triply-theme';

function getInitialTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(next: Theme) {
    if (typeof document === 'undefined') return;
    if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        /* ignore quota / private mode */
    }
    window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: next }));
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('dark');

    useEffect(() => {
        if (typeof document === 'undefined') return;
        setThemeState(getInitialTheme());

        const onThemeChange = (event: Event) => {
            const detail = (event as CustomEvent<Theme>).detail;
            if (detail === 'light' || detail === 'dark') {
                setThemeState(detail);
            }
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return;
            const next: Theme = event.newValue === 'light' ? 'light' : 'dark';
            applyTheme(next);
            setThemeState(next);
        };

        window.addEventListener(THEME_EVENT, onThemeChange);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener(THEME_EVENT, onThemeChange);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const toggle = useCallback(() => {
        setThemeState((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            return next;
        });
    }, []);

    const setTheme = useCallback((next: Theme) => {
        applyTheme(next);
        setThemeState(next);
    }, []);

    return { theme, toggle, setTheme };
}
