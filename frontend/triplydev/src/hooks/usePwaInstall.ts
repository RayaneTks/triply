'use client';

import { useCallback, useEffect, useState } from 'react';

type PlatformHint = 'ios' | 'android' | 'desktop' | 'unknown';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function detectPlatformHint(): PlatformHint {
  if (typeof window === 'undefined') return 'unknown';
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (userAgent.includes('android')) return 'android';
  if (/(macintosh|windows|linux)/.test(userAgent)) return 'desktop';
  return 'unknown';
}

function getStandaloneState(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)').matches;
  const safariStandalone =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMediaQuery || safariStandalone;
}

export function usePwaInstall(): {
  canInstall: boolean;
  isStandalone: boolean;
  platformHint: PlatformHint;
  promptInstall: () => Promise<void>;
} {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platformHint, setPlatformHint] = useState<PlatformHint>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const syncStandalone = () => setIsStandalone(getStandaloneState());
    const syncPlatformHint = () => setPlatformHint(detectPlatformHint());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault?.();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      syncStandalone();
    };
    const timer = window.setTimeout(() => {
      syncPlatformHint();
      syncStandalone();
    }, 0);

    standaloneMediaQuery.addEventListener('change', syncStandalone);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(timer);
      standaloneMediaQuery.removeEventListener('change', syncStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canInstall: !isStandalone && deferredPrompt != null,
    isStandalone,
    platformHint,
    promptInstall,
  };
}
