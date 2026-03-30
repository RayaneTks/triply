'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'â€“';
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
            className="cursor-pointer rounded-2xl border border-white/12 bg-white/6 p-4 text-slate-100 transition-all hover:border-[var(--primary)] hover:bg-white/10"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                        <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{offer.hotelName}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-300">
                            <span>{offer.cityCode}</span>
                            <span>â€¢</span>
                            <span>{formatDate(offer.checkInDate)} â€“ {formatDate(offer.checkOutDate)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                        <div className="font-bold text-emerald-400">
                            {offer.price.total} {offer.price.currency}
                        </div>
                    </div>
                    {onRemove ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20"
                            aria-label="Supprimer"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
