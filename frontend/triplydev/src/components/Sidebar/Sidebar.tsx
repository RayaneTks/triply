'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    LayoutDashboard, 
    Compass, 
    History, 
    Settings, 
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    X
} from 'lucide-react';
import { Logo } from '../Logo/Logo';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isConnected: boolean;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    /** Mobile: ouverture du drawer (overlay) */
    mobileOpen?: boolean;
    /** Mobile: callback fermeture */
    onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    onToggle,
    isConnected,
    onLoginClick,
    onLogoutClick,
    mobileOpen = false,
    onMobileClose
}) => {
    const isDesktop = useMediaQuery(MEDIA_MIN_LG);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
        { icon: Search, label: 'Planifier' },
        { icon: Compass, label: 'Explorer' },
        { icon: History, label: 'Mes voyages' },
        { icon: Settings, label: 'Paramètres' },
    ];

    const closeMobile = () => {
        onMobileClose?.();
    };

    const handleLogin = () => {
        closeMobile();
        onLoginClick();
    };

    const handleLogout = () => {
        closeMobile();
        onLogoutClick();
    };

    if (!isDesktop) {
        return (
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobile}
                            className="fixed inset-0 z-[119] bg-black/60 backdrop-blur-sm"
                            aria-hidden
                        />

                        <motion.aside
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="fixed left-0 top-0 z-[120] flex h-dvh w-[min(320px,86vw)] flex-col border-r border-white/10 bg-[#020617]/95 backdrop-blur-xl"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Menu Triply"
                        >
                            {/* Top bar (logo + close) */}
                            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Logo size="small" tone="light" />
                                    <span className="truncate text-xl font-bold tracking-tight text-white font-chillax">
                                        Triply
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeMobile}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                                    aria-label="Fermer le menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 space-y-1 p-4">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                                            item.active
                                                ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <item.icon size={20} strokeWidth={item.active ? 2 : 1.5} className="shrink-0" />
                                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Bottom auth */}
                            <div className="border-t border-white/5 p-4">
                                {isConnected ? (
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className={`group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all`}
                                    >
                                        <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
                                        <span className="text-sm font-medium">Déconnexion</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleLogin}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-400 transition-all"
                                    >
                                        Connexion
                                    </button>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            className="relative z-[110] flex h-full flex-col border-r border-white/5 bg-[#020617]/95 backdrop-blur-xl transition-all duration-300 ease-in-out"
        >
            {/* Logo Section */}
            <div className="flex h-16 items-center border-b border-white/5 px-6">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    <Logo size="small" tone="light" />
                    {!isCollapsed && (
                        <span className="text-xl font-bold tracking-tight text-white font-chillax">
                            Triply
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        className={`group flex w-full items-center gap-4 rounded-xl px-3 py-3 transition-all duration-200 ${
                            item.active 
                            ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <item.icon size={20} strokeWidth={item.active ? 2 : 1.5} className="shrink-0" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        )}
                        {item.active && !isCollapsed && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section: Auth / Logout */}
            <div className="border-t border-white/5 p-4">
                {isConnected ? (
                    <button
                        onClick={onLogoutClick}
                        className={`group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
                    </button>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-400 transition-all"
                    >
                        {!isCollapsed ? 'Connexion' : <LayoutDashboard size={20} />}
                    </button>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0F172A] text-slate-400 hover:text-white shadow-xl transition-all hover:scale-110"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </motion.aside>
    );
};
