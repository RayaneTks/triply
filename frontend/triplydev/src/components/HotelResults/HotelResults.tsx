'use client';

import React from 'react';
import { HotelOfferCard } from './HotelOfferCard';
import type { HotelOffer } from './HotelOfferCard';

export interface AmadeusHotelResponse {
    data?: Array<{
        type?: string;
        hotel?: {
            hotelId?: string;
            name?: string;
            cityCode?: string;
        };
        offers?: Array<{
            id?: string;
            checkInDate?: string;
            checkOutDate?: string;
            room?: {
                typeEstimated?: { category?: string };
                description?: { text?: string };
            };
            guests?: { adults?: number };
            price?: { total?: string; currency?: string; base?: string };
        }>;
    }>;
}

function flattenHotelOffers(data: AmadeusHotelResponse): HotelOffer[] {
    const result: HotelOffer[] = [];
    const items = data.data || [];

    for (const item of items) {
        const hotel = item.hotel;
        const offers = item.offers || [];

        for (const off of offers) {
            result.push({
                id: off.id || `${hotel?.hotelId}-${off.id}`,
                hotelId: hotel?.hotelId || '',
                hotelName: hotel?.name || 'Hôtel',
                cityCode: hotel?.cityCode || '',
                checkInDate: off.checkInDate || '',
                checkOutDate: off.checkOutDate || '',
                roomCategory: off.room?.typeEstimated?.category,
                roomDescription: off.room?.description?.text,
                price: {
                    total: off.price?.total || '0',
                    currency: off.price?.currency || 'EUR',
                    base: off.price?.base,
                },
                guests: off.guests ? { adults: off.guests.adults || 1 } : undefined,
            });
        }
    }

    return result;
}

interface HotelResultsProps {
    data: (AmadeusHotelResponse | { error?: string; details?: string }) | null;
    onSelectOffer?: (offer: HotelOffer) => void;
}

function isAmadeusHotelResponse(d: HotelResultsProps['data']): d is AmadeusHotelResponse {
    return d !== null && 'data' in d;
}

export const HotelResults = ({ data, onSelectOffer }: HotelResultsProps) => {
    const offers = isAmadeusHotelResponse(data) ? flattenHotelOffers(data) : [];

    if (offers.length === 0) {
        return <div className="text-white">Aucun résultat.</div>;
    }

    return (
        <div className="flex flex-col gap-4 p-4 pb-20 max-w-4xl mx-auto w-full" style={{ color: '#e5e5e5' }}>
            {offers.map((offer) => (
                <HotelOfferCard
                    key={offer.id}
                    offer={offer}
                    onSelect={onSelectOffer ? () => onSelectOffer(offer) : undefined}
                    className="w-full"
                />
            ))}
        </div>
    );
};
