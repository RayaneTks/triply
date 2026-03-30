'use client';

import React from 'react';
import Image from 'next/image';
import { PlaneTakeoff } from 'lucide-react';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';

const formatTime = (dateString: string) => {
    if (!dateString) return 'â€“';
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
    const firstSegment = outbound?.segments?.[0];
    const lastSegment = outbound?.segments?.[outbound.segments.length - 1];
    const airlineCode = offer.validatingAirlineCodes?.[0] || '';
    const logoUrl = `https://pics.avs.io/200/200/${airlineCode}.png`;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(event) => event.key === 'Enter' && onClick()}
            className="cursor-pointer rounded-2xl border border-white/12 bg-white/6 p-4 text-slate-100 transition-all hover:border-[var(--primary)] hover:bg-white/10"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-500/15 text-cyan-300">
                        {airlineCode ? (
                            <Image
                                src={logoUrl}
                                alt={carrierName}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-xl object-contain bg-white/80"
                                onError={(event) => {
                                    (event.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <PlaneTakeoff size={18} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{carrierName}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-300">
                            <span>{firstSegment?.departure?.iataCode || 'â€“'}</span>
                            <span>â†’</span>
                            <span>{lastSegment?.arrival?.iataCode || 'â€“'}</span>
                            <span>{firstSegment?.departure?.at ? formatDate(firstSegment.departure.at) : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                        <div className="font-bold text-emerald-400">
                            {offer.price.grandTotal} {offer.price.currency}
                        </div>
                        <div className="text-xs text-slate-400">
                            {formatTime(firstSegment?.departure?.at || '')} â€“ {formatTime(lastSegment?.arrival?.at || '')}
                        </div>
                    </div>

                    {onRemove ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
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
