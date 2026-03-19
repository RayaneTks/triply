import React from 'react';
import { FlightOfferCard } from './FlightOfferCard';
import type { FlightOffer } from './FlightOfferCard';

export interface AmadeusResponse {
    data: FlightOffer[];
    dictionaries: {
        carriers: Record<string, string>;
        locations: Record<string, unknown>;
    };
}

interface FlightResultsProps {
    data: (AmadeusResponse | { error?: string; details?: string }) | null;
    onSelectOffer?: (offer: FlightOffer, carrierName: string) => void;
}

function isAmadeusResponse(d: FlightResultsProps['data']): d is AmadeusResponse {
    return d !== null && 'data' in d && Array.isArray((d as AmadeusResponse).data);
}

export const FlightResults = ({ data, onSelectOffer }: FlightResultsProps) => {
    if (!isAmadeusResponse(data) || !data.data.length) return <div className="text-white">Aucun résultat.</div>;

    return (
        <div className="flex flex-col gap-4 p-4 pb-20 max-w-4xl mx-auto w-full" style={{ color: '#e5e5e5' }}>
            {data.data.map((offer) => {
                const carrierCode = offer.validatingAirlineCodes?.[0];
                const carrierName = data.dictionaries?.carriers?.[carrierCode || ''] || carrierCode || 'Compagnie';

                return (
                    <FlightOfferCard
                        key={offer.id}
                        offer={offer}
                        carrierName={carrierName}
                        onSelect={onSelectOffer ? () => onSelectOffer(offer, carrierName) : undefined}
                        className="w-full"
                    />
                );
            })}
        </div>
    );
};
