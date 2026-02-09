import React from 'react';
import { motion } from 'framer-motion';

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
    return (
        <motion.aside
            className={`h-full relative flex-shrink-0 ${className}`}
            style={{
                backgroundColor: 'var(--background, #222222)',
                boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
            }}
            animate={{ width: isCollapsed ? '64px' : '256px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {/* Toggle */}
            <button
                onClick={onToggle}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-700"
                style={{ color: 'var(--foreground, #ededed)' }}
            >
                {isCollapsed ? '>' : '<'}
            </button>

            <motion.div
                className="p-6 h-full flex flex-col overflow-hidden"
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {children || (
                    <>
                        {/* HAUT */}
                        <nav className="space-y-4">
                            <h2
                                className={`text-lg font-semibold mb-4 ${isCollapsed ? 'hidden' : ''}`}
                                style={{ color: 'var(--foreground, #ededed)' }}
                            >
                                Navigation
                            </h2>

                            <ul className="space-y-2">
                                <li>{!isCollapsed && 'Accueil'}</li>
                                <li>{!isCollapsed && 'À propos'}</li>
                                <li>{!isCollapsed && 'Contact'}</li>
                            </ul>
                        </nav>

                        {/* BAS */}
                        <div className="mt-auto pt-4 border-t border-white/10">
                            <button
                                onClick={isConnected ? onLogoutClick : onLoginClick}
                                className="w-full text-left hover:text-primary"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            >
                                {!isCollapsed && (
                                    <span>
                                        {isConnected ? 'Déconnexion' : 'Connexion'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.aside>
    );
};
