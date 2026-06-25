'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button/Button';
import { TriplyLogo } from '@/src/components/layout/TriplyLogo';
import { AuthBackgroundMap } from '@/src/features/auth/AuthBackgroundMap';

interface AuthPanelLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthPanelLayout({ title, subtitle, children, footer }: AuthPanelLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <AuthBackgroundMap />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <header className="mb-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <Link href="/" className="inline-flex">
                <TriplyLogo size={48} priority />
              </Link>
              <Button label="Retour" onClick={handleBack} variant="dark" tone="tone2" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
            </div>
          </header>

          {children}

          <footer className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-300">{footer}</footer>
        </section>
      </div>
    </div>
  );
}
