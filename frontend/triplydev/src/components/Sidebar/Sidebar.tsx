import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/Button/Button';

export interface SidebarProps {
    children?: React.ReactNode;
    className?: string;
    isCollapsed?: boolean;
    onToggle?: () => void;

    isConnected: boolean;
    onLoginClick: () => void;
    onLogoutClick: () => void;
}

const NAV_ITEMS = [
    { label: 'Accueil', icon: '⌂' },
    { label: 'À propos', icon: 'ℹ' },
    { label: 'Contact', icon: '✉' },
];

export const Sidebar: React.FC<SidebarProps> = ({
                                                    children,
                                                    className = '',
                                                    isCollapsed = false,
                                                    onToggle,
                                                    isConnected,
                                                    onLoginClick,
                                                    onLogoutClick,
                                                }) => {
    return (
        <motion.aside
            className={`h-full relative flex-shrink-0 overflow-hidden flex flex-col ${className}`}
            style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, var(--background, #222222) 100%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
            }}
            animate={{ width: isCollapsed ? '80px' : '280px' }}
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
                                {NAV_ITEMS.map((item) => (
                                    <li key={item.label}>
                                        <button
                                            type="button"
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:bg-white/5"
                                            style={{
                                                color: 'rgba(255, 255, 255, 0.75)',
                                            }}
                                        >
                                            <span className="text-lg opacity-80">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                        </button>
                                    </li>
                                ))}
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
    );
};
