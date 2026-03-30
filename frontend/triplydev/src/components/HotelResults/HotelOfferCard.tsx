'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, MapPin, Calendar, Users, ChevronRight, Info } from 'lucide-react';

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
    price: { total: string; currency: string; base?: string; };
    guests?: { adults: number };
}

export interface HotelOfferCardProps {
    offer: HotelOffer;
    onSelect?: (offer: HotelOffer) => void;
    className?: string;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const HotelOfferCard: React.FC<HotelOfferCardProps> = ({ offer, onSelect, className = '' }) => {
    return (
        <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-emerald-500/30 hover:bg-white/10 shadow-xl ${className}`}
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* Info Left */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                            <Hotel size={24} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg font-bold text-white truncate">{offer.hotelName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 uppercase tracking-wider">{offer.cityCode}</span>
                                {offer.roomCategory && (
                                    <span className="text-[10px] font-medium text-slate-500 truncate italic">
                                        {offer.roomCategory}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Séjour</div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-emerald-500/70" />
                                <span className="text-xs font-semibold text-slate-200">
                                    {formatDate(offer.checkInDate)} — {formatDate(offer.checkOutDate)}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1 text-right md:text-left">
                            <div className="flex items-center justify-end md:justify-start gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacité</div>
                            <div className="flex items-center justify-end md:justify-start gap-2">
                                <Users size={14} className="text-emerald-500/70" />
                                <span className="text-xs font-semibold text-slate-200">{offer.guests?.adults || 1} Voyageur(s)</span>
                            </div>
                        </div>
                    </div>

                    {offer.hotelAddress && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                            <MapPin size={12} className="shrink-0 text-slate-500" />
                            <span className="truncate">{offer.hotelAddress}</span>
                        </div>
                    )}
                </div>

                {/* Price Right */}
                <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Séjour</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black text-emerald-400 font-chillax tracking-tight">{offer.price.total}</span>
                            <span className="text-sm font-bold text-emerald-500/80">{offer.price.currency}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelect?.(offer)}
                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 group-hover:bg-emerald-500 transition-all active:scale-95"
                    >
                        Choisir <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Room description footer */}
            {offer.roomDescription && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 overflow-hidden">
                    <Info size={12} className="shrink-0 text-slate-500" />
                    <p className="text-[10px] text-slate-500 italic truncate">{offer.roomDescription}</p>
                </div>
            )}
        </motion.div>
    );
};
