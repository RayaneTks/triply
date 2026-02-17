'use client';

import React from 'react';
import { Button } from '@/src/components/Button/Button';

export interface FlightSegment {
    departure: { iataCode?: string; at: string; terminal?: string };
    arrival: { iataCode?: string; at: string; terminal?: string };
    carrierCode?: string;
    number?: string;
    aircraft?: { code?: string };
    operating?: { carrierCode?: string };
    numberOfStops?: number;
    duration?: string;
}

export interface FlightItinerary {
    duration?: string;
    segments: FlightSegment[];
}

export interface FlightOffer {
    id: string;
    price: {
        grandTotal: string;
        currency: string;
        total?: string;
        base?: string;
        fees?: Array<{ amount: string; type: string }>;
        taxes?: Array<{ amount: string; code: string }>;
    };
    validatingAirlineCodes?: string[];
    itineraries: FlightItinerary[];
    travelerPricings?: Array<{
        travelerId: string;
        fareOption: string;
        travelerType: string;
        price: { total: string; currency: string };
        fareDetailsBySegment?: Array<{
            segmentId: string;
            cabin: string;
            fareBasis: string;
            class: string;
            includedCheckedBags?: { quantity?: number };
        }>;
    }>;
}

export interface FlightOfferCardProps {
    offer: FlightOffer;
    carrierName: string;
    onSelect?: (offer: FlightOffer) => void;
    className?: string;
}

const formatDuration = (isoDuration: string) => {
    if (!isoDuration) return '';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? `${match[1]}h` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    return `${hours} ${minutes}`.trim();
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const FlightOfferCard: React.FC<FlightOfferCardProps> = ({
    offer,
    carrierName,
    onSelect,
    className = '',
}) => {
    const carrierCode = offer.validatingAirlineCodes?.[0] || '';
    const logoUrl = `https://pics.avs.io/200/200/${carrierCode}.png`;
    const outbound = offer.itineraries?.[0];
    const returnItinerary = offer.itineraries?.[1];
    const totalStops = (offer.itineraries || []).reduce((acc, it) => {
        return acc + (it.segments || []).reduce((s, seg) => s + (seg.numberOfStops || 0), 0);
    }, 0);

    return (
        <div
            className={`rounded-xl overflow-hidden border ${className}`}
            style={{
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#e5e5e5',
            }}
        >
            {/* En-tête : Compagnie + Prix */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            >
                <div className="flex items-center gap-3">
                    <img
                        src={logoUrl}
                        alt={carrierName}
                        className="w-10 h-10 rounded-lg object-contain bg-white/10"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div>
                        <div className="font-semibold" style={{ color: '#f5f5f5' }}>
                            {carrierName}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                            {(offer.validatingAirlineCodes || []).join(', ')} •{' '}
                            {totalStops === 0 ? 'Vol direct' : `${totalStops} escale${totalStops > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                        {offer.price.grandTotal} {offer.price.currency}
                    </div>
                    {offer.price.base && offer.price.base !== offer.price.grandTotal && (
                        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                            base {offer.price.base} {offer.price.currency}
                        </div>
                    )}
                </div>
            </div>

            {/* Aller */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#0096c7' }}>
                        Aller
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatDuration(outbound?.duration || '')}
                    </span>
                </div>
                {(outbound?.segments || []).map((seg, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-2">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium" style={{ color: '#f5f5f5' }}>
                                {formatTime(seg.departure?.at || '')} — {formatTime(seg.arrival?.at || '')}
                            </div>
                            <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                                <span>{seg.departure?.iataCode || '–'}</span>
                                <span className="text-xs">
                                    {(seg.numberOfStops || 0) > 0 ? `→ ${seg.numberOfStops} escale${(seg.numberOfStops || 0) > 1 ? 's' : ''} →` : '→'}
                                </span>
                                <span>{seg.arrival?.iataCode || '–'}</span>
                                {((seg.departure?.terminal || seg.arrival?.terminal)) && (
                                    <span className="text-xs">
                                        Term. {seg.departure?.terminal || seg.arrival?.terminal}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                {seg.carrierCode || ''} {seg.number || ''}
                            </div>
                            {seg.aircraft?.code && (
                                <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                                    {seg.aircraft.code}
                                </div>
                            )}
                            {seg.duration && (
                                <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                                    {formatDuration(seg.duration)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Retour */}
            {returnItinerary && (
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#0096c7' }}>
                            Retour
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {formatDuration(returnItinerary?.duration || '')}
                        </span>
                    </div>
                    {(returnItinerary?.segments || []).map((seg, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 py-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium" style={{ color: 'var(--foreground, #ededed)' }}>
                                    {formatTime(seg.departure?.at || '')} — {formatTime(seg.arrival?.at || '')}
                                </div>
                                <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    <span>{seg.departure?.iataCode || '–'}</span>
                                    <span className="text-xs">
                                        {(seg.numberOfStops || 0) > 0 ? `→ ${seg.numberOfStops} escale${(seg.numberOfStops || 0) > 1 ? 's' : ''} →` : '→'}
                                    </span>
                                    <span>{seg.arrival?.iataCode || '–'}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    {seg.carrierCode || ''} {seg.number || ''}
                                </div>
                                {seg.aircraft?.code && (
                                    <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                                        {seg.aircraft.code}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Détails tarifaires (si disponibles) */}
            {offer.travelerPricings && offer.travelerPricings.length > 0 && (
                <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="text-xs space-y-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {offer.travelerPricings.map((tp, i) => (
                            <div key={i} className="flex justify-between">
                                <span>
                                    {tp.travelerType === 'ADULT' ? 'Adulte' : tp.travelerType === 'CHILD' ? 'Enfant' : tp.travelerType}
                                    {tp.fareDetailsBySegment?.[0]?.cabin && ` • ${tp.fareDetailsBySegment[0].cabin}`}
                                    {tp.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity !== undefined && (
                                        ` • ${tp.fareDetailsBySegment[0].includedCheckedBags.quantity} bagage(s)`
                                    )}
                                </span>
                                <span>{tp.price.total} {tp.price.currency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prix détaillé (base + taxes) */}
            {offer.price.base && (
                <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="text-xs space-y-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <div className="flex justify-between">
                            <span>Tarif de base</span>
                            <span>{offer.price.base} {offer.price.currency}</span>
                        </div>
                        {offer.price.taxes?.map((t, i) => (
                            <div key={i} className="flex justify-between">
                                <span>Taxe {t.code}</span>
                                <span>{t.amount} {offer.price.currency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bouton */}
            <div className="px-4 py-3">
                <Button
                    label="Sélectionner cette offre"
                    onClick={() => onSelect?.(offer)}
                    variant="light"
                    tone="tone1"
                    className="w-full"
                />
            </div>
        </div>
    );
};
