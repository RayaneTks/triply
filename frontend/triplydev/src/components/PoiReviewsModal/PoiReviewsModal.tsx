'use client';

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
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
    /** Largeur du panneau gauche (sidebar + slide) pour éviter le chevauchement */
    leftPanelWidth?: number;
}

const MODAL_WIDTH = 360;
const MODAL_WIDTH_MOBILE = 320;
const MAX_HEIGHT = 420;
const OFFSET = 12;
const EDGE_PADDING = 12;

function computeModalPosition(
    anchor: { x: number; y: number },
    leftPanelWidth = 0
): { left: number; top: number; width: number } {
    if (typeof window === 'undefined') return { left: anchor.x + OFFSET, top: anchor.y + OFFSET, width: MODAL_WIDTH };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const width = isMobile ? Math.min(MODAL_WIDTH_MOBILE, vw - EDGE_PADDING * 2) : MODAL_WIDTH;

    const spaceRight = vw - anchor.x - OFFSET;
    const spaceLeft = anchor.x - leftPanelWidth - OFFSET;
    const spaceBottom = vh - anchor.y - OFFSET;
    const spaceTop = anchor.y - OFFSET;

    const preferRight = spaceRight >= width || spaceRight >= spaceLeft;
    const preferBottom = spaceBottom >= spaceTop;

    let left: number;
    let top: number;

    if (preferRight && preferBottom) {
        left = anchor.x + OFFSET;
        top = anchor.y + OFFSET;
    } else if (preferRight && !preferBottom) {
        left = anchor.x + OFFSET;
        top = anchor.y - MAX_HEIGHT - OFFSET;
    } else if (!preferRight && preferBottom) {
        left = anchor.x - width - OFFSET;
        top = anchor.y + OFFSET;
    } else {
        left = anchor.x - width - OFFSET;
        top = anchor.y - MAX_HEIGHT - OFFSET;
    }

    left = Math.max(EDGE_PADDING, Math.min(vw - width - EDGE_PADDING, left));

    const topMin = EDGE_PADDING;
    const topMax = vh - MAX_HEIGHT - EDGE_PADDING;
    const topClamped = Math.max(topMin, Math.min(topMax, top));

    if (topClamped === topMin && top < topMin && spaceBottom > 0) {
        return { left, top: Math.min(topMax, anchor.y + OFFSET), width };
    }

    return { left, top: topClamped, width };
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
    leftPanelWidth = 0,
}) => {
    const { left, top, width } = useMemo(
        () => computeModalPosition(position, leftPanelWidth),
        [position, leftPanelWidth]
    );

    const modalContent = (
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
                        width: `${width}px`,
                        maxHeight: `${MAX_HEIGHT}px`,
                        backgroundColor: 'var(--background, #222222)',
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
                            maxHeight: `${MAX_HEIGHT - 100}px`,
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

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(modalContent, document.body)
        : modalContent;
};
