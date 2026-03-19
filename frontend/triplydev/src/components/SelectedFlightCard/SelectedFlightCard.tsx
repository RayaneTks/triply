'use client';

import React from 'react';
import Image from 'next/image';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';

const formatTime = (dateString: string) => {
    if (!dateString) return '–';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    });
};

export interface SelectedFlightCardProps {
    offer: FlightOffer;
    carrierName: string;
    onClick: () => void;
    onRemove?: () => void;
}

export const SelectedFlightCard: React.FC<SelectedFlightCardProps> = ({
    offer,
    carrierName,
    onClick,
    onRemove,
}) => {
    const outbound = offer.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound.segments.length - 1];
    const logoUrl = `https://pics.avs.io/200/200/${offer.validatingAirlineCodes?.[0] || ''}.png`;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            className="rounded-xl border p-4 cursor-pointer transition-all hover:border-[#0096c7] hover:bg-white/5"
            style={{
                backgroundColor: 'var(--background, #222222)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#e5e5e5',
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Image
                        src={logoUrl}
                        alt={carrierName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-contain bg-white/10 shrink-0"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: '#f5f5f5' }}>
                            {carrierName}
                        </div>
                        <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <span>{firstSeg?.departure?.iataCode || '–'}</span>
                            <span>→</span>
                            <span>{lastSeg?.arrival?.iataCode || '–'}</span>
                            <span className="text-xs">
                                {firstSeg?.departure?.at && formatDate(firstSeg.departure.at)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <div className="font-bold" style={{ color: '#22c55e' }}>
                            {offer.price.grandTotal} {offer.price.currency}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {formatTime(firstSeg?.departure?.at || '')} – {formatTime(lastSeg?.arrival?.at || '')}
                        </div>
                    </div>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                            aria-label="Supprimer"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
