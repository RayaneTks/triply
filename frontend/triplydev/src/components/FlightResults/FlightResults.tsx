import React from 'react';
import { ImageCard } from '../ImageCard/ImageCard'; // Ajuste le chemin selon ta structure

// Types pour la réponse API Amadeus (simplifiés pour l'affichage)
interface FlightOffer {
    id: string;
    price: { grandTotal: string; currency: string };
    validatingAirlineCodes: string[];
    itineraries: {
        duration: string;
        segments: {
            departure: { iataCode: string; at: string };
            arrival: { iataCode: string; at: string };
            carrierCode: string;
            number: string;
            numberOfStops: number;
        }[];
    }[];
}

interface AmadeusResponse {
    data: FlightOffer[];
    dictionaries: {
        carriers: Record<string, string>;
        locations: Record<string, any>;
    };
}

// Fonction utilitaire pour formater la durée (PT1H25M -> 1h 25m)
const formatDuration = (isoDuration: string) => {
    if (!isoDuration) return '';
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? match[1].replace('H', 'h') : '';
    const minutes = match[2] ? match[2].replace('M', 'm') : '';
    return `${hours} ${minutes}`.trim();
};

// Fonction pour formater l'heure (2026-02-12T16:20:00 -> 16:20)
const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const FlightResults = ({ data }: { data: AmadeusResponse | null }) => {
    if (!data || !data.data) return <div className="text-white">Aucun résultat.</div>;

    return (
        // --- MODIFICATION ICI ---
        // 1. "flex flex-col" : aligne les enfants verticalement
        // 2. "gap-4" : espace entre chaque carte
        // 3. "max-w-4xl mx-auto" : centre la colonne et évite que les cartes soient trop larges sur grand écran
        <div className="flex flex-col gap-4 p-4 pb-20 overflow-y-auto h-full max-w-4xl mx-auto w-full">

            {data.data.map((offer) => {
                const carrierCode = offer.validatingAirlineCodes[0];
                const carrierName = data.dictionaries?.carriers[carrierCode] || carrierCode;
                const logoUrl = `https://pics.avs.io/200/200/${carrierCode}.png`;

                const descriptionContent = (
                    <div className="space-y-3 text-sm">
                        {/* ... (Ton contenu de description reste identique) ... */}
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-800 border-b pb-1">Aller</span>
                            {offer.itineraries[0].segments.map((seg, i) => (
                                <div key={i} className="flex justify-between text-gray-600">
                                    <span>{formatTime(seg.departure.at)} {seg.departure.iataCode}</span>
                                    <span className="text-xs text-gray-400">➜</span>
                                    <span>{formatTime(seg.arrival.at)} {seg.arrival.iataCode}</span>
                                </div>
                            ))}
                            <div className="text-xs text-gray-400">
                                Durée: {formatDuration(offer.itineraries[0].duration)}
                            </div>
                        </div>

                        {offer.itineraries[1] && (
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-800 border-b pb-1 mt-1">Retour</span>
                                {offer.itineraries[1].segments.map((seg, i) => (
                                    <div key={i} className="flex justify-between text-gray-600">
                                        <span>{formatTime(seg.departure.at)} {seg.departure.iataCode}</span>
                                        <span className="text-xs text-gray-400">➜</span>
                                        <span>{formatTime(seg.arrival.at)} {seg.arrival.iataCode}</span>
                                    </div>
                                ))}
                                <div className="text-xs text-gray-400">
                                    Durée: {formatDuration(offer.itineraries[1].duration)}
                                </div>
                            </div>
                        )}

                        <div className="mt-2 text-right">
                             <span className="text-xl font-bold text-green-600">
                                {offer.price.grandTotal} €
                             </span>
                        </div>
                    </div>
                );

                return (
                    <ImageCard
                        key={offer.id}
                        imageSrc={logoUrl}
                        imageAlt={`Logo ${carrierName}`}
                        title={`${carrierName} - ${offer.price.grandTotal} €`}
                        description={descriptionContent}
                        buttonText="Sélectionner"
                        onButtonClick={() => console.log('Offre sélectionnée:', offer.id)}
                        // IMPORTANT : On force la largeur à 100% pour remplir la colonne
                        className="w-full !max-w-none"
                    />
                );
            })}
        </div>
    );
};