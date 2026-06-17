'use client';

import { useEffect, useState } from 'react';

// Suit l'état réseau du navigateur. Initialise à `true` côté serveur pour éviter
// un flash de bannière offline pendant l'hydratation.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
