'use client';

import { useSyncExternalStore } from 'react';

/**
 * Souscrit à window.matchMedia (SSR-safe via snapshot false).
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onStoreChange) => {
            if (typeof window === 'undefined') return () => {};
            const m = window.matchMedia(query);
            m.addEventListener('change', onStoreChange);
            return () => m.removeEventListener('change', onStoreChange);
        },
        () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false),
        () => false
    );
}

export const MEDIA_MIN_LG = '(min-width: 1024px)';
export const MEDIA_MIN_XL = '(min-width: 1280px)';
export const MEDIA_MAX_LG = '(max-width: 1023px)';
