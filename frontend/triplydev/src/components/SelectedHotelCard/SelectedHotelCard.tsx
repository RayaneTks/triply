'use client';

import React from 'react';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    });
};

export interface SelectedHotelCardProps {
    offer: HotelOffer;
    onClick: () => void;
    onRemove?: () => void;
}

export const SelectedHotelCard: React.FC<SelectedHotelCardProps> = ({
    offer,
    onClick,
    onRemove,
}) => {
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
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(0, 150, 199, 0.2)' }}
                    >
                        <span className="text-lg">🏨</span>
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: '#f5f5f5' }}>
                            {offer.hotelName}
                        </div>
                        <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <span>{offer.cityCode}</span>
                            <span>•</span>
                            <span>{formatDate(offer.checkInDate)} – {formatDate(offer.checkOutDate)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <div className="font-bold" style={{ color: '#22c55e' }}>
                            {offer.price.total} {offer.price.currency}
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
