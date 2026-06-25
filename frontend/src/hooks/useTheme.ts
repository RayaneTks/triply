'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

const THEME_EVENT = 'triply-theme-changed';
const STORAGE_KEY = 'triply-theme';

function readDomTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setDomTheme(next: Theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (next === 'light') {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
    } else {
        root.removeAttribute('data-theme');
        root.classList.add('dark');
    }
}

function applyTheme(next: Theme) {
    setDomTheme(next);
    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        /* ignore quota / private mode */
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: next }));
    }
}

// Source de vérité côté client : l'attribut data-theme posé sur <html> par le
// script inline du layout (avant hydratation) et mis à jour par applyTheme.
function subscribe(onChange: () => void) {
    if (typeof window === 'undefined') return () => {};

    const onStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY) return;
        // Synchronisation inter-onglets : reflète le nouveau thème sur ce DOM.
        setDomTheme(event.newValue === 'light' ? 'light' : 'dark');
        onChange();
    };

    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener('storage', onStorage);

    return () => {
        window.removeEventListener(THEME_EVENT, onChange);
        window.removeEventListener('storage', onStorage);
    };
}

// getServerSnapshot renvoie toujours 'dark' : c'est ce que rend le SSR (pas de
// document côté serveur). useSyncExternalStore garantit que le premier rendu
// client utilise cette même valeur puis se resynchronise sur le thème réel sans
// déclencher d'avertissement de mismatch d'hydratation.
export function useTheme() {
    const theme = useSyncExternalStore<Theme>(subscribe, readDomTheme, () => 'dark');

    const toggle = useCallback(() => {
        applyTheme(readDomTheme() === 'dark' ? 'light' : 'dark');
    }, []);

    const setTheme = useCallback((next: Theme) => {
        applyTheme(next);
    }, []);

    return { theme, toggle, setTheme };
}
