'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'triply-install-dismissed';
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // re-proposer après 14 jours

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Invite d'installation PWA (beforeinstallprompt). Charte cyan, dismissable.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // empêche l'invite mini-infobar par défaut
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* localStorage indisponible : on masque pour la session */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-[80px] z-[55] flex justify-center px-4 lg:bottom-6">
      <div className="triply-card flex w-full max-w-md items-center gap-3 p-3 pr-2 shadow-xl">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
        >
          <Download size={20} className="text-brand" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Installer Triply</p>
          <p className="truncate text-xs text-light-muted">
            Accès rapide et itinéraires hors-ligne, même sans réseau.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void install()}
          className="btn-primary shrink-0 px-4 py-2 text-sm"
        >
          Installer
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ignorer"
          className="shrink-0 rounded-full p-2 text-light-muted transition-colors hover:text-foreground"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
