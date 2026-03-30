'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BriefcaseBusiness, ChevronLeft, LogIn, LogOut, Sparkles, UserRound } from 'lucide-react';
import { Logo } from '@/src/components/Logo/Logo';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';
import type { AuthUser } from '@/src/lib/auth-client';

export type AppTab = 'planifier' | 'voyages' | 'profil';

interface AppShellProps {
  activeTab: AppTab;
  title: string;
  subtitle?: string;
  user?: AuthUser | null;
  isConnected?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  showTabs?: boolean;
  fullBleed?: boolean;
  contentClassName?: string;
}

type NavItem = {
  id: AppTab;
  href: string;
  label: string;
  icon: typeof Sparkles;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'planifier', href: '/', label: 'Planifier', icon: Sparkles },
  { id: 'voyages', href: '/voyages', label: 'Voyages', icon: BriefcaseBusiness },
  { id: 'profil', href: '/profil', label: 'Profil', icon: UserRound },
];

function joinClasses(...values: Array<string | null | undefined | false>): string {
  return values.filter(Boolean).join(' ');
}

function renderUserBadge(user?: AuthUser | null): string {
  if (!user?.name) return '?';
  return user.name.trim().charAt(0).toUpperCase();
}

export function AppShell({
  activeTab,
  title,
  subtitle,
  user,
  isConnected = false,
  onLoginClick,
  onLogoutClick,
  backHref,
  backLabel = 'Retour',
  actions,
  children,
  showTabs = true,
  fullBleed = false,
  contentClassName,
}: AppShellProps) {
  const isDesktop = useMediaQuery(MEDIA_MIN_LG);
  const userBadge = renderUserBadge(user);

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[color:var(--foreground)]">
      <div className="flex min-h-dvh">
        <aside className="hidden lg:flex lg:w-[108px] lg:flex-col lg:border-r lg:border-[var(--app-border)] lg:bg-white/55 lg:backdrop-blur-xl">
          <div className="flex h-[88px] items-center justify-center border-b border-[var(--app-border)]">
            <Link
              href="/"
              className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#0b1f33]/12 bg-[#0b1f33] shadow-[var(--shadow-sm)]"
              aria-label="Triply"
            >
              <Logo size="small" tone="dark" width={44} height={44} />
            </Link>
          </div>

          <nav className="flex flex-1 flex-col items-center gap-3 px-3 py-5" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={joinClasses(
                    'flex w-full flex-col items-center gap-2 rounded-[1.5rem] px-3 py-4 text-center text-xs font-semibold transition-all',
                    active
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                      : 'bg-white/70 text-[color:var(--app-muted)] hover:bg-white hover:text-[color:var(--foreground)]'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[color:var(--app-surface-elevated)]/96 backdrop-blur-xl"
            style={{ paddingTop: 'calc(0.85rem + env(safe-area-inset-top))' }}
          >
            <div className="flex items-start justify-between gap-3 px-4 pb-4 md:px-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-3">
                  {backHref ? (
                    <Link
                      href={backHref}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white/80 text-[color:var(--foreground)] transition-colors hover:bg-white"
                      aria-label={backLabel}
                    >
                      <ChevronLeft size={18} />
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0b1f33]/12 bg-[#0b1f33] shadow-[var(--shadow-sm)]"
                      aria-label="Triply"
                    >
                      <Logo size="small" tone="dark" width={36} height={36} />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--app-muted)]">
                      Triply
                    </p>
                    <h1 className="truncate text-xl font-semibold text-[color:var(--foreground)] sm:text-2xl">{title}</h1>
                  </div>
                </div>
                {subtitle ? (
                  <p className="hidden max-w-xl text-sm leading-relaxed text-[color:var(--app-muted)] md:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {actions}
                {isConnected ? (
                  <>
                    {isDesktop && user ? (
                      <div className="hidden text-right lg:block">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">{user.name}</p>
                        <p className="text-xs text-[color:var(--app-muted)]">{user.email}</p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={onLogoutClick}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white/85 px-3 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-white"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                        {userBadge}
                      </span>
                      {isDesktop ? <LogOut size={16} /> : null}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                  >
                    <LogIn size={16} />
                    <span className="hidden sm:inline">Connexion</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          <main
            className={joinClasses(
              'min-h-0 flex-1 pb-28 lg:pb-8',
              fullBleed ? 'px-0' : 'px-4 py-5 md:px-6 md:py-6',
              contentClassName
            )}
          >
            {fullBleed ? children : <div className="mx-auto w-full max-w-7xl">{children}</div>}
          </main>
        </div>
      </div>

      {showTabs ? (
        <nav
          className="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border border-[var(--app-border)] bg-[color:var(--app-surface-elevated)]/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl lg:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
          aria-label="Navigation principale"
        >
          <div className="grid grid-cols-3 gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={joinClasses(
                    'flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[0.72rem] font-semibold transition-all',
                    active
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                      : 'text-[color:var(--app-muted)] hover:bg-white hover:text-[color:var(--foreground)]'
                  )}
                >
                  <Icon size={18} />
                  <span className="mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
