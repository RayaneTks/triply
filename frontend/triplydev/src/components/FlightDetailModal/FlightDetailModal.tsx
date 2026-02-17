'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightOfferCard } from '@/src/components/FlightResults/FlightOfferCard';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';

const buildBookingUrl = (offer: FlightOffer): string => {
    const outbound = offer.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound?.segments?.length ? outbound.segments.length - 1 : 0];
    const from = firstSeg?.departure?.iataCode || 'PAR';
    const to = lastSeg?.arrival?.iataCode || 'MRS';
    const date = firstSeg?.departure?.at
        ? new Date(firstSeg.departure.at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const q = `Flights from ${from} to ${to} on ${date}`;
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
};

export interface FlightDetailModalProps {
    visible: boolean;
    onClose: () => void;
    offer: FlightOffer | null;
    carrierName: string;
}

export const FlightDetailModal: React.FC<FlightDetailModalProps> = ({
    visible,
    onClose,
    offer,
    carrierName,
}) => {
    const modalContent = (
        <AnimatePresence>
            {visible && offer && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm"
                        aria-hidden="true"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-2 sm:inset-4 md:inset-12 lg:inset-16 z-[10001] flex flex-col rounded-xl overflow-hidden max-h-[calc(100dvh-1rem)]"
                        style={{
                            backgroundColor: '#222222',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="flight-detail-title"
                    >
                        <div
                            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                        >
                            <h2 id="flight-detail-title" className="text-xl font-semibold" style={{ color: '#ededed' }}>
                                Détail du billet
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Fermer"
                                style={{ color: '#ededed' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-2xl mx-auto space-y-4">
                                <FlightOfferCard
                                    offer={offer}
                                    carrierName={carrierName}
                                    className="w-full"
                                />

                                <a
                                    href={buildBookingUrl(offer)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-4 px-6 rounded-xl font-bold text-center transition-all hover:opacity-90"
                                    style={{
                                        backgroundColor: '#0096c7',
                                        color: '#fff',
                                    }}
                                >
                                    Acheter ce billet →
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(modalContent, document.body)
        : modalContent;
};
