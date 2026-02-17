'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/Button/Button';

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const m = window.matchMedia(query);
        setMatches(m.matches);
        const h = () => setMatches(m.matches);
        m.addEventListener('change', h);
        return () => m.removeEventListener('change', h);
    }, [query]);
    return matches;
}

const iconSize = 20;

const HomeIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const UserIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ClipboardIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
);

const InfoIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const MailIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const NAV_ITEMS = [
    { label: 'Accueil', Icon: HomeIcon, path: '/' },
    { label: 'Profil', Icon: UserIcon, path: '/profil' },
    { label: 'Mes voyages', Icon: ClipboardIcon, path: '/voyages' },
    { label: 'À propos', Icon: InfoIcon, path: undefined },
    { label: 'Contact', Icon: MailIcon, path: undefined },
];

export interface SidebarProps {
    children?: React.ReactNode;
    className?: string;
    isCollapsed?: boolean;
    onToggle?: () => void;

    isConnected: boolean;
    onLoginClick: () => void;
    onLogoutClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    children,
                                                    className = '',
                                                    isCollapsed = false,
                                                    onToggle,
                                                    isConnected,
                                                    onLoginClick,
                                                    onLogoutClick,
                                                }) => {
    const pathname = usePathname();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const collapsedW = isMobile ? 56 : 80;
    const expandedW = isMobile ? 280 : 280;

    return (
        <>
            {isMobile && !isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}
        <motion.aside
            className={`h-full relative flex-shrink-0 overflow-hidden flex flex-col z-30 md:z-auto ${className}`}
            style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, var(--background, #222222) 100%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: isMobile && !isCollapsed ? '8px 0 32px rgba(0, 0, 0, 0.4)' : '4px 0 24px rgba(0, 0, 0, 0.25)',
            }}
            animate={{ width: isCollapsed ? collapsedW : expandedW }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Header avec logo + toggle */}
            <div
                className={`flex items-center border-b ${isCollapsed ? 'justify-center p-3' : 'justify-between p-4'}`}
                style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
                {!isCollapsed && (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-full h-full flex items-center justify-center overflow-hidden">
                            <img
                                src="/Logo-triply.svg"
                                alt="Triply"
                                width={100}
                                height={36}
                                className="object-contain"
                            />
                        </div>

                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{
                        color: 'var(--foreground, #ededed)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    }}
                    aria-label={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
                >
                    <motion.span
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        ‹
                    </motion.span>
                </button>
            </div>

            <motion.div
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.05 }}
            >
                {children || (
                    <>
                        <nav className="flex-1 py-6 px-4">
                            <ul className="space-y-1">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = item.path ? pathname === item.path : false;
                                    const Icon = item.Icon;
                                    const content = (
                                        <>
                                            <span className="flex-shrink-0 opacity-80" style={{ color: 'inherit' }}>
                                                <Icon />
                                            </span>
                                            <span className="font-medium">{item.label}</span>
                                        </>
                                    );
                                    return (
                                        <li key={item.label}>
                                            {item.path ? (
                                                <Link
                                                    href={item.path}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:bg-white/5 block ${
                                                        isActive ? 'bg-white/10' : ''
                                                    }`}
                                                    style={{
                                                        color: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.75)',
                                                    }}
                                                >
                                                    {content}
                                                </Link>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:bg-white/5"
                                                    style={{ color: 'rgba(255, 255, 255, 0.75)' }}
                                                >
                                                    {content}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div
                            className="p-4 border-t"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
                        >
                            <Button
                                label={isConnected ? 'Déconnexion' : 'Connexion'}
                                onClick={isConnected ? onLogoutClick : onLoginClick}
                                variant="dark"
                                tone="tone1"
                                className="w-full"
                            />
                        </div>
                    </>
                )}
            </motion.div>
        </motion.aside>
        </>
    );
};
