'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GoogleReview {
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
}

export interface PoiReviewsModalProps {
    visible: boolean;
    name: string;
    rating: number | null;
    reviews: GoogleReview[];
    url: string | null;
    position: { x: number; y: number };
    loading?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const PoiReviewsModal: React.FC<PoiReviewsModalProps> = ({
    visible,
    name,
    rating,
    reviews,
    url,
    position,
    loading = false,
    onMouseEnter,
    onMouseLeave,
}) => {
    const offset = 16;
    const modalWidth = 360;
    const maxHeight = 420;

    let left = position.x + offset;
    let top = position.y + offset;

    if (typeof window !== 'undefined') {
        if (left + modalWidth > window.innerWidth) left = position.x - modalWidth - offset;
        if (top + maxHeight > window.innerHeight) top = position.y - maxHeight - offset;
        if (left < 8) left = 8;
        if (top < 8) top = 8;
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className="fixed z-[10000] rounded-xl shadow-2xl overflow-hidden"
                    style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${modalWidth}px`,
                        maxHeight: `${maxHeight}px`,
                        backgroundColor: 'rgba(34, 34, 34, 0.98)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-semibold truncate" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {name}
                                </h3>
                                {rating != null && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-amber-400 text-sm">★</span>
                                        <span className="text-sm font-medium" style={{ color: 'var(--foreground, #ededed)' }}>
                                            {rating}
                                        </span>
                                        <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            Google
                                        </span>
                                    </div>
                                )}
                            </div>
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-90"
                                    style={{
                                        backgroundColor: 'var(--primary, #0096C7)',
                                        color: '#fff',
                                    }}
                                >
                                    Voir sur Google
                                </a>
                            )}
                        </div>
                    </div>

                    <div
                        className="overflow-y-auto p-4"
                        style={{
                            maxHeight: `${maxHeight - 100}px`,
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        <style>{`
                            [data-poi-reviews-scroll]::-webkit-scrollbar {
                                display: none !important;
                            }
                        `}</style>
                        <div data-poi-reviews-scroll>
                            {loading ? (
                                <div className="flex items-center justify-center py-8" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    Chargement des avis...
                                </div>
                            ) : reviews.length === 0 ? (
                                <p className="text-sm py-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    Aucun avis Google disponible pour ce lieu.
                                </p>
                            ) : (
                                <ul className="space-y-4">
                                    {reviews.map((review, index) => (
                                        <li key={index} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-amber-400 text-xs">★</span>
                                                <span className="text-sm font-medium" style={{ color: 'var(--foreground, #ededed)' }}>
                                                    {review.rating}
                                                </span>
                                                <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                    {review.relative_time_description}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                                {review.text}
                                            </p>
                                            <p className="text-xs mt-1.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                — {review.author_name}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
