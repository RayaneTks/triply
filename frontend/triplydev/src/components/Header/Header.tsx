'use client';

import React from 'react';
import { Bell, HelpCircle, LogOut, User, Menu } from 'lucide-react';
import { Logo } from '../Logo/Logo';
import type { AuthUser } from '@/src/lib/auth-client';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';

export interface HeaderProps {
    user: AuthUser | null;
    isConnected: boolean;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onMenuClick?: () => void;
    isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    user, 
    isConnected, 
    onLoginClick, 
    onLogoutClick,
    onMenuClick,
    isSidebarCollapsed 
}) => {
    const isDesktop = useMediaQuery(MEDIA_MIN_LG);
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    return (
        <header className="fixed top-0 right-0 z-[100] flex h-16 items-center justify-between border-b border-white/5 bg-[#020617]/80 px-6 backdrop-blur-md transition-all duration-300"
                style={{ left: isDesktop ? (isSidebarCollapsed ? '80px' : '280px') : '0px' }}>
            
            {/* Left side: Quick Info / Mobile Menu */}
            <div className="flex items-center gap-4">
                {onMenuClick ? (
                    <button 
                        onClick={onMenuClick}
                        aria-label="Ouvrir le menu"
                        aria-expanded="false"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all lg:hidden"
                    >
                        <Menu size={20} />
                    </button>
                ) : (
                    <div className="lg:hidden" />
                )}
                <div className="flex items-center gap-2 lg:block">
                    <div className="hidden lg:block">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Dashboard</span>
                    </div>
                    <div className="lg:hidden flex items-center gap-2">
                        <Logo size="small" tone="light" />
                        <span className="text-sm font-bold tracking-tight text-white font-chillax">Triply</span>
                    </div>
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Utility Actions */}
                <div className="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-cyan-400 transition-all">
                        <Bell size={18} />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-cyan-400 transition-all">
                        <HelpCircle size={18} />
                    </button>
                </div>

                {isConnected ? (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-semibold text-white">{user?.name}</span>
                            <span className="text-[10px] text-slate-500">{user?.email}</span>
                        </div>
                        
                        {/* User Avatar Dropdown (simplified for now) */}
                        <div className="group relative">
                            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold hover:bg-cyan-500 hover:text-white transition-all">
                                {userInitial}
                            </button>
                            
                            {/* Simple Dropdown on Hover */}
                            <div className="absolute right-0 mt-2 w-48 origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] p-1 shadow-2xl shadow-black/50">
                                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                        <User size={16} /> Profil
                                    </button>
                                    <div className="my-1 h-px bg-white/5" />
                                    <button 
                                        onClick={onLogoutClick}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut size={16} /> Déconnexion
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={onLoginClick}
                        className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-400 active:scale-95 transition-all"
                    >
                        Connexion
                    </button>
                )}
            </div>
        </header>
    );
};
