import React from 'react';
import { motion } from 'framer-motion';

export interface SidebarProps {
    children?: React.ReactNode;
    className?: string;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '', isCollapsed = false, onToggle }) => {
    return (
        <motion.aside 
            className={`h-full relative flex-shrink-0 ${className}`} 
            style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)' }}
            animate={{ width: isCollapsed ? '64px' : '256px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {/* Bouton de toggle */}
            <button
                onClick={onToggle}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                style={{ color: 'var(--foreground, #ededed)' }}
                aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
            >
                {isCollapsed ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="9" y1="18" x2="15" y2="12"></line>
                        <line x1="9" y1="6" x2="15" y2="12"></line>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="15" y1="18" x2="9" y2="12"></line>
                        <line x1="15" y1="6" x2="9" y2="12"></line>
                    </svg>
                )}
            </button>

            <motion.div
                className="p-6 h-full overflow-hidden"
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {children || (
                    <nav className="space-y-4">
                        <h2 className={`text-lg font-semibold mb-4 ${isCollapsed ? 'hidden' : ''}`} style={{ color: 'var(--foreground, #ededed)' }}>Navigation</h2>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {!isCollapsed && <span>Accueil</span>}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {!isCollapsed && <span>À propos</span>}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {!isCollapsed && <span>Contact</span>}
                                </a>
                            </li>
                        </ul>
                    </nav>
                )}
            </motion.div>
        </motion.aside>
    );
};
