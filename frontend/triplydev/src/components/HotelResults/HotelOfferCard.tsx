'use client';

import React from 'react';
import { Button } from '@/src/components/Button/Button';

export interface HotelOffer {
    id: string;
    hotelId: string;
    hotelName: string;
    hotelAddress?: string;
    hotelLatitude?: number;
    hotelLongitude?: number;
    cityCode: string;
    checkInDate: string;
    checkOutDate: string;
    roomCategory?: string;
    roomDescription?: string;
    price: {
        total: string;
        currency: string;
        base?: string;
    };
    guests?: { adults: number };
}

export interface HotelOfferCardProps {
    offer: HotelOffer;
    onSelect?: (offer: HotelOffer) => void;
    className?: string;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const HotelOfferCard: React.FC<HotelOfferCardProps> = ({
    offer,
    onSelect,
    className = '',
}) => {
    return (
        <div
            className={`rounded-xl overflow-hidden border ${className}`}
            style={{
                backgroundColor: 'var(--background, #222222)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#e5e5e5',
            }}
        >
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0, 150, 199, 0.2)' }}
                    >
                        <span className="text-xl">🏨</span>
                    </div>
                    <div>
                        <div className="font-semibold" style={{ color: '#f5f5f5' }}>
                            {offer.hotelName}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                            {offer.cityCode} • {offer.roomCategory || 'Chambre'}
                        </div>
                        {offer.hotelAddress && (
                            <div className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                                {offer.hotelAddress}
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                        {offer.price.total} {offer.price.currency}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                        séjour total
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#0096c7' }}>
                        Dates
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                    <div>
                        <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Arrivée
                        </div>
                        <div className="font-medium" style={{ color: '#f5f5f5' }}>
                            {formatDate(offer.checkInDate)}
                        </div>
                    </div>
                    <span className="text-xl">→</span>
                    <div className="text-right">
                        <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Départ
                        </div>
                        <div className="font-medium" style={{ color: '#f5f5f5' }}>
                            {formatDate(offer.checkOutDate)}
                        </div>
                    </div>
                </div>
                {offer.roomDescription && (
                    <div className="mt-2 text-xs pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {offer.roomDescription}
                    </div>
                )}
            </div>

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
