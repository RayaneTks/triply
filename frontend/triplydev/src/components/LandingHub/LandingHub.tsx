'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Map as MapIcon, Plane, Hotel, Calendar, Users } from 'lucide-react';
import { Logo } from '../Logo/Logo';

interface LandingHubProps {
    onStartPlanning: (mode: 'ai' | 'manual') => void;
    onQuickSearch: (type: 'flight' | 'hotel') => void;
    onExploreMap: () => void;
}

export function LandingHub({ onStartPlanning, onQuickSearch, onExploreMap }: LandingHubProps) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#020617] px-6 py-12 text-slate-100">
            {/* Background Decorative Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 mb-16 flex flex-col items-center"
            >
                <Logo size="large" tone="light" />
                <h1 className="mt-8 text-center text-4xl font-bold tracking-tight sm:text-6xl">
                    L'aventure commence <span className="text-cyan-400 font-chillax">ici.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-center text-lg text-slate-400 leading-relaxed">
                    Centralisez vos vols, hôtels et activités. Planifiez votre voyage sur mesure avec l'IA ou explorez le monde librement.
                </p>
            </motion.div>

            <div className="relative z-10 grid w-full max-w-6xl gap-6 md:grid-cols-3">
                {/* AI Planning Card */}
                <motion.button
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartPlanning('ai')}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-8 text-left transition-all hover:border-cyan-400 hover:bg-cyan-500/10 shadow-2xl shadow-cyan-900/20"
                >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                        <Sparkles size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Assistant IA</h3>
                    <p className="mt-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                        Laissez notre intelligence artificielle concevoir l'itinéraire parfait selon vos envies et votre budget.
                    </p>
                    <div className="mt-8 flex items-center text-sm font-semibold text-cyan-400">
                        Démarrer la planification →
                    </div>
                </motion.button>

                {/* Quick Search Card */}
                <motion.button
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartPlanning('manual')}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-white/20 hover:bg-white/8 shadow-2xl"
                >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-slate-300 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                        <Search size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Recherche Classique</h3>
                    <p className="mt-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                        Cherchez directement vos vols et hôtels. Gardez le contrôle total sur chaque étape de votre organisation.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Plane size={14} /> Vols
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Hotel size={14} /> Hôtels
                        </div>
                    </div>
                </motion.button>

                {/* Map Exploration Card */}
                <motion.button
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExploreMap}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-white/20 hover:bg-white/8 shadow-2xl"
                >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-slate-300 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                        <MapIcon size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Explorer la Carte</h3>
                    <p className="mt-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                        Découvrez les meilleures activités et points d'intérêt directement sur notre carte interactive 3D.
                    </p>
                    <div className="mt-8 flex items-center text-sm font-semibold text-slate-300">
                        Ouvrir la carte →
                    </div>
                </motion.button>
            </div>

            {/* Footer / Quick Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 text-slate-500"
            >
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-cyan-500/50" />
                    <span className="text-sm">Planification Flexible</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-cyan-500/50" />
                    <span className="text-sm">Gestion de Groupe</span>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-cyan-500/50" />
                    <span className="text-sm">IA de Pointe</span>
                </div>
            </motion.div>
        </div>
    );
}
