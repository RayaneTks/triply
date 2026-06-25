'use client';

import { FC } from 'react';
import { cn } from '../../../lib/utils';

export type TripTab = 'itinerary' | 'flights' | 'hotels';

const TABS: { id: TripTab; label: string }[] = [
    { id: 'itinerary', label: 'Jour par jour' },
    { id: 'flights', label: 'Vols' },
    { id: 'hotels', label: 'Hôtels' },
];

interface TripTabsNavProps {
    activeTab: TripTab;
    onChange: (tab: TripTab) => void;
}

export const TripTabsNav: FC<TripTabsNavProps> = ({ activeTab, onChange }) => (
    <nav className="flex flex-wrap gap-2 p-1.5 bg-light-bg rounded-2xl w-fit border border-light-border">
        {TABS.map((tab) => (
            <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                    'px-6 py-2 rounded-xl text-sm font-bold transition-all',
                    activeTab === tab.id
                        ? 'bg-card text-brand shadow-sm'
                        : 'text-light-muted hover:text-light-foreground',
                )}
            >
                {tab.label}
            </button>
        ))}
    </nav>
);
