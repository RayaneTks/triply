'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { TriplyLogo } from './TriplyLogo';
import { SiteFooter } from './SiteFooter';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '../../lib/utils';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/planifier', label: 'Planifier' },
  { href: '/voyages', label: 'Voyages' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/a-propos', label: 'À propos' },
];

interface AppShellProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showBottomNav?: boolean;
  contentClassName?: string;
}

export function AppShell({
  children,
  showFooter = true,
  showBottomNav = true,
  contentClassName,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-light-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Accueil Triply" className="shrink-0">
            <TriplyLogo priority />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-brand/10 text-brand'
                      : 'text-light-muted hover:bg-light-bg hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/profil"
              className={cn(
                'hidden h-9 w-9 items-center justify-center rounded-full border border-light-border bg-card text-light-muted transition-colors hover:border-brand hover:text-brand md:inline-flex',
                pathname === '/profil' && 'border-brand text-brand',
              )}
              aria-label="Mon profil"
              title="Mon profil"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className={cn('flex-1', showBottomNav && 'pb-[80px] lg:pb-0', contentClassName)}>
        {children}
      </main>

      {showFooter && <SiteFooter />}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
