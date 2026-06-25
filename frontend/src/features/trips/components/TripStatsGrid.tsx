'use client';

import { FC } from 'react';
import { Clock, MapPin, Sparkles, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TripStatsGridProps {
    budget: number;
    remainingBudget: number;
    statusLabel: string;
    destination: string;
}

export const TripStatsGrid: FC<TripStatsGridProps> = ({
    budget,
    remainingBudget,
    statusLabel,
    destination,
}) => {
    const stats: { label: string; val: string; icon: LucideIcon; color: string }[] = [
        { label: 'Budget total', val: `${budget}€`, icon: Wallet, color: 'text-brand' },
        { label: 'Budget restant (estim.)', val: `${remainingBudget}€`, icon: Sparkles, color: 'text-brand' },
        { label: 'Statut', val: statusLabel, icon: Clock, color: 'text-amber-600' },
        { label: 'Destination', val: destination, icon: MapPin, color: 'text-brand' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {stats.map((stat) => (
                <div key={stat.label} className="triply-card p-6 space-y-1">
                    <p className="text-xs font-bold text-light-muted uppercase tracking-widest flex items-center gap-2">
                        <stat.icon size={12} className={stat.color} /> {stat.label}
                    </p>
                    <p className={cn('text-xl font-display font-bold', stat.color)}>{stat.val}</p>
                </div>
            ))}
        </div>
    );
};
