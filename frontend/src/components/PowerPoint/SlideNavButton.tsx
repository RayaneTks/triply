import { motion } from 'framer-motion';

interface SlideNavButtonProps {
    direction: 'prev' | 'next';
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

export const SlideNavButton: React.FC<SlideNavButtonProps> = ({
                                                                  direction,
                                                                  onClick,
                                                                  disabled = false,
                                                                  className = '',
                                                              }) => {
    const isNext = direction === 'next';

    return (
        <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`
                p-3 rounded-full flex items-center justify-center transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed text-slate-700
                ${className}
            `}
            aria-label={isNext ? "Suivant" : "Précédent"}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isNext ? "" : "transform rotate-180"}
            >
                <path d="M9 18l6-6-6-6" />
            </svg>
        </motion.button>
    );
};