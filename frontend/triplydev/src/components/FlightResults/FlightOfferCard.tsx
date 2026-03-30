'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlaneTakeoff, PlaneLanding, Clock, Luggage, ChevronRight, Info } from 'lucide-react';

export interface FlightSegment {
    departure: { iataCode?: string; at: string; terminal?: string };
    arrival: { iataCode?: string; at: string; terminal?: string };
    carrierCode?: string;
    number?: string;
    aircraft?: { code?: string };
    duration?: string;
    numberOfStops?: number;
}

export interface FlightItinerary {
    duration?: string;
    segments: FlightSegment[];
}

export interface FlightOffer {
    id: string;
    price: { grandTotal: string; currency: string; total?: string; base?: string; };
    validatingAirlineCodes?: string[];
    itineraries: FlightItinerary[];
    travelerPricings?: Array<{
        travelerType: string;
        price: { total: string; currency: string };
        fareDetailsBySegment?: Array<{ cabin: string; includedCheckedBags?: { quantity?: number }; }>;
    }>;
}

export interface FlightOfferCardProps {
    offer: FlightOffer;
    carrierName: string;
    onSelect?: (offer: FlightOffer) => void;
    className?: string;
}

const formatDuration = (iso: string) => {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    return m ? `${m[1] || 0}h ${m[2] || 0}m` : iso;
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const ItinerarySection = ({ itin, label }: { itin: FlightItinerary; label: string }) => {
    const first = itin.segments[0];
    const last = itin.segments[itin.segments.length - 1];
    const stops = itin.segments.length - 1;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">{label}</span>
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={12} />
                    <span className="text-[11px] font-medium">{formatDuration(itin.duration || '')}</span>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{formatTime(first.departure.at)}</span>
                        <div className="flex-1 flex items-center gap-1">
                            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                            <div className="flex flex-col items-center gap-1 px-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">{stops === 0 ? 'Direct' : `${stops} escale${stops > 1 ? 's' : ''}`}</span>
                                <PlaneTakeoff size={14} className="text-cyan-400 rotate-45" />
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/50 to-transparent" />
                        </div>
                        <span className="text-lg font-bold text-white">{formatTime(last.arrival.at)}</span>
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-xs font-bold text-slate-400">{first.departure.iataCode}</span>
                        <span className="text-xs font-bold text-slate-400">{last.arrival.iataCode}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FlightOfferCard: React.FC<FlightOfferCardProps> = ({ offer, carrierName, onSelect, className = '' }) => {
    const carrierCode = offer.validatingAirlineCodes?.[0] || '';
    const logoUrl = `https://pics.avs.io/200/200/${carrierCode}.png`;
    const traveler = offer.travelerPricings?.[0];
    const cabin = traveler?.fareDetailsBySegment?.[0]?.cabin;
    const bags = traveler?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity;

    return (
        <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan-500/30 hover:bg-white/10 shadow-xl ${className}`}
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* Info Left */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white p-1.5 shadow-inner">
                            <Image src={logoUrl} alt={carrierName} fill className="object-contain p-1" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">{carrierName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                {cabin && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">{cabin}</span>}
                                {bags !== undefined && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Luggage size={10} />
                                        <span>{bags > 0 ? `${bags} bagage(s)` : 'Sans bagage'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <ItinerarySection itin={offer.itineraries[0]} label="Aller" />
                        {offer.itineraries[1] && <ItinerarySection itin={offer.itineraries[1]} label="Retour" />}
                    </div>
                </div>

                {/* Price Right */}
                <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix Total</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black text-emerald-400 font-chillax tracking-tight">{offer.price.grandTotal}</span>
                            <span className="text-sm font-bold text-emerald-500/80">{offer.price.currency}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelect?.(offer)}
                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-900/20 group-hover:bg-cyan-400 transition-all active:scale-95"
                    >
                        Choisir <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Decorative Corner */}
            <div className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};
