'use client';

import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Service worker minimal : permet une base pour cache/offline ultérieur.
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}

