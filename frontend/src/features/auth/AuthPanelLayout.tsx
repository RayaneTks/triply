'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TriplyLogo } from '@/src/components/layout/TriplyLogo';
import { AuthBackgroundMap } from '@/src/features/auth/AuthBackgroundMap';

interface AuthPanelLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  centered?: boolean;
}

export function AuthPanelLayout({ title, subtitle, children, footer, centered = false }: AuthPanelLayoutProps) {
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
        <section className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <button
            type="button"
            onClick={handleBack}
            className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition hover:text-white sm:right-8 sm:top-8"
          >
            <ArrowLeft size={16} aria-hidden />
            Retour
          </button>

          <header className={`mb-8 space-y-6 ${centered ? 'pt-2 text-center' : 'pr-24'}`}>
            <Link href="/" className={`inline-flex ${centered ? 'mx-auto' : ''}`}>
              <TriplyLogo size={48} priority />
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-white">{title}</h1>
              <p className={`mt-2 text-sm text-slate-300 ${centered ? 'mx-auto max-w-sm' : ''}`}>{subtitle}</p>
            </div>
          </header>

          {children}

          <footer className={`mt-8 border-t border-white/10 pt-6 text-sm text-slate-300 ${centered ? 'text-center' : ''}`}>
            {footer}
          </footer>
        </section>
      </div>
    </div>
  );
}
