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
    if (data && typeof data === 'object' && 'error' in data && data.error) {
        return (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-sm" style={{ color: 'var(--foreground)' }}>
                <p className="font-bold mb-1">Recherche impossible</p>
                <p className="opacity-90">{data.error}</p>
            </div>
        );
    }
    if (!isAmadeusResponse(data) || !data.data.length) {
        return <div style={{ color: 'var(--foreground)' }}>Aucun résultat pour ces critères. Essayez d&apos;ajuster les dates ou le budget.</div>;
    }

    return (
        <div className="flex flex-col gap-4 p-4 pb-20 max-w-4xl mx-auto w-full" style={{ color: 'var(--foreground)' }}>
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
