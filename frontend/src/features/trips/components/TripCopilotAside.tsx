'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Bot, Calendar, ExternalLink, Map as MapIcon, Users } from 'lucide-react';

interface TripCopilotAsideProps {
    dates: string;
    travelers: number;
}

export const TripCopilotAside: FC<TripCopilotAsideProps> = ({ dates, travelers }) => (
    <aside className="space-y-8">
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="triply-card p-8 border-2 border-brand/20 bg-brand/5 space-y-6"
        >
            <header className="flex items-center gap-3 text-brand">
                <Bot size={24} />
                <h3 className="font-bold">Copilote</h3>
            </header>
            <p className="text-sm text-brand leading-relaxed">
                Suggestion : likez les activités que vous avez préférées pour aider Triply à affiner vos
                prochaines recommandations.
            </p>
        </motion.div>

        <div className="triply-card p-8 space-y-6">
            <h4 className="font-bold flex items-center gap-2">
                <MapIcon size={18} className="text-light-muted" /> Ressources
            </h4>
            <ul className="space-y-4">
                {[
                    { t: 'Billets & réservations', d: 'Bientôt disponible', icon: ExternalLink },
                    { t: 'Hébergement', d: 'Bientôt disponible', icon: ExternalLink },
                ].map((res) => (
                    <li
                        key={res.t}
                        className="flex items-center justify-between p-4 bg-light-bg rounded-xl group hover:bg-card border border-transparent hover:border-light-border transition-all"
                    >
                        <div>
                            <p className="text-sm font-bold">{res.t}</p>
                            <p className="text-xs text-light-muted">{res.d}</p>
                        </div>
                        <res.icon size={14} className="text-light-muted group-hover:text-brand" />
                    </li>
                ))}
            </ul>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-light-muted">
            <Calendar size={14} />
            <span>{dates}</span>
            <Users size={14} className="ml-2" />
            <span>{travelers}</span>
        </div>
    </aside>
);
