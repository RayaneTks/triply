'use client';

import { useEffect, useRef, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

// Bannière "Mode hors-ligne". Charte cyan (--primary). S'affiche en haut quand le
// navigateur perd le réseau, et confirme brièvement le retour en ligne.
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowBackOnline(false);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setShowBackOnline(true);
      const t = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(t);
    }
  }, [online]);

  if (online && !showBackOnline) return null;

  const offline = !online;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white shadow-md"
      style={{
        backgroundColor: offline
          ? 'var(--primary)'
          : 'color-mix(in srgb, var(--primary) 88%, black)',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
      }}
    >
      {offline ? (
        <>
          <CloudOff size={16} aria-hidden />
          <span>Mode hors-ligne — vos voyages enregistrés restent consultables.</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} aria-hidden />
          <span>De retour en ligne — synchronisation en cours…</span>
        </>
      )}
    </div>
  );
}
