import React from 'react';
import { FlightOfferCard } from './FlightOfferCard';
import type { FlightOffer } from './FlightOfferCard';

interface AmadeusResponse {
    data: FlightOffer[];
    dictionaries: {
        carriers: Record<string, string>;
        locations: Record<string, unknown>;
    };
}

interface FlightResultsProps {
    data: AmadeusResponse | null;
    onSelectOffer?: (offer: FlightOffer, carrierName: string) => void;
}

export const FlightResults = ({ data, onSelectOffer }: FlightResultsProps) => {
    if (!data || !data.data) return <div className="text-white">Aucun résultat.</div>;

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
